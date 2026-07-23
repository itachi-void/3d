import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEY = 'magic-sandbox-onboarded';

export function hasOnboarded(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}
function markOnboarded() {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
}

interface Props {
  /** Called when the user chooses to enable the camera. */
  onEnableCamera: () => void;
  /** Called when the user dismisses (chooses mouse mode or closes). */
  onDismiss: () => void;
  cameraState: 'idle' | 'loading' | 'active' | 'error';
  cameraError?: string;
}

// The three core gestures a first-timer actually needs.
const CORE_GESTURES = [
  { icon: '✋', ar: 'راحة اليد', en: 'Open palm', action: 'حرّك الكاميرا / الأجسام' },
  { icon: '✊', ar: 'قبضة', en: 'Fist', action: 'ثقب أسود يجذب كل شيء' },
  { icon: '🤏', ar: 'قرصة', en: 'Pinch', action: 'اشحن ثم انفجار!' },
];

export function Onboarding({ onEnableCamera, onDismiss, cameraState, cameraError }: Props) {
  const [closing, setClosing] = useState(false);

  const finish = (enableCamera: boolean) => {
    markOnboarded();
    setClosing(true);
    if (enableCamera) onEnableCamera();
    // let the exit animation play
    setTimeout(onDismiss, 260);
  };

  return (
    <AnimatePresence>
      {!closing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label="مرحباً بك في Magic Sandbox"
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,8,0.72)', backdropFilter: 'blur(6px)',
            fontFamily: "'DM Mono', monospace", padding: '20px',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: '100%', maxWidth: '440px',
              maxHeight: '90vh', overflowY: 'auto',
              background: 'linear-gradient(160deg, rgba(14,16,40,0.96), rgba(6,6,20,0.96))',
              border: '1px solid rgba(120,150,255,0.3)',
              borderRadius: '20px', padding: '28px 26px',
              boxShadow: '0 0 60px rgba(80,120,255,0.2)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '13px', letterSpacing: '0.5em', color: 'rgba(150,180,255,0.7)', marginBottom: '10px' }}>
              ✦ ✦ ✦
            </div>
            <h2 style={{
              fontSize: '24px', letterSpacing: '0.1em', margin: '0 0 6px',
              color: 'rgba(220,232,255,0.98)', fontWeight: 400,
            }}>
              مرحباً بك
            </h2>
            <p style={{
              fontSize: '14px', color: 'rgba(190,205,240,0.85)', lineHeight: 1.7,
              margin: '0 0 22px', direction: 'rtl',
            }}>
              تجربة ثلاثية الأبعاد تتحكم فيها <strong style={{ color: '#8ab4ff' }}>بحركة يدك</strong> عبر الكاميرا.
              الفيديو لا يغادر جهازك أبداً — كل المعالجة محلية.
            </p>

            {/* Core gestures */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '10px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px', padding: '16px', marginBottom: '22px',
            }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: 'rgba(150,180,255,0.6)', marginBottom: '4px', direction: 'rtl' }}>
                ابدأ بـ 3 إيماءات فقط
              </div>
              {CORE_GESTURES.map(g => (
                <div key={g.en} style={{ display: 'flex', alignItems: 'center', gap: '12px', direction: 'rtl' }}>
                  <span style={{ fontSize: '26px', lineHeight: 1, flexShrink: 0 }}>{g.icon}</span>
                  <div style={{ textAlign: 'right', flex: 1 }}>
                    <div style={{ fontSize: '13px', color: 'rgba(215,228,255,0.95)' }}>{g.ar}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(160,185,230,0.7)' }}>{g.action}</div>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: '11px', color: 'rgba(150,175,220,0.55)', marginTop: '2px', direction: 'rtl' }}>
                باقي الإيماءات تلاقيها داخل كل تجربة زر «الإيماءات» ✋
              </div>
            </div>

            {cameraState === 'error' && (
              <div style={{
                fontSize: '12px', color: 'rgba(255,150,140,0.9)', direction: 'rtl',
                background: 'rgba(255,80,60,0.1)', border: '1px solid rgba(255,80,60,0.3)',
                borderRadius: '10px', padding: '10px 12px', marginBottom: '16px', lineHeight: 1.6,
              }}>
                تعذّر تشغيل الكاميرا{cameraError ? `: ${cameraError}` : ''}. تقدر تستخدم الماوس بدلاً منها.
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => finish(true)}
                disabled={cameraState === 'loading'}
                aria-label="تفعيل الكاميرا والتحكم باليد"
                style={{
                  padding: '13px 20px', fontSize: '14px', letterSpacing: '0.15em',
                  fontFamily: "'DM Mono', monospace",
                  background: 'linear-gradient(135deg, rgba(80,140,255,0.9), rgba(140,110,255,0.9))',
                  border: 'none', borderRadius: '12px', color: '#fff',
                  cursor: cameraState === 'loading' ? 'wait' : 'pointer',
                  boxShadow: '0 4px 20px rgba(90,120,255,0.4)',
                }}
              >
                {cameraState === 'loading' ? '⏳ جارٍ التشغيل…' : '📷 تفعيل الكاميرا'}
              </button>
              <button
                onClick={() => finish(false)}
                aria-label="المتابعة باستخدام الماوس"
                style={{
                  padding: '11px 20px', fontSize: '13px', letterSpacing: '0.15em',
                  fontFamily: "'DM Mono', monospace",
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '12px', color: 'rgba(190,205,240,0.85)', cursor: 'pointer',
                }}
              >
                🖱️ استخدم الماوس بدلاً من ذلك
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
