import { useState } from "react";
import { Camera, ChevronLeft, CircleHelp, Eye, Hand, Sparkles, X } from "lucide-react";
import type { MagicInfo } from "../magic/MagicEngine";
import { PALETTES } from "../magic/MagicEngine";
import { FORMATION_ORDER, FORMATIONS } from "../magic/formations";
import type { FormationId } from "../magic/formations";
import type { MagicEngine } from "../magic/MagicEngine";
import type { TwoHandContext } from "../hand-tracking/types";

interface Props {
  info: MagicInfo | null;
  engineRef: React.MutableRefObject<MagicEngine | null>;
  cameraActive: boolean;
  handCtx: TwoHandContext;
  onStartCamera: () => void;
  onExit: () => void;
}

const gestureNames: Record<string, string> = {
  none: "ضع يدك داخل الإطار",
  open_palm: "كف مفتوح · ادفع المجال",
  fist: "قبضة · اصنع ثقبًا أسود",
  pinch: "قرص · اشحن الانفجار",
  pointing: "إشارة · اجذب الجسيمات",
  thumbs_up: "إبهام للأعلى · التكوين التالي",
  thumbs_down: "إبهام للأسفل · التكوين السابق",
  peace: "علامة السلام · حركة تلقائية",
  three_fingers: "٣ أصابع · لوحة ألوان",
  four_fingers: "٤ أصابع · لوحة ألوان",
  five_fingers: "٥ أصابع · ثبّت لتبديل الخلفية",
};

const gestureShort: Record<string, string> = {
  open_palm: "كف", fist: "قبضة", pinch: "قرص", pointing: "إشارة", thumbs_up: "↑", thumbs_down: "↓", peace: "سلام", three_fingers: "٣", four_fingers: "٤", five_fingers: "٥",
};

function HandMeter({ ctx }: { ctx: TwoHandContext }) {
  const hands = [ctx.left, ctx.right].filter((hand) => hand.present);
  const active = hands.find((hand) => hand.gesture !== "none") ?? hands[0];
  const confidence = active ? Math.round(active.gestureConfidence * 100) : 0;
  const pinch = active ? Math.round(active.pinchStrength * 100) : 0;

  return (
    <div className="pointer-events-none absolute bottom-5 left-5 z-20 hidden w-60 border border-white/10 bg-[#080b18]/75 p-3.5 font-mono backdrop-blur-xl md:block">
      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/45">
        <span>Hand signal</span>
        <span className={hands.length ? "text-emerald-300" : "text-white/35"}>{hands.length ? `${hands.length} / 2` : "waiting"}</span>
      </div>
      <div className="mb-3 flex items-center gap-2 text-sm text-white/90">
        <span className={`h-2 w-2 rounded-full ${hands.length ? "bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.9)]" : "bg-white/20"}`} />
        <span dir="rtl">{active ? gestureNames[active.gesture] : "أظهر يدًا واحدة بوضوح"}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.12em] text-white/40">
        <div><span className="block mb-1">Read</span><div className="h-1 overflow-hidden bg-white/10"><div className="h-full bg-cyan-300 transition-all duration-150" style={{ width: `${confidence}%` }} /></div></div>
        <div><span className="block mb-1">Pinch</span><div className="h-1 overflow-hidden bg-white/10"><div className="h-full bg-fuchsia-300 transition-all duration-150" style={{ width: `${pinch}%` }} /></div></div>
      </div>
    </div>
  );
}

