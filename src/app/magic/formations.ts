export type FormationId =
  | 'sphere' | 'torus' | 'cube' | 'helix' | 'galaxy'
  | 'dna' | 'crystal' | 'orb' | 'pyramid' | 'text' | 'hand';

export interface FormationMeta {
  en: string;
  ar: string;
  icon: string;
  accent: string;
}

export const FORMATIONS: Record<FormationId, FormationMeta> = {
  sphere:  { en: 'Sphere',      ar: 'كرة',       icon: '◎', accent: '#4af' },
  torus:   { en: 'Torus',       ar: 'حلقة',      icon: '⊗', accent: '#f4a' },
  cube:    { en: 'Cube',        ar: 'مكعب',      icon: '⬡', accent: '#4fa' },
  helix:   { en: 'Helix',       ar: 'لولبي',     icon: '⟳', accent: '#fa4' },
  galaxy:  { en: 'Galaxy',      ar: 'مجرة',      icon: '✺', accent: '#a4f' },
  dna:     { en: 'DNA',         ar: 'دي إن إيه', icon: '⥁', accent: '#f44' },
  crystal: { en: 'Crystal',     ar: 'كريستال',   icon: '◈', accent: '#aff' },
  orb:     { en: 'Energy Orb',  ar: 'كرة طاقة',  icon: '◉', accent: '#ff4' },
  pyramid: { en: 'Pyramid',     ar: 'هرم',        icon: '△', accent: '#f84' },
  text:    { en: 'AI Text',     ar: 'نص ذكاء',   icon: 'AI', accent: '#4ff' },
  hand:    { en: 'Hand Field',  ar: 'حقل اليد',  icon: '✋', accent: '#d8a4ff' },
};

export const FORMATION_ORDER: FormationId[] = [
  'sphere', 'torus', 'cube', 'helix', 'galaxy', 'dna', 'crystal', 'orb', 'pyramid', 'text', 'hand',
];

export function buildFormation(id: FormationId, count: number): Float32Array {
  switch (id) {
    case 'sphere':  return buildSphere(count);
    case 'torus':   return buildTorus(count);
    case 'cube':    return buildCube(count);
    case 'helix':   return buildHelix(count);
    case 'galaxy':  return buildGalaxy(count);
    case 'dna':     return buildDNA(count);
    case 'crystal': return buildCrystal(count);
    case 'orb':     return buildOrb(count);
    case 'pyramid': return buildPyramid(count);
    case 'text':    return buildText(count);
    case 'hand':    return buildHand(count);
  }
}

function buildSphere(n: number, radius = 2.2): Float32Array {
  const pos = new Float32Array(n * 3);
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    pos[i * 3]     = r * Math.cos(theta) * radius;
    pos[i * 3 + 1] = y * radius;
    pos[i * 3 + 2] = r * Math.sin(theta) * radius;
  }
  return pos;
}

function buildTorus(n: number, R = 1.8, r = 0.7): Float32Array {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = (i / n) * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    pos[i * 3]     = (R + r * Math.cos(v)) * Math.cos(u);
    pos[i * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u);
    pos[i * 3 + 2] = r * Math.sin(v);
  }
  return pos;
}

function buildCube(n: number, size = 2.3): Float32Array {
  const pos = new Float32Array(n * 3);
  const h = size / 2;
  for (let i = 0; i < n; i++) {
    const face = Math.floor(Math.random() * 6);
    const a = (Math.random() - 0.5) * size;
    const b = (Math.random() - 0.5) * size;
    switch (face) {
      case 0: pos[i*3]=h;  pos[i*3+1]=a; pos[i*3+2]=b; break;
      case 1: pos[i*3]=-h; pos[i*3+1]=a; pos[i*3+2]=b; break;
      case 2: pos[i*3]=a;  pos[i*3+1]=h; pos[i*3+2]=b; break;
      case 3: pos[i*3]=a;  pos[i*3+1]=-h;pos[i*3+2]=b; break;
      case 4: pos[i*3]=a;  pos[i*3+1]=b; pos[i*3+2]=h; break;
      default:pos[i*3]=a;  pos[i*3+1]=b; pos[i*3+2]=-h;break;
    }
  }
  return pos;
}

