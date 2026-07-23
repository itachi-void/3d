import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ParticleCanvas } from './ParticleCanvas';
import { Overlay } from './ui/Overlay';
import { HandLandmarkOverlay } from './HandLandmarkOverlay';
import { useAppContext } from '../AppContext';
import type { QualityLevel } from '../engine/QualityManager';

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

  const handleFormationSelect = useCallback((index: number) => {
    experienceRef.current?.setFormationByIndex(index);
  }, [experienceRef]);

  const handleQualityChange = useCallback((q: QualityLevel) => {
    setQualityOverride(q);
  }, [setQualityOverride]);

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
