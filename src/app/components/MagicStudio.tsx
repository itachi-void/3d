import { useEffect, useRef } from 'react';
import { MagicEngine, type MagicInfo } from '../magic/MagicEngine';
import type { GestureForces, GestureTriggers } from '../hand-tracking/types';
import type { FormationId } from '../magic/formations';

interface Props {
  engineRef:   React.MutableRefObject<MagicEngine | null>;
  onInfo:      (info: MagicInfo) => void;
  cameraStream: MediaStream | null;
  onFormation: (id: FormationId) => void;
  onPalette:   (idx: number) => void;
  initialFormation?: FormationId;
  initialPalette?: number;
}

export function MagicStudio({ engineRef, onInfo, cameraStream, onFormation, onPalette, initialFormation, initialPalette }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef  = useRef<HTMLVideoElement | null>(null);
  const onInfoRef = useRef(onInfo);
  onInfoRef.current = onInfo;

  // Build engine once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new MagicEngine(canvas);
    engine.onInfo = info => onInfoRef.current(info);
    engineRef.current = engine;
    if (initialFormation) engine.setFormation(initialFormation);
    if (typeof initialPalette === 'number') engine.setPalette(initialPalette);

    const onResize = () => engine.onResize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Feed webcam stream into engine as video texture
  useEffect(() => {
    if (!cameraStream) return;
    const engine = engineRef.current;
    if (!engine) return;

    const video = document.createElement('video');
    video.srcObject = cameraStream;
    video.autoplay  = true;
    video.muted     = true;
    video.playsInline = true;
    video.style.cssText = 'display:none';
    document.body.appendChild(video);
    videoRef.current = video;

    video.play().then(() => {
      engine.setVideoElement(video);
    }).catch(() => {
      // Camera denied or not available — background stays dark
    });

    return () => {
      video.pause();
      video.srcObject = null;
      video.remove();
      videoRef.current = null;
    };
  }, [cameraStream]);

  // Mouse / touch interaction (works even without the camera)
  const dragRef = useRef(false);
  const movedRef = useRef(false);

  const norm = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { nx: (e.clientX - r.left) / r.width, ny: (e.clientY - r.top) / r.height };
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = true;
        movedRef.current = false;
        const { nx, ny } = norm(e);
        engineRef.current?.pointerDown(nx, ny);
      }}
      onPointerMove={(e) => {
        const { nx, ny } = norm(e);
        if (dragRef.current) movedRef.current = true;
        engineRef.current?.pointerMove(nx, ny, dragRef.current);
      }}
      onPointerUp={(e) => {
        dragRef.current = false;
        engineRef.current?.pointerUp();
        // A tap without dragging = burst
        if (!movedRef.current) engineRef.current?.clickBurst();
      }}
      onPointerLeave={() => { dragRef.current = false; engineRef.current?.pointerUp(); }}
      onWheel={(e) => {
        engineRef.current?.wheelZoom(e.deltaY < 0 ? 1 : -1);
      }}
      style={{
        display:      'block',
        width:        '100%',
        height:       '100%',
        touchAction:  'none',
        cursor:       'crosshair',
      }}
    />
  );
}

// Stable forwarder so App.tsx can route gestures here
export type MagicEngineRef = React.MutableRefObject<MagicEngine | null>;
export function forwardMagicGestures(
  ref:      MagicEngineRef,
  forces:   GestureForces,
  triggers: GestureTriggers,
) {
  ref.current?.applyGestures(forces, triggers);
}
