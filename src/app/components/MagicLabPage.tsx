import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Camera, Circle, Hand, RotateCcw, Sparkles } from "lucide-react";
import { MagicStudio } from "./MagicStudio";
import type { MagicInfo } from "../magic/MagicEngine";
import { PALETTES } from "../magic/MagicEngine";
import { useAppContext } from "../AppContext";

const AMETHYST_INDEX = PALETTES.findIndex((palette) => palette.name === "Amethyst");

export function MagicLabPage() {
  const navigate = useNavigate();
  const { magicRef, previewStream, cameraState, startHandTracking, handCtx } = useAppContext();
  const [info, setInfo] = useState<MagicInfo | null>(null);
  const [showControls, setShowControls] = useState(true);
  const configured = useRef(false);
  const activeHand = [handCtx.left, handCtx.right].find((hand) => hand.present && hand.gesture !== "none");
  const handReady = handCtx.handsPresent > 0;

  const resetScene = () => {
    magicRef.current?.setFormation("hand");
    magicRef.current?.setPalette(AMETHYST_INDEX);
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#080611] text-white font-[Outfit,Arial,sans-serif]">
      <MagicStudio
        engineRef={magicRef}
        cameraStream={previewStream}
        initialFormation="hand"
        initialPalette={AMETHYST_INDEX}
        onFormation={() => {}}
        onPalette={() => {}}
        onInfo={(nextInfo) => {
          if (!configured.current) {
            configured.current = true;
            resetScene();
          }
          setInfo(nextInfo);
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(2,1,8,.45),transparent_32%,transparent_68%,rgba(2,1,8,.26)),linear-gradient(0deg,rgba(3,1,9,.56),transparent_30%)]" />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4 sm:p-5">
        <div className="max-w-[220px]">
          <div className="mb-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-violet-200/60"><Sparkles size={12} /> Live particle field</div>
          <h1 className="text-lg font-medium tracking-[0.02em] text-white/95">Particle Field</h1>
          <p className="mt-1 text-[10px] leading-4 text-white/48" dir="rtl">حرك يدك لتشكيل مجال الجسيمات، ثم قرّب الإبهام والسبابة للشحن.</p>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="hidden border border-white/10 bg-black/35 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/60 backdrop-blur-md sm:block">
            <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${cameraState === "active" ? "bg-emerald-300 shadow-[0_0_8px_#86efac]" : "bg-white/25"}`} />
            {cameraState === "active" ? "camera live" : "camera idle"}
          </div>
          <button onClick={() => navigate("/magic")} className="grid h-9 w-9 place-items-center border border-white/15 bg-black/30 text-white/75 backdrop-blur-md transition hover:border-white/40 hover:text-white" aria-label="العودة للاستوديو الأصلي"><ArrowLeft size={16} /></button>
        </div>
      </header>

      <aside className="pointer-events-none absolute bottom-5 left-4 z-10 hidden w-44 font-mono text-[8px] uppercase tracking-[0.14em] text-white/45 sm:block">
        <div className="border-l border-violet-300/35 pl-3">
          <p className="text-violet-100/75">Input / {handReady ? "hand detected" : "awaiting hand"}</p>
          <p className="mt-2 leading-4">{activeHand ? `gesture / ${activeHand.gesture.replace("_", " ")}` : "open palm · move field"}</p>
          <p className="mt-1 leading-4">pinch / charge burst</p>
          <p className="mt-1 leading-4">fist / black hole</p>
        </div>
      </aside>

      {info?.gestureLabel && <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 border border-violet-200/25 bg-[#160c2b]/55 px-4 py-2 font-mono text-[10px] tracking-[0.2em] text-violet-100 shadow-[0_0_34px_rgba(192,132,252,.42)] backdrop-blur-sm">{info.gestureLabel}</div>}

      <div className="pointer-events-auto absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 border border-white/10 bg-black/35 px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/60 backdrop-blur-md">
        <button onClick={() => setShowControls((value) => !value)} className="flex h-7 items-center gap-1.5 px-2 transition hover:bg-white/10" aria-expanded={showControls}><Circle size={9} className={handReady ? "fill-violet-300 text-violet-300" : "text-white/40"} /> {handReady ? "tracking" : "hand"}</button>
        <i className="h-4 w-px bg-white/15" />
        <button onClick={resetScene} className="grid h-7 w-7 place-items-center transition hover:bg-white/10" aria-label="إعادة حقل اليد"><RotateCcw size={13} /></button>
        {showControls && <><i className="h-4 w-px bg-white/15" /><span className="hidden px-1 text-white/40 sm:inline">{info?.particleCount?.toLocaleString() ?? "22,000"} pts</span><span className="hidden px-1 text-violet-200/80 sm:inline">amethyst</span></>}
      </div>

      {cameraState !== "active" && <div className="absolute inset-0 z-20 grid place-items-center bg-[#080611]/60 p-5 backdrop-blur-[2px]"><div className="w-full max-w-sm border border-violet-200/20 bg-[#0d0818]/80 p-6 text-center shadow-[0_18px_80px_rgba(0,0,0,.5)] backdrop-blur-xl"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-violet-200/30 bg-violet-300/10 text-violet-200"><Hand size={21} /></div><h2 className="mt-4 text-xl font-medium" dir="rtl">جرب حقل اليد</h2><p className="mt-2 text-sm leading-6 text-white/55" dir="rtl">هذه نسخة اختبارية مستقلة. لن نعدل الاستوديو الأصلي قبل ما تتأكد من الشكل والسلاسة.</p><button onClick={startHandTracking} disabled={cameraState === "loading"} className="mt-5 flex w-full items-center justify-center gap-2 bg-violet-200 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#12091e] transition hover:bg-white disabled:cursor-wait disabled:opacity-60"><Camera size={15} /> {cameraState === "loading" ? "starting camera" : "enable camera"}</button></div></div>}
    </div>
  );
}
