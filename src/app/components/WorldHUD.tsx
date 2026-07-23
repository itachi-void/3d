import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { WorldInfo, WorldId } from '../worlds/WorldEngine';
import type { WorldEngine } from '../worlds/WorldEngine';

interface Props {
  info: WorldInfo;
  engineRef: React.MutableRefObject<WorldEngine | null>;
  onExit: () => void;
  cameraActive: boolean;
  onStartCamera: () => void;
}

const WORLD_CARDS: Array<{ id: WorldId; icon: string; name: string; nameAr: string; color: string }> = [
  { id: 'temple',     icon: '🏛️', name: 'Ancient Temple',  nameAr: 'المعبد القديم',     color: '#f59e0b' },
  { id: 'castle',     icon: '🏰', name: 'Magic Castle',    nameAr: 'القلعة السحرية',    color: '#a855f7' },
  { id: 'scifi',      icon: '🔬', name: 'Sci-Fi Lab',      nameAr: 'المختبر المستقبلي', color: '#3b82f6' },
  { id: 'space',      icon: '🚀', name: 'Space Station',   nameAr: 'محطة الفضاء',       color: '#e2e8f0' },
  { id: 'underwater', icon: '🌊', name: 'Ocean Deep',      nameAr: 'أعماق المحيط',      color: '#06b6d4' },
];

const GESTURE_GUIDE = [
  { icon: '✋', en: 'Open Palm', ar: 'راحة مفتوحة', action: 'Orbit camera' },
  { icon: '✊', en: 'Fist', ar: 'قبضة', action: 'Black Hole' },
  { icon: '🤏', en: 'Pinch + Hold', ar: 'قرصة + استمرار', action: 'Charge → Explosion' },
  { icon: '☝️', en: 'Point', ar: 'إصبع واحد', action: 'Magic Beam' },
  { icon: '👍', en: 'Thumbs Up', ar: 'إبهام فوق', action: 'Next World' },
  { icon: '👎', en: 'Thumbs Down', ar: 'إبهام تحت', action: 'Prev World' },
  { icon: '✌️', en: 'Peace Sign', ar: 'حرف V', action: 'Explore Mode' },
  { icon: '🖖', en: 'Five Fingers Held', ar: 'خمسة أصابع', action: 'Supernova!' },
  { icon: '👐', en: 'Two Hands Spread', ar: 'فرد إيدين', action: 'Zoom In/Out' },
  { icon: '🔄', en: 'Rotate Hands', ar: 'تدوير إيدين', action: 'Rotate World' },
  { icon: '🤞', en: 'Three Fingers', ar: 'ثلاث أصابع', action: 'Change Weather' },
  { icon: '🤟', en: 'Four Fingers', ar: 'أربع أصابع', action: 'Lightning!' },
];

const WEATHER_ICONS: Record<string, string> = {
  clear: '☀️', foggy: '🌫️', storm: '⛈️', magic: '✨',
};

const font = { fontFamily: "'DM Mono', monospace" };

