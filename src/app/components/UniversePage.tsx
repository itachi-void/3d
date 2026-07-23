import { useNavigate } from 'react-router';
import { UniverseCanvas } from './UniverseCanvas';
import { CosmicHUD } from './CosmicHUD';
import { PageLoader } from './PageLoader';
import { useAppContext } from '../AppContext';

export function UniversePage() {
  const navigate = useNavigate();
  const { universeRef, universeInfo, setUniverseInfo, cameraState, startHandTracking } = useAppContext();

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      <UniverseCanvas engineRef={universeRef} onInfo={setUniverseInfo} />

      {!universeInfo && <PageLoader accent="#a78bfa" label="جارٍ تحميل الكون…" />}

      {universeInfo && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
          <CosmicHUD info={universeInfo} engineRef={universeRef} onExit={() => navigate('/')} />
        </div>
      )}

      {/* Camera button */}
      {cameraState !== 'active' && (
        <button
          onClick={startHandTracking}
          disabled={cameraState === 'loading'}
          aria-label="تفعيل الكاميرا للتحكم باليد"
          style={{
            position: 'absolute', bottom: '60px', right: '20px', zIndex: 10,
            padding: '9px 16px', fontSize: '12px', letterSpacing: '0.15em',
            fontFamily: "'DM Mono', monospace",
            background: 'rgba(80,40,180,0.25)', border: '1px solid rgba(160,100,255,0.45)',
            borderRadius: '9px', color: 'rgba(210,175,255,0.95)',
            cursor: cameraState === 'loading' ? 'wait' : 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          {cameraState === 'loading' ? '⏳ جارٍ التشغيل…' : '📷 تفعيل اليد'}
        </button>
      )}

      {/* Back */}
      <button
        onClick={() => navigate('/')}
        aria-label="العودة للصفحة الرئيسية"
        style={{
          position: 'absolute', bottom: '20px', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10, padding: '8px 18px', fontSize: '12px', letterSpacing: '0.15em',
          fontFamily: "'DM Mono', monospace",
          background: 'rgba(255,200,80,0.1)', border: '1px solid rgba(255,200,80,0.35)',
          borderRadius: '9px', color: 'rgba(255,225,120,0.9)', cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
      >
        ← HOME
      </button>
    </div>
  );
}
