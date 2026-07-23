import * as THREE from 'three';
import type { GestureForces, GestureTriggers } from '../hand-tracking/types';
import { buildFormation, FORMATION_ORDER, type FormationId } from './formations';

// ─── Constants ────────────────────────────────────────────────────────────────
const PARTICLE_COUNT = 22000;
const MORPH_SPEED    = 0.60;

// Spring constants (critically damped)
const SPRING_K_POS   = 180;
const SPRING_K_SCALE = 220;
const SPRING_K_ROT   = 80;
const SPRING_D_POS   = 2 * Math.sqrt(SPRING_K_POS);
const SPRING_D_SCALE = 2 * Math.sqrt(SPRING_K_SCALE);
const SPRING_D_ROT   = 2 * Math.sqrt(SPRING_K_ROT);

// ─── Palettes ─────────────────────────────────────────────────────────────────
export const PALETTES = [
  { name: 'Cosmic', swatch: '#4af', colors: [[0.3,0.6,1.0],[0.65,0.22,1.0],[0.15,0.9,1.0],[0.5,0.35,0.95]] },
  { name: 'Fire',   swatch: '#f84', colors: [[1.0,0.38,0.12],[1.0,0.72,0.0],[0.95,0.12,0.12],[1.0,0.55,0.22]] },
  { name: 'Forest', swatch: '#4f8', colors: [[0.12,1.0,0.45],[0.28,0.85,0.12],[0.55,1.0,0.22],[0.0,0.72,0.38]] },
  { name: 'Gold',   swatch: '#fa2', colors: [[1.0,0.82,0.22],[1.0,0.95,0.6],[0.92,0.65,0.12],[1.0,0.88,0.35]] },
  { name: 'Neon',   swatch: '#f0f', colors: [[1.0,0.0,0.88],[0.0,1.0,0.92],[0.58,0.0,1.0],[1.0,0.58,0.0]] },
  { name: 'Amethyst', swatch: '#c084fc', colors: [[0.78,0.52,1.0],[0.93,0.70,1.0],[0.56,0.25,0.92],[0.84,0.55,1.0]] },
];

// ─── Vertex shader ────────────────────────────────────────────────────────────
const VERT = /* glsl */`
  attribute vec3  aFromPos;
  attribute float aSeed;
  attribute float aSize;
  attribute vec3  aColor;

  uniform float uTime;
  uniform float uMorphT;
  uniform vec3  uCenter;
  uniform float uRotY;
  uniform float uObjScale;
  uniform float uBlackHole;
  uniform float uExplosion;
  uniform vec3  uAttractPt;
  uniform float uAttractStr;
  uniform float uPulse;

  varying vec3  vColor;
  varying float vAlpha;
  varying float vEdge;
  varying float vPulse;

  void main() {
    // Morph: 'position' (THREE built-in) = target; aFromPos = source
    float t   = smoothstep(0.0, 1.0, uMorphT);
    vec3  pos = mix(aFromPos, position, t);

    // Organic micro-breathing per particle
    float breathAmp = sin(uTime * 0.6 + aSeed * 6.2832) * 0.016
                    + sin(uTime * 1.3 + aSeed * 3.14) * 0.006;
    float centerDist = length(pos);
    pos += normalize(pos + vec3(0.0001)) * breathAmp * max(centerDist, 0.05);

    // Outward energy pulse wave
    float waveT = mod(uPulse - centerDist * 1.8, 6.2832) / 6.2832;
    float wave  = exp(-pow(waveT - 0.5, 2.0) * 18.0) * 0.08;
    pos += normalize(pos + vec3(0.0001)) * wave;

    // Y rotation
    float cs = cos(uRotY);
    float sn = sin(uRotY);
    pos = vec3(pos.x * cs - pos.z * sn, pos.y, pos.x * sn + pos.z * cs);

    // Scale
    pos *= uObjScale;

    // Black hole: spiral inward
    if (uBlackHole > 0.001) {
      float dist = length(pos);
      vec3  inDir  = -normalize(pos + vec3(0.001));
      vec3  up     = vec3(0.0, 1.0, 0.001);
      vec3  tangent = normalize(cross(inDir, up));
      pos += inDir  * uBlackHole * (dist * 0.5 + 0.3) * 2.8;
      pos += tangent * uBlackHole * 2.4;
    }

    // Explosion: radial burst keyed by seed
    if (uExplosion > 0.001) {
      float a1 = aSeed * 6.2832;
      float a2 = aSeed * 9.4248;
      vec3 dir = normalize(vec3(cos(a1)*cos(a2), sin(a2)+sin(a1)*0.4, sin(a1)*cos(a2)));
      pos += dir * uExplosion * (0.4 + aSeed * 0.9) * 5.8;
      pos *= 1.0 + uExplosion * 0.35;
    }

    // Attraction (pointing finger)
    if (uAttractStr > 0.001) {
      vec3 diff = uAttractPt - pos;
      float d = length(diff);
      if (d < 3.2) pos += normalize(diff) * uAttractStr * (3.2 - d) * 0.42;
    }

    vec3 worldPos = pos + uCenter;
    vec4 mvPos    = modelViewMatrix * vec4(worldPos, 1.0);
    gl_Position   = projectionMatrix * mvPos;

    // Edge factor: brighter on formation surface edges
    float edgeFactor = smoothstep(0.4, 2.5, centerDist);

    // Point size: larger near edges + pulse boost
    float camDist = max(-mvPos.z, 0.01);
    float sz = (aSize * uObjScale * 22.0) / camDist;
    sz *= 1.0 + edgeFactor * 0.35 + wave * 1.2;
    gl_PointSize = clamp(sz, 0.5, 16.0);

    vColor = aColor;
    vAlpha = 1.0 - smoothstep(8.0, 14.0, camDist);
    vEdge  = edgeFactor;
    vPulse = wave;
  }
`;

