import { useEffect, useRef } from 'react';
import { WorldEngine, type WorldInfo } from '../worlds/WorldEngine';

interface Props {
  engineRef: React.MutableRefObject<WorldEngine | null>;
  onInfo: (info: WorldInfo) => void;
}

export function WorldCanvas({ engineRef, onInfo }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onInfoRef = useRef(onInfo);
  onInfoRef.current = onInfo;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new WorldEngine(canvas);
    engineRef.current = engine;
    engine.onInfo(info => onInfoRef.current(info));

    const onResize = () => engine.onResize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      engine.dispose();
      engineRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        cursor: 'grab',
        touchAction: 'none',
      }}
    />
  );
}