export function MagicHUD({ info, engineRef, cameraActive, handCtx, onStartCamera, onExit }: Props) {
  const [guideOpen, setGuideOpen] = useState(!cameraActive);
  const formation = info?.formation ?? "sphere";
  const fps = info?.fps ?? 60;
  const palette = info?.palette ?? "Cosmic";
  const paletteSwatch = info?.paletteSwatch ?? "#4af";
  const gestureLabel = info?.gestureLabel ?? "";
  const formMeta = FORMATIONS[formation];
  const activeGesture = [handCtx.left, handCtx.right].find((hand) => hand.present && hand.gesture !== "none");

  const chooseFormation = (id: FormationId) => engineRef.current?.setFormation(id);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none font-[Outfit,Arial,sans-serif] text-white">
      <div className="absolute left-4 top-4 md:left-5 md:top-5">
        <div className="border border-white/10 bg-[#080b18]/75 px-4 py-3.5 backdrop-blur-xl">
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-white/40">Magic studio / 01</div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none" aria-hidden="true">{formMeta.icon}</span>
            <div>
              <div className="text-base font-medium tracking-[0.05em]" style={{ color: formMeta.accent }}>{formMeta.en}</div>
              <div className="mt-0.5 text-xs text-white/45" dir="rtl">{formMeta.ar}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">
            <span>{info?.particleCount?.toLocaleString() ?? "22,000"} pts</span><i className="h-3 w-px bg-white/15" /><span style={{ color: paletteSwatch }}>{palette}</span>
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-4 flex items-start gap-2 md:right-5 md:top-5">
        <div className="border border-white/10 bg-[#080b18]/75 px-3 py-2.5 text-right font-mono backdrop-blur-xl">
          <div className={`text-lg leading-none ${fps >= 55 ? "text-emerald-300" : fps >= 30 ? "text-amber-300" : "text-rose-400"}`}>{fps}</div>
          <div className="mt-1 text-[8px] uppercase tracking-[0.24em] text-white/35">fps</div>
        </div>
        <button onClick={onExit} className="pointer-events-auto grid h-[46px] w-[46px] place-items-center border border-white/10 bg-[#080b18]/75 text-white/75 backdrop-blur-xl transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" aria-label="الخروج للصفحة الرئيسية"><ChevronLeft size={19} /></button>
      </div>

      {gestureLabel && <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-y border-white/15 bg-[#080b18]/55 px-5 py-3 font-mono text-xs tracking-[0.22em] text-cyan-100 shadow-[0_0_36px_rgba(125,211,252,.22)] backdrop-blur-sm">{gestureLabel}</div>}

      <div className="pointer-events-auto absolute bottom-4 left-1/2 flex w-[calc(100%-2rem)] max-w-[680px] -translate-x-1/2 items-center gap-2 border border-white/10 bg-[#080b18]/85 p-2 backdrop-blur-xl md:bottom-5">
        <div className="hidden px-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/35 sm:block">Shape</div>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {FORMATION_ORDER.map((id) => { const meta = FORMATIONS[id]; const active = formation === id; return <button key={id} onClick={() => chooseFormation(id)} aria-label={`تكوين: ${meta.ar}`} aria-pressed={active} className={`grid h-9 min-w-9 place-items-center border text-lg transition ${active ? "border-white/45 bg-white/10 shadow-[0_0_16px_rgba(255,255,255,.11)]" : "border-transparent text-white/45 hover:border-white/15 hover:text-white"}`} style={active ? { color: meta.accent } : undefined}>{meta.icon}</button>; })}
        </div>
        <div className="h-6 w-px bg-white/10" />
        <div className="flex items-center gap-1">
          {PALETTES.map((entry, index) => <button key={entry.name} onClick={() => engineRef.current?.setPalette(index)} aria-label={`لوحة ألوان: ${entry.name}`} aria-pressed={palette === entry.name} className={`h-5 w-5 rounded-full border transition hover:scale-110 ${palette === entry.name ? "scale-110 border-white shadow-[0_0_12px_currentColor]" : "border-white/25"}`} style={{ backgroundColor: entry.swatch, color: entry.swatch }} />)}
        </div>
      </div>

      <HandMeter ctx={handCtx} />

      <button onClick={() => setGuideOpen(true)} className="pointer-events-auto absolute bottom-[76px] right-4 grid h-10 w-10 place-items-center border border-white/10 bg-[#080b18]/75 text-white/65 backdrop-blur-xl transition hover:text-white md:bottom-5 md:right-5" aria-label="دليل الإيماءات"><CircleHelp size={18} /></button>

      {!cameraActive && <button onClick={onStartCamera} className="pointer-events-auto absolute bottom-[76px] right-16 flex h-10 items-center gap-2 border border-emerald-300/35 bg-emerald-300/10 px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-200 backdrop-blur-xl transition hover:bg-emerald-300/20 md:bottom-5 md:right-[68px]"><Camera size={15} /> Enable hand</button>}

      {cameraActive && activeGesture && <div className="pointer-events-none absolute bottom-[78px] right-16 hidden items-center gap-2 border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-cyan-100 backdrop-blur-xl md:flex"><Hand size={14} /> {gestureShort[activeGesture.gesture] ?? "reading"} · {Math.round(activeGesture.gestureConfidence * 100)}%</div>}

      {guideOpen && <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-[#02030a]/65 p-4 backdrop-blur-sm"><section className="relative w-full max-w-xl border border-white/15 bg-[#090b18]/95 p-5 shadow-2xl md:p-7" aria-label="دليل الإيماءات"><button onClick={() => setGuideOpen(false)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center text-white/50 transition hover:text-white" aria-label="إغلاق الدليل"><X size={18} /></button><div className="mb-1 flex items-center gap-2 text-cyan-200"><Sparkles size={16} /><span className="font-mono text-[10px] uppercase tracking-[0.22em]">Gesture conductor</span></div><h2 className="mt-3 text-2xl font-medium tracking-[-0.02em]" dir="rtl">ابدأ بإشارة واحدة واضحة</h2><p className="mt-2 max-w-md text-sm leading-6 text-white/55" dir="rtl">ثبّت كفك داخل إطار الكاميرا لثانية، ثم انتقل للإيماءة التالية. المؤشر السفلي يعرض القراءة وقوة القرص لحظيًا.</p><div className="mt-6 grid gap-px bg-white/10 sm:grid-cols-2">{[["🤏", "قرص", "اشحن ثم حرّر للانفجار"], ["✊", "قبضة", "اجذب المجال إلى ثقب أسود"], ["🖐", "كف مفتوح", "ادفع الجسيمات ووجّهها"], ["☝", "إشارة", "اسحب الجسيمات نحو إصبعك"], ["👍 / 👎", "إبهام", "تنقّل بين التكوينات"], ["✌", "سلام", "بدّل الحركة التلقائية"]].map(([icon, title, body]) => <div key={title} className="bg-[#090b18] p-3.5"><div className="text-lg">{icon}</div><div className="mt-1 text-sm font-medium" dir="rtl">{title}</div><div className="mt-1 text-xs leading-5 text-white/45" dir="rtl">{body}</div></div>)}</div><button onClick={() => { setGuideOpen(false); if (!cameraActive) onStartCamera(); }} className="mt-6 flex w-full items-center justify-center gap-2 bg-cyan-200 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#061019] transition hover:bg-white"><Eye size={15} /> {cameraActive ? "عودة للاستوديو" : "تفعيل الكاميرا"}</button></section></div>}
    </div>
  );
}
