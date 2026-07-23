export type QualityLevel = 'ultra' | 'high' | 'medium' | 'low';

export interface QualityConfig {
  particleCount: number;
  pixelRatio: number;
  particleSize: number;
  bloomIntensity: number;
  usePostProcessing: boolean;
}

const CONFIGS: Record<QualityLevel, QualityConfig> = {
  ultra: {
    particleCount: 55_000,
    pixelRatio: Math.min(devicePixelRatio, 1.5),
    particleSize: 1.35,
    bloomIntensity: 0.56,
    usePostProcessing: true,
  },
  high: {
    particleCount: 40_000,
    pixelRatio: Math.min(devicePixelRatio, 1.25),
    particleSize: 1.3,
    bloomIntensity: 0.48,
    usePostProcessing: true,
  },
  medium: {
    particleCount: 26_000,
    pixelRatio: 1,
    particleSize: 1.4,
    bloomIntensity: 0.38,
    usePostProcessing: false,
  },
  low: {
    particleCount: 14_000,
    pixelRatio: 1,
    particleSize: 1.75,
    bloomIntensity: 0.4,
    usePostProcessing: false,
  },
};

export class QualityManager {
  level: QualityLevel;
  config: QualityConfig;

  constructor(override?: QualityLevel) {
    this.level = override ?? this.detect();
    this.config = CONFIGS[this.level];
  }

  private detect(): QualityLevel {
    const mobile = /Mobile|Android/i.test(navigator.userAgent);
    const cores = navigator.hardwareConcurrency ?? 4;
    const memory = (navigator as { deviceMemory?: number }).deviceMemory ?? 4;

    if (mobile) return 'medium';
    if (cores >= 8 && memory >= 8) return 'ultra';
    if (cores >= 4) return 'high';
    if (cores >= 2) return 'medium';
    return 'low';
  }

  setLevel(level: QualityLevel): void {
    this.level = level;
    this.config = CONFIGS[level];
  }

  static all(): QualityLevel[] {
    return ['low', 'medium', 'high', 'ultra'];
  }
}