export function WorldHUD({ info, engineRef, onExit, cameraActive, onStartCamera }: Props) {
  const [showGuide, setShowGuide] = useState(false);
  const [showWorlds, setShowWorlds] = useState(false);

  const goWorld = (id: WorldId) => { engineRef.current?.setWorld(id); setShowWorlds(false); };

  const currentCard = WORLD_CARDS.find(w => w.id === info.worldId);
  const accent = currentCard?.color ?? '#4a8fff';

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...font }}>

      {/* ── TOP LEFT: World info ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          position: 'absolute', top: '16px', left: '16px',
          background: 'rgba(0,0,8,0.7)', border: `1px solid ${accent}30`,
          borderRadius: '12px', padding: '12px 16px',
          backdropFilter: 'blur(12px)', pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: '8px', letterSpacing: '0.35em', color: `${accent}88`, marginBottom: '4px' }}>
          {currentCard?.icon} INTERACTIVE MAGIC SANDBOX
        </div>
        <div style={{ fontSize: '18px', letterSpacing: '0.1em', color: 'rgba(220,235,255,0.92)', fontWeight: 300, marginBottom: '2px' }}>
          {info.worldNameAr}
        </div>
        <div style={{ fontSize: '9px', color: 'rgba(160,185,230,0.45)', letterSpacing: '0.1em' }}>
          {info.worldName}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <span style={{ fontSize: '8px', color: 'rgba(160,185,230,0.5)' }}>
            {WEATHER_ICONS[info.weather] ?? '☀️'} {info.weather.toUpperCase()}
          </span>
          <span style={{ fontSize: '8px', color: 'rgba(160,185,230,0.35)' }}>·</span>
          <span style={{ fontSize: '8px', color: 'rgba(160,185,230,0.5)' }}>
            🕐 {info.timeOfDay}
          </span>
        </div>
      </motion.div>

      {/* ── TOP RIGHT: Stats ── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'rgba(0,0,8,0.7)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '10px', padding: '10px 14px',
          backdropFilter: 'blur(10px)', pointerEvents: 'none',
          textAlign: 'right',
        }}
      >
        <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(140,200,140,0.8)', marginBottom: '4px' }}>
          ◆ {info.fps} FPS
        </div>
        {info.spell && info.spell !== 'none' && (
          <div style={{ fontSize: '8px', color: `${accent}99`, letterSpacing: '0.15em' }}>
            ✨ {info.spell}
          </div>
        )}
        <div style={{ fontSize: '7px', color: 'rgba(120,150,200,0.35)', marginTop: '4px', letterSpacing: '0.15em' }}>
          {cameraActive ? '📷 HANDS ON' : '🖱️ MOUSE MODE'}
        </div>
      </motion.div>

      {/* ── CENTER: Gesture label ── */}
      <AnimatePresence>
        {info.gestureLabel && (
          <motion.div
            key={info.gestureLabel}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: `${accent}18`,
              border: `1px solid ${accent}50`,
              borderRadius: '14px', padding: '12px 24px',
              backdropFilter: 'blur(16px)',
              pointerEvents: 'none', textAlign: 'center',
              boxShadow: `0 0 30px ${accent}30`,
            }}
          >
            <div style={{ fontSize: '14px', letterSpacing: '0.2em', color: 'rgba(230,240,255,0.95)' }}>
              {info.gestureLabel}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Portal open indicator ── */}
      <AnimatePresence>
        {info.portalOpen && info.portalTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute', bottom: '120px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,8,0.8)', border: '1px solid rgba(80,120,255,0.4)',
              borderRadius: '8px', padding: '8px 20px',
              pointerEvents: 'none', textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '9px', letterSpacing: '0.3em', color: 'rgba(140,180,255,0.9)' }}>
              🌀 PORTAL TO {WORLD_CARDS.find(w => w.id === info.portalTarget)?.nameAr ?? info.portalTarget}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM LEFT: Mode + gesture quick-ref ── */}
      <div style={{
        position: 'absolute', bottom: '16px', left: '16px',
        display: 'flex', flexDirection: 'column', gap: '6px',
        pointerEvents: 'auto',
      }}>
        {/* Gesture guide toggle */}
        <button
          onClick={() => setShowGuide(v => !v)}
          aria-expanded={showGuide}
          aria-label="دليل الإيماءات"
          style={{
            ...btnStyle,
            padding: '7px 14px', fontSize: '11px',
            borderColor: showGuide ? `${accent}60` : 'rgba(255,255,255,0.14)',
            color: showGuide ? accent : 'rgba(180,205,240,0.8)',
          }}
        >
          {showGuide ? '✕ GESTURES' : '✋ GESTURES'}
        </button>

        {/* Camera start */}
        {!cameraActive && (
          <button onClick={onStartCamera} aria-label="تفعيل الكاميرا للتحكم باليد" style={{ ...btnStyle, padding: '7px 14px', fontSize: '11px', borderColor: 'rgba(80,200,120,0.4)', color: 'rgba(120,235,165,0.9)' }}>
            📷 START CAMERA
          </button>
        )}
        {cameraActive && (
          <div style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(110,225,150,0.7)' }}>
            ● HANDS TRACKING
          </div>
        )}
      </div>

      {/* ── BOTTOM CENTER: World nav ── */}
      <div style={{
        position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
        pointerEvents: 'auto',
      }}>
        {/* World buttons */}
        <AnimatePresence>
          {showWorlds && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{ display: 'flex', gap: '6px' }}
            >
              {WORLD_CARDS.map(w => (
                <button
                  key={w.id}
                  onClick={() => goWorld(w.id)}
                  aria-label={`الانتقال إلى ${w.nameAr}`}
                  style={{
                    ...btnStyle,
                    padding: '7px 12px', fontSize: '11px',
                    background: w.id === info.worldId ? `${w.color}20` : 'rgba(0,0,10,0.7)',
                    borderColor: w.id === info.worldId ? `${w.color}60` : 'rgba(255,255,255,0.08)',
                    color: w.id === info.worldId ? w.color : 'rgba(160,185,230,0.55)',
                  }}
                >
                  {w.icon} {w.nameAr}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => engineRef.current?.prevWorldCycle()}
            aria-label="العالم السابق"
            style={{ ...btnStyle, padding: '6px 14px', fontSize: '13px' }}
          >←</button>
          <button
            onClick={() => setShowWorlds(v => !v)}
            aria-label="اختيار العالم"
            style={{
              ...btnStyle, padding: '7px 18px', fontSize: '11px', letterSpacing: '0.15em',
              background: `${accent}15`, borderColor: `${accent}40`, color: accent,
            }}
          >
            {currentCard?.icon} {info.worldId.toUpperCase()}
          </button>
          <button
            onClick={() => engineRef.current?.nextWorldCycle()}
            aria-label="العالم التالي"
            style={{ ...btnStyle, padding: '6px 14px', fontSize: '13px' }}
          >→</button>
        </div>
      </div>

      {/* ── BOTTOM RIGHT: Controls ── */}
      <div style={{
        position: 'absolute', bottom: '16px', right: '16px',
        display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end',
        pointerEvents: 'auto',
      }}>
        <button onClick={onExit} aria-label="الخروج للصفحة الرئيسية" style={{ ...btnStyle, fontSize: '11px', padding: '7px 14px', borderColor: 'rgba(255,100,80,0.4)', color: 'rgba(255,165,145,0.9)' }}>
          ✕ EXIT
        </button>
      </div>

      {/* ── Gesture guide panel ── */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            style={{
              position: 'absolute', bottom: '90px', left: '16px',
              background: 'rgba(0,0,10,0.90)', border: `1px solid ${accent}25`,
              borderRadius: '12px', padding: '14px',
              backdropFilter: 'blur(14px)', pointerEvents: 'auto',
              width: '280px', maxHeight: '420px', overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: `${accent}cc`, marginBottom: '10px' }}>
              ✋ GESTURE GUIDE — دليل الإيماءات
            </div>
            {GESTURE_GUIDE.map((g, i) => (
              <div key={g.en}>
                {i === 0 && <GuideHeading text="الأساسيات — START HERE" accent={accent} />}
                {i === 3 && <GuideHeading text="متقدّم — ADVANCED" accent={accent} />}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '9px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0, lineHeight: 1 }}>{g.icon}</span>
                  <div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', letterSpacing: '0.1em', color: accent }}>{g.ar}</span>
                      <span style={{ fontSize: '10px', color: 'rgba(150,175,220,0.55)' }}>/ {g.en}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(185,205,235,0.75)', marginTop: '2px' }}>
                      → {g.action}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GuideHeading({ text, accent }: { text: string; accent: string }) {
  return (
    <div style={{
      fontSize: '10px', letterSpacing: '0.2em', color: `${accent}99`,
      margin: '4px 0 8px', paddingBottom: '4px',
      borderBottom: `1px solid ${accent}22`, direction: 'rtl',
    }}>
      {text}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'rgba(0,0,10,0.72)',
  border: '1px solid rgba(80,110,200,0.2)',
  borderRadius: '7px',
  color: 'rgba(160,190,240,0.7)',
  cursor: 'pointer',
  letterSpacing: '0.15em',
  fontFamily: "'DM Mono', monospace",
  backdropFilter: 'blur(8px)',
  transition: 'all 0.2s ease',
};
