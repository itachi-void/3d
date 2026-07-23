/**
 * WorldEngine — real photo-sphere viewer using THREE.js.
 *
 * Each world loads a real Unsplash photo into an inside-out sphere
 * (SphereGeometry scaled to flip normals). The camera sits at the
 * centre of the sphere, giving a full Google-Street-View–style
 * immersive experience. Users look around, zoom in/out, and switch
 * worlds via gesture or mouse.
 */

import * as THREE from 'three';
import type { GestureForces, GestureTriggers } from '../hand-tracking/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorldId = 'temple' | 'castle' | 'scifi' | 'space' | 'underwater';

export interface WorldInfo {
  fps: number;
  worldId: WorldId;
  worldName: string;
  worldNameAr: string;
  gestureLabel: string;
  portalOpen: boolean;
  portalTarget: WorldId | null;
  spell: string;
  weather: string;
  timeOfDay: string;
}

// ─── World catalogue ──────────────────────────────────────────────────────────

const WORLD_META: Record<WorldId, {
  name: string; nameAr: string;
  url: string;
  weather: string; timeOfDay: string;
  pr: number; pg: number; pb: number; // particle colour 0-1
}> = {
  temple: {
    name: 'Ancient Temple', nameAr: 'المعبد القديم',
    url: 'https://images.unsplash.com/photo-1632944398987-494eebe663be?w=3000&q=90&fm=jpg',
    weather: 'clear', timeOfDay: 'sunset',
    pr: 1.0, pg: 0.73, pb: 0.13,
  },
  castle: {
    name: 'Magic Castle', nameAr: 'القلعة السحرية',
    url: 'https://images.unsplash.com/photo-1560857964-8249ce27ab8f?w=3000&q=90&fm=jpg',
    weather: 'magic', timeOfDay: 'night',
    pr: 0.67, pg: 0.27, pb: 1.0,
  },
  scifi: {
    name: 'Sci-Fi Lab', nameAr: 'المختبر المستقبلي',
    url: 'https://images.unsplash.com/photo-1680992046626-418f7e910589?w=3000&q=90&fm=jpg',
    weather: 'clear', timeOfDay: 'artificial',
    pr: 0.08, pg: 0.87, pb: 1.0,
  },
  space: {
    name: 'Deep Space', nameAr: 'الفضاء العميق',
    url: 'https://images.unsplash.com/photo-1487715433499-93acdc0bd7c3?w=3000&q=90&fm=jpg',
    weather: 'clear', timeOfDay: 'stellar',
    pr: 0.71, pg: 0.79, pb: 1.0,
  },
  underwater: {
    name: 'Ocean Deep', nameAr: 'أعماق المحيط',
    url: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=3000&q=90&fm=jpg',
    weather: 'foggy', timeOfDay: 'noon',
    pr: 0.04, pg: 0.73, pb: 0.94,
  },
};

export const WORLD_ORDER: WorldId[] = ['temple', 'castle', 'scifi', 'space', 'underwater'];

const PARTICLE_COUNT = 250;

// ─── Engine ───────────────────────────────────────────────────────────────────

export class WorldEngine {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private rafId = 0;
  private lastTs = 0;

  // ── Photo sphere ──
  private sphere!: THREE.Mesh;
  private sphereMat!: THREE.MeshBasicMaterial;
  private loader = new THREE.TextureLoader();
  private loadedTextures = new Map<WorldId, THREE.Texture>();
  private isLoading = false;

  // ── Camera look state ──
  private camYaw = 0;         // current (smooth)
  private camPitch = 0;
  private camYawTarget = 0;   // target (driven by gestures/mouse)
  private camPitchTarget = 0;
  private camFov = 75;
  private camFovTarget = 75;

  // ── Fade transition overlay (plane parented to camera) ──
  private overlayMat!: THREE.MeshBasicMaterial;
  private fadeAlpha = 1; // start faded in, reveals on first load
  private fadeDir = -1;  // immediately start fading out
  private fadePending: WorldId | null = null;

