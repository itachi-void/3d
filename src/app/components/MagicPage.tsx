import { useNavigate } from 'react-router';
import { MagicStudio } from './MagicStudio';
import { MagicHUD } from './MagicHUD';
import { PageLoader } from './PageLoader';
import { useAppContext } from '../AppContext';

export function MagicPage() {
  const navigate = useNavigate();
  const { magicRef, magicInfo, setMagicInfo, previewStream, cameraState, startHandTracking, handCtx } = useAppContext();

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      <MagicStudio
        engineRef={magicRef}
        onInfo={(info) => setMagicInfo(info)}
        cameraStream={previewStream}
        onFormation={() => {}}
        onPalette={() => {}}
      />
      {!magicInfo && <PageLoader accent="#e879f9" label="جارٍ تحميل الاستوديو…" />}
      <MagicHUD
        info={magicInfo}
        engineRef={magicRef}
        cameraActive={cameraState === 'active'}
        handCtx={handCtx}
        onStartCamera={startHandTracking}
        onExit={() => navigate('/')}
      />
    </div>
  );
}
