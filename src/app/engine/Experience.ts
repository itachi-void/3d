import * as THREE from 'three';
import { Renderer } from './Renderer';
import { ParticleSystem, ForceField } from './ParticleSystem';
import { PostProcessor } from './PostProcessor';
import { AnimationLoop } from './AnimationLoop';
import { QualityManager, QualityLevel } from './QualityManager';
import {
  Formations,
  FormationType,
  FORMATION_PALETTES,
  FORMATION_ORDER,
  updateWaveTargets,
} from './Formations';
import type { GestureForces, GestureTriggers } from '../hand-tracking/types';

export interface ExperienceStats {
  fps: number;
  particleCount: number;
  quality: QualityLevel;
  formation: FormationType;
  formationIndex: number;
  gesture: string;
  constellationsOn: boolean;
  webcamOn: boolean;
  autoCameraMode: boolean;
  zoomProgress: number;
}

// Constellation lines — draw connectors between nearby selected particles
class ConstellationLines {
  private mesh: THREE.LineSegments;
  enabled = false;
  private frameCount = 0;

  constructor(scene: THREE.Scene) {
    const geo = new THREE.BufferGeometry();
    const mat = new THREE.LineBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.mesh = new THREE.LineSegments(geo, mat);
    scene.add(this.mesh);
    this.mesh.visible = false;
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    this.mesh.visible = this.enabled;
    return this.enabled;
  }

  update(positions: Float32Array, count: number): void {
    if (!this.enabled) return;
    this.frameCount++;
    if (this.frameCount % 4 !== 0) return;

    const SAMPLE = 350;
    const step = Math.max(1, Math.floor(count / SAMPLE));
    const THR2 = 7 * 7;
    const verts: number[] = [];

    for (let i = 0; i < count; i += step) {
      for (let j = i + step; j < count; j += step) {
        const dx = positions[i*3] - positions[j*3];
        const dy = positions[i*3+1] - positions[j*3+1];
        const dz = positions[i*3+2] - positions[j*3+2];
        if (dx*dx + dy*dy + dz*dz < THR2) {
          verts.push(positions[i*3], positions[i*3+1], positions[i*3+2]);
          verts.push(positions[j*3], positions[j*3+1], positions[j*3+2]);
        }
      }
    }

    this.mesh.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(verts), 3),
    );
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// Camera shake
interface CameraShake {
  intensity: number;
  duration: number;
  elapsed: number;
}

// Color palette presets (for gesture cycling)
const COLOR_PALETTES: Array<[number,number,number][]> = [
  [[0.0, 0.55, 1.0],  [0.5, 0.9, 1.0]],
  [[0.8, 0.0, 1.0],   [1.0, 0.4, 0.8]],
  [[1.0, 0.5, 0.0],   [1.0, 0.95, 0.2]],
  [[0.0, 1.0, 0.5],   [0.0, 0.8, 1.0]],
  [[1.0, 0.1, 0.0],   [1.0, 0.7, 0.0]],
  [[0.8, 0.8, 1.0],   [1.0, 1.0, 1.0]],
];
let paletteIndex = 0;

export class Experience extends EventTarget {
  private renderer: Renderer;
  private particles: ParticleSystem;
  private postProcessor: PostProcessor | null = null;
  private loop: AnimationLoop;
  readonly quality: QualityManager;
  private constellation: ConstellationLines;

  // Camera state
  private camAngle = 0;
  private autoCameraMode = true;
  private camShake: CameraShake = { intensity: 0, duration: 0, elapsed: 0 };
  private palmCamYaw = 0;
  private palmCamPitch = 0;

  // Formation state
  formation: FormationType = 'sphere';
  formationIndex = 0;

  // Gesture-driven forces (set externally each frame)
  gestureForces: GestureForces | null = null;
  gestureTriggers: GestureTriggers | null = null;

  // Pinch charge state
  private pinchChargeLevel = 0;
  private pinchWorldPos = new THREE.Vector3();
  private palmAnchorTarget = new THREE.Vector3();
  private palmAnchorActive = false;
  private palmVisualScale = 1.0;

  // Scale/rotation state for formation targets
  private formationScale = 1.0;
  private formationRotY = 0;
  private targetScale = 1.0;

  // Camera zoom (two-hand / pinch driven)
  private camRadius = 55;
  private camRadiusTarget = 55;
  private navigating = false;
  private navigateTimer = 0;
  zoomProgress = 0;

