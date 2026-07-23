import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { TwoHandContext } from '../hand-tracking/types';

// Sponza Palace (Khronos GLTF Sample Models) via jsDelivr CDN — CORS enabled
const SPONZA_URL =
  'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Sponza/glTF-Binary/Sponza.glb';

export type LoadState = 'loading' | 'ready' | 'fallback';

export interface BuildingInfo {
  loadState: LoadState;
  progress: number;   // 0–1
  speed: number;      // m/s
  gesture: string;
  birdEye: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stoneCanvas(hex = '#5c5860', size = 256): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const n = parseInt(hex.slice(1), 16);
  const [br, bg, bb] = [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 4500; i++) {
    const v = Math.floor(Math.random() * 60 - 30);
    const r = Math.max(0, Math.min(255, br + v));
    const g = Math.max(0, Math.min(255, bg + v));
    const b = Math.max(0, Math.min(255, bb + v));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, 0.8 + Math.random() * 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(12,10,16,0.42)';
  ctx.lineWidth = 1.5;
  const rh = 36;
  for (let y = rh; y < size; y += rh) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
  }
  for (let row = 0; row * rh < size; row++) {
    const off = (row % 2) * 55;
    for (let x = off; x < size + 55; x += 110) {
      ctx.beginPath(); ctx.moveTo(x, row * rh); ctx.lineTo(x, (row + 1) * rh); ctx.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function columnGeo(h: number): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.50, 0.00),
    new THREE.Vector2(0.50, 0.16),
    new THREE.Vector2(0.40, 0.26),
  ];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    pts.push(new THREE.Vector2(0.29 - t * 0.06, 0.30 + t * (h - 1.1)));
  }
  pts.push(
    new THREE.Vector2(0.28, h - 0.80),
    new THREE.Vector2(0.38, h - 0.55),
    new THREE.Vector2(0.48, h - 0.28),
    new THREE.Vector2(0.54, h - 0.08),
    new THREE.Vector2(0.54, h),
  );
  return new THREE.LatheGeometry(pts, 18);
}

// ─── Engine ──────────────────────────────────────────────────────────────────

