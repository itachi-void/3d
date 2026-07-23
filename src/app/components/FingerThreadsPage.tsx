import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Camera, Hand, Sparkles } from "lucide-react";
import { useAppContext } from "../AppContext";

const FINGERS = [
  { tip: 4, label: "Thumb", arabic: "الإبهام", color: "#fbbf24" },
  { tip: 8, label: "Index", arabic: "السبابة", color: "#22d3ee" },
  { tip: 12, label: "Middle", arabic: "الوسطى", color: "#c084fc" },
  { tip: 16, label: "Ring", arabic: "البنصر", color: "#f472b6" },
  { tip: 20, label: "Pinky", arabic: "الخنصر", color: "#a3e635" },
] as const;

export function FingerThreadsPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { previewStream, cameraState, startHandTracking, handCtx } = useAppContext();
  const bothHands = handCtx.left.present && handCtx.right.present;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = previewStream;
    if (previewStream) video.play().catch(() => undefined);
    return () => { video.srcObject = null; };
  }, [previewStream]);

  const point = (hand: "left" | "right", index: number) => {
    const landmark = handCtx[hand].landmarks[index];
    // The video is mirrored for natural interaction, so landmarks mirror too.
    return landmark ? { x: (1 - landmark.x) * 100, y: landmark.y * 100 } : { x: 50, y: 50 };
  };

  return (
    <main className="absolute inset-0 overflow-hidden bg-[#05030a] text-white font-[Outfit,Arial,sans-serif]">
      <video ref={videoRef} className="absolute inset-0 h-full w-full scale-x-[-1] object-contain opacity-90" muted playsInline />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_24%,rgba(7,3,13,.22)_72%,rgba(2,1,6,.72)_100%)]" />

      <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="خطوط ملونة تربط الأصابع المتطابقة بين اليدين">
        <defs>
          {FINGERS.map((finger) => <filter key={finger.label} id={`glow-${finger.tip}`} x="-40%" y="-80%" width="180%" height="260%"><feGaussianBlur stdDeviation="0.55" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>)}
        </defs>
        {bothHands && FINGERS.map((finger) => {
          const left = point("left", finger.tip);
          const right = point("right", finger.tip);
          return <g key={finger.label} filter={`url(#glow-${finger.tip})`}>
            <line x1={left.x} y1={left.y} x2={right.x} y2={right.y} stroke={finger.color} strokeOpacity="0.26" strokeWidth="1.8" />
            <line x1={left.x} y1={left.y} x2={right.x} y2={right.y} stroke={finger.color} strokeWidth="0.28" />
            <circle cx={left.x} cy={left.y} r="0.85" fill={finger.color} /><circle cx={right.x} cy={right.y} r="0.85" fill={finger.color} />
          </g>;
        })}
      </svg>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 sm:p-5">
        <div>
          <div className="mb-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-cyan-100/70"><Sparkles size={12} /> finger threads</div>
          <h1 className="text-lg font-medium tracking-[0.02em]">Chromatic Lines</h1>
          <p className="mt-1 max-w-[230px] text-[10px] leading-4 text-white/60" dir="rtl">كل إصبع يقابل نظيره بخيط ضوء مختلف يتبع اليدين لحظيًا.</p>
        </div>
        <div className="pointer-events-auto flex gap-2">
          <div className={`hidden items-center gap-2 border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] backdrop-blur-md sm:flex ${bothHands ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-white/15 bg-black/25 text-white/60"}`}><span className={`h-1.5 w-1.5 rounded-full ${bothHands ? "bg-emerald-300 shadow-[0_0_8px_#86efac]" : "bg-white/35"}`} />{bothHands ? "5 links live" : "awaiting hands"}</div>
          <button onClick={() => navigate("/")} className="grid h-9 w-9 place-items-center border border-white/15 bg-black/25 text-white/80 backdrop-blur-md transition hover:border-white/40" aria-label="العودة للرئيسية"><ArrowLeft size={16} /></button>
        </div>
      </header>

      <aside className="pointer-events-none absolute bottom-5 left-4 z-20 hidden border-l border-white/20 pl-3 font-mono text-[9px] uppercase tracking-[0.14em] text-white/70 sm:block">
        {FINGERS.map((finger) => <div key={finger.label} className="mb-1.5 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: finger.color, boxShadow: `0 0 8px ${finger.color}` }} /><span>{finger.label}</span><span className="text-white/35" dir="rtl">{finger.arabic}</span></div>)}
      </aside>

      {!bothHands && <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 mx-auto w-max max-w-[calc(100%-2rem)] border border-white/15 bg-black/35 px-4 py-3 text-center backdrop-blur-md"><div className="flex items-center justify-center gap-2 text-sm text-white/90"><Hand size={16} className="text-cyan-200" /><span dir="rtl">ارفع اليدين داخل الكاميرا</span></div><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/45">same finger · one color · live line</p></div>}

      {cameraState !== "active" && <div className="absolute inset-0 z-30 grid place-items-center bg-[#05030a]/70 p-5 backdrop-blur-sm"><div className="w-full max-w-sm border border-cyan-200/20 bg-[#0b101a]/85 p-6 text-center shadow-2xl"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-cyan-200/30 bg-cyan-200/10 text-cyan-100"><Camera size={20} /></div><h2 className="mt-4 text-xl font-medium" dir="rtl">خطوط بين الأصابع</h2><p className="mt-2 text-sm leading-6 text-white/55" dir="rtl">شغّل الكاميرا، ثم ارفع اليدين. سيظهر لكل زوج من الأصابع خط بلون مستقل.</p><button onClick={startHandTracking} disabled={cameraState === "loading"} className="mt-5 flex w-full items-center justify-center gap-2 bg-cyan-200 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#061019] transition hover:bg-white disabled:cursor-wait disabled:opacity-60"><Camera size={15} /> {cameraState === "loading" ? "starting camera" : "enable camera"}</button></div></div>}
    </main>
  );
}