  // Feature toggles
  private constellationsOn = false;
  private webcamOn = false;

  // Current gesture label for UI (auto-clears after 1.5s)
  currentGesture = 'none';
  private gestureTimer = 0;

  // FPS
  private fpsFrames = 0;
  private fpsAccum = 0;
  private lowFpsSamples = 0;
  private bloomThrottled = false;
  fps = 60;

  constructor(canvas: HTMLCanvasElement, qualityOverride?: QualityLevel) {
    super();
    this.quality = new QualityManager(qualityOverride);
    const { particleCount, pixelRatio, particleSize, bloomIntensity, usePostProcessing } =
      this.quality.config;

    this.renderer = new Renderer(canvas, pixelRatio);
    this.constellation = new ConstellationLines(this.renderer.scene);

    this.particles = new ParticleSystem({ count: particleCount, pixelRatio, particleSize });
    this.renderer.scene.add(this.particles.points);

    if (usePostProcessing) {
      try {
        this.postProcessor = new PostProcessor(
          this.renderer.gl, this.renderer.scene, this.renderer.camera, bloomIntensity,
        );
        this.postProcessor.resize(canvas.clientWidth, canvas.clientHeight);
      } catch { this.postProcessor = null; }
    }

    const initPositions = Formations.scatter(particleCount, 55);
    this.particles.setInitialPositions(initPositions);
    this.applyFormation('sphere', true);

    this.loop = new AnimationLoop(this.update.bind(this));
    this.loop.start();
  }

  dispose(): void {
    this.loop.dispose();
    this.constellation.dispose();
    this.particles.dispose();
    this.postProcessor?.dispose();
    this.renderer.dispose();
  }

  onResize(w: number, h: number): void {
    this.renderer.resize(w, h);
    this.postProcessor?.resize(w, h);
  }

  setFormationByIndex(index: number): void {
    this.formationIndex = index % FORMATION_ORDER.length;
    this.applyFormation(FORMATION_ORDER[this.formationIndex]);
  }

  private applyFormation(f: FormationType, skipColorInit = false): void {
    this.formation = f;
    const targets = Formations.generate(f, this.particles.count);
    this.particles.setTargets(targets);
    const { c1, c2 } = FORMATION_PALETTES[f];
    skipColorInit ? this.particles.initColors(c1, c2) : this.particles.setColors(c1, c2);
    this.dispatchStats();
  }

  private nextFormation(): void {
    this.formationIndex = (this.formationIndex + 1) % FORMATION_ORDER.length;
    this.applyFormation(FORMATION_ORDER[this.formationIndex]);
  }

  triggerCameraShake(intensity: number, duration: number): void {
    this.camShake = { intensity, duration, elapsed: 0 };
  }

  triggerSupernova(): void {
    this.particles.triggerScatter(0, 0, 0, 80);
    this.particles.springMult = 0.12;
    this.triggerCameraShake(1.8, 0.6);
    if (this.postProcessor) this.postProcessor.setBloomIntensity(5.0);
    setTimeout(() => {
      this.particles.springMult = 1.0;
      if (this.postProcessor) this.postProcessor.setBloomIntensity(this.quality.config.bloomIntensity);
      this.applyFormation(this.formation);
    }, 3200);
  }

  triggerPinchExplosion(worldPos: THREE.Vector3, chargeLevel: number): void {
    const strength = 20 + chargeLevel * 60;
    const maxR = 25 + chargeLevel * 50;
    this.particles.triggerWave(worldPos.x, worldPos.y, worldPos.z, strength, maxR);
    this.triggerCameraShake(chargeLevel * 1.2, 0.4);
    if (this.postProcessor) {
      const orig = this.quality.config.bloomIntensity;
      this.postProcessor.setBloomIntensity(orig + chargeLevel * 4);
      setTimeout(() => this.postProcessor?.setBloomIntensity(orig), 400);
    }
  }

  triggerBothPinchRelease(): void {
    this.particles.triggerScatter(0, 0, 0, 50);
    this.particles.springMult = 0.2;
    this.triggerCameraShake(1.4, 0.5);
    if (this.postProcessor) {
      const orig = this.quality.config.bloomIntensity;
      this.postProcessor.setBloomIntensity(orig + 3);
      setTimeout(() => this.postProcessor?.setBloomIntensity(orig), 600);
    }
    setTimeout(() => {
      this.particles.springMult = 1.0;
    }, 2500);
  }

