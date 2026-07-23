export type FormationType =
  | 'sphere'
  | 'galaxy'
  | 'dna'
  | 'torus'
  | 'lorenz'
  | 'wave'
  | 'hyperbloom'
  | 'ribbons';

export interface FormationMeta {
  label: string;
  description: string;
}

export const FORMATION_META: Record<FormationType, FormationMeta> = {
  sphere:     { label: 'SPHERE',    description: 'Fibonacci point distribution' },
  galaxy:     { label: 'GALAXY',    description: 'Three-arm logarithmic spiral' },
  dna:        { label: 'HELIX',     description: 'Double helix structure' },
  torus:      { label: 'TORUS',     description: 'Toroidal field geometry' },
  lorenz:     { label: 'ATTRACTOR', description: 'Lorenz strange attractor' },
  wave:       { label: 'WAVE',      description: 'Animated interference field' },
  hyperbloom: { label: 'BLOOM',     description: 'Parametric floral form' },
  ribbons:    { label: 'RIBBONS',   description: 'Interleaved sine ribbons' },
};

export const FORMATION_PALETTES: Record<
  FormationType,
  { c1: [number, number, number]; c2: [number, number, number] }
> = {
  sphere:     { c1: [0.0, 0.55, 1.0],  c2: [0.45, 0.85, 1.0]  },
  galaxy:     { c1: [1.0, 0.48, 0.0],  c2: [1.0, 0.93, 0.22]  },
  dna:        { c1: [0.0, 0.88, 0.42], c2: [0.0, 1.0, 0.78]   },
  torus:      { c1: [0.55, 0.0, 1.0],  c2: [1.0, 0.0, 0.68]   },
  lorenz:     { c1: [1.0, 0.08, 0.0],  c2: [1.0, 0.62, 0.0]   },
  wave:       { c1: [0.12, 0.38, 1.0], c2: [0.65, 0.88, 1.0]  },
  hyperbloom: { c1: [1.0, 0.15, 0.42], c2: [1.0, 0.78, 0.12]  },
  ribbons:    { c1: [0.45, 0.0, 1.0],  c2: [0.0, 0.88, 1.0]   },
};

export const FORMATION_ORDER: FormationType[] = [
  'sphere', 'galaxy', 'dna', 'torus', 'lorenz', 'wave', 'hyperbloom', 'ribbons',
];

// ─── Formation generators ────────────────────────────────────────────────────

function sphere(count: number, R = 19): Float32Array {
  const pos = new Float32Array(count * 3);
  const phi = Math.PI * (Math.sqrt(5) - 1);
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    pos[i * 3]     = Math.cos(theta) * r * R;
    pos[i * 3 + 1] = y * R;
    pos[i * 3 + 2] = Math.sin(theta) * r * R;
  }
  return pos;
}

function galaxy(count: number): Float32Array {
  const pos = new Float32Array(count * 3);
  const ARMS = 3;
  const MAX_R = 24;

  for (let i = 0; i < count; i++) {
    const arm = i % ARMS;
    const t = Math.random();
    const r = Math.sqrt(t) * MAX_R;
    const spin = r * 0.32;
    const spread = (Math.random() - 0.5) * 0.6;
    const theta = spin + arm * ((Math.PI * 2) / ARMS) + spread;
    const y = (Math.random() - 0.5) * Math.exp(-r / 9) * 5;

    pos[i * 3]     = Math.cos(theta) * r;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(theta) * r;
  }
  return pos;
}

function dna(count: number): Float32Array {
  const pos = new Float32Array(count * 3);
  const TURNS = 6;
  const HEIGHT = 32;
  const RADIUS = 5.5;

  for (let i = 0; i < count; i++) {
    const strand = i % 2;
    const frac = i / count;
    const t = frac * TURNS * Math.PI * 2;
    const y = frac * HEIGHT - HEIGHT / 2;
    const angle = t + strand * Math.PI;
    const jitter = (Math.random() - 0.5) * 0.25;

    pos[i * 3]     = Math.cos(angle + jitter) * RADIUS;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(angle + jitter) * RADIUS;
  }
  return pos;
}

function torus(count: number, R = 13, r = 5): Float32Array {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    const jitter = (Math.random() - 0.5) * 0.3;
    pos[i * 3]     = (R + r * Math.cos(v)) * Math.cos(u);
    pos[i * 3 + 1] = r * Math.sin(v) + jitter;
    pos[i * 3 + 2] = (R + r * Math.cos(v)) * Math.sin(u);
  }
  return pos;
}

