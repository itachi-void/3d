import type { NormalizedLandmark } from './types';

// One Euro Filter — adapts smoothing to velocity: low speed = more smooth, high speed = less smooth
class OneEuro1D {
  private x = 0;
  private dx = 0;
  private initialized = false;
  private lastTs = 0;

  constructor(
    private minCutoff = 1.0,
    private beta = 0.005,
    private dCutoff = 1.0,
  ) {}

  private alpha(cutoff: number, freq: number): number {
    const tau = 1 / (2 * Math.PI * cutoff);
    const te = 1 / freq;
    return 1 / (1 + tau / te);
  }

  filter(value: number, ts: number): number {
    if (!this.initialized) {
      this.x = value;
      this.lastTs = ts;
      this.initialized = true;
      return value;
    }

    const freq = Math.max(1, 1000 / Math.max(1, ts - this.lastTs));
    this.lastTs = ts;

    const adx = this.alpha(this.dCutoff, freq);
    const rawDx = (value - this.x) * freq;
    this.dx = adx * rawDx + (1 - adx) * this.dx;

    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    const ax = this.alpha(cutoff, freq);
    this.x = ax * value + (1 - ax) * this.x;

    return this.x;
  }

  reset(): void {
    this.initialized = false;
  }
}

// Filter for a 3D normalized landmark
class LandmarkFilter {
  private fx = new OneEuro1D(1.2, 0.006, 1.0);
  private fy = new OneEuro1D(1.2, 0.006, 1.0);
  private fz = new OneEuro1D(0.8, 0.004, 1.0);

  filter(lm: NormalizedLandmark, ts: number): NormalizedLandmark {
    return {
      x: this.fx.filter(lm.x, ts),
      y: this.fy.filter(lm.y, ts),
      z: this.fz.filter(lm.z, ts),
    };
  }

  reset(): void {
    this.fx.reset();
    this.fy.reset();
    this.fz.reset();
  }
}

// Filter all 21 landmarks for one hand
export class HandLandmarkFilter {
  private filters: LandmarkFilter[] = Array.from({ length: 21 }, () => new LandmarkFilter());

  filter(landmarks: NormalizedLandmark[], ts: number): NormalizedLandmark[] {
    return landmarks.map((lm, i) => this.filters[i].filter(lm, ts));
  }

  reset(): void {
    this.filters.forEach((f) => f.reset());
  }
}

// Scalar EMA for pinch strength and other scalars
export class ScalarEMA {
  private value: number;
  constructor(initial = 0, private alpha = 0.25) {
    this.value = initial;
  }
  update(raw: number): number {
    this.value = this.alpha * raw + (1 - this.alpha) * this.value;
    return this.value;
  }
  get(): number { return this.value; }
}
