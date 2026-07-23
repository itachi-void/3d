import * as THREE from 'three';
import { PARTICLE_VERTEX_SHADER } from '../shaders/particleVertex';
import { PARTICLE_FRAGMENT_SHADER } from '../shaders/particleFragment';

export interface ForceField {
  ox: number; oy: number; oz: number;
  radius: number;
  strength: number;
  mode: 'repel' | 'attract' | 'spiral';
}

interface ClickWave {
  ox: number; oy: number; oz: number;
  radius: number;
  maxRadius: number;
  strength: number;
}

export interface ParticleConfig {
  count: number;
  pixelRatio: number;
  particleSize: number;
}

export class ParticleSystem {
  readonly count: number;

  readonly positions: Float32Array;
  readonly velocities: Float32Array;
  readonly targets: Float32Array;
  readonly noises: Float32Array;

  private readonly colors: Float32Array;
  private readonly sizes: Float32Array;
  private readonly alphas: Float32Array;
  private readonly speeds: Float32Array;

  private readonly colorsSrc: Float32Array;
  private readonly colorsDst: Float32Array;
  private colorT = 1.0;

  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  points: THREE.Points;

  private posAttr: THREE.BufferAttribute;
  private colAttr: THREE.BufferAttribute;
  private spdAttr: THREE.BufferAttribute;

  private clickWaves: ClickWave[] = [];

  // Global spring multiplier (0 = free flight, 1 = normal)
  springMult = 1.0;
  // Scatter all particles away from targets (supernova)
  scatterImpulse = 0;

  constructor({ count, pixelRatio, particleSize }: ParticleConfig) {
    this.count = count;

    this.positions  = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.targets    = new Float32Array(count * 3);
    this.noises     = new Float32Array(count);
    this.colors     = new Float32Array(count * 3);
    this.sizes      = new Float32Array(count);
    this.alphas     = new Float32Array(count);
    this.speeds     = new Float32Array(count);
    this.colorsSrc  = new Float32Array(count * 3);
    this.colorsDst  = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      this.noises[i] = Math.random();
      this.sizes[i]  = 0.3 + Math.random() * 0.62;
      this.alphas[i] = 0.28 + Math.random() * 0.38;
    }