// ─── Fragment shader ──────────────────────────────────────────────────────────
const FRAG = /* glsl */`
  varying vec3  vColor;
  varying float vAlpha;
  varying float vEdge;
  varying float vPulse;

  void main() {
    vec2  uv = gl_PointCoord * 2.0 - 1.0;
    float d  = length(uv);
    if (d > 1.0) discard;

    // Layered glow: tight core + wide halo + edge ring
    float core     = exp(-d * d * 5.0);
    float halo     = exp(-d * d * 1.5) * 0.38;
    float edgeRing = (1.0 - smoothstep(0.55, 0.85, d)) * vEdge * 0.28;
    float alpha    = (core + halo + edgeRing) * vAlpha;

    // Color: edge particles and pulse briefly brighten
    float brightness = 1.0 + core * 1.8 + vEdge * 0.5 + vPulse * 3.0;
    vec3  col = vColor * brightness;
    // Slight hue shift toward white on pulse
    col = mix(col, vec3(1.0), vPulse * 0.35);
    col = min(col, vec3(3.0));

    gl_FragColor = vec4(col, alpha * 0.90);
  }
`;

// ─── Background vertex ────────────────────────────────────────────────────────
const BG_VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
`;

// ─── Background fragment (cinematic: CA + grain + vignette) ──────────────────
const BG_FRAG = /* glsl */`
  uniform sampler2D uVideoTex;
  uniform float     uHasVideo;
  uniform float     uTime;
  varying vec2      vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec2 uv = vec2(1.0 - vUv.x, vUv.y); // mirror for selfie

    // Keep the feed recognisable: this is an AR canvas, not a dark video grade.
    vec2  center = uv - 0.5;
    float caAmt  = length(center) * 0.006;
    vec2  caOff  = normalize(center + vec2(0.0001)) * caAmt;

    float r = texture2D(uVideoTex, uv + caOff).r;
    float g = texture2D(uVideoTex, uv).g;
    float b = texture2D(uVideoTex, uv - caOff).b;
    vec3  c = vec3(r, g, b);

    // Preserve a readable live camera background beneath the AR particles.
    c *= 0.62;

    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(lum), c, 0.74);
    c += vec3(-0.002, 0.002, 0.008);

    float vig = 1.0 - dot(center * 1.38, center * 1.38);
    c *= max(vig * 0.78 + 0.22, 0.0);

    float grain = hash(vUv * 240.0 + vec2(uTime * 0.003, 0.0)) * 0.009;
    c += grain - 0.0045;

    // Dark fallback when no video
    vec3 fallback = vec3(0.012, 0.015, 0.032);
    c = mix(fallback, c, uHasVideo);
    c = max(c, vec3(0.0));

    gl_FragColor = vec4(c, 1.0);
  }
