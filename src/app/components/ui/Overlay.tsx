import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FORMATION_META, FORMATION_ORDER, FormationType } from '../../engine/Formations';
import type { ExperienceStats } from '../../engine/Experience';
import type { QualityLevel } from '../../engine/QualityManager';

type CameraState = 'idle' | 'loading' | 'active' | 'error';

interface OverlayProps {
  stats: ExperienceStats;
  onFormationSelect: (index: number) => void;
  onQualityChange: (q: QualityLevel) => void;
  cameraState: CameraState;
  cameraError?: string;
  onStartCamera: () => void;
  showDebugSkeleton: boolean;
  onToggleDebug: () => void;
}

const QUALITY_LEVELS: QualityLevel[] = ['low', 'medium', 'high', 'ultra'];

// Gesture emoji map
const GESTURE_ICON: Record<string, string> = {
  'BLACK HOLE': '🌀',
  'MAGNETIC': '🧲',
  'EXPLOSION!': '💥',
  'SUPERNOVA!': '✨',
  'BIG BANG!': '🌌',
  'NEXT': '👍',
  'RESET': '👎',
  'COLOR': '🎨',
  'CONSTELLATION': '⭐',
  'WEBCAM': '📷',
  'SCALING': '⬌',
  'ROTATING': '🔄',
  'COMPRESSING': '◎',
  'RANDOM': '🔀',
  'AUTO CAM': '🎥',
  'HAND CAM': '✋',
};

// Gesture guide lines for help tooltip
const GESTURE_GUIDE = [
  ['✋ Open palm', 'Repel / steer camera'],
  ['✊ Fist', 'Black hole swirl'],
  ['🤌 Pinch + hold', 'Charge → explode'],
  ['☝️ Point', 'Attract particles'],
  ['👍 Thumbs up', 'Next formation'],
  ['👎 Thumbs down', 'Reset'],
  ['✌️ Peace', 'Toggle auto camera'],
  ['3 fingers', 'Cycle colors'],
  ['4 fingers', 'Toggle constellations'],
  ['5 fingers (hold)', 'Toggle webcam'],
  ['↔ Two hands', 'Scale / rotate'],
  ['🤜🤛 Both pinch', 'Compress → big bang'],
  ['🙌 Hands above', 'SUPERNOVA'],
  ['🤞 Crossed hands', 'Random formation'],
];