export class BuildingEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private rafId = 0;
  private then = performance.now();

  // Player
  private eye = new THREE.Vector3(0, 1.7, 10);
  private yaw = Math.PI;
  private pitch = 0;
  private speed = 0;
  private speedTarget = 0;
  private bounds = new THREE.Box3();
  private boundsReady = false;

  // Gesture inputs
  private gForward = false;
  private gStop = false;
  private gSteer = 0;
  private gSprint = false;
  private gPitch = 0;
  private peaceWas = false;
  private _birdEye = false;
  private gestureLabel = 'idle';

  // State
  private loadState: LoadState = 'loading';
  private loadProgress = 0;

  onInfo?: (info: BuildingInfo) => void;

  constructor(canvas: HTMLCanvasElement) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x09050f, 20, 70);
    this.scene.background = new THREE.Color(0x09050f);

    this.camera = new THREE.PerspectiveCamera(72, w / Math.max(h, 1), 0.05, 130);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(w, h, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // IBL environment for PBR materials in the loaded GLTF
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(0.04)).texture;
    pmrem.dispose();

    this.setupLighting();
    this.loadModel();
    this.startLoop();
  }

  // ── Lighting ────────────────────────────────────────────────────────────────

  private setupLighting(): void {
    this.scene.add(new THREE.HemisphereLight(0xc5d8f0, 0x201820, 0.85));

    const sun = new THREE.DirectionalLight(0xfff0d8, 3.8);
    sun.position.set(8, 22, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera as THREE.OrthographicCamera;
    sc.near = 1; sc.far = 110;
    sc.left = sc.bottom = -28;
    sc.right = sc.top = 28;
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x5080b0, 0.9);
    fill.position.set(-6, 10, -12);
    this.scene.add(fill);

    const warmCols: [number, number, number, number][] = [
      [0, 4, 0, 0xff9944],
      [10, 2.8, 9, 0xff7722],
      [-10, 2.8, 9, 0xff7722],
      [10, 2.8, -9, 0xff9944],
      [-10, 2.8, -9, 0xff9944],
      [0, 3, -22, 0x4488ff],  // north alcove
      [0, 3,  22, 0xff8833],  // south chamber
    ];
    warmCols.forEach(([x, y, z, col]) => {
      const pl = new THREE.PointLight(col, 1.3, 20, 2);
      pl.position.set(x, y, z);
      this.scene.add(pl);
    });
  }

  // ── Model loading ────────────────────────────────────────────────────────────

  private async loadModel(): Promise<void> {
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    loader.setDRACOLoader(draco);

    try {
      const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
        loader.load(
          SPONZA_URL,
          resolve,
          (xhr) => {
            if (xhr.total > 0) {
              this.loadProgress = xhr.loaded / xhr.total;
              this.emitInfo();
            }
          },
          reject,
        );
      });

      const model = gltf.scene;

      // Scale so the widest horizontal dimension ≈ 32 m
      const raw = new THREE.Box3().setFromObject(model);
      const rawSize = raw.getSize(new THREE.Vector3());
      const maxSpan = Math.max(rawSize.x, rawSize.z);
      if (maxSpan > 0) model.scale.setScalar(32 / maxSpan);

      // Sit on Y = 0, center on XZ
      const fit = new THREE.Box3().setFromObject(model);
      const center = fit.getCenter(new THREE.Vector3());
      model.position.set(-center.x, -fit.min.y, -center.z);

      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.scene.add(model);

      // Walkable bounds = full model box shrunk by wall margin
      const final = new THREE.Box3().setFromObject(model);
      this.bounds.copy(final);
      const mid = final.getCenter(new THREE.Vector3());
      const sz = final.getSize(new THREE.Vector3());
      // Start player in center-ish of atrium, not at the absolute centre (might be a wall)
      this.eye.set(mid.x, final.min.y + 1.7, mid.z + sz.z * 0.15);
      this.boundsReady = true;

      this.loadState = 'ready';
      this.loadProgress = 1;
      this.emitInfo();

    } catch (err) {
      console.warn('[BuildingEngine] Sponza load failed — using procedural fallback:', err);
      this.buildFallback();
    }

    draco.dispose();
  }

  // ── Procedural fallback ──────────────────────────────────────────────────────

  private buildFallback(): void {
    const stoneTex = (hex: string, rx = 4, ry = 3) => {
      const t = stoneCanvas(hex); t.repeat.set(rx, ry); return t;
    };

    const stone = new THREE.MeshStandardMaterial({
      color: 0x625e63, roughness: 0.93, metalness: 0.01,
      map: stoneTex('#625e63'),
    });
    const dark = new THREE.MeshStandardMaterial({
      color: 0x3b383e, roughness: 0.95,
      map: stoneTex('#3b383e', 3, 2),
    });
    const floor = new THREE.MeshStandardMaterial({
      color: 0xbab3ac, roughness: 0.22, metalness: 0.16,
    });
    const gold = new THREE.MeshStandardMaterial({
      color: 0xd4a843, roughness: 0.26, metalness: 0.94,
    });
    const banner = new THREE.MeshStandardMaterial({
      color: 0x3c1e6e, emissive: 0x1a0d32, emissiveIntensity: 0.6,
      roughness: 0.9, side: THREE.DoubleSide,
    });

    const box = (
      w: number, h: number, d: number,
      x: number, y: number, z: number,
      mat: THREE.Material,
      inside = false,
    ) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        inside
          ? new THREE.MeshStandardMaterial({ ...(mat as THREE.MeshStandardMaterial), side: THREE.BackSide })
          : mat,
      );
      m.position.set(x, y, z);
      m.castShadow = m.receiveShadow = true;
      this.scene.add(m);
    };

    // ── Main Hall: 40 × 15 × 12 ──
    const HL = 40, HW = 15, HH = 12;

    // Floor
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(HW + 12, HL + 12), floor);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    // Barrel vault
    const vmat = dark.clone(); vmat.side = THREE.BackSide;
    const vault = new THREE.Mesh(
      new THREE.CylinderGeometry(HW * 0.58, HW * 0.58, HL, 16, 1, true, Math.PI * 0.24, Math.PI * 0.52),
      vmat,
    );
    vault.position.set(0, HH * 0.9, 0); vault.rotation.x = Math.PI / 2;
    vault.receiveShadow = true;
    this.scene.add(vault);

    // End walls
    box(HW + 4, HH, 0.7, 0, HH / 2, -HL / 2, stone);
    box(HW + 4, HH, 0.7, 0, HH / 2,  HL / 2, stone);

    // Side walls with arched window openings
    const WSILL = 2.8, WH = 4.5;
    for (let i = 0; i < 5; i++) {
      const z = -HL / 2 + 4.5 + i * 7.8;
      [-(HW / 2), HW / 2].forEach(x => {
        box(0.65, WSILL, 7.2, x, WSILL / 2, z, dark);
        box(0.65, HH - WSILL - WH, 7.2, x, WSILL + WH + (HH - WSILL - WH) / 2, z, dark);
        box(0.65, HH, 1.1, x, HH / 2, z - 3.95, stone);
        box(0.65, HH, 1.1, x, HH / 2, z + 3.95, stone);
      });
    }

    // 6 column pairs
    const cGeo = columnGeo(HH - 0.8);
    const cMat = new THREE.MeshStandardMaterial({ color: 0x8a8690, roughness: 0.82, metalness: 0.04 });
    for (let i = 0; i < 6; i++) {
      const z = -HL / 2 + 3 + i * 7.5;
      [-(HW / 2) + 2.4, (HW / 2) - 2.4].forEach(x => {
        const col = new THREE.Mesh(cGeo, cMat);
        col.position.set(x, 0, z);
        col.castShadow = col.receiveShadow = true;
        this.scene.add(col);
      });
    }

    // Gold entablature along column tops
    [-(HW / 2) + 2.4, (HW / 2) - 2.4].forEach(x => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.38, HL - 2.5), gold);
      beam.position.set(x, HH - 0.2, 0);
      this.scene.add(beam);
    });

    // Cross arches (half-torus between column pairs)
    for (let i = 0; i < 6; i++) {
      const z = -HL / 2 + 3 + i * 7.5;
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry((HW / 2) - 2.5, 0.18, 8, 30, Math.PI),
        dark,
      );
      arch.position.set(0, HH - 0.35, z);
      this.scene.add(arch);
    }

    // Banners
    for (let i = 0; i < 5; i++) {
      const z = -HL / 2 + 7 + i * 7.5;
      [-(HW / 2) + 3.2, (HW / 2) - 3.2].forEach(x => {
        const ban = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 4), banner);
        ban.position.set(x, HH - 4.2, z);
        this.scene.add(ban);
      });
    }

    // Chandelier (hanging ring + glow)
    const chanRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.07, 8, 28),
      gold,
    );
    chanRing.position.set(0, HH - 1.4, 0); chanRing.rotation.x = Math.PI / 2;
    this.scene.add(chanRing);
    const chanGlow = new THREE.PointLight(0xffd590, 3.5, 32, 2);
    chanGlow.position.set(0, HH - 1.5, 0); chanGlow.castShadow = true;
    chanGlow.shadow.mapSize.set(1024, 1024);
    this.scene.add(chanGlow);

    // ── North Alcove ─────────────────────────────────
    const NW = 11, ND = 14, NH = 9;
    const nFloor = new THREE.Mesh(new THREE.PlaneGeometry(NW, ND), floor.clone());
    nFloor.rotation.x = -Math.PI / 2;
    nFloor.position.set(0, 0, -HL / 2 - ND / 2);
    nFloor.receiveShadow = true;
    this.scene.add(nFloor);
    box(NW, NH, 0.65, 0, NH / 2, -HL / 2 - ND, dark);
    box(0.65, NH, ND, -(NW / 2), NH / 2, -HL / 2 - ND / 2, dark);
    box(0.65, NH, ND,  (NW / 2), NH / 2, -HL / 2 - ND / 2, dark);
    this.addCrystals(0, 0, -HL / 2 - ND + 1.8, 0x4488ff);

    // ── South Chamber ────────────────────────────────
    const SW = 13, SD = 11, SH = 7;
    const sFloor = new THREE.Mesh(new THREE.PlaneGeometry(SW, SD), floor.clone());
    sFloor.rotation.x = -Math.PI / 2;
    sFloor.position.set(0, 0, HL / 2 + SD / 2);
    sFloor.receiveShadow = true;
    this.scene.add(sFloor);
    box(SW, SH, 0.65, 0, SH / 2, HL / 2 + SD, dark);
    box(0.65, SH, SD, -(SW / 2), SH / 2, HL / 2 + SD / 2, stone);
    box(0.65, SH, SD,  (SW / 2), SH / 2, HL / 2 + SD / 2, stone);
    this.addAltar(0, 0, HL / 2 + SD * 0.7);

    // Dust
    this.addDust(HW - 2, HH, HL);

    // Bounds & start
    this.bounds.set(
      new THREE.Vector3(-(HW / 2) - 0.4, -0.5, -HL / 2 - ND - 0.5),
      new THREE.Vector3( (HW / 2) + 0.4,  HH,   HL / 2 + SD + 0.5),
    );
    this.boundsReady = true;
    this.eye.set(0, 1.7, 10);
    this.loadState = 'fallback';
    this.loadProgress = 1;
    this.emitInfo();
  }

  private addCrystals(cx: number, cy: number, cz: number, color: number): void {
    const mat = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 1.1,
      transparent: true, opacity: 0.72,
      roughness: 0.06, metalness: 0.28,
    });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = 0.5 + Math.random() * 2;
      const h = 0.6 + Math.random() * 3;
      const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.09 + Math.random() * 0.12, h, 5), mat);
      crystal.position.set(cx + Math.cos(a) * r, cy + h / 2, cz + Math.sin(a) * r);
      crystal.rotation.z = (Math.random() - 0.5) * 0.7;
      this.scene.add(crystal);
    }
    const l = new THREE.PointLight(color, 2.2, 12, 2);
    l.position.set(cx, cy + 2.5, cz);
    this.scene.add(l);
  }

  private addAltar(ax: number, ay: number, az: number): void {
    const smat = new THREE.MeshStandardMaterial({ color: 0x3a363a, roughness: 0.9 });
    const gmat = new THREE.MeshStandardMaterial({ color: 0xd4a843, roughness: 0.26, metalness: 0.94 });
    const ped = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.1), smat);
    ped.position.set(ax, ay + 0.55, az);
    this.scene.add(ped);
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.44, 22, 22),
      new THREE.MeshStandardMaterial({
        color: 0x5533ff, emissive: 0x3318cc,
        emissiveIntensity: 2.8, roughness: 0.06, metalness: 0.5,
      }),
    );
    orb.position.set(ax, ay + 1.6, az);
    this.scene.add(orb);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.045, 8, 28), gmat);
    ring.position.set(ax, ay + 1.6, az); ring.rotation.x = Math.PI / 3;
    this.scene.add(ring);
    const orbLight = new THREE.PointLight(0x5533ff, 2.4, 10, 2);
    orbLight.position.set(ax, ay + 1.6, az);
    this.scene.add(orbLight);
  }

  private addDust(w: number, h: number, d: number): void {
    const N = 700;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * w;
      pos[i * 3 + 1] = Math.random() * h;
      pos[i * 3 + 2] = (Math.random() - 0.5) * d;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffe8cc, size: 0.032,
      transparent: true, opacity: 0.30,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.scene.add(new THREE.Points(geo, mat));
  }

  // ── Hand gestures ────────────────────────────────────────────────────────────

  applyHandContext(ctx: TwoHandContext): void {
    const { left, right } = ctx;

    const peaceNow = left.gesture === 'peace' || right.gesture === 'peace';
    if (peaceNow && !this.peaceWas) this._birdEye = !this._birdEye;
    this.peaceWas = peaceNow;

    const hand =
      (left.present  && left.gesture  !== 'none') ? left  :
      (right.present && right.gesture !== 'none') ? right : null;

    this.gForward = false; this.gStop = false;
    this.gSteer = 0; this.gSprint = false; this.gPitch = 0;
    this.gestureLabel = 'idle';

    if (!hand) return;

    const g = hand.gesture;
    const tipX  = hand.landmarks[8]?.x ?? 0.5;   // index finger tip
    const tipY  = hand.landmarks[8]?.y ?? 0.5;
    const palmX = hand.landmarks[9]?.x ?? 0.5;   // palm / middle-finger MCP

    switch (g) {
      case 'open_palm':
        this.gForward = true;
        this.gSteer = (palmX - 0.5) * 2.8;
        this.gestureLabel = 'walk';
        break;
      case 'pointing':
        this.gForward = true;
        this.gSteer = (tipX - 0.5) * 3.4;
        this.gPitch  = -(tipY - 0.5) * 2.2;
        this.gestureLabel = 'steer';
        break;
      case 'pinch':
        this.gForward = true; this.gSprint = true;
        this.gSteer = (tipX - 0.5) * 3.4;
        this.gPitch  = -(tipY - 0.5) * 1.6;
        this.gestureLabel = 'sprint';
        break;
      case 'fist':
        this.gStop = true;
        this.gestureLabel = 'stop';
        break;
      case 'thumbs_up':
        this.gForward = true; this.gPitch = 0.55;
        this.gestureLabel = 'up';
        break;
      case 'thumbs_down':
        this.gForward = true; this.gPitch = -0.55;
        this.gestureLabel = 'down';
        break;
    }

    // Both open palms = sprint
    if (left.present && right.present &&
        left.gesture === 'open_palm' && right.gesture === 'open_palm') {
      this.gSprint = true; this.gestureLabel = 'sprint';
    }
  }

  // ── Update loop ──────────────────────────────────────────────────────────────

  private update(dt: number): void {
    const maxV = this.gSprint ? 11 : 5.5;
    this.speedTarget = this.gStop ? 0 : this.gForward ? maxV : 0;
    this.speed += (this.speedTarget - this.speed) * (1 - Math.exp(-dt * 7));

    this.yaw   -= this.gSteer * dt * 1.35;
    this.pitch += this.gPitch  * dt * 0.9;
    this.pitch  = Math.max(-0.52, Math.min(0.42, this.pitch));

    const dx = Math.sin(this.yaw) * this.speed * dt;
    const dz = Math.cos(this.yaw) * this.speed * dt;

    const targetY = this._birdEye ? 26 : 1.7;
    this.eye.y += (targetY - this.eye.y) * (1 - Math.exp(-dt * 5.5));

    if (this.boundsReady) {
      const M = 0.55;
      this.eye.x = Math.max(this.bounds.min.x + M, Math.min(this.bounds.max.x - M, this.eye.x + dx));
      this.eye.z = Math.max(this.bounds.min.z + M, Math.min(this.bounds.max.z - M, this.eye.z + dz));
    } else {
      this.eye.x += dx;
      this.eye.z += dz;
    }

    this.camera.position.copy(this.eye);

    if (this._birdEye) {
      this.camera.lookAt(this.eye.x, 0, this.eye.z);
      this.camera.fov = 92;
    } else {
      this.camera.lookAt(
        this.eye.x + Math.sin(this.yaw) * 10,
        this.eye.y + Math.sin(this.pitch) * 10,
        this.eye.z + Math.cos(this.yaw) * 10,
      );
      this.camera.fov = 72;
    }
    this.camera.updateProjectionMatrix();
    this.emitInfo();
  }

  private emitInfo(): void {
    this.onInfo?.({
      loadState: this.loadState,
      progress: this.loadProgress,
      speed: this.speed,
      gesture: this.gestureLabel,
      birdEye: this._birdEye,
    });
  }

  private startLoop(): void {
    const tick = (now: number) => {
      this.rafId = requestAnimationFrame(tick);
      const dt = Math.min((now - this.then) / 1000, 0.05);
      this.then = now;
      this.update(dt);
      this.renderer.render(this.scene, this.camera);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  onResize(w: number, h: number): void {
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    this.renderer.dispose();
    this.scene.clear();
  }
}