function lorenz(count: number): Float32Array {
  const pos = new Float32Array(count * 3);
  const dt = 0.007;
  const sigma = 10, rho = 28, beta = 8 / 3;
  const SCALE = 0.62;
  let x = 0.1, y = 0, z = 0;

  // Warm up onto the attractor
  for (let i = 0; i < 800; i++) {
    const dx = sigma * (y - x);
    const dy = x * (rho - z) - y;
    const dz = x * y - beta * z;
    x += dx * dt; y += dy * dt; z += dz * dt;
  }

  // Build trajectory
  const traj: number[] = [];
  const TRAJ_LEN = Math.max(count * 2, 40000);
  for (let i = 0; i < TRAJ_LEN; i++) {
    const dx = sigma * (y - x);
    const dy = x * (rho - z) - y;
    const dz = x * y - beta * z;
    x += dx * dt; y += dy * dt; z += dz * dt;
    traj.push(x * SCALE, (z - 25) * SCALE, y * SCALE * 0.55);
  }

  const pointsInTraj = traj.length / 3;
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pointsInTraj);
    const j = (Math.random() - 0.5) * 0.35;
    pos[i * 3]     = traj[idx * 3]     + j;
    pos[i * 3 + 1] = traj[idx * 3 + 1] + j;
    pos[i * 3 + 2] = traj[idx * 3 + 2] + j;
  }
  return pos;
}

function waveInitial(count: number): Float32Array {
  const pos = new Float32Array(count * 3);
  const side = Math.ceil(Math.sqrt(count));
  for (let i = 0; i < count; i++) {
    const col = i % side;
    const row = Math.floor(i / side);
    pos[i * 3]     = ((col / (side - 1)) - 0.5) * 42;
    pos[i * 3 + 1] = 0;
    pos[i * 3 + 2] = ((row / (side - 1)) - 0.5) * 42;
  }
  return pos;
}

function hyperbloom(count: number): Float32Array {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2 * 14;
    const r = Math.sqrt(i / count) * 22;
    const petals = 0.5 + 0.5 * Math.sin(t * 4.5);
    const rr = r * petals;
    pos[i * 3]     = Math.cos(t) * rr;
    pos[i * 3 + 1] = Math.sin(r * 0.18) * 3.5;
    pos[i * 3 + 2] = Math.sin(t) * rr;
  }
  return pos;
}

function ribbons(count: number): Float32Array {
  const pos = new Float32Array(count * 3);
  const BAND_COUNT = 6;
  const perBand = Math.floor(count / BAND_COUNT);

  for (let b = 0; b < BAND_COUNT; b++) {
    const offset = (b / BAND_COUNT) * Math.PI * 2;
    const yBase = (b / (BAND_COUNT - 1) - 0.5) * 30;
    const start = b * perBand;
    const end = b === BAND_COUNT - 1 ? count : start + perBand;

    for (let i = start; i < end; i++) {
      const t = ((i - start) / (end - start)) * Math.PI * 2;
      const amp = 12 + 4 * Math.sin(offset);
      pos[i * 3]     = Math.cos(t + offset) * amp;
      pos[i * 3 + 1] = yBase + Math.sin(t * 2 + offset) * 2;
      pos[i * 3 + 2] = Math.sin(t + offset) * amp;
    }
  }
  return pos;
}

// ─── Static wave updater (called each frame for wave formation) ──────────────

export function updateWaveTargets(targets: Float32Array, count: number, time: number): void {
  const side = Math.ceil(Math.sqrt(count));
  const inv = 1 / (side - 1);
  for (let i = 0; i < count; i++) {
    const col = i % side;
    const row = Math.floor(i / side);
    const x = (col * inv - 0.5) * 42;
    const z = (row * inv - 0.5) * 42;
    const y =
      Math.sin(x * 0.24 + time * 1.1) * Math.cos(z * 0.19 + time * 0.85) * 4.5 +
      Math.sin(x * 0.1 + z * 0.14 + time * 0.55) * 2.0;
    targets[i * 3]     = x;
    targets[i * 3 + 1] = y;
    targets[i * 3 + 2] = z;
  }
}

// ─── Public generate API ──────────────────────────────────────────────────────

export const Formations = {
  generate(type: FormationType, count: number): Float32Array {
    switch (type) {
      case 'sphere':     return sphere(count);
      case 'galaxy':     return galaxy(count);
      case 'dna':        return dna(count);
      case 'torus':      return torus(count);
      case 'lorenz':     return lorenz(count);
      case 'wave':       return waveInitial(count);
      case 'hyperbloom': return hyperbloom(count);
      case 'ribbons':    return ribbons(count);
    }
  },

  scatter(count: number, radius = 55): Float32Array {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.cbrt(Math.random()) * radius;
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  },
};
