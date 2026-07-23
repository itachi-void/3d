import { createContext, useContext } from 'react';
import type { MutableRefObject } from 'react';
import type { Experience, ExperienceStats } from './engine/Experience';
import type { UniverseEngine, UniverseInfo } from './universe/UniverseEngine';
import type { WorldEngine, WorldInfo } from './worlds/WorldEngine';
import type { MagicEngine, MagicInfo } from './magic/MagicEngine';
import type { QualityLevel } from './engine/QualityManager';
import type { TwoHandContext } from './hand-tracking/types';

export type CameraState = 'idle' | 'loading' | 'active' | 'error';

export interface AppContextType {
  // Engine refs
  experienceRef:      MutableRefObject<Experience | null>;
  universeRef:        MutableRefObject<UniverseEngine | null>;
  worldsRef:          MutableRefObject<WorldEngine | null>;
  magicRef:           MutableRefObject<MagicEngine | null>;

  // Camera / tracking
  cameraState:        CameraState;
  cameraError:        string;
  startHandTracking:  () => void;
  previewStream:      MediaStream | null;
  handCtx:            TwoHandContext;

  // Particle experience
  stats:              ExperienceStats;
  setStats:           (s: ExperienceStats) => void;
  qualityOverride:    QualityLevel | undefined;
  setQualityOverride: (q: QualityLevel) => void;
  showDebugSkeleton:  boolean;
  setShowDebugSkeleton: (v: boolean) => void;

  // Per-mode info objects
  universeInfo:       UniverseInfo | null;
  setUniverseInfo:    (i: UniverseInfo | null) => void;
  worldInfo:          WorldInfo | null;
  setWorldInfo:       (i: WorldInfo | null) => void;
  magicInfo:          MagicInfo | null;
  setMagicInfo:       (i: MagicInfo | null) => void;

  // Webcam div for particles background
  videoDivRef:        MutableRefObject<HTMLDivElement | null>;
}

export const AppContext = createContext<AppContextType | null>(null);

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within Root');
  return ctx;
}
