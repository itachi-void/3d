import { useRef, useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { AppContext } from '../AppContext';
import type { CameraState } from '../AppContext';
import { CameraPreview } from './CameraPreview';
import { Onboarding, hasOnboarded } from './Onboarding';
import { GestureGuide } from './GestureGuide';
import { HandTracker } from '../hand-tracking/HandTracker';
import { GestureController } from '../hand-tracking/GestureController';
import { gesturesForPath } from '../hand-tracking/GestureProfiles';
import type { TwoHandContext } from '../hand-tracking/types';
import { EMPTY_TWO_HAND } from '../hand-tracking/types';
import type { Experience, ExperienceStats } from '../engine/Experience';
import type { UniverseEngine, UniverseInfo } from '../universe/UniverseEngine';
import type { WorldEngine, WorldInfo } from '../worlds/WorldEngine';
import type { MagicEngine, MagicInfo } from '../magic/MagicEngine';
import type { QualityLevel } from '../engine/QualityManager';

const INITIAL_STATS: ExperienceStats = {
  fps: 60, particleCount: 0, quality: 'high', formation: 'sphere',
  formationIndex: 0, gesture: 'none', constellationsOn: false,
  webcamOn: false, autoCameraMode: true, zoomProgress: 0,
};

export function Root() {
  // ── Engine refs ─────────────────────────────────────────────────────────────
  const experienceRef = useRef<Experience | null>(null);
  const universeRef   = useRef<UniverseEngine | null>(null);
  const worldsRef     = useRef<WorldEngine | null>(null);
  const magicRef      = useRef<MagicEngine | null>(null);

  // ── Hand tracking ────────────────────────────────────────────────────────────
  const trackerRef     = useRef<HandTracker | null>(null);
  const controllerRef  = useRef(new GestureController());
  const videoDivRef    = useRef<HTMLDivElement | null>(null);
  const pageZoomRef    = useRef(1);
  const pageZoomDivRef = useRef<HTMLDivElement | null>(null);
  const pathRef        = useRef('/');

  // ── State ────────────────────────────────────────────────────────────────────
  const [stats, setStats]                       = useState<ExperienceStats>(INITIAL_STATS);
  const [qualityOverride, setQualityOverride]   = useState<QualityLevel | undefined>(undefined);
  const [cameraState, setCameraState]           = useState<CameraState>('idle');
  const [cameraError, setCameraError]           = useState('');
  const [handCtx, setHandCtx]                   = useState<TwoHandContext>({ ...EMPTY_TWO_HAND });
  const [showDebugSkeleton, setShowDebugSkeleton] = useState(false);
  const [previewStream, setPreviewStream]       = useState<MediaStream | null>(null);
  const [universeInfo, setUniverseInfo]         = useState<UniverseInfo | null>(null);
  const [worldInfo, setWorldInfo]               = useState<WorldInfo | null>(null);
  const [magicInfo, setMagicInfo]               = useState<MagicInfo | null>(null);
  const [showOnboarding, setShowOnboarding]     = useState(() => !hasOnboarded());

  const location = useLocation();

  useEffect(() => {
    pathRef.current = location.pathname;
    pageZoomRef.current = 1;
    if (pageZoomDivRef.current) pageZoomDivRef.current.style.transform = 'scale(1)';
  }, [location.pathname]);

  useEffect(() => () => { trackerRef.current?.dispose(); }, []);

  const startHandTracking = useCallback(async () => {
    if (trackerRef.current) return;
    setCameraState('loading');

    const tracker = new HandTracker();
    trackerRef.current = tracker;

    tracker.onResults = (ctx: TwoHandContext) => {
      controllerRef.current.update(ctx);
      const p = pathRef.current;
      const { forces, triggers } = gesturesForPath(p, controllerRef.current.forces, controllerRef.current.triggers);

      universeRef.current?.applyGestures(forces, triggers);
      worldsRef.current?.applyGestures(forces, triggers);
      magicRef.current?.applyGestures(forces, triggers);

      if (forces.pinchZoom.active && (p === '/' || p === '/docs') && pageZoomDivRef.current) {
        pageZoomRef.current = Math.max(0.4, Math.min(3, pageZoomRef.current + forces.pinchZoom.delta * 0.6));
        pageZoomDivRef.current.style.transform = `scale(${pageZoomRef.current})`;
      }

      const exp = experienceRef.current;
      if (exp) {
        exp.gestureForces = forces;
        exp.gestureTriggers = triggers;
        if (triggers.fiveFingerHeld) exp.toggleWebcam();
      }

      setHandCtx(ctx);
    };

    tracker.onError = (err) => {
      setCameraState('error');
      setCameraError(err.message);
    };

    tracker.onCameraReady = () => {
      setCameraState('active');
      if (tracker.mediaStream) setPreviewStream(tracker.mediaStream);
      const div = videoDivRef.current;
      if (div) {
        const vid = tracker.videoElement;
        vid.style.cssText = 'width:100%;height:100%;object-fit:cover;transform:scaleX(-1);filter:brightness(0.3) saturate(0.5);';
        div.appendChild(vid);
      }
    };

    try {
      await tracker.init();
      await tracker.startCamera();
    } catch (e: unknown) {
      setCameraState('error');
      setCameraError((e as Error).message ?? 'Camera error');
    }
  }, []);

  const isHomeLike = location.pathname === '/' || location.pathname === '/docs';

  return (
    <AppContext.Provider value={{
      experienceRef, universeRef, worldsRef, magicRef,
      cameraState, cameraError, startHandTracking, previewStream, handCtx,
      stats, setStats, qualityOverride, setQualityOverride,
      showDebugSkeleton, setShowDebugSkeleton,
      universeInfo, setUniverseInfo,
      worldInfo, setWorldInfo,
      magicInfo, setMagicInfo,
      videoDivRef,
    }}>
      <div style={{ width: '100vw', height: '100vh', background: '#000005', overflow: 'hidden', position: 'relative' }}>

        {isHomeLike ? (
          <div
            ref={pageZoomDivRef}
            style={{ position: 'absolute', inset: 0, transformOrigin: 'center center', transform: 'scale(1)' }}
          >
            <Outlet />
          </div>
        ) : (
          <Outlet />
        )}

        <GestureGuide path={location.pathname} />

        <CameraPreview
          stream={previewStream}
          handCtx={handCtx}
          gesture={stats.gesture}
          visible={cameraState === 'active' && location.pathname !== '/magic' && location.pathname !== '/magic-lab' && location.pathname !== '/finger-threads'}
        />

        {isHomeLike && cameraState !== 'active' && (
          <button
            onClick={startHandTracking}
            disabled={cameraState === 'loading'}
            aria-label={cameraState === 'error' ? 'إعادة محاولة تشغيل الكاميرا' : 'تفعيل التحكم باليد عبر الكاميرا'}
            style={{
              position: 'absolute', bottom: '20px', right: '20px', zIndex: 200,
              padding: '10px 18px', fontSize: '12px', letterSpacing: '0.15em',
              fontFamily: "'DM Mono', monospace",
              background: cameraState === 'error' ? 'rgba(200,80,60,0.18)' : 'rgba(60,120,80,0.18)',
              border: `1px solid ${cameraState === 'error' ? 'rgba(255,120,100,0.45)' : 'rgba(80,200,120,0.45)'}`,
              borderRadius: '10px',
              color: cameraState === 'error' ? 'rgba(255,170,150,0.95)' : 'rgba(120,235,165,0.95)',
              cursor: cameraState === 'loading' ? 'wait' : 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            {cameraState === 'loading' ? '⏳ جارٍ التشغيل…'
              : cameraState === 'error' ? '⚠️ إعادة المحاولة'
              : '📷 تفعيل اليد'}
          </button>
        )}

        {cameraState === 'error' && cameraError && (
          <div
            role="alert"
            style={{
              position: 'absolute', bottom: '70px', right: '20px', zIndex: 200,
              maxWidth: '260px', padding: '10px 14px',
              fontSize: '12px', letterSpacing: '0.05em', lineHeight: 1.6, direction: 'rtl',
              fontFamily: "'DM Mono', monospace",
              background: 'rgba(40,10,10,0.85)', border: '1px solid rgba(255,100,80,0.35)',
              borderRadius: '10px', color: 'rgba(255,190,180,0.95)', backdropFilter: 'blur(8px)',
            }}
          >
            تعذّر تشغيل الكاميرا: {cameraError} — تقدر تكمّل بالماوس.
          </div>
        )}

        {showOnboarding && location.pathname === '/' && (
          <Onboarding
            cameraState={cameraState}
            cameraError={cameraError}
            onEnableCamera={startHandTracking}
            onDismiss={() => setShowOnboarding(false)}
          />
        )}
      </div>
    </AppContext.Provider>
  );
}
