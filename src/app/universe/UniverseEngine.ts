import * as THREE from 'three';
import { AnimationLoop } from '../engine/AnimationLoop';
import { SOLAR_SYSTEM, GALAXY_CONFIG, UNIVERSE_GALAXIES } from './cosmicData';
import {
  buildBody, animateBody, collectAllMeshes, findBodyById, getWorldPosition,
  type BuiltBody,
} from './PlanetBuilder';
import { GalaxyField, UniverseField, createBackgroundStars } from './GalaxyField';
import type { ViewLevel, PlanetData } from './cosmicTypes';
import type { GestureForces, GestureTriggers } from '../hand-tracking/types';

export interface UniverseInfo {
  viewLevel: ViewLevel;
  focusName: string;
  focusNameAr: string;
  focusData: PlanetData | null;
  breadcrumb: Array<{ id: string; name: string; nameAr: string }>;
  hoverId: string | null;
  hoverName: string;
  hoverNameAr: string;
  gestureLabel: string;
}

type InfoListener = (info: UniverseInfo) => void;

// Camera easing constants
const FLY_SPEED = 2.8;

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class UniverseEngine {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private loop: AnimationLoop;

  // Scenes / objects
  private bgStars: THREE.Points;
  private galaxyField: GalaxyField;
  private universeField: UniverseField;
  private solarRoot: BuiltBody;
  private allMeshes: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private sunDir = new THREE.Vector3(1, 0.5, 0).normalize();

  // State
  private viewLevel: ViewLevel = 'system';
  private focusBody: BuiltBody | null = null;
  private breadcrumb: Array<{ id: string; name: string; nameAr: string }> = [];

  // Camera orbit state
  private orbitR = 180;
  private orbitTheta = 0.4;
  private orbitPhi = 0.5;
  private targetR = 180;
  private targetTheta = 0.4;
  private targetPhi = 0.5;

  // Focus transition
  private focusFrom = new THREE.Vector3();
  private focusTo = new THREE.Vector3();
  private focusTarget = new THREE.Vector3();
  private focusCurrent = new THREE.Vector3();
  private flyT = 1; // 0→1 interpolation, 1=arrived

  // Mouse state
  private isDragging = false;
  private lastMouse = new THREE.Vector2();
  private hasDragged = false;
  private hoverId: string | null = null;

  // Gesture state
  private gestureLabel = '';
  private gestureLabelTimer = 0;
  private prevPalmX = 0.5;
  private prevPalmY = 0.5;
  private palmActive = false;
  private autoOrbit = true;
  // Gesture raycaster direction (from pointing finger)
  private gestureNDC: THREE.Vector2 | null = null;

  // Listeners
  private infoListeners: InfoListener[] = [];

  constructor(canvas: HTMLCanvasElement) {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Camera
    this.camera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.01, 5000);
    this.camera.position.set(0, 80, 180);
    this.camera.lookAt(0, 0, 0);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000005);

    // Background stars
    this.bgStars = createBackgroundStars(8000);
    this.scene.add(this.bgStars);

    // Galaxy field (for galaxy view)
    this.galaxyField = new GalaxyField(GALAXY_CONFIG);
    this.galaxyField.points.visible = false;
    this.scene.add(this.galaxyField.points);

    // Universe field (for universe view)
    this.universeField = new UniverseField(UNIVERSE_GALAXIES);
    this.universeField.points.visible = false;
    this.scene.add(this.universeField.points);

    // Solar system
    this.solarRoot = buildBody(SOLAR_SYSTEM, this.sunDir, this.scene);
    this.allMeshes = collectAllMeshes(this.solarRoot);

    // Set raycaster precision for small objects
    this.raycaster.params.Points = { threshold: 0.1 };

    // Start in system view
    this.setView('system');

    // Animate loop
    this.loop = new AnimationLoop(this.tick.bind(this));
    this.loop.start();

    this.emitInfo();
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  dispose(): void {
    this.loop.dispose();
    this.galaxyField.dispose();
    this.universeField.dispose();
    this.bgStars.geometry.dispose();
    (this.bgStars.material as THREE.Material).dispose();
    this.renderer.dispose();
  }

  onResize(w: number, h: number): void {
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  onInfo(cb: InfoListener): void { this.infoListeners.push(cb); }
  offInfo(cb: InfoListener): void { this.infoListeners = this.infoListeners.filter(l => l !== cb); }

  // ─── Navigation ──────────────────────────────────────────────────────────────

  setView(level: ViewLevel): void {
    this.viewLevel = level;
    this.galaxyField.points.visible  = level === 'galaxy';
    this.universeField.points.visible = level === 'universe';
    this.solarRoot.group.visible = level === 'system' || level === 'planet';

    switch (level) {
      case 'universe':
        this.focusBody = null;
        this.focusCurrent.set(0, 0, 0);
        this.targetR = 1200; this.targetTheta = 0.2; this.targetPhi = 0.4;
        this.breadcrumb = [];
        break;
      case 'galaxy':
        this.focusBody = null;
        this.focusCurrent.set(0, 0, 0);
        this.targetR = 450; this.targetTheta = 0.3; this.targetPhi = 0.5;
        this.breadcrumb = [];
        break;
      case 'system':
        this.focusBody = this.solarRoot;
        this.focusCurrent.set(0, 0, 0);
        this.targetR = 180; this.targetTheta = 0.4; this.targetPhi = 0.55;
        this.breadcrumb = [{ id: 'sun', name: 'Solar System', nameAr: 'المجموعة الشمسية' }];
        break;
    }
    this.emitInfo();
  }

  flyTo(bodyId: string): void {
    const body = findBodyById(this.solarRoot, bodyId);
    if (!body) return;

    this.focusBody = body;
    this.focusFrom.copy(this.focusCurrent);
    this.focusTo.copy(getWorldPosition(body));
    this.flyT = 0;

    // Zoom distance based on body size
    const targetR = body.data.radius * (body.data.type === 'star' ? 6 : 4.5);
    this.targetR = Math.max(targetR, body.data.radius * 3);
    this.targetTheta = this.orbitTheta + 0.3;
    this.targetPhi = 0.4;

    this.viewLevel = body.data.type === 'moon' || body.data.type === 'planet' ? 'planet' : 'system';
    this.solarRoot.group.visible = true;
    this.galaxyField.points.visible = false;
    this.universeField.points.visible = false;

    // Update breadcrumb
    this.breadcrumb = this.buildBreadcrumb(bodyId);
    this.emitInfo();
  }

  zoomOut(): void {
    if (this.viewLevel === 'planet' && this.focusBody) {
      // Go to parent or system view
      const parentId = this.findParent(this.focusBody.id);
      if (parentId && parentId !== 'sun') {
        this.flyTo(parentId);
      } else {
        this.setView('system');
      }
    } else if (this.viewLevel === 'system') {
      this.setView('galaxy');
    } else if (this.viewLevel === 'galaxy') {
      this.setView('universe');
    }
  }

  // Mouse events
  onMouseDown(x: number, y: number): void {
    this.isDragging = true;
    this.lastMouse.set(x, y);
    this.hasDragged = false;
  }

  onMouseMove(x: number, y: number, cw: number, ch: number): void {
    if (this.isDragging) {
      const dx = x - this.lastMouse.x;
      const dy = y - this.lastMouse.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) this.hasDragged = true;
      this.targetTheta -= dx * 0.008;
      this.targetPhi   += dy * 0.006;
      this.targetPhi = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.targetPhi));
      this.lastMouse.set(x, y);
    }

    // Hover detection
    const ndcX = (x / cw) * 2 - 1;
    const ndcY = -(y / ch) * 2 + 1;
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const hits = this.raycaster.intersectObjects(this.allMeshes);
    const prev = this.hoverId;
    this.hoverId = hits.length > 0 ? (hits[0].object.userData.id ?? null) : null;
    if (this.hoverId !== prev) this.emitInfo();
  }

  onMouseUp(x: number, y: number, cw: number, ch: number): void {
    if (!this.hasDragged) {
      // It's a click → select object
      const ndcX = (x / cw) * 2 - 1;
      const ndcY = -(y / ch) * 2 + 1;
      this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
      const hits = this.raycaster.intersectObjects(this.allMeshes);
      if (hits.length > 0) {
        const id = hits[0].object.userData.id;
        if (id) this.flyTo(id);
      } else if (this.viewLevel === 'universe') {
        // Check universe galaxy sprites
        // (simplified: just fly to galaxy view on click in universe)
        this.setView('galaxy');
      }
    }
    this.isDragging = false;
  }

  onWheel(delta: number): void {
    const factor = delta > 0 ? 1.12 : 0.89;
    this.targetR = Math.max(0.05, Math.min(2000, this.targetR * factor));

    // Auto-level transitions based on zoom
    if (this.viewLevel === 'system' && this.targetR > 400) {
      this.setView('galaxy');
    } else if (this.viewLevel === 'galaxy' && this.targetR > 1000) {
      this.setView('universe');
    } else if (this.viewLevel === 'universe' && this.targetR < 800) {
      this.setView('galaxy');
    } else if (this.viewLevel === 'galaxy' && this.targetR < 350) {
      this.setView('system');
    }
  }

  onTouchPinch(scaleDelta: number): void {
    this.targetR = Math.max(0.05, Math.min(2000, this.targetR / scaleDelta));
  }

  // ─── Gesture control (called from App each frame) ─────────────────────────

  applyGestures(forces: GestureForces, triggers: GestureTriggers): void {
    const PLANETS = ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','pluto'];

    // ── Palm open → orbit camera (delta of palm position) ─────────────────
    if (forces.openPalmRepel.active) {
      if (this.palmActive) {
        const dx = forces.openPalmRepel.nx - this.prevPalmX;
        const dy = forces.openPalmRepel.ny - this.prevPalmY;
        // mirror x (image is mirrored), so moving palm right → rotate right
        this.targetTheta += dx * 6;
        this.targetPhi   -= dy * 3;
        this.targetPhi = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.targetPhi));
      }
      this.prevPalmX = forces.openPalmRepel.nx;
      this.prevPalmY = forces.openPalmRepel.ny;
      this.palmActive = true;
      this.setGesture('ORBIT');
    } else {
      this.palmActive = false;
    }

    // ── Two-hand spread/pinch → zoom ───────────────────────────────────────
    if (forces.twoHandScale.active) {
      // scaleDelta > 0 = hands spreading = zoom in
      const zoomFactor = 1 - forces.twoHandScale.scaleDelta * 18;
      this.targetR = Math.max(0.5, Math.min(2000, this.targetR * zoomFactor));
      this.checkZoomLevel();
      this.setGesture(forces.twoHandScale.scaleDelta > 0 ? '🔍 ZOOM IN' : '🔭 ZOOM OUT');
    }

    // ── Single-hand pinch zoom → orbit radius ─────────────────────────────
    // delta > 0 = fingers spreading = zoom in (reduce orbit radius)
    if (forces.pinchZoom.active) {
      const zoomFactor = 1 - forces.pinchZoom.delta * 12;
      this.targetR = Math.max(0.5, Math.min(2000, this.targetR * zoomFactor));
      this.checkZoomLevel();
      this.setGesture(forces.pinchZoom.delta > 0 ? '🔍 ZOOM IN' : '🔭 ZOOM OUT');
    }

    // ── Two-hand rotate → theta orbit ─────────────────────────────────────
    if (forces.twoHandRotate.active) {
      this.targetTheta += forces.twoHandRotate.angleDelta * 2.5;
      this.setGesture('ROTATE');
    }

    // ── Fist → zoom in slowly ─────────────────────────────────────────────
    if (forces.blackHole.active) {
      this.targetR = Math.max(0.5, this.targetR * 0.992);
      this.checkZoomLevel();
      this.setGesture('ZOOM IN');
    }

    // ── Pointing → use finger tip as raycaster to hover planet ────────────
    if (forces.magnetPoint.active) {
      // mirrored x for selfie camera
      const ndcX = (1 - forces.magnetPoint.nx) * 2 - 1;
      const ndcY = -(forces.magnetPoint.ny * 2 - 1);
      this.gestureNDC = new THREE.Vector2(ndcX, ndcY);
      this.setGesture('SELECT ☝️');
    } else {
      this.gestureNDC = null;
    }

    // ── Pinch charge + release → fly to hovered planet ────────────────────
    if (forces.pinchCharge.active && forces.pinchCharge.charge > 0.05) {
      this.setGesture(`CHARGING ${Math.round(forces.pinchCharge.charge * 100)}%`);
    }
    if (forces.pinchCharge.justReleased) {
      if (this.hoverId) {
        this.flyTo(this.hoverId);
        this.setGesture('FLY TO!');
      } else {
        this.targetR = Math.max(0.5, this.targetR * 0.3);
        this.checkZoomLevel();
        this.setGesture('ZOOM!');
      }
    }

    // ── Both pinch compress → slow zoom in ────────────────────────────────
    if (forces.bothPinchCompress.active) {
      this.targetR = Math.max(0.5, this.targetR * (1 - forces.bothPinchCompress.strength * 0.05));
      this.checkZoomLevel();
      this.setGesture('COMPRESS');
    }

    // ── Discrete triggers ─────────────────────────────────────────────────
    if (triggers.thumbsUp) {
      if (this.hoverId) { this.flyTo(this.hoverId); this.setGesture('FLY TO!'); }
      else { this.targetR = Math.max(0.5, this.targetR * 0.45); this.checkZoomLevel(); this.setGesture('ZOOM IN'); }
    }
    if (triggers.thumbsDown) {
      this.zoomOut();
      this.setGesture('ZOOM OUT');
    }
    if (triggers.threeFingers) {
      this.cycleView();
      this.setGesture('NEXT VIEW');
    }
    if (triggers.fourFingers) {
      this.autoOrbit = !this.autoOrbit;
      this.setGesture(this.autoOrbit ? 'AUTO ORBIT ON' : 'AUTO ORBIT OFF');
    }
    if (triggers.peace) {
      this.setView('system');
      this.setGesture('SOLAR SYSTEM');
    }
    if (triggers.supernova) {
      this.setView('universe');
      this.setGesture('🌌 UNIVERSE!');
    }
    if (triggers.randomize) {
      this.flyTo(PLANETS[Math.floor(Math.random() * PLANETS.length)]);
      this.setGesture('RANDOM PLANET');
    }
    if (triggers.bothPinchRelease) {
      this.setView('universe');
      this.setGesture('🌌 BIG VIEW!');
    }
    if (triggers.toggleAutoCamera) {
      this.autoOrbit = !this.autoOrbit;
    }
  }

  private setGesture(label: string): void {
    this.gestureLabel = label;
    this.gestureLabelTimer = 0;
  }

  private cycleView(): void {
    if (this.viewLevel === 'universe') this.setView('galaxy');
    else if (this.viewLevel === 'galaxy') this.setView('system');
    else this.setView('universe');
  }

  private checkZoomLevel(): void {
    if (this.viewLevel === 'system'   && this.targetR > 400)  this.setView('galaxy');
    else if (this.viewLevel === 'galaxy'   && this.targetR > 1000) this.setView('universe');
    else if (this.viewLevel === 'universe' && this.targetR < 800)  this.setView('galaxy');
    else if (this.viewLevel === 'galaxy'   && this.targetR < 350)  this.setView('system');
  }

  // ─── Main loop ───────────────────────────────────────────────────────────────

  private tick(time: number, dt: number): void {
    const alpha = 1 - Math.exp(-FLY_SPEED * dt);

    // Smooth orbit angles
    this.orbitR     += (this.targetR     - this.orbitR)     * alpha;
    this.orbitTheta += (this.targetTheta - this.orbitTheta) * alpha;
    this.orbitPhi   += (this.targetPhi   - this.orbitPhi)   * alpha;

    // Focus position interpolation (when flying to a body)
    if (this.flyT < 1) {
      this.flyT = Math.min(1, this.flyT + dt * 0.9);
      const t = easeInOut(this.flyT);
      this.focusCurrent.lerpVectors(this.focusFrom, this.focusTo, t);
    } else if (this.focusBody) {
      // Track moving body
      this.focusCurrent.copy(getWorldPosition(this.focusBody));
    }

    // Camera position from spherical coords + focus
    const cx = this.focusCurrent.x + this.orbitR * Math.sin(this.orbitTheta) * Math.cos(this.orbitPhi);
    const cy = this.focusCurrent.y + this.orbitR * Math.sin(this.orbitPhi);
    const cz = this.focusCurrent.z + this.orbitR * Math.cos(this.orbitTheta) * Math.cos(this.orbitPhi);
    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(this.focusCurrent);
    this.camera.up.set(0, 1, 0);

    // Update camera near/far based on zoom
    this.camera.near = this.orbitR * 0.001;
    this.camera.far  = Math.max(5000, this.orbitR * 20);
    this.camera.updateProjectionMatrix();

    // Animate solar system
    if (this.solarRoot.group.visible) {
      animateBody(this.solarRoot, time);
    }

    // Gentle auto-rotation when not dragging (respects autoOrbit flag)
    if (!this.isDragging && this.flyT >= 1 && this.autoOrbit) {
      this.targetTheta += dt * 0.025;
    }

    // Gesture finger-point → planet hover via raycasting
    if (this.gestureNDC) {
      this.raycaster.setFromCamera(this.gestureNDC, this.camera);
      const hits = this.raycaster.intersectObjects(this.allMeshes);
      const prev = this.hoverId;
      this.hoverId = hits.length > 0 ? (hits[0].object.userData.id ?? null) : null;
      if (this.hoverId !== prev) this.emitInfo();
    }

    // Gesture label timer — clear after 2s
    if (this.gestureLabel) {
      this.gestureLabelTimer += dt;
      if (this.gestureLabelTimer > 2) {
        this.gestureLabel = '';
        this.gestureLabelTimer = 0;
        this.emitInfo();
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private buildBreadcrumb(id: string): Array<{ id: string; name: string; nameAr: string }> {
    const crumbs: Array<{ id: string; name: string; nameAr: string }> = [
      { id: 'system', name: 'Solar System', nameAr: 'المجموعة الشمسية' },
    ];
    const body = findBodyById(this.solarRoot, id);
    if (body && body.id !== 'sun') {
      // Add parent (planet) if we're on a moon
      const parentId = this.findParent(id);
      if (parentId && parentId !== 'sun' && parentId !== 'solar_system') {
        const parent = findBodyById(this.solarRoot, parentId);
        if (parent) crumbs.push({ id: parentId, name: parent.data.name, nameAr: parent.data.nameAr });
      }
      crumbs.push({ id: body.id, name: body.data.name, nameAr: body.data.nameAr });
    }
    return crumbs;
  }

  private findParent(childId: string): string | null {
    return this.findParentIn(this.solarRoot, childId);
  }

  private findParentIn(node: BuiltBody, childId: string): string | null {
    for (const child of node.children) {
      if (child.id === childId) return node.id;
      const found = this.findParentIn(child, childId);
      if (found) return found;
    }
    return null;
  }

  private emitInfo(): void {
    const body = this.focusBody ? findBodyById(this.solarRoot, this.focusBody.id) : null;
    const hoverBody = this.hoverId ? findBodyById(this.solarRoot, this.hoverId) : null;
    const info: UniverseInfo = {
      viewLevel: this.viewLevel,
      focusName: body?.data.name ?? this.viewLevelLabel(),
      focusNameAr: body?.data.nameAr ?? this.viewLevelLabelAr(),
      focusData: body?.data ?? null,
      breadcrumb: this.breadcrumb,
      hoverId: this.hoverId,
      hoverName: hoverBody?.data.name ?? '',
      hoverNameAr: hoverBody?.data.nameAr ?? '',
      gestureLabel: this.gestureLabel,
    };
    this.infoListeners.forEach(cb => cb(info));
  }

  private viewLevelLabel(): string {
    return { universe: 'Observable Universe', galaxy: 'Milky Way Galaxy', system: 'Solar System', planet: 'Solar System' }[this.viewLevel];
  }
  private viewLevelLabelAr(): string {
    return { universe: 'الكون المرئي', galaxy: 'مجرة درب التبانة', system: 'المجموعة الشمسية', planet: 'المجموعة الشمسية' }[this.viewLevel];
  }
}
