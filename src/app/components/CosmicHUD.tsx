import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { UniverseInfo } from '../universe/UniverseEngine';
import type { UniverseEngine } from '../universe/UniverseEngine';

interface Props {
  info: UniverseInfo;
  engineRef: React.MutableRefObject<UniverseEngine | null>;
  onExit: () => void;
}

const VIEW_ICON: Record<string, string> = {
  universe: '🌌', galaxy: '🌠', system: '☀️', planet: '🪐',
};
const VIEW_LABEL: Record<string, string> = {
  universe: 'الكون المرئي', galaxy: 'درب التبانة', system: 'المجموعة الشمسية', planet: 'كوكب',
};

const PLANET_ICON: Record<string, string> = {
  sun: '☀️', mercury: '⬤', venus: '♀', earth: '🌍', moon: '🌕',
  mars: '🔴', asteroid_belt: '⬛', jupiter: '🟠', io: '🟡', europa: '🔵',
  ganymede: '⚫', callisto: '⚫', saturn: '🪐', titan: '🟤', enceladus: '⬜',
  uranus: '🔷', neptune: '🔵', triton: '⬤', pluto: '⬤',
};

export function CosmicHUD({ info, engineRef, onExit }: Props) {
  const [showInfo, setShowInfo] = useState(true);
  const [showControls, setShowControls] = useState(false);

  const flyTo = (id: string) => engineRef.current?.flyTo(id);
  const zoomOut = () => engineRef.current?.zoomOut();
  const setView = (v: 'universe' | 'galaxy' | 'system') => engineRef.current?.setView(v);

  // Quick-travel planet list
  const PLANETS = [
    { id: 'mercury', ar: 'عطارد', en: 'Mercury' },
    { id: 'venus',   ar: 'الزهرة', en: 'Venus' },
    { id: 'earth',   ar: 'الأرض',  en: 'Earth' },
    { id: 'mars',    ar: 'المريخ', en: 'Mars' },
    { id: 'jupiter', ar: 'المشتري', en: 'Jupiter' },
    { id: 'saturn',  ar: 'زحل',    en: 'Saturn' },
    { id: 'uranus',  ar: 'أورانوس', en: 'Uranus' },
    { id: 'neptune', ar: 'نبتون',  en: 'Neptune' },
    { id: 'pluto',   ar: 'بلوتو',  en: 'Pluto' },
  ];

  const font = { fontFamily: "'DM Mono', monospace" };

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...font }}>

      {/* ── Top bar ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(0,0,8,0.85) 0%, transparent 100%)',
        pointerEvents: 'auto',
      }}>
        {/* Left: breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Back to Milky Way button */}
          <button
            onClick={() => setView('system')}
            title="Solar System"
            style={{ ...btnStyle, padding: '4px 10px', fontSize: '9px' }}
          >☀️ SYSTEM</button>
          <button
            onClick={() => setView('galaxy')}
            title="Galaxy view"
            style={{ ...btnStyle, padding: '4px 10px', fontSize: '9px' }}
          >🌠 GALAXY</button>
          <button
            onClick={() => setView('universe')}
            title="Universe view"
            style={{ ...btnStyle, padding: '4px 10px', fontSize: '9px' }}
          >🌌 UNIVERSE</button>
        </div>

        {/* Center: location */}
        <AnimatePresence mode="wait">
          <motion.div
            key={info.focusName}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: 'rgba(150,185,255,0.45)', marginBottom: '2px' }}>
              {VIEW_ICON[info.viewLevel]} {VIEW_LABEL[info.viewLevel]}
            </div>
            <div style={{ fontSize: '18px', letterSpacing: '0.12em', color: 'rgba(200,220,255,0.9)', fontWeight: 300 }}>
              {info.focusNameAr}
            </div>
            <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(130,160,220,0.4)' }}>
              {info.focusName}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Right: controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setShowControls(v => !v)} aria-label="عرض دليل التحكم" style={{ ...btnStyle, fontSize: '11px', padding: '5px 12px' }}>
            {showControls ? '✕ CONTROLS' : '? CONTROLS'}
          </button>
          <button onClick={onExit} aria-label="الخروج للصفحة الرئيسية" style={{ ...btnStyle, fontSize: '11px', padding: '5px 12px', borderColor: 'rgba(255,100,80,0.4)', color: 'rgba(255,170,150,0.9)' }}>
            ✕ EXIT
          </button>
        </div>
      </div>

      {/* ── Controls tooltip ── */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
              position: 'absolute', top: '70px', right: '16px',
              background: 'rgba(2,4,20,0.92)', border: '1px solid rgba(80,120,255,0.2)',
              borderRadius: '10px', padding: '14px', minWidth: '220px',
              pointerEvents: 'auto',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ fontSize: '9px', letterSpacing: '0.3em', color: 'rgba(150,180,255,0.5)', marginBottom: '8px' }}>
              التحكم / CONTROLS
            </div>
            {[
              ['🖱️ اسحب', 'Drag to orbit'],
              ['🖱️ عجلة', 'Scroll to zoom'],
              ['👆 انقر كوكب', 'Click planet'],
              ['👐 قرص (موبايل)', 'Pinch to zoom'],
              ['✋ راحة إيد', 'Open palm = orbit'],
              ['👊 قبضة', 'Fist = zoom in'],
              ['☝️ إصبع واحد', 'Point = select planet'],
              ['🤌 قرصة + فك', 'Pinch release = fly to'],
              ['🤏+🤏 فردي', 'Two-hand spread = zoom'],
              ['🔄 إيدين دوار', 'Two-hand rotate = spin'],
              ['👍 إبهام فوق', 'Thumbs up = fly to'],
              ['👎 إبهام تحت', 'Thumbs down = zoom out'],
              ['✌️ حرف V', 'Peace = solar system'],
              ['🖖 خمس أصابع', 'Five fingers = universe'],
            ].map(([ar, en]) => (
              <div key={en} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(205,215,255,0.9)' }}>{ar}</span>
                <span style={{ fontSize: '11px', color: 'rgba(150,170,215,0.6)', textAlign: 'right' }}>{en}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Left: quick travel planet list ── */}
      <div style={{
        position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: '6px',
        pointerEvents: 'auto',
      }}>
        {PLANETS.map(p => (
          <button
            key={p.id}
            onClick={() => flyTo(p.id)}
            aria-label={`السفر إلى ${p.ar}`}
            style={{
              ...btnStyle,
              padding: '7px 12px',
              fontSize: '11px',
              textAlign: 'right',
              direction: 'rtl',
              background: info.focusData?.id === p.id ? 'rgba(70,130,255,0.2)' : 'rgba(0,0,10,0.6)',
              borderColor: info.focusData?.id === p.id ? 'rgba(100,165,255,0.5)' : 'rgba(80,100,200,0.15)',
              color: info.focusData?.id === p.id ? 'rgba(180,215,255,0.95)' : 'rgba(150,175,230,0.6)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {PLANET_ICON[p.id] ?? '⬤'} {p.ar}
          </button>
        ))}
        <button
          onClick={zoomOut}
          aria-label="الرجوع للخارج (تصغير)"
          style={{ ...btnStyle, padding: '7px 12px', fontSize: '11px', marginTop: '4px',
            borderColor: 'rgba(255,180,80,0.4)', color: 'rgba(255,205,120,0.9)' }}
        >
          ⬅ ارجع للخارج
        </button>
      </div>

      {/* ── Right: Info panel ── */}
      <AnimatePresence>
        {info.focusData && showInfo && (
          <motion.div
            key={info.focusData.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
              width: '260px',
              background: 'rgba(2,4,20,0.85)',
              border: '1px solid rgba(80,120,255,0.18)',
              borderRadius: '12px', padding: '16px',
              pointerEvents: 'auto',
              backdropFilter: 'blur(14px)',
              maxHeight: '70vh', overflowY: 'auto',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowInfo(false)}
              style={{ position: 'absolute', top: '8px', right: '10px', background: 'none', border: 'none',
                color: 'rgba(150,170,220,0.5)', cursor: 'pointer', fontSize: '12px' }}
            >✕</button>

            {/* Name */}
            <div style={{ fontSize: '22px', letterSpacing: '0.08em', color: 'rgba(200,220,255,0.9)', fontWeight: 300, marginBottom: '2px' }}>
              {PLANET_ICON[info.focusData.id] ?? '⬤'} {info.focusData.nameAr}
            </div>
            <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(120,150,210,0.5)', marginBottom: '12px' }}>
              {info.focusData.name}
            </div>

            {/* Description AR */}
            <p style={{ fontSize: '12px', color: 'rgba(195,215,245,0.88)', lineHeight: '1.8', direction: 'rtl', marginBottom: '12px', borderBottom: '1px solid rgba(80,120,255,0.12)', paddingBottom: '10px' }}>
              {info.focusData.descriptionAr}
            </p>

            {/* Facts AR */}
            {info.focusData.factsAr.length > 0 && (
              <div>
                <div style={{ fontSize: '8px', letterSpacing: '0.25em', color: 'rgba(150,180,255,0.4)', marginBottom: '8px' }}>
                  معلومات / FACTS
                </div>
                {info.focusData.factsAr.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '5px', direction: 'rtl' }}>
                    <span style={{ color: 'rgba(90,150,255,0.75)', flexShrink: 0 }}>◆</span>
                    <span style={{ fontSize: '11px', color: 'rgba(190,210,245,0.88)', lineHeight: '1.7' }}>{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Moons quick-travel */}
            {info.focusData.moons && info.focusData.moons.length > 0 && (
              <div style={{ marginTop: '12px', borderTop: '1px solid rgba(80,120,255,0.12)', paddingTop: '10px' }}>
                <div style={{ fontSize: '8px', letterSpacing: '0.25em', color: 'rgba(150,180,255,0.4)', marginBottom: '8px' }}>
                  الأقمار / MOONS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {info.focusData.moons.map(m => (
                    <button key={m.id} onClick={() => flyTo(m.id)}
                      style={{ ...btnStyle, padding: '3px 8px', fontSize: '8px' }}>
                      {m.nameAr}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Re-open info button */}
      {info.focusData && !showInfo && (
        <button
          onClick={() => setShowInfo(true)}
          style={{
            ...btnStyle,
            position: 'absolute', right: '16px', top: '50%',
            pointerEvents: 'auto', fontSize: '9px', padding: '6px 12px',
          }}
        >
          ℹ {info.focusData.nameAr}
        </button>
      )}

      {/* ── Hover tooltip ── */}
      <AnimatePresence>
        {info.hoverId && info.hoverId !== info.focusData?.id && (
          <motion.div
            key={info.hoverId}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(2,4,20,0.85)', border: '1px solid rgba(80,120,255,0.25)',
              borderRadius: '8px', padding: '6px 14px',
              pointerEvents: 'none',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(180,210,255,0.9)' }}>
              {PLANET_ICON[info.hoverId] ?? '⬤'} {info.hoverNameAr}
            </span>
            <span style={{ fontSize: '9px', color: 'rgba(130,160,220,0.5)', marginRight: '8px' }}>
              {' '}{info.hoverName} — انقر للاستكشاف
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Gesture label (center screen, above bottom bar) ── */}
      <AnimatePresence>
        {info.gestureLabel && (
          <motion.div
            key={info.gestureLabel}
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(40,20,80,0.75)',
              border: '1px solid rgba(160,100,255,0.4)',
              borderRadius: '10px', padding: '7px 18px',
              pointerEvents: 'none',
              backdropFilter: 'blur(10px)',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '12px', letterSpacing: '0.2em', color: 'rgba(210,170,255,0.95)', fontWeight: 300 }}>
              ✋ {info.gestureLabel}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom: scale/view indicator ── */}
      <div style={{
        position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{ fontSize: '8px', letterSpacing: '0.3em', color: 'rgba(130,160,220,0.35)' }}>
          {info.viewLevel === 'universe' && '1 وحدة ≈ مليون سنة ضوئية'}
          {info.viewLevel === 'galaxy'   && '1 وحدة ≈ ألف سنة ضوئية'}
          {info.viewLevel === 'system'   && '1 وحدة ≈ 5 وحدات فلكية'}
          {info.viewLevel === 'planet'   && 'منظور الكوكب — اسحب للاستكشاف'}
        </div>
      </div>
    </div>
  );
}

// Shared button style
const btnStyle: React.CSSProperties = {
  background: 'rgba(2,4,16,0.7)',
  border: '1px solid rgba(80,110,200,0.25)',
  borderRadius: '6px',
  color: 'rgba(160,190,240,0.75)',
  cursor: 'pointer',
  letterSpacing: '0.15em',
  fontFamily: "'DM Mono', monospace",
  transition: 'all 0.2s ease',
};