`;

// ─── Public info struct ────────────────────────────────────────────────────────
export interface MagicInfo {
  fps:           number;
  formation:     FormationId;
  particleCount: number;
  palette:       string;
  paletteSwatch: string;
  gestureLabel:  string;
  blackHole:     boolean;
  exploding:     boolean;
  handScale:     number;
}

// ─── Critically damped spring helpers ────────────────────────────────────────
function springScalar(cur: number, tar: number, vel: number, k: number, d: number, dt: number): [number, number] {
  const acc = (tar - cur) * k - vel * d;
  const nv  = vel + acc * dt;
  const nc  = cur + nv * dt;
  return [nc, nv];
}

// ─── Engine ───────────────────────────────────────────────────────────────────
export class MagicEngine {
  // Renderer + scenes
  private renderer!: THREE.WebGLRenderer;
  private bgScene   = new THREE.Scene();
  private bgCamera  = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private bgMat!:    THREE.ShaderMaterial;
  private videoTex: THREE.VideoTexture | null = null;

  private scene   = new THREE.Scene();
  private camera  = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  private ptsMat!: THREE.ShaderMaterial;
  private ptsGeo!: THREE.BufferGeometry;
  private ptsObj!: THREE.Points;

  // Per-particle buffers (Float32Array — mutated in-place)
  private fromBuf!:  THREE.BufferAttribute;
  private toBuf!:    THREE.BufferAttribute;
  private colorBuf!: THREE.BufferAttribute;
  private fromPos!:  Float32Array;
  private toPos!:    Float32Array;
  private colors!:   Float32Array;
  private seeds!:    Float32Array;

  // Formation
  private formIdx = 0;
  private morphT  = 1.0;

  // Palette
  private paletteIdx = 0;

  // ── Spring-physics object state ───────────────────────────────────────────
  private objPosTgt   = new THREE.Vector3();
  private objPosCur   = new THREE.Vector3();
  private objPosVel   = new THREE.Vector3();

  private objScaleTgt = 1.0;
  private objScaleCur = 1.0;
  private objScaleVel = 0;

  private objRotTgt   = 0;
  private objRotCur   = 0;
  private objRotVel   = 0;

  // Hand-derived scale target (from palm size)
  private handScaleTgt = 1.0;

  // ── World-space extents of the z=0 plane as seen by the camera ─────────────
  // Recomputed on resize; used to map normalized palm coords → world position so
  // the AR formation sits exactly over the palm shown in the mirrored feed.
  private camDist    = 6;
  private viewWidth  = 4.5;
  private viewHeight = 3.2;

  // ── Effects ───────────────────────────────────────────────────────────────
  private blackHoleStr   = 0;
  private blackHoleActive= false;
  private explosionStr   = 0;
  private explosionAge   = 0;
  private isExploding    = false;
  private attractStr     = 0;
  private attractPt      = new THREE.Vector3();

  // ── UI label ──────────────────────────────────────────────────────────────
  private gestureLabel = '';
  private gestureTtl   = 0;

  // ── Idle / interaction state ───────────────────────────────────────────────
  private idleTime     = 0;      // seconds since last user interaction
  private autoSpin     = 0.18;   // idle auto-rotation speed (rad/s)
  private attractHold  = 0;      // frames to keep attraction alive before decay
  private lastPointerX = 0.5;
  private lastPointerY = 0.5;
  private mouseScaleTgt: number | null = null; // set by wheel; null = untouched

  // ── onInfo throttling (avoid 60fps React re-renders) ───────────────────────
  private infoAccum    = 0;
  private lastEmitLabel= '';

  // ── Stats ─────────────────────────────────────────────────────────────────
  private frameCount  = 0;
  private lastFpsTime = 0;
  private fps         = 60;
  private animId      = 0;
  private lastTime    = 0;

  onInfo: ((info: MagicInfo) => void) | null = null;

  // ─── Init ────────────────────────────────────────────────────────────────
  constructor(canvas: HTMLCanvasElement) {
    this.initRenderer(canvas);
    this.initBackground();
    this.initParticles();
    this.camera.position.set(0, 0, this.camDist);
    this.camera.lookAt(0, 0, 0);
    this.recomputeViewExtents();
    this.animId = requestAnimationFrame(t => this.animate(t));
  }

  private initRenderer(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.autoClear = false;
  }

  private initBackground() {
    const geo  = new THREE.PlaneGeometry(2, 2);
    this.bgMat = new THREE.ShaderMaterial({
      vertexShader:   BG_VERT,
      fragmentShader: BG_FRAG,
      uniforms: {
        uVideoTex: { value: null },
        uHasVideo: { value: 0 },
        uTime:     { value: 0 },
      },
      depthTest:  false,
      depthWrite: false,
    });
    this.bgScene.add(new THREE.Mesh(geo, this.bgMat));
  }

  private initParticles() {
    const N = PARTICLE_COUNT;

    this.seeds = new Float32Array(N);
    for (let i = 0; i < N; i++) this.seeds[i] = Math.random();

    const sizes = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const r = Math.random();
      sizes[i] = r < 0.78 ? 0.35 + Math.random() * 0.42
               : r < 0.94 ? 0.75 + Math.random() * 0.9
               :             1.6  + Math.random() * 1.6;
    }

    this.colors  = new Float32Array(N * 3);
    this.fromPos = new Float32Array(N * 3);
    this.toPos   = buildFormation('sphere', N);

    this.applyPaletteToBuffer(0);

    this.ptsGeo = new THREE.BufferGeometry();
    this.toBuf   = new THREE.BufferAttribute(this.toPos,   3);
    this.fromBuf = new THREE.BufferAttribute(this.fromPos, 3);
    this.colorBuf= new THREE.BufferAttribute(this.colors,  3);

    this.ptsGeo.setAttribute('position', this.toBuf);
    this.ptsGeo.setAttribute('aFromPos', this.fromBuf);
    this.ptsGeo.setAttribute('aSeed',    new THREE.BufferAttribute(this.seeds, 1));
    this.ptsGeo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    this.ptsGeo.setAttribute('aColor',   this.colorBuf);

    this.ptsMat = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime:       { value: 0 },
        uMorphT:     { value: 1.0 },
        uCenter:     { value: new THREE.Vector3() },
        uRotY:       { value: 0 },
        uObjScale:   { value: 1.0 },
        uBlackHole:  { value: 0 },
        uExplosion:  { value: 0 },
        uAttractPt:  { value: new THREE.Vector3() },
        uAttractStr: { value: 0 },
        uPulse:      { value: 0 },
      },
      transparent: true,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
      depthTest:   false,
    });

    this.ptsObj = new THREE.Points(this.ptsGeo, this.ptsMat);
    this.ptsObj.frustumCulled = false;
    this.scene.add(this.ptsObj);
  }

  // ─── Video texture ──────────────────────────────────────────────────────
  setVideoElement(video: HTMLVideoElement) {
    this.videoTex?.dispose();
    this.videoTex = new THREE.VideoTexture(video);
    this.videoTex.colorSpace = THREE.SRGBColorSpace;
    this.bgMat.uniforms.uVideoTex.value = this.videoTex;
    this.bgMat.uniforms.uHasVideo.value = 1;
  }

  // ─── Formation morphing ──────────────────────────────────────────────────
  private startMorph(id: FormationId) {
    const t = this.morphT;
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      this.fromPos[i] = this.fromPos[i] + (this.toPos[i] - this.fromPos[i]) * t;
    }
    this.fromBuf.needsUpdate = true;

    const next = buildFormation(id, PARTICLE_COUNT);
    this.toPos.set(next);
    this.toBuf.needsUpdate = true;

    this.morphT  = 0.0;
    this.formIdx = FORMATION_ORDER.indexOf(id);
  }

  private nextFormation() { this.startMorph(FORMATION_ORDER[(this.formIdx + 1) % FORMATION_ORDER.length]); }
  private prevFormation() { this.startMorph(FORMATION_ORDER[(this.formIdx - 1 + FORMATION_ORDER.length) % FORMATION_ORDER.length]); }

  setFormation(id: FormationId) {
    if (FORMATION_ORDER[this.formIdx] !== id) this.startMorph(id);
  }

  // ─── Palette ─────────────────────────────────────────────────────────────
  private applyPaletteToBuffer(idx: number) {
    const cols = PALETTES[idx].colors;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ci = Math.floor(this.seeds ? this.seeds[i] * cols.length : Math.random() * cols.length);
      const c  = cols[Math.min(ci, cols.length - 1)];
      this.colors[i * 3]     = c[0];
      this.colors[i * 3 + 1] = c[1];
      this.colors[i * 3 + 2] = c[2];
    }
  }

  private nextPalette() { this.paletteIdx = (this.paletteIdx + 1) % PALETTES.length; this.applyPaletteToBuffer(this.paletteIdx); this.colorBuf.needsUpdate = true; }
  private prevPalette() { this.paletteIdx = (this.paletteIdx - 1 + PALETTES.length) % PALETTES.length; this.applyPaletteToBuffer(this.paletteIdx); this.colorBuf.needsUpdate = true; }

  setPalette(idx: number) {
    this.paletteIdx = ((idx % PALETTES.length) + PALETTES.length) % PALETTES.length;
    this.applyPaletteToBuffer(this.paletteIdx);
    this.colorBuf.needsUpdate = true;
  }

  // ─── Explosion ───────────────────────────────────────────────────────────
  private triggerExplosion() {
    if (this.isExploding) return;
    this.isExploding  = true;
    this.explosionAge = 0;
    this.explosionStr = 0;
  }

  // ─── Gesture interface ───────────────────────────────────────────────────
  applyGestures(forces: GestureForces, triggers: GestureTriggers): void {
    const { openPalmRepel, blackHole, magnetPoint, pinchCharge,
            pinchZoom, twoHandScale, twoHandRotate, palmRotation, handScale, palmAnchor } = forces;

    const label = (s: string, ttl = 70) => { this.gestureLabel = s; this.gestureTtl = ttl; };

    // Any live hand input counts as interaction → suppress idle auto-spin
    if (openPalmRepel.active || blackHole.active || magnetPoint.active ||
        twoHandScale.active || twoHandRotate.active || pinchZoom.active || handScale.active) {
      this.idleTime = 0;
    }

    // ── Hand size → object scale (primary driver) ────────────────────────
    if (handScale.active) {
      this.handScaleTgt = handScale.targetScale;
    } else {
      // Drift back to 1.0 when hand not visible
      this.handScaleTgt += (1.0 - this.handScaleTgt) * 0.008;
    }
    // Hand scale is the base; other gestures can nudge it.
    // Anchored mode deliberately caps the visual field to a palm-sized AR object.
    this.objScaleTgt = palmAnchor.active
      ? Math.max(0.22, Math.min(0.68, this.handScaleTgt * 0.52))
      : this.handScaleTgt;

    // ── Palm anchor → the formation stays centered on the actual palm ──────
    if (palmAnchor.active) {
      // The background feed is mirrored, so mirror the MediaPipe x coordinate
      // before projecting. This places the field on the visible palm, not its
      // opposite side.
      const tx = (0.5 - palmAnchor.nx) * this.viewWidth;
      const ty = (0.5 - palmAnchor.ny) * this.viewHeight;
      this.objPosTgt.set(tx, ty, 0);
    }

    // Open palm keeps the same anchor but communicates the active motion mode.
    if (openPalmRepel.active) label('✋ MOVE', 30);

    // ── Fist → black hole ────────────────────────────────────────────────
    this.blackHoleActive = blackHole.active;
    if (blackHole.active) { this.blackHoleStr = Math.min(1, this.blackHoleStr + 0.04); label('⚫ BLACK HOLE'); }

    // ── Pointing → attract ───────────────────────────────────────────────
    if (magnetPoint.active) {
      // Feed is mirrored (selfie) → mirror x like palmAnchor for on-screen match.
      const tx = (0.5 - magnetPoint.nx) * this.viewWidth;
      const ty = (0.5 - magnetPoint.ny) * this.viewHeight;
      this.attractPt.set(tx, ty, 0);
      this.attractStr = Math.min(1, this.attractStr + 0.06);
      this.attractHold = 6;
      label('☝️ ATTRACT');
    }

    // ── Pinch → charge + explode on release ──────────────────────────────
    if (pinchCharge.justReleased && pinchCharge.charge > 0.05 && !this.isExploding) {
      this.triggerExplosion();
      label('💥 EXPLODE', 100);
    }

    // ── Two-hand scale: relative offset on top of hand scale ─────────────
    if (twoHandScale.active) {
      this.objScaleTgt = Math.max(0.25, Math.min(3.2, this.objScaleTgt + twoHandScale.scaleDelta * 2.8));
      label('🤲 SCALE', 30);
    }

    // ── Two-hand rotate ──────────────────────────────────────────────────
    if (twoHandRotate.active) { this.objRotTgt += twoHandRotate.angleDelta * 1.8; label('🔄 ROTATE', 30); }

    // ── Palm tilt → gentle rotate ────────────────────────────────────────
    if (palmRotation.active && !twoHandRotate.active) { this.objRotTgt += palmRotation.deltaRotY * 0.85; }

    // ── Pinch zoom: fine-tune scale ──────────────────────────────────────
    if (pinchZoom.active) {
      this.objScaleTgt = Math.max(0.25, Math.min(3.2, this.objScaleTgt + pinchZoom.delta * 1.8));
    }

    // ── Discrete triggers ────────────────────────────────────────────────
    if (triggers.peace)        { this.nextFormation(); label('✌️ SHAPE',   90); }
    if (triggers.thumbsUp)     { this.nextPalette();   label('👍 COLOR',   90); }
    if (triggers.thumbsDown)   { this.prevPalette();   label('👎 COLOR',   90); }
    if (triggers.threeFingers) { this.prevFormation(); label('3 PREV',     90); }
    if (triggers.supernova && !this.isExploding) { this.triggerExplosion(); label('🌟 SUPERNOVA', 120); }
    if (triggers.randomize) {
      this.startMorph(FORMATION_ORDER[Math.floor(Math.random() * FORMATION_ORDER.length)]);
      label('🎲 RANDOM', 90);
    }
  }

  // ─── Mouse / pointer interaction (works without a camera) ─────────────────
  /** nx, ny in 0..1 (canvas-relative). */
  pointerDown(nx: number, ny: number) {
    this.lastPointerX = nx;
    this.lastPointerY = ny;
    this.idleTime = 0;
  }

  /** nx, ny in 0..1. `dragging` = a button is held. */
  pointerMove(nx: number, ny: number, dragging: boolean) {
    this.idleTime = 0;
    if (dragging) {
      // Drag → rotate + drift the field toward the cursor
      this.objRotTgt += (nx - this.lastPointerX) * 4.0;
      this.objPosTgt.set((nx - 0.5) * this.viewWidth, (0.5 - ny) * this.viewHeight, 0);
    } else {
      // Hover → particles gently reach toward the cursor
      this.attractPt.set((nx - 0.5) * this.viewWidth, (0.5 - ny) * this.viewHeight, 0);
      this.attractStr = Math.min(1, this.attractStr + 0.08);
      this.attractHold = 6;
    }
    this.lastPointerX = nx;
    this.lastPointerY = ny;
  }

  pointerUp() {
    // Ease the field back to centre after a drag
    this.objPosTgt.set(0, 0, 0);
  }

  /** dir > 0 zoom in, < 0 zoom out. */
  wheelZoom(dir: number) {
    const base = this.mouseScaleTgt ?? this.objScaleCur;
    this.mouseScaleTgt = Math.max(0.25, Math.min(3.2, base + dir * 0.18));
    this.objScaleTgt = this.mouseScaleTgt;
    this.idleTime = 0;
  }

  /** Click on empty space → burst. */
  clickBurst() {
    if (!this.isExploding) {
      this.triggerExplosion();
      this.gestureLabel = '💥 BURST';
      this.gestureTtl = 90;
    }
    this.idleTime = 0;
  }

  // ─── Resize ─────────────────────────────────────────────────────────────
  onResize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.recomputeViewExtents();
  }

  /** Visible world extents of the z=0 plane — keeps palm↔formation aligned. */
  private recomputeViewExtents() {
    const vFov = (this.camera.fov * Math.PI) / 180;
    this.viewHeight = 2 * Math.tan(vFov / 2) * this.camDist;
    this.viewWidth  = this.viewHeight * this.camera.aspect;
  }

  // ─── Animation loop ──────────────────────────────────────────────────────
  private animate(time: number) {
    const dt = Math.min(0.05, (time - (this.lastTime || time)) / 1000);
    this.lastTime = time;

    // FPS counter
    this.frameCount++;
    if (time - this.lastFpsTime > 500) {
      this.fps         = Math.round(this.frameCount * 1000 / (time - this.lastFpsTime));
      this.frameCount  = 0;
      this.lastFpsTime = time;
    }

    // Morph
    if (this.morphT < 1.0) this.morphT = Math.min(1.0, this.morphT + dt * MORPH_SPEED);

    // Black hole decay
    if (!this.blackHoleActive) this.blackHoleStr = Math.max(0, this.blackHoleStr - dt * 1.6);

    // Explosion lifecycle
    if (this.isExploding) {
      this.explosionAge += dt;
      this.explosionStr = this.explosionAge < 0.35
        ? this.explosionAge / 0.35
        : Math.max(0, 1 - (this.explosionAge - 0.35) / 1.6);
      if (this.explosionAge > 2.1) {
        this.isExploding  = false;
        this.explosionStr = 0;
        this.startMorph(FORMATION_ORDER[this.formIdx]);
      }
    }

    // Gesture label TTL
    if (this.gestureTtl > 0) this.gestureTtl--;
    else this.gestureLabel = '';

    // Attraction decay (single source of truth for both hand + mouse)
    if (this.attractHold > 0) this.attractHold--;
    else this.attractStr = Math.max(0, this.attractStr - dt * 2.2);

    // Idle auto-rotation — keeps the field feeling alive when untouched
    this.idleTime += dt;
    if (this.idleTime > 1.0) {
      const ramp = Math.min(1, (this.idleTime - 1.0) / 1.5); // ease in over 1.5s
      this.objRotTgt += this.autoSpin * ramp * dt;
    }

    // ── Critically damped springs ─────────────────────────────────────────
    // Position
    const pxRes = springScalar(this.objPosCur.x, this.objPosTgt.x, this.objPosVel.x, SPRING_K_POS, SPRING_D_POS, dt);
    const pyRes = springScalar(this.objPosCur.y, this.objPosTgt.y, this.objPosVel.y, SPRING_K_POS, SPRING_D_POS, dt);
    const pzRes = springScalar(this.objPosCur.z, this.objPosTgt.z, this.objPosVel.z, SPRING_K_POS, SPRING_D_POS, dt);
    this.objPosCur.set(pxRes[0], pyRes[0], pzRes[0]);
    this.objPosVel.set(pxRes[1], pyRes[1], pzRes[1]);

    // Scale
    const [sc, sv] = springScalar(this.objScaleCur, this.objScaleTgt, this.objScaleVel, SPRING_K_SCALE, SPRING_D_SCALE, dt);
    this.objScaleCur = Math.max(0.05, sc);
    this.objScaleVel = sv;

    // Rotation
    const [rc, rv] = springScalar(this.objRotCur, this.objRotTgt, this.objRotVel, SPRING_K_ROT, SPRING_D_ROT, dt);
    this.objRotCur  = rc;
    this.objRotVel  = rv;

    // ── Update uniforms ───────────────────────────────────────────────────
    const u = this.ptsMat.uniforms;
    u.uTime.value       = time * 0.001;
    u.uMorphT.value     = this.morphT;
    u.uCenter.value.copy(this.objPosCur);
    u.uRotY.value       = this.objRotCur;
    u.uObjScale.value   = this.objScaleCur;
    u.uBlackHole.value  = this.blackHoleStr;
    u.uExplosion.value  = this.explosionStr;
    u.uAttractPt.value.copy(this.attractPt);
    u.uAttractStr.value = this.attractStr;
    u.uPulse.value      = time * 0.0015; // slow outward wave

    this.bgMat.uniforms.uTime.value = time * 0.001;

    // ── Render ────────────────────────────────────────────────────────────
    this.renderer.clear(true, true, true);
    this.renderer.render(this.bgScene, this.bgCamera);
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);

    // ── Info (throttled ~8Hz, or immediately when the label changes) ───────
    this.infoAccum += dt;
    if (this.infoAccum >= 0.12 || this.gestureLabel !== this.lastEmitLabel) {
      this.infoAccum = 0;
      this.lastEmitLabel = this.gestureLabel;
      this.onInfo?.({
        fps:           this.fps,
        formation:     FORMATION_ORDER[this.formIdx],
        particleCount: PARTICLE_COUNT,
        palette:       PALETTES[this.paletteIdx].name,
        paletteSwatch: PALETTES[this.paletteIdx].swatch,
        gestureLabel:  this.gestureLabel,
        blackHole:     this.blackHoleStr > 0.05,
        exploding:     this.isExploding,
        handScale:     this.objScaleCur,
      });
    }

    this.animId = requestAnimationFrame(t => this.animate(t));
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────
  dispose() {
    cancelAnimationFrame(this.animId);
    this.ptsGeo.dispose();
    this.ptsMat.dispose();
    this.bgMat.dispose();
    this.videoTex?.dispose();
    this.renderer.dispose();
  }
}
