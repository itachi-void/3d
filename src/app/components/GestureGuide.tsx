import { useEffect, useState } from "react";
import { ChevronDown, Hand } from "lucide-react";
import { GESTURE_PROFILES } from "../hand-tracking/GestureProfiles";

export function GestureGuide({ path }: { path: string }) {
  const profile = GESTURE_PROFILES[path] ?? GESTURE_PROFILES["/"];
  const [open, setOpen] = useState(true);

  useEffect(() => { setOpen(true); }, [path]);

  return (
    <aside className="pointer-events-auto absolute right-4 top-24 z-[180] w-[min(280px,calc(100vw-2rem))] border border-white/12 bg-[#060914]/80 font-[Outfit,Arial,sans-serif] text-white shadow-[0_16px_48px_rgba(0,0,0,.32)] backdrop-blur-xl md:right-5 md:top-28" aria-label={`دليل التحكم: ${profile.titleAr}`}>
      <button onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition hover:bg-white/5" aria-expanded={open}>
        <span className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center border border-cyan-200/20 bg-cyan-200/10 text-cyan-100"><Hand size={14} /></span><span><span className="block font-mono text-[9px] uppercase tracking-[0.19em] text-cyan-100/70">Gesture guide</span><span className="mt-0.5 block text-sm font-medium" dir="rtl">{profile.titleAr}</span></span></span>
        <ChevronDown size={16} className={`text-white/55 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-white/10 px-3.5 py-2.5">{profile.items.map((item) => <div key={item.gesture} className="grid grid-cols-[94px_1fr] gap-2 border-b border-white/8 py-2 last:border-0"><span className="font-mono text-[9px] leading-4 text-cyan-100/80" dir="rtl">{item.gesture}</span><span className="text-[11px] leading-4 text-white/62" dir="rtl">{item.action}</span></div>)}</div>}
    </aside>
  );
}
