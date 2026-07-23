import { useRef, useEffect } from 'react';
import type { TwoHandContext, NormalizedLandmark } from '../hand-tracking/types';
import { HAND_CONNECTIONS } from '../hand-tracking/GestureRecognizer';

interface Props {
  ctx: TwoHandContext | null;
  debug?: boolean;
  currentGesture?: string;
}

// Finger tip indices for larger dots
const FINGERTIPS = [4, 8, 12, 16, 20];

function drawHand(
  ctx2d: CanvasRenderingContext2D,
  lms: NormalizedLandmark[],
  w: number,
  h: number,
  color: string,
): void {
  if (!lms.length) return;

  // mirror x for selfie view
  const px = (lm: NormalizedLandmark) => (1 - lm.x) * w;
  const py = (lm: NormalizedLandmark) => lm.y * h;

  // Bones
  ctx2d.strokeStyle = color;
  ctx2d.lineWidth = 1.8;
  ctx2d.globalAlpha = 0.65;
  for (const [a, b] of HAND_CONNECTIONS) {
    if (!lms[a] || !lms[b]) continue;
    ctx2d.beginPath();
    ctx2d.moveTo(px(lms[a]), py(lms[a]));
    ctx2d.lineTo(px(lms[b]), py(lms[b]));
    ctx2d.stroke();
  }

  // Landmark dots
  ctx2d.globalAlpha = 0.9;
  for (let i = 0; i < lms.length; i++) {
    const isTip = FINGERTIPS.includes(i);
    ctx2d.beginPath();
    ctx2d.arc(px(lms[i]), py(lms[i]), isTip ? 5 : 3, 0, Math.PI * 2);
    ctx2d.fillStyle = isTip ? '#ffffff' : color;
    ctx2d.fill();
  }
  ctx2d.globalAlpha = 1;
}

export function HandLandmarkOverlay({ ctx, debug, currentGesture }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext('2d');
    if (!c) return;

    const w = canvas.width;
    const h = canvas.height;
    c.clearRect(0, 0, w, h);

    if (!ctx || (!ctx.left.present && !ctx.right.present)) return;

    if (debug) {
      if (ctx.left.present) drawHand(c, ctx.left.landmarks, w, h, '#46a8ff');
      if (ctx.right.present) drawHand(c, ctx.right.landmarks, w, h, '#ff6b9d');
    }

    // Gesture label — always show if gesture active
    const gesture = currentGesture && currentGesture !== 'none' ? currentGesture : '';
    if (gesture) {
      c.font = '500 14px "DM Mono", monospace';
      c.textAlign = 'center';
      c.fillStyle = 'rgba(70, 168, 255, 0.9)';
      c.fillText(gesture, w / 2, h - 20);
    }
  }, [ctx, debug, currentGesture]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    obs.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    return () => obs.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
}
