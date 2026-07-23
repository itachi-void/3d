import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

const CARDS = [
  {
    id: 'worlds',
    icon: '🏛️',
    title: 'MAGIC WORLDS',
    titleAr: 'العوالم السحرية',
    badge: '5 WORLDS',
    desc: 'Enter interactive 3D worlds — Ancient Temple, Magic Castle, Sci-Fi Lab, Space Station, and Ocean Deep.',
    descAr: 'ادخل عوالم ثلاثية الأبعاد سحرية تتحكم فيها بإيدك',
    accent: '#f59e0b',
    glow: 'rgba(245,158,11,0.18)',
    border: 'rgba(245,158,11,0.35)',
    features: ['5 worlds', 'Magic spells', 'Portal travel', 'Gesture control'],
  },
  {
    id: 'particles',
    icon: '✦',
    title: 'AETHER',
    titleAr: 'الجسيمات',
    badge: 'LIVE',
    desc: 'Interactive 3D particle formations controlled entirely by your hands via camera gestures.',
    descAr: 'تشكيلات ثلاثية الأبعاد يتحكم فيها حركات إيدك',
    accent: '#4a8fff',
    glow: 'rgba(74,143,255,0.18)',
    border: 'rgba(74,143,255,0.35)',
    features: ['8 formations', 'Hand gestures', 'GPU particles', 'Post FX'],
  },
  {
    id: 'universe',
    icon: '🌌',
    title: 'COSMOS',
    titleAr: 'الكون',
    badge: 'EXPLORE',
    desc: 'Journey from individual planets to the solar system, Milky Way, and the observable universe.',
    descAr: 'رحلة من الكواكب للمجموعة الشمسية والمجرة',
    accent: '#a78bfa',
    glow: 'rgba(167,139,250,0.18)',
    border: 'rgba(167,139,250,0.35)',
    features: ['Solar system', 'Galaxy field', 'LOD zoom', 'Arabic info'],
  },
  {
    id: 'magic',
    icon: '✦',
    title: 'MAGIC STUDIO',
    titleAr: 'الاستوديو السحري',
    badge: 'NEW',
    desc: 'Premium interactive particle field with webcam background. 22,000 GPU particles in 10 formations — controlled by your hands.',
    descAr: 'جسيمات تفاعلية بكاميرا خلفية وإيماءات اليد',
    accent: '#e879f9',
    glow: 'rgba(232,121,249,0.18)',
    border: 'rgba(232,121,249,0.35)',
    features: ['22K particles', '10 shapes', 'Webcam BG', 'Gesture FX'],
  },
  {
    id: 'finger-threads',
    icon: '〰',
    title: 'CHROMATIC LINES',
    titleAr: 'خيوط الأصابع',
    badge: 'LIVE',
    desc: 'Five luminous lines connect matching fingertips across both hands, each with its own color and live motion.',
    descAr: 'خمسة خطوط ضوئية تربط الأصابع المتطابقة بين اليدين بألوان مختلفة.',
    accent: '#22d3ee',
    glow: 'rgba(34,211,238,0.16)',
    border: 'rgba(34,211,238,0.38)',
    features: ['5 finger links', 'Live camera', 'Color trails', 'Two-hand tracking'],
  },
  {
    id: 'docs',
    icon: '📖',
    title: 'MAGIC DOCS',
    titleAr: 'وثائق المشروع',
    badge: '5 SPECS',
    desc: 'Complete project specification — worlds, gestures, magic engine, graphics, and engineering guidelines.',
    descAr: 'مواصفات كاملة للمشروع من الرؤية للهندسة',
    accent: '#34d399',
    glow: 'rgba(52,211,153,0.18)',
    border: 'rgba(52,211,153,0.35)',
    features: ['5 documents', 'Project vision', 'Gesture guide', 'Tech specs'],
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Lightweight animated star field
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const stars: Array<{ x: number; y: number; r: number; speed: number; opacity: number; pulse: number }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 220; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 0.2 + Math.random() * 1.4,
        speed: 0.015 + Math.random() * 0.04,
        opacity: 0.1 + Math.random() * 0.7,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    let t = 0;
    const draw = () => {
      t += 0.012;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        s.pulse += s.speed;
        const alpha = s.opacity * (0.5 + 0.5 * Math.sin(s.pulse));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,210,255,${alpha})`;
        ctx.fill();
      }
      // Subtle nebula glows
      const g1 = ctx.createRadialGradient(
        canvas.width * 0.2, canvas.height * 0.3, 0,
        canvas.width * 0.2, canvas.height * 0.3, 280
      );
      g1.addColorStop(0, `rgba(80,100,255,${0.04 + 0.02 * Math.sin(t * 0.5)})`);
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const g2 = ctx.createRadialGradient(
        canvas.width * 0.8, canvas.height * 0.7, 0,
        canvas.width * 0.8, canvas.height * 0.7, 320
      );
      g2.addColorStop(0, `rgba(140,60,220,${0.035 + 0.015 * Math.sin(t * 0.4 + 1)})`);
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse at 30% 20%, #05051a 0%, #000005 70%)',
      overflowY: 'auto', overflowX: 'hidden',
      fontFamily: "'DM Mono', monospace",
    }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} />

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', flexWrap: 'wrap',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(2,3,14,0.55)', backdropFilter: 'blur(10px)',
      }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: 'rgba(190,210,255,0.6)' }}>
          MAGIC SANDBOX — INTERACTIVE 3D EXPERIENCE
        </div>
        <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(150,185,255,0.4)' }}>
          v2.0 — THREE.JS + MEDIAPIPE
        </div>
      </div>

      {/* Content flow */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        minHeight: 'calc(100% - 110px)', justifyContent: 'center',
        textAlign: 'center', padding: '48px 20px 32px',
      }}>
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{
            fontSize: '13px', letterSpacing: '0.5em',
            color: 'rgba(130,170,255,0.6)', marginBottom: '20px',
          }}>
            ✦ ✦ ✦
          </div>

          <h1 style={{
            fontSize: 'clamp(38px, 7vw, 88px)',
            letterSpacing: '0.16em',
            color: 'transparent',
            backgroundImage: 'linear-gradient(135deg, rgba(210,228,255,0.98) 0%, rgba(140,170,255,0.85) 50%, rgba(190,150,255,0.92) 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            margin: '0 0 8px', fontWeight: 300, lineHeight: 1,
          }}>
            MAGIC
          </h1>
          <h1 style={{
            fontSize: 'clamp(38px, 7vw, 88px)',
            letterSpacing: '0.16em',
            color: 'transparent',
            backgroundImage: 'linear-gradient(135deg, rgba(175,210,255,0.9) 0%, rgba(210,170,255,0.95) 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            margin: '0 0 24px', fontWeight: 300, lineHeight: 1,
          }}>
            SANDBOX
          </h1>

          <p style={{
            fontSize: '12px', letterSpacing: '0.22em',
            color: 'rgba(175,200,245,0.7)',
            maxWidth: '460px', margin: '0 auto 10px',
          }}>
            AN AWARD-WINNING INTERACTIVE 3D WEB EXPERIENCE
          </p>
          <p style={{
            fontSize: '14px', direction: 'rtl',
            color: 'rgba(165,190,240,0.6)', margin: 0,
          }}>
            تجربة ويب تفاعلية ثلاثية الأبعاد تتحكم فيها بيدك
          </p>
        </motion.div>

        {/* Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 240px))',
            gap: '16px',
            justifyContent: 'center',
            marginTop: '44px',
            width: '100%', maxWidth: '1120px',
          }}
        >
          {CARDS.map((card, i) => (
            <motion.div
              key={card.id}
              aria-label={`${card.title} — ${card.titleAr}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: card.glow,
                border: `1px solid ${card.border}`,
                borderRadius: '16px',
                padding: '24px 22px',
                cursor: 'default',
                textAlign: 'left',
                position: 'relative',
                backdropFilter: 'blur(12px)',
                boxShadow: `0 0 30px ${card.glow}`,
                transition: 'box-shadow 0.3s ease',
              }}
            >
              <div style={{
                position: 'absolute', top: '12px', right: '12px',
                fontSize: '9px', letterSpacing: '0.15em',
                color: card.accent, background: `${card.glow}`,
                border: `1px solid ${card.border}`,
                padding: '2px 8px', borderRadius: '5px',
              }}>
                {card.badge}
              </div>

              <div style={{ fontSize: '30px', marginBottom: '10px', lineHeight: 1 }}>
                {card.icon}
              </div>

              <div style={{
                fontSize: '15px', letterSpacing: '0.2em',
                color: card.accent, marginBottom: '4px', fontWeight: 400,
              }}>
                {card.title}
              </div>
              <div style={{
                fontSize: '12px', color: 'rgba(180,200,235,0.65)',
                marginBottom: '12px', direction: 'rtl', letterSpacing: '0.05em',
              }}>
                {card.titleAr}
              </div>

              <p style={{
                fontSize: '11px', color: 'rgba(180,205,240,0.8)',
                lineHeight: '1.7', margin: '0 0 14px',
              }}>
                {card.desc}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {card.features.map(f => (
                  <span key={f} style={{
                    fontSize: '10px', letterSpacing: '0.05em',
                    color: 'rgba(180,205,245,0.7)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '2px 8px', borderRadius: '4px',
                  }}>
                    {f}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '18px', position: 'relative', zIndex: 1 }}>
                {card.id === 'magic' ? (
                  <>
                    <button
                      onClick={() => navigate('/magic')}
                      aria-label="فتح النسخة الأصلية من الاستوديو السحري"
                      style={{
                        flex: 1, padding: '9px 10px', cursor: 'pointer',
                        borderRadius: '7px', border: `1px solid ${card.border}`,
                        background: 'rgba(255,255,255,0.06)', color: 'rgba(232,240,255,0.9)',
                        fontSize: '10px', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      الأصلية
                    </button>
                    <button
                      onClick={() => navigate('/magic-lab')}
                      aria-label="فتح النسخة التجريبية من الاستوديو السحري"
                      style={{
                        flex: 1, padding: '9px 10px', cursor: 'pointer',
                        borderRadius: '7px', border: `1px solid ${card.accent}`,
                        background: `${card.glow}`, color: card.accent,
                        fontSize: '10px', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace",
                        boxShadow: `0 0 16px ${card.glow}`,
                      }}
                    >
                      التجريبية
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate('/' + card.id)}
                    aria-label={`فتح ${card.title}`}
                    style={{
                      width: '100%', padding: '9px 10px', cursor: 'pointer',
                      borderRadius: '7px', border: `1px solid ${card.border}`,
                      background: 'rgba(255,255,255,0.06)', color: card.accent,
                      fontSize: '10px', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    OPEN →
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', flexWrap: 'wrap',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(150,180,235,0.4)' }}>
          THREE.JS · MEDIAPIPE · GLSL · GPU INSTANCING
        </div>
        <div style={{ fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(150,180,235,0.4)', direction: 'rtl' }}>
          صُنع بالحب ✦
        </div>
      </div>
    </div>
  );
}