function buildHelix(n: number, radius = 1.8, height = 4.5, turns = 5): Float32Array {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const angle = t * Math.PI * 2 * turns;
    const scatter = (Math.random() - 0.5) * 0.12;
    pos[i * 3]     = (radius + scatter) * Math.cos(angle);
    pos[i * 3 + 1] = (t - 0.5) * height * 2;
    pos[i * 3 + 2] = (radius + scatter) * Math.sin(angle);
  }
  return pos;
}

function buildGalaxy(n: number): Float32Array {
  const pos = new Float32Array(n * 3);
  const ARMS = 3;
  for (let i = 0; i < n; i++) {
    const arm  = i % ARMS;
    const t    = Math.floor(i / ARMS) / (n / ARMS);
    const r    = t * 3.2 + 0.1;
    const spin = r * 1.6;
    const armAngle = (arm / ARMS) * Math.PI * 2;
    const angle    = armAngle + spin;
    const scatter  = (Math.random() * Math.random()) * 0.5 * r;
    const sa       = Math.random() * Math.PI * 2;
    pos[i * 3]     = (r + scatter * Math.cos(sa)) * Math.cos(angle);
    pos[i * 3 + 1] = (Math.random() - 0.5) * 0.25 * (1 - t * 0.7);
    pos[i * 3 + 2] = (r + scatter * Math.sin(sa)) * Math.sin(angle);
  }
  return pos;
}

function buildDNA(n: number): Float32Array {
  const pos = new Float32Array(n * 3);
  const TURNS = 5;
  const HEIGHT = 5.0;
  const RADIUS = 1.2;
  for (let i = 0; i < n; i++) {
    const t     = i / n;
    const angle = t * Math.PI * 2 * TURNS;
    const strand = (i % 30 < 15) ? 0 : Math.PI;
    const isRung = (i % 30 === 7 || i % 30 === 22);
    if (isRung) {
      // Base pair rung
      const rungT = (i % 30 < 15) ? (i % 15) / 15 : ((i % 30) - 15) / 15;
      pos[i * 3]     = RADIUS * Math.cos(angle + strand) * rungT;
      pos[i * 3 + 1] = (t - 0.5) * HEIGHT * 2;
      pos[i * 3 + 2] = RADIUS * Math.sin(angle + strand) * rungT;
    } else {
      const jitter = (Math.random() - 0.5) * 0.07;
      pos[i * 3]     = RADIUS * Math.cos(angle + strand) + jitter;
      pos[i * 3 + 1] = (t - 0.5) * HEIGHT * 2;
      pos[i * 3 + 2] = RADIUS * Math.sin(angle + strand) + jitter;
    }
  }
  return pos;
}

function buildCrystal(n: number): Float32Array {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t    = Math.random();
    const top  = Math.random() > 0.5;
    const y    = top ? t * 2.8 - 0.3 : -(t * 2.8 - 0.3);
    const maxR = (1 - Math.abs(y) / 2.8) * 1.9;
    const sides = 6;
    const side  = Math.floor(Math.random() * sides);
    const baseAngle = (side / sides) * Math.PI * 2;
    const angle = baseAngle + (Math.random() - 0.5) * 0.35;
    const r = maxR * (0.7 + Math.random() * 0.3);
    pos[i * 3]     = r * Math.cos(angle);
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = r * Math.sin(angle);
  }
  return pos;
}

function buildOrb(n: number): Float32Array {
  const pos = new Float32Array(n * 3);
  const phi = Math.PI * (3 - Math.sqrt(5));
  const radii = [0.4, 0.85, 1.3, 1.75, 2.2];
  for (let i = 0; i < n; i++) {
    const layer  = i % 5;
    const radius = radii[layer] + (Math.random() - 0.5) * 0.08;
    const j      = Math.floor(i / 5);
    const total  = Math.floor(n / 5);
    const y      = 1 - (j / (total - 1)) * 2;
    const rFlat  = Math.sqrt(Math.max(0, 1 - y * y));
    const theta  = phi * j;
    pos[i * 3]     = rFlat * Math.cos(theta) * radius;
    pos[i * 3 + 1] = y * radius;
    pos[i * 3 + 2] = rFlat * Math.sin(theta) * radius;
  }
  return pos;
}

