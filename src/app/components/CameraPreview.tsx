import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { TwoHandContext, NormalizedLandmark } from '../hand-tracking/types';
import { HAND_CONNECTIONS } from '../hand-tracking/GestureRecognizer';

interface Props {
  stream: MediaStream | null;
  handCtx: TwoHandContext;
  gesture: string;
  visible: boolean;
}

// Gesture → color for hand bones
const HAND_COLOR: Record<string, string> = {
  fist:          '#ff4466',
  open_palm:     '#46d9ff',
  five_fingers:  '#46d9ff',
  pinch:         '#ffcc00',
  pointing:      '#ff9944',
  thumbs_up:     '#44ff88',
  thumbs_down:   '#ff4488',
  peace:         '#aa88ff',
  three_fingers: '#ff88aa',
  four_fingers:  '#88ffcc',
  none:          'rgba(100,160,255,0.7)',
};

function getHandColor(ctx: TwoHandContext): string {
  const g = ctx.left.present
    ? ctx.left.gesture
    : ctx.right.present
    ? ctx.right.gesture
    : 'none';
  return HAND_COLOR[g] ?? HAND_COLOR.none;
}

function drawSkeleton(
  c: CanvasRenderingContext2D,
  lms: NormalizedLandmark[],
  w: number,
  h: number,
  color: string,
): void {
  if (!lms.length) return;
  // image space: x=0 is left of camera image, mirrored display → flip x
  const px = (lm: NormalizedLandmark) => (1 - lm.x) * w;
  const py = (lm: NormalizedLandmark) => lm.y * h;

  // Glow effect
  c.shadowColor = color;
  c.shadowBlur = 8;
  c.strokeStyle = color;
  c.lineWidth = 1.5;
  c.globalAlpha = 0.8;
  for (const [a, b] of HAND_CONNECTIONS) {
    if (!lms[a] || !lms[b]) continue;
    c.beginPath();
    c.moveTo(px(lms[a]), py(lms[a]));
    c.lineTo(px(lms[b]), py(lms[b]));
    c.stroke();
  }

  // Dots
  c.shadowBlur = 12;
  for (let i = 0; i < lms.length; i++) {
    const tip = [4, 8, 12, 16, 20].includes(i);
    c.beginPath();
    c.arc(px(lms[i]), py(lms[i]), tip ? 4 : 2.5, 0, Math.PI * 2);
    c.fillStyle = tip ? '#fff' : color;
    c.fill();
  }

  c.shadowBlur = 0;
  c.globalAlpha = 1;
}

const GESTURE_AR: Record<string, string> = {
  'BLACK HOLE':    '🌀 ثقب أسود',
  'MAGNETIC':      '🧲 جذب مغناطيسي',
  'CHARGING':      '⚡ شحن…',
  'EXPLOSION!':    '💥 انفجار!',
  'SUPERNOVA!':    '✨ سوبرنوفا!',
  'BIG BANG!':     '🌌 الانفجار الكبير!',
  'NEXT':          '👍 التالي',
  'RESET':         '👎 إعادة',
  'COLOR':         '🎨 لون جديد',
  'CONSTELLATION': '⭐ نجوم',
  'WEBCAM':        '📷 كاميرا',
  'SCALING':       '⬌ تكبير/تصغير',
  'ROTATING':      '🔄 تدوير',
  'COMPRESSING':   '◎ ضغط',
  'RANDOM':        '🔀 عشوائي',
  'AUTO CAM':      '🎥 كاميرا أوتو',
  'HAND CAM':      '✋ كاميرا يد',
};

export function CameraPreview({ stream, handCtx, gesture, visible }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [minimized, setMinimized] = useState(
    typeof window !== 'undefined' && window.innerWidth < 640,
  );
  const handsPresent = handCtx.left.present || handCtx.right.present;
  const handColor = getHandColor(handCtx);

  // Attach stream to video
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !stream) return;
    vid.srcObject = stream;
    vid.play().catch(() => {});
    return () => { vid.srcObject = null; };
  }, [stream]);

  // Draw skeleton on canvas overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || minimized) return;
    const c = canvas.getContext('2d');
    if (!c) return;
    c.clearRect(0, 0, canvas.width, canvas.height);

    if (handCtx.left.present)  drawSkeleton(c, handCtx.left.landmarks,  canvas.width, canvas.height, '#46a8ff');
    if (handCtx.right.present) drawSkeleton(c, handCtx.right.landmarks, canvas.width, canvas.height, '#ff6b9d');
  }, [handCtx, minimized]);

  const activeGesture = gesture && gesture !== 'none' ? gesture : '';
  const gestureLabel = activeGesture
    ? (Object.entries(GESTURE_AR).find(([k]) => activeGesture.startsWith(k))?.[1] ?? activeGesture)
    : '';

  if (!visible || !stream) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      aria-label="معاينة الكاميرا وتتبع اليد"
      style={{
        position: 'absolute',
        bottom: '100px',
        right: '24px',
        zIndex: 30,
        borderRadius: '14px',
        overflow: 'hidden',
        border: `1px solid ${handsPresent ? handColor : 'rgba(80,120,255,0.25)'}`,
        boxShadow: handsPresent
          ? `0 0 20px ${handColor}44, 0 8px 32px rgba(0,0,0,0.6)`
          : '0 8px 32px rgba(0,0,0,0.5)',
        transition: 'border-color 0.3s, box-shadow 0.3s',
        background: '#000',
        fontFamily: "'DM Mono', monospace",
        width: minimized ? '120px' : '240px',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        background: 'rgba(2,4,16,0.9)',
        borderBottom: '1px solid rgba(80,120,255,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Live dot */}
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: handsPresent ? handColor : '#06d6a0',
            boxShadow: `0 0 6px ${handsPresent ? handColor : '#06d6a0'}`,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <span style={{ fontSize: '8px', letterSpacing: '0.25em', color: 'rgba(160,200,255,0.6)' }}>
            {handsPresent ? (handCtx.left.present && handCtx.right.present ? 'إيدين' : 'إيد') : 'LIVE'}
          </span>
        </div>
        <button
          onClick={() => setMinimized((v) => !v)}
          aria-label={minimized ? 'توسيع معاينة الكاميرا' : 'تصغير معاينة الكاميرا'}
          aria-expanded={!minimized}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(170,195,255,0.8)', fontSize: '14px', lineHeight: 1,
            padding: '2px 6px',
          }}
        >
          {minimized ? '▲' : '▼'}
        </button>
      </div>

      {/* Video + skeleton */}
      <AnimatePresence>
        {!minimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                display: 'block',
                width: '100%',
                aspectRatio: '4/3',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                filter: 'brightness(0.85) saturate(0.8)',
              }}
            />
            {/* Skeleton overlay canvas */}
            <canvas
              ref={canvasRef}
              width={240}
              height={180}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            />
            {/* Gesture label */}
            <AnimatePresence>
              {gestureLabel && (
                <motion.div
                  key={gestureLabel}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    padding: '6px 8px',
                    background: 'linear-gradient(to top, rgba(0,0,16,0.9) 0%, transparent 100%)',
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    color: handColor,
                    textAlign: 'center',
                    textShadow: `0 0 12px ${handColor}`,
                  }}
                >
                  {gestureLabel}
                </motion.div>
              )}
            </AnimatePresence>

            {/* No-hands hint */}
            {!handsPresent && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <span style={{ fontSize: '12px', letterSpacing: '0.15em', color: 'rgba(175,200,255,0.6)' }}>
                  ارفع إيدك ✋
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </motion.div>
  );
}
