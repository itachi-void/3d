import { useNavigate } from 'react-router';
import { WorldCanvas } from './WorldCanvas';
import { WorldHUD } from './WorldHUD';
import { PageLoader } from './PageLoader';
import { useAppContext } from '../AppContext';

export function WorldsPage() {
  const navigate = useNavigate();
  const { worldsRef, worldInfo, setWorldInfo, cameraState, startHandTracking } = useAppContext();

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      <WorldCanvas engineRef={worldsRef} onInfo={setWorldInfo} />

      {!worldInfo && <PageLoader accent="#f59e0b" label="جارٍ تحميل العوالم…" />}

      {worldInfo && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
          <WorldHUD
            info={worldInfo}
            engineRef={worldsRef}
            onExit={() => navigate('/')}
            cameraActive={cameraState === 'active'}
            onStartCamera={startHandTracking}
          />
        </div>
      )}
    </div>
  );
}
