import { useEffect, useRef, MutableRefObject } from 'react';
import { Experience, ExperienceStats } from '../engine/Experience';
import type { QualityLevel } from '../engine/QualityManager';

interface ParticleCanvasProps {
  onStats: (stats: ExperienceStats) => void;
  qualityOverride?: QualityLevel;
  experienceRef: MutableRefObject<Experience | null>;
}

export function ParticleCanvas({ onStats, qualityOverride, experienceRef }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onStatsRef = useRef(onStats);
  onStatsRef.current = onStats;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exp = new Experience(canvas, qualityOverride);
    experienceRef.current = exp;

    exp.addEventListener('stats', (e: Event) => {
      onStatsRef.current((e as CustomEvent<ExperienceStats>).detail);
    });

    const handleResize = () => exp.onResize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      exp.dispose();
      experienceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qualityOverride]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