  cycleColorPalette(): void {
    paletteIndex = (paletteIndex + 1) % COLOR_PALETTES.length;
    const [c1, c2] = COLOR_PALETTES[paletteIndex];
    this.particles.setColors(c1 as [number,number,number], c2 as [number,number,number]);
  }

  toggleConstellations(): boolean {
    this.constellationsOn = this.constellation.toggle();
    this.dispatchStats();
    return this.constellationsOn;
  }

  toggleWebcam(): boolean {
    this.webcamOn = !this.webcamOn;
    this.dispatchStats();
    return this.webcamOn;
  }

  toggleAutoCamera(): void {
    this.autoCameraMode = !this.autoCameraMode;
    this.dispatchStats();
  }

  resetScene(): void {
    this.formationScale = 1.0;
    this.formationRotY = 0;
    this.particles.springMult = 1.0;
    this.camRadiusTarget = 55;
    this.navigating = false;
    this.navigateTimer = 0;
    this.zoomProgress = 0;
    this.applyFormation(this.formation);
    if (this.postProcessor) this.postProcessor.setBloomIntensity(this.quality.config.bloomIntensity);
  }

  private update(time: number, dt: number): void {
    const fields: ForceField[] = [];

    if (this.gestureForces) {
      this.applyGestureForces(this.gestureForces, fields, time, dt);
    }
    if (this.gestureTriggers) {
      this.applyGestureTriggers(this.gestureTriggers, time);
    }

    const anchorEase = 1 - Math.exp(-dt * (this.palmAnchorActive ? 24 : 4));
    const anchorGoal = this.palmAnchorActive ? this.palmAnchorTarget : new THREE.Vector3();
    this.particles.points.position.lerp(anchorGoal, anchorEase);
    const targetPalmScale = this.palmAnchorActive ? 0.15 : 1.0;
    this.palmVisualScale += (targetPalmScale - this.palmVisualScale) * (1 - Math.exp(-dt * 16));
    this.particles.points.scale.setScalar(this.palmVisualScale);

    if (this.formation === 'wave') {
      updateWaveTargets(this.particles.targets, this.particles.count, time);
    }

    if (this.gestureForces?.bothPinchCompress.active) {
      const s = this.gestureForces.bothPinchCompress.strength;
      this.targetScale = Math.max(0.1, 1.0 - s * 0.85);
    } else {
      this.targetScale += (1.0 - this.targetScale) * 0.05;
    }

    if (this.formationRotY !== 0 || this.targetScale !== 1.0) {
      this.transformTargets(this.formationRotY, this.targetScale);
      this.formationRotY = 0;
    }

    this.particles.update(dt, time, fields);
    this.constellation.update(this.particles.positions, this.particles.count);

    if (this.currentGesture !== 'none') {
      this.gestureTimer += dt;
      if (this.gestureTimer > 1.5) {
        this.currentGesture = 'none';
        this.gestureTimer = 0;
      }
    }

    this.updateCamera(dt, time);

    if (this.postProcessor) {
      this.postProcessor.render(dt);
    } else {
      this.renderer.gl.render(this.renderer.scene, this.renderer.camera);
    }

    this.fpsFrames++;
    this.fpsAccum += dt;
    if (this.fpsAccum >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsAccum);
      this.fpsFrames = 0;
      this.fpsAccum = 0;

      this.lowFpsSamples = this.fps < 42 ? this.lowFpsSamples + 1 : Math.max(0, this.lowFpsSamples - 1);
      if (this.postProcessor && this.lowFpsSamples >= 2 && !this.bloomThrottled) {
        this.postProcessor.setBloomIntensity(0.18);
        this.bloomThrottled = true;
      } else if (this.postProcessor && this.lowFpsSamples === 0 && this.bloomThrottled) {
        this.postProcessor.setBloomIntensity(this.quality.config.bloomIntensity);
        this.bloomThrottled = false;
      }
      this.dispatchStats();
    }
  }

  private setGesture(label: string): void {
    this.currentGesture = label;
    this.gestureTimer = 0;
  }

  private applyGestureForces(gf: GestureForces, fields: ForceField[], time: number, dt: number): void {
    this.palmAnchorActive = gf.palmAnchor.active;
    if (gf.palmAnchor.active) {
      this.palmAnchorTarget.copy(this.ndcToWorld(gf.palmAnchor.nx, gf.palmAnchor.ny));
      if (!this.webcamOn) this.webcamOn = true;
    }
    const localPoint = (nx: number, ny: number) => this.ndcToWorld(nx, ny).sub(this.particles.points.position);

    if (gf.openPalmRepel.active) {
      const wp = localPoint(gf.openPalmRepel.nx, gf.openPalmRepel.ny);
      fields.push({ ox: wp.x, oy: wp.y, oz: 0, radius: 22, strength: 0.3, mode: 'repel' });

      if (gf.palmRotation.active) {
        this.formationRotY += gf.palmRotation.deltaRotY;
      }
    }

    if (gf.blackHole.active) {
      const wp = localPoint(gf.blackHole.nx, gf.blackHole.ny);
      fields.push({ ox: wp.x, oy: wp.y, oz: 0, radius: 28, strength: 0.55, mode: 'spiral' });
      this.setGesture('BLACK HOLE');
    }

    if (gf.magnetPoint.active) {
      const wp = localPoint(gf.magnetPoint.nx, gf.magnetPoint.ny);
      fields.push({ ox: wp.x, oy: wp.y, oz: 0, radius: 22, strength: 0.3, mode: 'attract' });
      this.setGesture('MAGNETIC');
    }

    if (gf.pinchCharge.active) {
      this.pinchChargeLevel = gf.pinchCharge.charge;
      this.pinchWorldPos.copy(localPoint(gf.pinchCharge.nx, gf.pinchCharge.ny));
      this.setGesture(`CHARGING ${Math.round(gf.pinchCharge.charge * 100)}%`);
    } else if (gf.pinchCharge.justReleased && this.pinchChargeLevel > 0.05) {
      this.triggerPinchExplosion(this.pinchWorldPos, this.pinchChargeLevel);
      this.pinchChargeLevel = 0;
      this.setGesture('EXPLOSION!');
    }

    // Two-hand scale → zoom camera + scale formation
    if (gf.twoHandScale.active) {
      const s = 1 + gf.twoHandScale.scaleDelta * 2.5;
      this.camRadiusTarget = Math.max(5, Math.min(90, this.camRadiusTarget / s));
      this.scaleTargets(s);
      this.formationScale *= s;
      this.setGesture(gf.twoHandScale.scaleDelta > 0 ? '⟳ ZOOM IN' : '⟳ ZOOM OUT');
    }

    // Single-hand pinch zoom → camera zoom
    if (gf.pinchZoom.active) {
      this.camRadiusTarget = Math.max(5, Math.min(90, this.camRadiusTarget - gf.pinchZoom.delta * 40));
    }

    if (gf.twoHandRotate.active) {
      this.formationRotY += gf.twoHandRotate.angleDelta;
      this.setGesture('ROTATING');
    }

    if (gf.bothPinchCompress.active) {
      this.setGesture('COMPRESSING');
    }
  }

  private applyGestureTriggers(gt: GestureTriggers, _time: number): void {
    if (gt.thumbsUp)         { this.nextFormation(); this.setGesture('NEXT'); }
    if (gt.thumbsDown)       { this.resetScene(); this.setGesture('RESET'); }
    if (gt.toggleAutoCamera) { this.toggleAutoCamera(); }
    if (gt.threeFingers)     { this.cycleColorPalette(); this.setGesture('COLOR'); }
    if (gt.fourFingers)      { this.toggleConstellations(); this.setGesture('CONSTELLATION'); }
    if (gt.fiveFingerHeld)   { this.toggleWebcam(); this.setGesture('WEBCAM'); }
    if (gt.supernova)        { this.triggerSupernova(); this.setGesture('SUPERNOVA!'); }
    if (gt.randomize)        { this.setFormationByIndex(Math.floor(Math.random() * FORMATION_ORDER.length)); this.setGesture('RANDOM'); }
    if (gt.bothPinchRelease) { this.triggerBothPinchRelease(); this.setGesture('BIG BANG!'); }
    if (gt.peace)            { this.setGesture(this.autoCameraMode ? 'AUTO CAM' : 'HAND CAM'); }
  }

  private updateCamera(dt: number, time: number): void {
    const cam = this.renderer.camera;

    // Smoothly lerp camera radius toward target
    this.camRadius += (this.camRadiusTarget - this.camRadius) * (1 - Math.exp(-dt * 3.5));

    // Track zoom progress: 0 when far (r=28), 1 when very close (r=6)
    const ZOOM_START = 28, ZOOM_END = 6;
    this.zoomProgress = Math.max(0, Math.min(1, (ZOOM_START - this.camRadius) / (ZOOM_START - ZOOM_END)));

    // Navigate-into trigger: hold at max zoom for 0.7s
    if (this.zoomProgress >= 1 && !this.navigating) {
      this.navigateTimer += dt;
      if (this.navigateTimer >= 0.7) {
        this.navigating = true;
        this.dispatchEvent(new CustomEvent('navigate-into', { detail: { formation: this.formation } }));
      }
    } else if (this.zoomProgress < 0.9) {
      this.navigateTimer = 0;
    }

    const camR = this.camRadius;

    if (this.autoCameraMode) {
      this.camAngle += dt * 0.07;
      const tx = Math.sin(this.camAngle) * camR;
      const ty = Math.sin(this.camAngle * 0.38) * 10;
      const tz = Math.cos(this.camAngle) * camR;
      cam.position.x += (tx - cam.position.x) * 0.018;
      cam.position.y += (ty - cam.position.y) * 0.018;
      cam.position.z += (tz - cam.position.z) * 0.018;
    } else {
      if (this.gestureForces?.palmRotation.active) {
        this.palmCamYaw   += this.gestureForces.palmRotation.deltaRotY * 20;
        this.palmCamPitch += this.gestureForces.palmRotation.deltaRotX * 20;
        this.palmCamYaw   = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.palmCamYaw));
        this.palmCamPitch = Math.max(-0.6, Math.min(0.6, this.palmCamPitch));
      }
      const tx = Math.sin(this.palmCamYaw) * camR;
      const ty = Math.sin(this.palmCamPitch) * camR * 0.5;
      const tz = Math.cos(this.palmCamYaw) * camR;
      cam.position.x += (tx - cam.position.x) * 0.05;
      cam.position.y += (ty - cam.position.y) * 0.05;
      cam.position.z += (tz - cam.position.z) * 0.05;
    }

    if (this.camShake.elapsed < this.camShake.duration) {
      this.camShake.elapsed += dt;
      const t = 1 - this.camShake.elapsed / this.camShake.duration;
      const shake = this.camShake.intensity * t;
      cam.position.x += (Math.random() - 0.5) * shake * 3;
      cam.position.y += (Math.random() - 0.5) * shake * 3;
    }

    cam.lookAt(0, 0, 0);
  }

  private ndcToWorld(nx: number, ny: number): THREE.Vector3 {
    const cam = this.renderer.camera;
    const ndcX = (1 - nx) * 2 - 1;
    const ndcY = -(ny * 2 - 1);

    const dir = new THREE.Vector3(ndcX, ndcY, 0.5)
      .unproject(cam).sub(cam.position).normalize();

    if (Math.abs(dir.z) < 0.001) return new THREE.Vector3(0, 0, 0);
    const t = -cam.position.z / dir.z;
    return new THREE.Vector3(
      cam.position.x + dir.x * t,
      cam.position.y + dir.y * t,
      0,
    );
  }

  private scaleTargets(factor: number): void {
    const { targets } = this.particles;
    for (let i = 0; i < this.particles.count; i++) {
      targets[i * 3]     *= factor;
      targets[i * 3 + 1] *= factor;
      targets[i * 3 + 2] *= factor;
    }
  }

  private transformTargets(rotY: number, scale: number): void {
    if (rotY === 0 && scale === 1.0) return;
    const { targets } = this.particles;
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    for (let i = 0; i < this.particles.count; i++) {
      const i3 = i * 3;
      const tx = targets[i3], tz = targets[i3 + 2];
      targets[i3]     = (tx * cosY - tz * sinY) * scale;
      targets[i3 + 1] *= scale;
      targets[i3 + 2] = (tx * sinY + tz * cosY) * scale;
    }
  }

  private dispatchStats(): void {
    this.dispatchEvent(new CustomEvent<ExperienceStats>('stats', {
      detail: {
        fps: this.fps,
        particleCount: this.particles.count,
        quality: this.quality.level,
        formation: this.formation,
        formationIndex: this.formationIndex,
        gesture: this.currentGesture,
        constellationsOn: this.constellationsOn,
        webcamOn: this.webcamOn,
        autoCameraMode: this.autoCameraMode,
        zoomProgress: this.zoomProgress,
      },
    }));
  }
}
