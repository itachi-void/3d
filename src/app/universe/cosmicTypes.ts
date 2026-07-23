export type SurfaceType = 'rocky' | 'earth' | 'venus' | 'gas' | 'ice' | 'star' | 'moon';
export type BodyType = 'star' | 'planet' | 'moon' | 'dwarf' | 'belt';
export type ViewLevel = 'universe' | 'galaxy' | 'system' | 'planet';

export interface RingData {
  innerR: number;
  outerR: number;
  color: string;
  opacity: number;
}

export interface AtmosphereData {
  color: string;
  scale: number;     // relative to planet radius (1.05 = thin, 1.15 = thick)
  opacity: number;
}

export interface PlanetData {
  id: string;
  name: string;
  nameAr: string;
  type: BodyType;
  // Orbit relative to parent (scene units)
  orbitRadius: number;
  orbitPeriod: number;   // Earth years
  orbitInclination: number; // degrees
  startAngle: number;    // radians
  // Physical (scene units)
  radius: number;
  axialTilt: number;     // degrees
  // Visual
  surface: SurfaceType;
  color1: string;
  color2: string;
  color3?: string;
  emissive?: boolean;
  emissiveIntensity?: number;
  atmosphere?: AtmosphereData;
  rings?: RingData;
  // Info panel
  description: string;
  descriptionAr: string;
  facts: string[];
  factsAr: string[];
  // Children
  moons?: PlanetData[];
}

export interface GalaxyData {
  numStars: number;
  numArms: number;
  armAngle: number;
  spread: number;
  radius: number;
  bulgeRadius: number;
}

export interface UniverseState {
  viewLevel: ViewLevel;
  focusId: string | null;
  hoverId: string | null;
  orbitR: number;
  orbitTheta: number;
  orbitPhi: number;
  targetOrbitR: number;
  targetTheta: number;
  targetPhi: number;
  isFlying: boolean;
  time: number;
}
