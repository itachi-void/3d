import { useEffect, useRef, useCallback } from 'react';
import { UniverseEngine, type UniverseInfo } from '../universe/UniverseEngine';

interface Props {
  onInfo: (info: UniverseInfo) => void;
  engineRef: React.MutableRefObject<UniverseEngine | null>;
}

export function UniverseCanvas({ onInfo, engineRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onInfoRef = useRef(onInfo);
  onInfoRef.current = onInfo;

  // Touch pinch state
  const lastPinchRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new UniverseEngine(canvas);
    engineRef.current = engine;

    engine.onInfo((info) => onInfoRef.current(info));

    const handleResize = () => engine.onResize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
      engineRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    engineRef.current?.onMouseDown(e.clientX, e.clientY);
  }, [engineRef]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    engineRef.current?.onMouseMove(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
  }, [engineRef]);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    engineRef.current?.onMouseUp(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
  }, [engineRef]);

  const onMouseLeave = useCallback(() => {
    engineRef.current?.onMouseUp(0, 0, 1, 1);
  }, [engineRef]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    engineRef.current?.onWheel(e.deltaY);
  }, [engineRef]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchRef.current = Math.hypot(dx, dy);
    } else if (e.touches.length === 1) {
      engineRef.current?.onMouseDown(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [engineRef]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      engineRef.current?.onTouchPinch(dist / lastPinchRef.current);
      lastPinchRef.current = dist;
    } else if (e.touches.length === 1) {
      engineRef.current?.onMouseMove(e.touches[0].clientX, e.touches[0].clientY, window.innerWidth, window.innerHeight);
    }
  }, [engineRef]);

  const onTouchEnd = useCallback(() => {
    lastPinchRef.current = null;
    engineRef.current?.onMouseUp(0, 0, 1, 1);
  }, [engineRef]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
    />
  );
}
