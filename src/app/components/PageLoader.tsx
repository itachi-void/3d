import { motion } from 'motion/react';

interface Props {
  label?: string;
  accent?: string;
}

/** Full-bleed loading overlay shown while a heavy 3D engine boots. */
export function PageLoader({ label = 'جارٍ تحميل التجربة…', accent = '#7aa4ff' }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      role="status"
      aria-live="polite"
      aria-label={label}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '20px', background: 'radial-gradient(ellipse at center, #05061c 0%, #000005 80%)',
        fontFamily: "'DM Mono', monospace", pointerEvents: 'none',
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '44px', height: '44px', borderRadius: '50%',
          border: `2px solid ${accent}22`, borderTopColor: accent,
        }}
      />
      <div style={{ fontSize: '13px', letterSpacing: '0.3em', color: 'rgba(180,205,255,0.7)', direction: 'rtl' }}>
        {label}
      </div>
    </motion.div>
  );
}
