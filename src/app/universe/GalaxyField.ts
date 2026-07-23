import * as THREE from 'three';
import type { GalaxyData, GalaxySprite } from './cosmicTypes';
import { GALAXY_VERT, GALAXY_FRAG, UNIVERSE_GALAXY_VERT, UNIVERSE_GALAXY_FRAG } from './shaders/planetShaders';

// Arm color palettes
const ARM_COLORS = [
  new THREE.Color('#88aaff'), new THREE.Color('#ffddaa'),
  new THREE.Color('#aaffcc'), new THREE.Color('#ffaacc'),
  new THREE.Color('#ffffff'),
];

export class GalaxyField {
  points: THREE.Points;
  private material: THREE.ShaderMaterial;
  private count: number;

  constructor(config: GalaxyData) {
    this.count = config.numStars;
    const { numArms, armAngle, spread, radius, bulgeRadius } = config;

    const positions = new Float32Array(this.count * 3);
    const colors    = new Float32Array(this.count * 3);
    const sizes     = new Float32Array(this.count);
    const brightness = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      const isBulge = Math.random() < 0.25;
      let x: number, y: number, z: number;
      let col: THREE.Color;

      if (isBulge) {
        // Central bulge — dense sphere
        const r = Math.pow(Math.random(), 2) * bulgeRadius;
        const theta = Math.random() * Math.PI * 2;
        const phi   = (Math.random() - 0.5) * Math.PI;
        x = r * Math.cos(theta) * Math.cos(phi);
        y = r * Math.sin(phi) * 0.35;
        z = r * Math.sin(theta) * Math.cos(phi);
        col = new THREE.Color().lerpColors(new THREE.Color('#ffcc88'), new THREE.Color('#ffeecc'), Math.random());
      } else {
        // Spiral arms
        const armIdx = Math.floor(Math.random() * numArms);
        const armOffset = (armIdx / numArms) * Math.PI * 2;
        const dist = bulgeRadius + Math.pow(Math.random(), 1.2) * (radius - bulgeRadius);
        const angle = armOffset + (dist / radius) * armAngle + (Math.random() - 0.5) * spread * (1 + dist / radius);
        const diskY = (Math.random() - 0.5) * 8 * (1 - dist / radius);
        x = Math.cos(angle) * dist + (Math.random() - 0.5) * spread * radius * 0.15;
        y = diskY;
        z = Math.sin(angle) * dist + (Math.random() - 0.5) * spread * radius * 0.15;
        // Color by arm + distance
        const baseCol = ARM_COLORS[armIdx % ARM_COLORS.length];
        col = new THREE.Color().lerpColors(baseCol, new THREE.Color('#ffffff'), Math.random() * 0.4);
        // Farther from center = bluer, younger stars
        const youngness = Math.max(0, dist / radius - 0.4) * 1.5;
        col.lerpColors(col, new THREE.Color('#aaccff'), youngness * 0.35);
      }

      positions[i * 3]     = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      colors[i * 3]     = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
      sizes[i]      = 0.4 + Math.random() * 1.2;
      brightness[i] = 0.3 + Math.random() * 0.7;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position',   new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor',     new THREE.BufferAttribute(colors,    3));
    geo.setAttribute('aSize',      new THREE.BufferAttribute(sizes,     1));
    geo.setAttribute('aBrightness',new THREE.BufferAttribute(brightness, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader:   GALAXY_VERT,
      fragmentShader: GALAXY_FRAG,
      uniforms: { uPixelRatio: { value: window.devicePixelRatio } },
      transparent: true,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    });

    this.points = new THREE.Points(geo, this.material);
  }

  dispose(): void {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}

// ─── Universe view: sprites for each galaxy ───────────────────────────────────

export class UniverseField {
  points: THREE.Points;
  private material: THREE.ShaderMaterial;

  constructor(galaxies: GalaxySprite[]) {
    const N = galaxies.length;
    const positions  = new Float32Array(N * 3);
    const colors     = new Float32Array(N * 3);
    const sizes      = new Float32Array(N);
    const rotations  = new Float32Array(N);

    galaxies.forEach((g, i) => {
      positions[i * 3]     = g.position[0];
      positions[i * 3 + 1] = g.position[1];
      positions[i * 3 + 2] = g.position[2];
      const col = new THREE.Color(g.color);
      colors[i * 3]     = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
      sizes[i]     = g.size;
      rotations[i] = Math.random() * Math.PI * 2;
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor',   new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aRotation',new THREE.BufferAttribute(rotations, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader:   UNIVERSE_GALAXY_VERT,
      fragmentShader: UNIVERSE_GALAXY_FRAG,
      uniforms: { uPixelRatio: { value: window.devicePixelRatio } },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.points = new THREE.Points(geo, this.material);
  }

  dispose(): void {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}

// ─── Distant background stars (always visible) ────────────────────────────────

export function createBackgroundStars(count: number): THREE.Points {
  const positions  = new Float32Array(count * 3);
  const colors     = new Float32Array(count * 3);
  const sizes      = new Float32Array(count);
  const brightness = new Float32Array(count);

  const starColors = [
    new THREE.Color('#ffffff'), new THREE.Color('#aaccff'),
    new THREE.Color('#ffeecc'), new THREE.Color('#ffddaa'),
    new THREE.Color('#ccddff'),
  ];

  for (let i = 0; i < count; i++) {
    // Spread on unit sphere, scale to huge distance
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 1800 + Math.random() * 200;
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    const c = starColors[Math.floor(Math.random() * starColors.length)];
    colors[i * 3]     = c.r; colors[i * 3+1] = c.g; colors[i * 3+2] = c.b;
    sizes[i]      = 0.3 + Math.random() * 0.9;
    brightness[i] = 0.2 + Math.random() * 0.8;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position',    new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aColor',      new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aSize',       new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1));

  const mat = new THREE.ShaderMaterial({
    vertexShader: GALAXY_VERT,
    fragmentShader: GALAXY_FRAG,
    uniforms: { uPixelRatio: { value: window.devicePixelRatio } },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return new THREE.Points(geo, mat);
}
