import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Eye, Navigation, Zap } from 'lucide-react';
import { BuildingEngine, type BuildingInfo } from '../building/BuildingEngine';
import { useAppContext } from '../AppContext';

const GESTURE_ICONS: Record<string, string> = {
  walk: '🖐',
  steer: '☝',
  sprint: '🤏',
  stop: '✊',
  up: '👍',
  down: '👎',
  idle: '—',
};

export function BuildingPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BuildingEngine | null>(null);
  const [info, setInfo] = useState<BuildingInfo>({
    loadState: 'loading', progress: 0, speed: 0, gesture: 'idle', birdEye: false,
  });
  const { handCtx, cameraState, startHandTracking } = useAppContext();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new BuildingEngine(canvas);
    engineRef.current = engine;
    engine.onInfo = setInfo;
    const onResize = () => engine.onResize(canvas.clientWidth, canvas.clientHeight);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.applyHandContext(handCtx);
  }, [handCtx]);

  const isLoading = info.loadState === 'loading';
  const pct = Math.round(info.progress * 100);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#09050f]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* ── Loading screen ── */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-[#09050f]/96 backdrop-blur-sm">
          {/* Animated ring */}
          <svg width="72" height="72" viewBox="0 0 72 72" className="opacity-70">
            <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(251,146,60,0.15)" strokeWidth="2" />
            <circle
              cx="36" cy="36" r="28" fill="none"
              stroke="rgba(251,146,60,0.65)" strokeWidth="2" strokeLinecap="round"
              strokeDasharray={`${175.9 * pct / 100} 175.9`}
              strokeDashoffset={175.9 * 0.25}
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
            <text x="36" y="40" textAnchor="middle" fill="rgba(251,146,60,0.7)"
              fontSize="11" fontFamily="'DM Mono', monospace" letterSpacing="1">
              {pct}%
            </text>
          </svg>

          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-200/55">
              Sponza Palace
            </p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.18em] text-white/22">
              Khronos GLTF Sample • PBR Materials • Real Architecture
            </p>
          </div>

          {/* Thin progress bar */}
          <div className="relative h-px w-56 overflow-hidden bg-white/8">
            <div
              className="absolute inset-y-0 left-0 bg-amber-200/55 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── HUD ── */}
      {!isLoading && (
        <>
          {/* Speed / gesture bar */}
          <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2 flex items-center gap-4 border border-white/8 bg-black/22 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/38 backdrop-blur-sm">
            <span
              className={`flex items-center gap-1.5 transition-colors duration-200 ${
                info.gesture === 'sprint' ? 'text-cyan-300/85' :
                info.gesture !== 'idle'   ? 'text-amber-200/75' : ''
              }`}
            >
              {info.gesture === 'sprint' ? <Zap size={9} /> :
               info.gesture !== 'idle'   ? <Navigation size={9} /> :
               <Eye size={9} />}
              {GESTURE_ICONS[info.gesture] ?? ''} {info.gesture}
            </span>
            <i className="h-3 w-px bg-white/14" />
            <span className="tabular-nums">{info.speed.toFixed(1)} m/s</span>
            {info.birdEye && (
              <>
                <i className="h-3 w-px bg-white/14" />
                <span className="text-violet-300/70">bird view</span>
              </>
            )}
          </div>

          {/* Gesture guide — bottom right */}
          <div className="pointer-events-none absolute bottom-5 right-5 z-10 border-r border-white/10 pr-4 font-mono text-[8px] leading-[1.95] tracking-[0.1em] text-white/25 text-right">
            <div className="text-amber-200/40 mb-1">ايماءات التنقل</div>
            <div>🖐 كف → تقدم للأمام</div>
            <div>☝ إصبع → توجيه الكاميرا</div>
            <div>🤏 قرص → سرعة مضاعفة</div>
            <div>✊ قبضة → توقف</div>
            <div>✌ سلام → عرض علوي</div>
          </div>

          {/* Fallback notice */}
          {info.loadState === 'fallback' && (
            <div className="pointer-events-none absolute top-16 left-1/2 z-10 -translate-x-1/2 border border-amber-200/12 bg-black/18 px-3 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-amber-200/30">
              وضع المبنى الاحتياطي · Procedural fallback
            </div>
          )}

          {/* Bird's-eye fade overlay */}
          {info.birdEye && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-black/40 to-transparent" />
          )}
        </>
      )}

      {/* ── Back button ── */}
      <button
        onClick={() => navigate('/')}
        className="pointer-events-auto absolute top-4 left-4 z-30 grid h-9 w-9 place-items-center border border-white/15 bg-black/30 text-white/70 backdrop-blur-md transition hover:border-white/40 hover:text-white"
        aria-label="رجوع للرئيسية"
      >
        <ArrowLeft size={16} />
      </button>

      {/* Title tag */}
      {!isLoading && (
        <div className="pointer-events-none absolute top-4 left-1/2 z-10 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.22em] text-amber-200/40">
          {info.loadState === 'ready' ? 'Sponza Palace · Khronos GLTF' : 'قصر الأثير'}
        </div>
      )}

      {/* ── Camera enable card ── */}
      {cameraState !== 'active' && !isLoading && (
        <div className="absolute inset-x-0 bottom-0 z-25 flex justify-center p-5">
          <div className="w-full max-w-xs border border-amber-200/18 bg-[#0e0a1a]/90 p-5 text-center backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,.55)]">
            <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full border border-amber-200/25 bg-amber-200/8 text-amber-200/70">
              <Eye size={18} />
            </div>
            <h2 className="text-base font-medium" dir="rtl">تجوّل بيدك</h2>
            <p className="mt-1.5 text-[12px] leading-5 text-white/48" dir="rtl">
              فعّل الكاميرا لتتحكم في الحركة داخل المبنى بإيماءات اليد
            </p>
            <button
              onClick={startHandTracking}
              disabled={cameraState === 'loading'}
              className="mt-4 flex w-full items-center justify-center gap-2 bg-amber-200 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#0e0a1a] transition hover:bg-white disabled:cursor-wait disabled:opacity-55"
            >
              {cameraState === 'loading' ? '⏳ جارٍ التشغيل...' : '📷 تفعيل الكاميرا'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="mt-2.5 w-full font-mono text-[9px] uppercase tracking-[0.12em] text-white/30 transition hover:text-white/55"
            >
              ← رجوع
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