    this.geometry = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.positions, 3);
    this.colAttr = new THREE.BufferAttribute(this.colors, 3);
    this.spdAttr = new THREE.BufferAttribute(this.speeds, 1);

    this.geometry.setAttribute('position', this.posAttr);
    this.geometry.setAttribute('aColor',   this.colAttr);
    this.geometry.setAttribute('aSize',    new THREE.BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('aAlpha',   new THREE.BufferAttribute(this.alphas, 1));
    this.geometry.setAttribute('aNoise',   new THREE.BufferAttribute(this.noises, 1));
    this.geometry.setAttribute('aSpeed',   this.spdAttr);

    this.material = new THREE.ShaderMaterial({
      vertexShader:   PARTICLE_VERTEX_SHADER,
      fragmentShader: PARTICLE_FRAGMENT_SHADER,
      uniforms: {
        uTime:       { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uSize:       { value: particleSize },
      },
      transparent: true,
      blending:    THREE.NormalBlending,
      depthWrite:  false,
      depthTest:   false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  setTargets(newTargets: Float32Array): void {
    this.targets.set(newTargets);
  }

  setInitialPositions(pos: Float32Array): void {
    this.positions.set(pos);
    this.velocities.fill(0);
  }

  setColors(c1: [number, number, number], c2: [number, number, number]): void {
    this.colorsSrc.set(this.colors);
    for (let i = 0; i < this.count; i++) {
      const t = this.noises[i];
      this.colorsDst[i * 3]     = c1[0] + (c2[0] - c1[0]) * t;
      this.colorsDst[i * 3 + 1] = c1[1] + (c2[1] - c1[1]) * t;
      this.colorsDst[i * 3 + 2] = c1[2] + (c2[2] - c1[2]) * t;
    }
    this.colorT = 0;
  }

  initColors(c1: [number, number, number], c2: [number, number, number]): void {
    for (let i = 0; i < this.count; i++) {
      const t = this.noises[i];
      this.colors[i * 3]     = c1[0] + (c2[0] - c1[0]) * t;
      this.colors[i * 3 + 1] = c1[1] + (c2[1] - c1[1]) * t;
      this.colors[i * 3 + 2] = c1[2] + (c2[2] - c1[2]) * t;
    }
    this.colorsSrc.set(this.colors);
    this.colorsDst.set(this.colors);
    this.colorT = 1;
    this.colAttr.needsUpdate = true;
  }

  triggerWave(ox: number, oy: number, oz: number, strength = 22, maxRadius = 45): void {
    this.clickWaves.push({ ox, oy, oz, radius: 0, maxRadius, strength });
  }

  // Legacy alias
  triggerClick(ox: number, oy: number, oz: number, strength = 22): void {
    this.triggerWave(ox, oy, oz, strength);
  }

  // Scatter all particles outward from a point (supernova)
  triggerScatter(ox: number, oy: number, oz: number, strength = 60): void {
    const { positions, velocities } = this;
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const dx = positions[i3]     - ox;
      const dy = positions[i3 + 1] - oy;
      const dz = positions[i3 + 2] - oz;
      const d  = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      const f  = strength / d;
      velocities[i3]     += dx * f * (0.5 + Math.random());
      velocities[i3 + 1] += dy * f * (0.5 + Math.random());
      velocities[i3 + 2] += dz * f * (0.5 + Math.random());
    }
  }

  // ─── Per-frame physics ──────────────────────────────────────────────────────

  update(dt: number, time: number, fields: ForceField[]): void {
    const { positions, velocities, targets } = this;
    const N    = this.count;
    const DT60 = Math.min(dt * 60, 3);
    const SPRING = 0.055 * this.springMult;
    const DAMP   = Math.pow(0.91, DT60);
    const FL = fields.length;

    // Advance click waves
    for (let w = this.clickWaves.length - 1; w >= 0; w--) {
      this.clickWaves[w].radius += 28 * dt;
      if (this.clickWaves[w].radius > this.clickWaves[w].maxRadius)
        this.clickWaves.splice(w, 1);
    }
    const waves = this.clickWaves;
    const wLen  = waves.length;

    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      let px = positions[i3],     py = positions[i3 + 1], pz = positions[i3 + 2];
      let vx = velocities[i3],    vy = velocities[i3 + 1], vz = velocities[i3 + 2];
      const tx = targets[i3], ty = targets[i3 + 1], tz = targets[i3 + 2];

      // Spring toward target
      vx += (tx - px) * SPRING * DT60;
      vy += (ty - py) * SPRING * DT60;
      vz += (tz - pz) * SPRING * DT60;

      // Force fields (repel, attract, spiral)
      for (let fi = 0; fi < FL; fi++) {
        const ff = fields[fi];
        const dx = px - ff.ox, dy = py - ff.oy, dz = pz - ff.oz;
        const d2 = dx * dx + dy * dy + dz * dz;
        const R2 = ff.radius * ff.radius;
        if (d2 < R2 && d2 > 0.01) {
          const d    = Math.sqrt(d2);
          const fall = (1 - d / ff.radius);
          const f    = ff.strength * fall * fall / d * DT60;

          if (ff.mode === 'repel') {
            vx += dx * f; vy += dy * f; vz += dz * f;
          } else if (ff.mode === 'attract') {
            vx -= dx * f; vy -= dy * f; vz -= dz * f;
          } else { // spiral (black hole)
            vx -= dx * f * 0.7;
            vy -= dy * f * 0.7;
            vz -= dz * f * 0.7;
            // Tangential component for swirl
            vx += (-dz) * f * 0.45;
            vz += dx  * f * 0.45;
          }
        }
      }

      // Click waves
      for (let w = 0; w < wLen; w++) {
        const wv = waves[w];
        const wx = px - wv.ox, wy = py - wv.oy, wz2 = pz - wv.oz;
        const wd = Math.sqrt(wx * wx + wy * wy + wz2 * wz2);
        const diff = wd - wv.radius;
        if (Math.abs(diff) < 6 && wd > 0.01) {
          const ring  = 1 - Math.abs(diff) / 6;
          const decay = 1 - wv.radius / wv.maxRadius;
          const f     = wv.strength * ring * decay / wd;
          vx += wx * f; vy += wy * f; vz += wz2 * f;
        }
      }

      // Damping + integrate
      vx *= DAMP; vy *= DAMP; vz *= DAMP;

      positions[i3]     = px + vx * DT60;
      positions[i3 + 1] = py + vy * DT60;
      positions[i3 + 2] = pz + vz * DT60;
      velocities[i3]     = vx;
      velocities[i3 + 1] = vy;
      velocities[i3 + 2] = vz;

      this.speeds[i] = Math.sqrt(vx * vx + vy * vy + vz * vz) * 0.18;
    }

    // Color morph
    if (this.colorT < 1) {
      this.colorT = Math.min(this.colorT + dt * 0.9, 1);
      const tc = 1 - this.colorT, t = this.colorT;
      for (let i = 0; i < N * 3; i++) {
        this.colors[i] = this.colorsSrc[i] * tc + this.colorsDst[i] * t;
      }
      this.colAttr.needsUpdate = true;
    }

    this.posAttr.needsUpdate = true;
    this.spdAttr.needsUpdate = true;
    this.material.uniforms.uTime.value = time;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