  // ── World state ──
  private world: WorldId = 'temple';

  // ── Particles ──
  private particles!: THREE.Points;
  private pPos!: Float32Array;
  private pVel!: Float32Array;
  private pColors!: Float32Array;

  // ── Gesture / spell state ──
  chargeLevel = 0;
  private blackHoleActive = false;
  private exploding = false;
  private explodeTimer = 0;
  private spell = 'none';
  private label = '';
  private labelTimer = 0;

  // ── Info callback ──
  private infoCallback: ((i: WorldInfo) => void) | null = null;
  private infoTimer = 0;
  private fps = 60;
  private fpsBuf: number[] = [];

  // ── Mouse drag (desktop fallback) ──
  private dragActive = false;
  private dragLastX = 0;
  private dragLastY = 0;
  private lastPinchDist: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(w, h);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1100);
    this.camera.position.set(0, 0, 0);

    this.scene = new THREE.Scene();
    this.scene.add(this.camera);

    this.buildOverlay();
    this.buildSphere();
    this.buildParticles();
    this.bindMouse(canvas);

    // Preload all world textures in background
    this.loader.crossOrigin = 'anonymous';
    for (const id of WORLD_ORDER) this.loadTexture(id);

    this.rafId = requestAnimationFrame(this.tick);
  }

  // ── Build helpers ─────────────────────────────────────────────────────────

  private buildOverlay() {
    const geo = new THREE.PlaneGeometry(2, 2);
    this.overlayMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
    });
    const plane = new THREE.Mesh(geo, this.overlayMat);
    plane.position.set(0, 0, -0.5);
    plane.renderOrder = 999;
    this.camera.add(plane);
  }

  private buildSphere() {
    const geo = new THREE.SphereGeometry(500, 64, 32);
    geo.scale(-1, 1, 1); // flip normals → you're inside
    this.sphereMat = new THREE.MeshBasicMaterial({ color: 0x080818 });
    this.sphere = new THREE.Mesh(geo, this.sphereMat);
    this.scene.add(this.sphere);
  }

  private loadTexture(id: WorldId) {
    if (this.loadedTextures.has(id)) return;
    this.loader.load(
      WORLD_META[id].url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        this.loadedTextures.set(id, tex);
        // Apply immediately if this is the current world
        if (id === this.world) {
          this.sphereMat.map = tex;
          this.sphereMat.color.setHex(0xffffff);
          this.sphereMat.needsUpdate = true;
          this.isLoading = false;
        }
      },
      undefined,
      () => { if (id === this.world) this.isLoading = false; }
    );
  }

  private buildParticles() {
    this.pPos    = new Float32Array(PARTICLE_COUNT * 3);
    this.pVel    = new Float32Array(PARTICLE_COUNT * 3);
    this.pColors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 6;
      this.pPos[i * 3]     = Math.cos(a) * r;
      this.pPos[i * 3 + 1] = -2 - Math.random() * 4;
      this.pPos[i * 3 + 2] = Math.sin(a) * r;
      this.pVel[i * 3]     = (Math.random() - 0.5) * 0.012;
      this.pVel[i * 3 + 1] = 0.004 + Math.random() * 0.006;
      this.pVel[i * 3 + 2] = (Math.random() - 0.5) * 0.012;
      this.pColors[i * 3] = 1; this.pColors[i * 3 + 1] = 1; this.pColors[i * 3 + 2] = 1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(this.pColors, 3));

    this.particles = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 5,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      sizeAttenuation: false,
    }));
    this.scene.add(this.particles);
  }

  private bindMouse(canvas: HTMLCanvasElement) {
    const onDown = (e: MouseEvent) => {
      this.dragActive = true;
      this.dragLastX = e.clientX;
      this.dragLastY = e.clientY;
    };
    const onMove = (e: MouseEvent) => {
      if (!this.dragActive) return;
      const dx = e.clientX - this.dragLastX;
      const dy = e.clientY - this.dragLastY;
      this.camYawTarget   -= dx * 0.003;
      this.camPitchTarget  = Math.max(-1.4, Math.min(1.4, this.camPitchTarget + dy * 0.002));
      this.dragLastX = e.clientX;
      this.dragLastY = e.clientY;
    };
    const onUp = () => { this.dragActive = false; };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.camFovTarget = Math.max(22, Math.min(110, this.camFovTarget + e.deltaY * 0.05));
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        this.dragLastX = e.touches[0].clientX;
        this.dragLastY = e.touches[0].clientY;
        this.dragActive = true;
      } else if (e.touches.length === 2) {
        this.dragActive = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.lastPinchDist = Math.hypot(dx, dy);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && this.dragActive) {
        const dx = e.touches[0].clientX - this.dragLastX;
        const dy = e.touches[0].clientY - this.dragLastY;
        this.camYawTarget   -= dx * 0.004;
        this.camPitchTarget  = Math.max(-1.4, Math.min(1.4, this.camPitchTarget + dy * 0.003));
        this.dragLastX = e.touches[0].clientX;
        this.dragLastY = e.touches[0].clientY;
      } else if (e.touches.length === 2 && this.lastPinchDist !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const delta = this.lastPinchDist - dist;
        this.camFovTarget = Math.max(22, Math.min(110, this.camFovTarget + delta * 0.1));
        this.lastPinchDist = dist;
      }
    };
    const onTouchEnd = () => { this.dragActive = false; this.lastPinchDist = null; };

    canvas.addEventListener('mousedown',  onDown,      { passive: true });
    window.addEventListener('mousemove',  onMove,      { passive: true });
    window.addEventListener('mouseup',    onUp,        { passive: true });
    canvas.addEventListener('wheel',      onWheel,     { passive: false });
    canvas.addEventListener('touchstart', onTouchStart,{ passive: true });
    canvas.addEventListener('touchmove',  onTouchMove, { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd,  { passive: true });
  }

  // ── Main loop ─────────────────────────────────────────────────────────────

  private tick = (now: number) => {
    this.rafId = requestAnimationFrame(this.tick);
    const dt = Math.min((now - (this.lastTs || now)) / 1000, 0.05);
    this.lastTs = now;

    if (dt > 0) {
      this.fpsBuf.push(1 / dt);
      if (this.fpsBuf.length > 40) this.fpsBuf.shift();
      this.fps = Math.round(this.fpsBuf.reduce((a, b) => a + b) / this.fpsBuf.length);
    }

    this.labelTimer += dt;
    if (this.labelTimer > 3) this.label = '';

    if (this.exploding) {
      this.explodeTimer += dt;
      if (this.explodeTimer > 0.8) { this.exploding = false; this.explodeTimer = 0; }
    }

    // Fade transition
    if (this.fadeDir !== 0) {
      this.fadeAlpha += this.fadeDir * dt * 2.8;
      if (this.fadeAlpha >= 1) {
        this.fadeAlpha = 1;
        if (this.fadePending) {
          this.applyWorld(this.fadePending);
          this.fadePending = null;
        }
        this.fadeDir = -1;
      } else if (this.fadeAlpha <= 0) {
        this.fadeAlpha = 0;
        this.fadeDir = 0;
      }
      this.overlayMat.opacity = Math.max(0, this.fadeAlpha);
    }

    // Smooth camera
    const lerp = Math.min(1, dt * 8);
    this.camYaw   += (this.camYawTarget   - this.camYaw)   * lerp;
    this.camPitch += (this.camPitchTarget - this.camPitch) * lerp;
    this.camFov   += (this.camFovTarget   - this.camFov)   * Math.min(1, dt * 6);
    this.camera.fov = this.camFov;
    this.camera.updateProjectionMatrix();

    // Apply look direction
    const lx = Math.cos(this.camPitch) * Math.sin(this.camYaw);
    const ly = Math.sin(this.camPitch);
    const lz = -Math.cos(this.camPitch) * Math.cos(this.camYaw);
    this.camera.lookAt(lx * 100, ly * 100, lz * 100);

    this.updateParticles(dt);
    this.renderer.render(this.scene, this.camera);

    this.infoTimer += dt;
    if (this.infoTimer >= 0.1) { this.infoTimer = 0; this.emitInfo(); }
  };

  private updateParticles(dt: number) {
    const { pr, pg, pb } = WORLD_META[this.world];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3, iy = ix + 1, iz = ix + 2;

      // Black hole: pull towards origin
      if (this.blackHoleActive) {
        const dx = -this.pPos[ix], dy = -this.pPos[iy], dz = -this.pPos[iz];
        const d = Math.sqrt(dx*dx + dy*dy + dz*dz) + 0.1;
        const f = 0.4 / (d * d);
        this.pVel[ix] += dx * f; this.pVel[iy] += dy * f; this.pVel[iz] += dz * f;
      }

      // Explosion: push outward
      if (this.exploding) {
        const len = Math.sqrt(this.pPos[ix]**2 + this.pPos[iy]**2 + this.pPos[iz]**2) + 0.1;
        this.pVel[ix] += (this.pPos[ix]/len) * 0.18;
        this.pVel[iy] += (this.pPos[iy]/len) * 0.18;
        this.pVel[iz] += (this.pPos[iz]/len) * 0.18;
      }

      this.pPos[ix] += this.pVel[ix];
      this.pPos[iy] += this.pVel[iy];
      this.pPos[iz] += this.pVel[iz];

      // Gentle float upward
      this.pVel[iy] += 0.00025;
      this.pVel[ix] *= 0.992; this.pVel[iy] *= 0.992; this.pVel[iz] *= 0.992;

      // Respawn when out of view range
      const dist2 = this.pPos[ix]**2 + this.pPos[iy]**2 + this.pPos[iz]**2;
      if (dist2 > 14**2 || this.pPos[iy] > 9) {
        const a = Math.random() * Math.PI * 2;
        const r = 1.5 + Math.random() * 3;
        this.pPos[ix] = Math.cos(a) * r;
        this.pPos[iy] = -2 - Math.random() * 3;
        this.pPos[iz] = Math.sin(a) * r;
        this.pVel[ix] = (Math.random() - 0.5) * 0.012;
        this.pVel[iy] = 0.004 + Math.random() * 0.006;
        this.pVel[iz] = (Math.random() - 0.5) * 0.012;
      }

      // Update colour to match current world
      this.pColors[ix] = pr; this.pColors[iy] = pg; this.pColors[iz] = pb;
    }

    (this.particles.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.particles.geometry.getAttribute('color')    as THREE.BufferAttribute).needsUpdate = true;
  }

  private applyWorld(id: WorldId) {
    this.world = id;
    this.camYawTarget = 0;
    this.camPitchTarget = 0;
    this.camFovTarget = 75;

    const tex = this.loadedTextures.get(id);
    if (tex) {
      this.sphereMat.map = tex;
      this.sphereMat.color.setHex(0xffffff);
      this.sphereMat.needsUpdate = true;
      this.isLoading = false;
    } else {
      this.sphereMat.map = null;
      this.sphereMat.color.setHex(0x080818);
      this.sphereMat.needsUpdate = true;
      this.isLoading = true;
      this.loadTexture(id);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  setWorld(id: WorldId) {
    if (id === this.world || this.fadeDir !== 0) return;
    this.fadePending = id;
    this.fadeDir = 1;
  }

  nextWorldCycle() {
    const next = WORLD_ORDER[(WORLD_ORDER.indexOf(this.world) + 1) % WORLD_ORDER.length];
    this.setWorld(next);
    this.flash(`→ ${WORLD_META[next].nameAr}`);
  }

  prevWorldCycle() {
    const prev = WORLD_ORDER[(WORLD_ORDER.indexOf(this.world) - 1 + WORLD_ORDER.length) % WORLD_ORDER.length];
    this.setWorld(prev);
    this.flash(`← ${WORLD_META[prev].nameAr}`);
  }

  applyGestures(forces: GestureForces, triggers: GestureTriggers) {
    // Finger-aim → pan the camera in the direction the index finger points.
    // Rate control: while pointing, the camera keeps turning toward the aim.
    // Position-agnostic — the hand can be anywhere in the camera box.
    if (forces.pointDir.active) {
      const { dx, dy } = forces.pointDir;
      // Dead-zone so a roughly-forward finger holds the view steady.
      const dead = 0.18;
      const ax = Math.abs(dx) > dead ? dx : 0;
      const ay = Math.abs(dy) > dead ? dy : 0;
      const YAW_SPEED   = 0.05;
      const PITCH_SPEED = 0.04;
      this.camYawTarget  += ax * YAW_SPEED;
      // dy is image-space (y-down): finger up (dy<0) → look up (pitch up).
      this.camPitchTarget = Math.max(-1.35, Math.min(1.35, this.camPitchTarget - ay * PITCH_SPEED));
    }

    // Two-hand spread/close → zoom (FOV)
    if (forces.twoHandScale.active) {
      this.camFovTarget = Math.max(22, Math.min(110, this.camFovTarget - forces.twoHandScale.scaleDelta * 60));
    }

    // Single-hand pinch zoom: thumb+index distance → FOV
    // Spreading fingers (delta > 0) = zoom in = smaller FOV
    if (forces.pinchZoom.active) {
      this.camFovTarget = Math.max(22, Math.min(110, this.camFovTarget - forces.pinchZoom.delta * 45));
    }

    // Two-hand rotate → yaw pan
    if (forces.twoHandRotate.active) {
      this.camYawTarget -= forces.twoHandRotate.angleDelta * 5;
    }

    // (Camera look is driven by finger-aim direction above, not hand tilt.)

    // Black hole (fist)
    const bhWas = this.blackHoleActive;
    this.blackHoleActive = forces.blackHole.active;
    if (this.blackHoleActive && !bhWas) { this.spell = 'Black Hole'; this.flash('🌑 ثقب أسود'); }
    else if (!this.blackHoleActive && bhWas && this.spell === 'Black Hole') { this.spell = 'none'; }

    // Pinch charge → explosion
    if (forces.pinchCharge.active) {
      this.chargeLevel = Math.min(1, this.chargeLevel + 0.03);
      if (this.chargeLevel > 0.75) { this.spell = 'Charged!'; this.flash('⚡ مشحون — افتح يدك!'); }
    } else if (!forces.pinchCharge.justReleased) {
      this.chargeLevel = Math.max(0, this.chargeLevel - 0.015);
    }
    if (forces.pinchCharge.justReleased && this.chargeLevel > 0.08) {
      this.flash(`💥 انفجار ${Math.round(this.chargeLevel * 100)}%!`);
      this.triggerExplosion();
      this.chargeLevel = 0;
      this.spell = 'none';
    }

    if (triggers.thumbsUp)   this.nextWorldCycle();
    if (triggers.thumbsDown) this.prevWorldCycle();
    if (triggers.supernova)  { this.triggerExplosion(); this.flash('💥 سوبرنوفا!'); }
  }

  onInfo(cb: (i: WorldInfo) => void)  { this.infoCallback = cb; }

  onResize(w: number, h: number) {
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    cancelAnimationFrame(this.rafId);
    this.renderer.dispose();
    this.loadedTextures.forEach(t => t.dispose());
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private flash(msg: string) { this.label = msg; this.labelTimer = 0; }

  private triggerExplosion() { this.exploding = true; this.explodeTimer = 0; }

  private emitInfo() {
    if (!this.infoCallback) return;
    const meta = WORLD_META[this.world];
    this.infoCallback({
      fps: this.fps,
      worldId: this.world,
      worldName: meta.name,
      worldNameAr: meta.nameAr,
      gestureLabel: this.isLoading ? '⏳ جاري التحميل...' : this.label,
      portalOpen: this.fadeDir !== 0,
      portalTarget: this.fadePending,
      spell: this.spell,
      weather: meta.weather,
      timeOfDay: meta.timeOfDay,
    });
  }
}
