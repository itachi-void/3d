import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ParticleCanvas } from './ParticleCanvas';
import { Overlay } from './ui/Overlay';
import { HandLandmarkOverlay } from './HandLandmarkOverlay';
import { useAppContext } from '../AppContext';
import type { QualityLevel } from '../engine/QualityManager';
import type { FormationType } from '../engine/Formations';

const FORMATION_DESTINATIONS: Partial<Record<FormationType, string>> = {
  galaxy:     '/universe',
  sphere:     '/universe',
  lorenz:     '/universe',
  torus:      '/universe',
  hyperbloom: '/magic',
  dna:        '/magic',
  wave:       '/magic',
  ribbons:    '/magic',
};

const FORMATION_LABELS: Partial<Record<FormationType, string>> = {
  galaxy:     'ENTERING GALAXY',
  sphere:     'ENTERING UNIVERSE',
  lorenz:     'ENTERING ATTRACTOR',
  torus:      'ENTERING TORUS',
  hyperbloom: 'ENTERING BLOOM',
  dna:        'ENTERING HELIX',
  wave:       'ENTERING WAVE',
  ribbons:    'ENTERING RIBBONS',
};

export function ParticlesPage() {
  const navigate = useNavigate();
  const {
    experienceRef, stats, setStats,
    qualityOverride, setQualityOverride,
    cameraState, cameraError, startHandTracking,
    handCtx, showDebugSkeleton, setShowDebugSkeleton,
    videoDivRef,
  } = useAppContext();

  const webcamOn = stats.webcamOn;
  const navigatingRef = useRef(false);

  // Listen for "navigate-into" event from Experience engine
  useEffect(() => {
    const exp = experienceRef.current;
    if (!exp) return;

    const handler = (e: Event) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;
      const formation = (e as CustomEvent<{ formation: FormationType }>).detail.formation;
      const dest = FORMATION_DESTINATIONS[formation] ?? '/universe';
      setTimeout(() => navigate(dest), 400);
    };

    exp.addEventListener('navigate-into', handler);
    return () => exp.removeEventListener('navigate-into', handler);
  }, [experienceRef, navigate]);

  // Reset navigating flag when component mounts
  useEffect(() => {
    navigatingRef.current = false;
    experienceRef.current?.resetScene();
  }, [experienceRef]);

  const handleFormationSelect = useCallback((index: number) => {
    experienceRef.current?.setFormationByIndex(index);
  }, [experienceRef]);

  const handleQualityChange = useCallback((q: QualityLevel) => {
    setQualityOverride(q);
  }, [setQualityOverride]);

  const zp = stats.zoomProgress ?? 0;
  const showZoomRing = zp > 0.05;
  const formation = stats.formation as FormationType;
  const enterLabel = FORMATION_LABELS[formation] ?? 'ENTERING';

  // SVG circle ring params
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = circ * zp;

  return (
    <>
      {/* Webcam background */}
      <div ref={videoDivRef} style={{
        position: 'absolute', inset: 0,
        opacity: (cameraState === 'active' && webcamOn) ? 1 : 0,
        transition: 'opacity 0.5s ease', zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
      }} />

      {/* 3D particle canvas */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <ParticleCanvas
          key={qualityOverride ?? 'auto'}
          onStats={setStats}
          experienceRef={experienceRef}
          qualityOverride={qualityOverride}
        />
      </div>

      {/* Particle UI */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 20 }}>
        <Overlay
          stats={stats}
          onFormationSelect={handleFormationSelect}
          onQualityChange={handleQualityChange}
          cameraState={cameraState}
          cameraError={cameraError}
          onStartCamera={startHandTracking}
          showDebugSkeleton={showDebugSkeleton}
          onToggleDebug={() => setShowDebugSkeleton(!showDebugSkeleton)}
        />
      </div>

      {/* Hand skeleton overlay */}
      {cameraState === 'active' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none' }}>
          <HandLandmarkOverlay ctx={handCtx} debug={showDebugSkeleton} currentGesture={stats.gesture} />
        </div>
      )}

      {/* Zoom progress ring */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 25,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
        opacity: showZoomRing ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>
        <div style={{ position: 'relative', width: 130, height: 130 }}>
          <svg width="130" height="130" style={{ position: 'absolute', inset: 0 }}>
            <circle
              cx="65" cy="65" r={r}
              fill="none"
              stroke="rgba(80,140,255,0.15)"
              strokeWidth="3"
            />
            <circle
              cx="65" cy="65" r={r}
              fill="none"
              stroke={zp >= 1 ? 'rgba(255,120,60,0.95)' : 'rgba(80,180,255,0.85)'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={circ * 0.25}
              style={{ transition: 'stroke-dasharray 0.05s linear, stroke 0.3s ease' }}
            />
          </svg>

          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 2,
          }}>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '9px',
              letterSpacing: '0.12em',
              color: zp >= 1 ? 'rgba(255,140,80,0.95)' : 'rgba(140,200,255,0.85)',
              textAlign: 'center',
              lineHeight: 1.3,
              transition: 'color 0.3s ease',
            }}>
              {zp >= 1 ? 'WARP!' : enterLabel}
            </span>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '11px',
              fontWeight: 600,
              color: zp >= 1 ? 'rgba(255,160,60,1)' : 'rgba(100,180,255,0.9)',
              transition: 'color 0.3s ease',
            }}>
              {Math.round(zp * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Two-hand hint */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 30, pointerEvents: 'none',
        opacity: cameraState === 'active' && !showZoomRing ? 0.55 : 0,
        transition: 'opacity 0.6s ease',
        fontFamily: "'DM Mono', monospace",
        fontSize: '10px', letterSpacing: '0.14em',
        color: 'rgba(140,200,255,0.7)',
        textAlign: 'center',
      }}>
        ↔ SPREAD HANDS TO ZOOM · ENTER FORMATION
      </div>

      {/* Back to home */}
      <button
        onClick={() => navigate('/')}
        aria-label="العودة للصفحة الرئيسية"
        style={{
          position: 'absolute', bottom: '100px', left: '24px',
          zIndex: 30, padding: '8px 16px', fontSize: '12px', letterSpacing: '0.15em',
          fontFamily: "'DM Mono', monospace",
          background: 'rgba(80,140,255,0.12)', border: '1px solid rgba(80,140,255,0.35)',
          borderRadius: '9px', color: 'rgba(160,200,255,0.9)', cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
      >
        ← HOME
      </button>
    </>
  );
}