function buildPyramid(n: number): Float32Array {
  const pos = new Float32Array(n * 3);
  const HEIGHT = 3.5;
  const BASE   = 2.5;
  for (let i = 0; i < n; i++) {
    const t    = Math.random();
    const y    = t * HEIGHT - HEIGHT * 0.5;
    const frac = 1 - (y + HEIGHT * 0.5) / HEIGHT;
    const maxR = frac * BASE;
    if (Math.random() < 0.65) {
      const angle = Math.random() * Math.PI * 2;
      const r     = maxR * (0.85 + Math.random() * 0.15);
      pos[i * 3]     = r * Math.cos(angle);
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = r * Math.sin(angle);
    } else {
      const side      = Math.floor(Math.random() * 4);
      const sideAngle = (side / 4) * Math.PI * 2;
      pos[i * 3]     = maxR * Math.cos(sideAngle);
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = maxR * Math.sin(sideAngle);
    }
  }
  return pos;
}

// "AI" glyph pixels (column, row) for text formation
const AI_PIXELS: [number, number][] = [];
const A_BITMAP = [' ### ', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'];
const I_BITMAP = ['###', ' # ', ' # ', ' # ', ' # ', ' # ', '###'];
for (let row = 0; row < A_BITMAP.length; row++) {
  for (let col = 0; col < A_BITMAP[row].length; col++) {
    if (A_BITMAP[row][col] !== ' ') AI_PIXELS.push([col - 5.5, row]);
  }
}
for (let row = 0; row < I_BITMAP.length; row++) {
  for (let col = 0; col < I_BITMAP[row].length; col++) {
    if (I_BITMAP[row][col] !== ' ') AI_PIXELS.push([col + 1.5, row]);
  }
}

function buildText(n: number): Float32Array {
  const pos   = new Float32Array(n * 3);
  const total = AI_PIXELS.length;
  for (let i = 0; i < n; i++) {
    const px = AI_PIXELS[i % total];
    const sc = 0.3;
    pos[i * 3]     = px[0] * 0.4 + (Math.random() - 0.5) * sc;
    pos[i * 3 + 1] = -px[1] * 0.38 + 1.2 + (Math.random() - 0.5) * sc;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
  }
  return pos;
}


// A planar palm-and-fingers silhouette for the camera-led Magic Lab.
// Keeping a little depth noise makes it read as a living particle volume rather
// than a flat icon when the field rotates.
function buildHand(n: number): Float32Array {
  const pos = new Float32Array(n * 3);
  const fingers = [
    { x: -0.92, width: 0.34, bottom: 0.10, top: 1.68 }, // pinky
    { x: -0.43, width: 0.38, bottom: 0.10, top: 2.10 }, // ring
    { x: 0.04, width: 0.40, bottom: 0.10, top: 2.35 },  // middle
    { x: 0.53, width: 0.36, bottom: 0.10, top: 2.12 },  // index
  ];
  for (let i = 0; i < n; i++) {
    const r = Math.random();
    let x: number;
    let y: number;
    if (r < 0.58) {
      // Palm, widened through the middle and tapered near the wrist.
      y = -1.28 + Math.random() * 1.55;
      const t = (y + 1.28) / 1.55;
      const halfWidth = 0.72 + Math.sin(t * Math.PI) * 0.37;
      x = (Math.random() * 2 - 1) * halfWidth;
    } else if (r < 0.88) {
      const finger = fingers[Math.floor(Math.random() * fingers.length)];
      y = finger.bottom + Math.random() * (finger.top - finger.bottom);
      const taper = 1 - ((y - finger.bottom) / (finger.top - finger.bottom)) * 0.35;
      x = finger.x + (Math.random() * 2 - 1) * (finger.width * taper);
    } else {
      // Thumb slants naturally out from the side of the palm.
      const t = Math.random();
      x = -0.62 - t * 0.95 + (Math.random() - 0.5) * 0.26;
      y = -0.38 + t * 0.78 + (Math.random() - 0.5) * 0.22;
    }
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 0.34;
  }
  return pos;
}