export function Overlay({
  stats, onFormationSelect, onQualityChange,
  cameraState, cameraError, onStartCamera,
  showDebugSkeleton, onToggleDebug,
}: OverlayProps) {
  const [showQuality, setShowQuality] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const meta = FORMATION_META[stats.formation];
  const qualityColor: Record<QualityLevel, string> = {
    low: '#ff6b35', medium: '#ffd166', high: '#06d6a0', ultra: '#4ecdc4',
  };
  const isActive = cameraState === 'active';
  const activeGesture = stats.gesture && stats.gesture !== 'none' ? stats.gesture : '';

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none"
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      {/* ─── Top-left: Brand ─── */}
      <motion.div
        className="absolute top-8 left-8 pointer-events-none"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      >
        <div style={{ fontSize: '11px', letterSpacing: '0.35em', color: 'rgba(160,185,255,0.45)', marginBottom: '4px' }}>
          INTERACTIVE FIELD
        </div>
        <div style={{ fontSize: '32px', letterSpacing: '0.18em', fontWeight: 300, color: 'rgba(200,220,255,0.92)', lineHeight: 1, textShadow: '0 0 40px rgba(80,140,255,0.6)' }}>
          AETHER
        </div>

        {/* Camera status indicator */}
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: isActive ? '#06d6a0' : cameraState === 'loading' ? '#ffd166' : cameraState === 'error' ? '#ff6b35' : 'rgba(255,255,255,0.2)',
            boxShadow: isActive ? '0 0 8px #06d6a0' : 'none',
            transition: 'all 0.4s',
          }} />
          <span style={{ fontSize: '9px', letterSpacing: '0.25em', color: 'rgba(150,180,255,0.4)' }}>
            {isActive ? 'HAND TRACKING' : cameraState === 'loading' ? 'LOADING…' : cameraState === 'error' ? 'CAM ERROR' : 'NO CAMERA'}
          </span>
        </div>
      </motion.div>

      {/* ─── Top-right: Formation name ─── */}
      <div className="absolute top-8 right-8 text-right pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={stats.formation}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ fontSize: '11px', letterSpacing: '0.3em', color: 'rgba(150,180,255,0.4)', marginBottom: '4px' }}>
              FORMATION
            </div>
            <div style={{ fontSize: '22px', letterSpacing: '0.2em', fontWeight: 300, color: 'rgba(180,210,255,0.85)', textShadow: '0 0 25px rgba(80,140,255,0.5)' }}>
              {meta.label}
            </div>
            <div style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(120,155,220,0.45)', marginTop: '4px' }}>
              {meta.description}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Center: Active gesture HUD ─── */}
      <AnimatePresence>
        {isActive && activeGesture && (
          <motion.div
            key={activeGesture}
            className="absolute top-1/2 left-1/2"
            style={{ transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>
              {GESTURE_ICON[activeGesture] ?? '✦'}
            </div>
            <div style={{
              fontSize: '13px',
              letterSpacing: '0.35em',
              color: 'rgba(150,210,255,0.9)',
              textShadow: '0 0 20px rgba(80,160,255,0.8)',
            }}>
              {activeGesture}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Center: Intro hint when no camera ─── */}
      <AnimatePresence>
        {!isActive && cameraState === 'idle' && (
          <motion.div
            className="absolute top-1/2 left-1/2"
            style={{ transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, delay: 2 }}
          >
            <div style={{ fontSize: '9px', letterSpacing: '0.3em', color: 'rgba(150,180,255,0.35)', lineHeight: 2 }}>
              OPEN YOUR CAMERA<br />TO CONTROL WITH HANDS
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Bottom bar ─── */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 pointer-events-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
      >
        <div style={{
          margin: '0 24px 24px',
          padding: '14px 20px',
          background: 'rgba(2,2,12,0.72)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(80,120,255,0.14)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          {/* Formation buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {FORMATION_ORDER.map((f: FormationType, idx: number) => {
              const active = f === stats.formation;
              return (
                <button
                  key={f}
                  onClick={() => onFormationSelect(idx)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '9px',
                    letterSpacing: '0.2em',
                    fontFamily: "'DM Mono', monospace",
                    background: active ? 'rgba(70,130,255,0.22)' : 'rgba(255,255,255,0.04)',
                    border: active ? '1px solid rgba(100,165,255,0.55)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '5px',
                    color: active ? 'rgba(180,215,255,0.95)' : 'rgba(140,165,210,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    textShadow: active ? '0 0 12px rgba(100,165,255,0.6)' : 'none',
                    boxShadow: active ? '0 0 14px rgba(70,130,255,0.2)' : 'none',
                  }}
                >
                  {FORMATION_META[f].label}
                </button>
              );
            })}
          </div>

          {/* Right side controls */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexShrink: 0 }}>
            {/* Stats */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '8px', letterSpacing: '0.25em', color: 'rgba(130,160,220,0.4)' }}>PARTICLES</div>
              <div style={{ fontSize: '13px', color: 'rgba(160,195,255,0.7)', letterSpacing: '0.1em' }}>
                {stats.particleCount.toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '8px', letterSpacing: '0.25em', color: 'rgba(130,160,220,0.4)' }}>FPS</div>
              <div style={{ fontSize: '13px', letterSpacing: '0.1em', color: stats.fps >= 55 ? 'rgba(100,220,160,0.8)' : stats.fps >= 30 ? 'rgba(255,200,80,0.8)' : 'rgba(255,100,80,0.8)' }}>
                {stats.fps}
              </div>
            </div>

            {/* Camera button */}
            <button
              onClick={cameraState === 'idle' || cameraState === 'error' ? onStartCamera : undefined}
              style={{
                padding: '5px 14px',
                fontSize: '9px',
                letterSpacing: '0.2em',
                fontFamily: "'DM Mono', monospace",
                background: isActive ? 'rgba(6,214,160,0.12)' : cameraState === 'loading' ? 'rgba(255,209,102,0.1)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isActive ? 'rgba(6,214,160,0.4)' : cameraState === 'loading' ? 'rgba(255,209,102,0.3)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: '5px',
                color: isActive ? 'rgba(6,214,160,0.9)' : cameraState === 'loading' ? 'rgba(255,209,102,0.8)' : 'rgba(180,200,255,0.6)',
                cursor: cameraState === 'idle' || cameraState === 'error' ? 'pointer' : 'default',
                transition: 'all 0.25s',
              }}
            >
              {isActive ? '📷 ON' : cameraState === 'loading' ? '⏳ …' : '📷 HANDS'}
            </button>

            {/* Debug skeleton toggle (only when active) */}
            {isActive && (
              <button
                onClick={onToggleDebug}
                style={{
                  padding: '5px 10px',
                  fontSize: '9px',
                  letterSpacing: '0.2em',
                  fontFamily: "'DM Mono', monospace",
                  background: showDebugSkeleton ? 'rgba(70,130,255,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${showDebugSkeleton ? 'rgba(100,165,255,0.45)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '5px',
                  color: showDebugSkeleton ? 'rgba(180,215,255,0.9)' : 'rgba(140,165,210,0.45)',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                }}
              >
                SKELETON
              </button>
            )}

            {/* Gesture guide toggle */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowGuide((v) => !v)}
                style={{
                  padding: '5px 10px',
                  fontSize: '9px',
                  letterSpacing: '0.2em',
                  fontFamily: "'DM Mono', monospace",
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '5px',
                  color: 'rgba(140,165,210,0.5)',
                  cursor: 'pointer',
                }}
              >
                GESTURES?
              </button>
              <AnimatePresence>
                {showGuide && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute',
                      bottom: '110%',
                      right: 0,
                      width: '260px',
                      background: 'rgba(2,2,14,0.95)',
                      border: '1px solid rgba(80,120,255,0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      backdropFilter: 'blur(12px)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                    }}
                  >
                    <div style={{ fontSize: '9px', letterSpacing: '0.3em', color: 'rgba(150,180,255,0.5)', marginBottom: '4px' }}>GESTURE GUIDE</div>
                    {GESTURE_GUIDE.map(([g, desc]) => (
                      <div key={g} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ fontSize: '9px', color: 'rgba(180,210,255,0.75)', letterSpacing: '0.05em' }}>{g}</span>
                        <span style={{ fontSize: '9px', color: 'rgba(120,150,200,0.5)', textAlign: 'right' }}>{desc}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quality selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowQuality((v) => !v)}
                style={{
                  padding: '5px 12px',
                  fontSize: '9px',
                  letterSpacing: '0.2em',
                  fontFamily: "'DM Mono', monospace",
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '5px',
                  color: qualityColor[stats.quality],
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {stats.quality.toUpperCase()}
              </button>
              <AnimatePresence>
                {showQuality && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute',
                      bottom: '110%',
                      right: 0,
                      background: 'rgba(2,2,14,0.92)',
                      border: '1px solid rgba(80,120,255,0.2)',
                      borderRadius: '7px',
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    {QUALITY_LEVELS.map((q) => (
                      <button
                        key={q}
                        onClick={() => { onQualityChange(q); setShowQuality(false); }}
                        style={{
                          padding: '5px 14px',
                          fontSize: '9px',
                          letterSpacing: '0.2em',
                          fontFamily: "'DM Mono', monospace",
                          background: q === stats.quality ? 'rgba(70,130,255,0.18)' : 'transparent',
                          border: '1px solid transparent',
                          borderRadius: '4px',
                          color: qualityColor[q],
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {q.toUpperCase()}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {cameraState === 'error' && cameraError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign: 'center',
                fontSize: '9px',
                letterSpacing: '0.2em',
                color: 'rgba(255,100,80,0.7)',
                paddingBottom: '8px',
              }}
            >
              {cameraError}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Left edge: formation progress bars ─── */}
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: '2px', display: 'flex', flexDirection: 'column', gap: '4px', padding: '80px 0' }}
      >
        {FORMATION_ORDER.map((f: FormationType) => (
          <div
            key={f}
            style={{
              flex: 1,
              background: f === stats.formation ? 'rgba(100,160,255,0.65)' : 'rgba(255,255,255,0.07)',
              transition: 'background 0.5s ease',
              borderRadius: '1px',
            }}
          />
        ))}
      </div>

      {/* ─── Auto-camera badge ─── */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '8px',
              letterSpacing: '0.3em',
              color: stats.autoCameraMode ? 'rgba(100,220,160,0.8)' : 'rgba(180,180,255,0.8)',
              pointerEvents: 'none',
            }}
          >
            {stats.autoCameraMode ? '✦ AUTO ORBIT' : '✋ HAND CAM'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
