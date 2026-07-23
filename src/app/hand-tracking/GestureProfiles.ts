import type { GestureForces, GestureTriggers } from "./types";

export interface GestureGuideItem {
  gesture: string;
  action: string;
}

export interface GestureProfile {
  title: string;
  titleAr: string;
  items: GestureGuideItem[];
}

export const GESTURE_PROFILES: Record<string, GestureProfile> = {
  "/": {
    title: "Navigate", titleAr: "تصفح", items: [
      { gesture: "🤏 قرص بإصبعين", action: "تكبير / تصغير الصفحة" },
    ],
  },
  "/particles": {
    title: "Aether", titleAr: "الجسيمات", items: [
      { gesture: "🖐 كف مفتوح", action: "دفع وتدوير الجسيمات" },
      { gesture: "🤏 قرص", action: "شحن ثم انفجار" },
      { gesture: "✊ قبضة", action: "ثقب أسود" },
      { gesture: "✌ سلام", action: "وضع الكاميرا التلقائي" },
      { gesture: "↔ ابعد يديك", action: "تكبير والدخول للعنصر" },
      { gesture: "🙌 يدان قريبتان", action: "تصغير والخروج" },
    ],
  },
  "/universe": {
    title: "Cosmos", titleAr: "الكون", items: [
      { gesture: "🖐 كف مفتوح", action: "دوران حول المشهد" },
      { gesture: "☝ إشارة", action: "تحديد كوكب" },
      { gesture: "🤏 قرص", action: "الانتقال إلى الكوكب" },
      { gesture: "🙌 يدان", action: "تكبير وتصغير وتدوير" },
      { gesture: "👍 / 👎", action: "اقتراب / ابتعاد" },
    ],
  },
  "/worlds": {
    title: "Magic Worlds", titleAr: "العوالم", items: [
      { gesture: "☝ إشارة", action: "توجيه الكاميرا حسب اتجاه الإصبع" },
      { gesture: "🙌 يدان", action: "مجال رؤية أوسع أو أقرب" },
      { gesture: "🤏 قرص", action: "شحن تعويذة ثم إطلاقها" },
      { gesture: "✊ قبضة", action: "ثقب أسود" },
      { gesture: "👍 / 👎", action: "العالم التالي / السابق" },
    ],
  },
  "/magic": {
    title: "Magic Studio", titleAr: "الاستوديو", items: [
      { gesture: "🖐 كف مفتوح", action: "تحريك الحقل" },
      { gesture: "☝ إشارة", action: "جذب الجسيمات" },
      { gesture: "🤏 قرص", action: "شحن انفجار" },
      { gesture: "✌ سلام", action: "الشكل التالي" },
      { gesture: "👍 / 👎", action: "لوحة الألوان" },
    ],
  },
  "/magic-lab": {
    title: "Magic Lab", titleAr: "مختبر اليد", items: [
      { gesture: "🖐 كف مفتوح", action: "تحريك حقل اليد" },
      { gesture: "🤏 قرص", action: "شحن الانفجار" },
      { gesture: "🙌 يدان", action: "ضغط أو تدوير" },
    ],
  },
  "/finger-threads": {
    title: "Chromatic Lines", titleAr: "خيوط الأصابع", items: [
      { gesture: "👐 اليدان", action: "خطوط حية بين الأصابع المتطابقة" },
      { gesture: "↔ تحريك اليدين", action: "تشكيل الخطوط والألوان" },
    ],
  },
  "/docs": {
    title: "Docs", titleAr: "الوثائق", items: [
      { gesture: "🤏 قرص بإصبعين", action: "تكبير / تصغير الوثائق" },
    ],
  },
};

const inactiveForces = (): GestureForces => ({
  openPalmRepel: { active: false, nx: 0.5, ny: 0.5, nz: 0 },
  blackHole: { active: false, nx: 0.5, ny: 0.5 },
  magnetPoint: { active: false, nx: 0.5, ny: 0.5 },
  pinchCharge: { active: false, nx: 0.5, ny: 0.5, charge: 0, justReleased: false },
  palmRotation: { active: false, deltaRotY: 0, deltaRotX: 0 },
  twoHandScale: { active: false, scaleDelta: 0 },
  twoHandRotate: { active: false, angleDelta: 0 },
  bothPinchCompress: { active: false, strength: 0 },
  pinchZoom: { active: false, delta: 0, scale: 0 },
  handScale: { active: false, targetScale: 1 },
  palmAnchor: { active: false, nx: 0.5, ny: 0.5, nz: 0 },
  pointDir: { active: false, dx: 0, dy: 0 },
});

const inactiveTriggers = (): GestureTriggers => ({
  thumbsUp: false, thumbsDown: false, peace: false, threeFingers: false,
  fourFingers: false, fiveFingerHeld: false, supernova: false, randomize: false,
  bothPinchRelease: false, toggleAutoCamera: false,
});

export function gesturesForPath(path: string, source: GestureForces, triggerSource: GestureTriggers): { forces: GestureForces; triggers: GestureTriggers } {
  if (path === "/particles" || path === "/magic" || path === "/magic-lab") return { forces: source, triggers: triggerSource };

  const forces = inactiveForces();
  const triggers = inactiveTriggers();
  const copy = <K extends keyof GestureForces>(key: K) => { forces[key] = source[key] as GestureForces[K]; };
  const copyTrigger = <K extends keyof GestureTriggers>(key: K) => { triggers[key] = triggerSource[key]; };

  if (path === "/universe") {
    ["openPalmRepel", "magnetPoint", "pinchCharge", "pinchZoom", "twoHandScale", "twoHandRotate", "bothPinchCompress"].forEach((key) => copy(key as keyof GestureForces));
    ["thumbsUp", "thumbsDown", "peace", "threeFingers", "fourFingers", "supernova", "randomize", "bothPinchRelease", "toggleAutoCamera"].forEach((key) => copyTrigger(key as keyof GestureTriggers));
  } else if (path === "/worlds") {
    ["openPalmRepel", "pointDir", "blackHole", "pinchCharge", "pinchZoom", "twoHandScale", "twoHandRotate"].forEach((key) => copy(key as keyof GestureForces));
    ["thumbsUp", "thumbsDown", "supernova"].forEach((key) => copyTrigger(key as keyof GestureTriggers));
  } else if (path === "/" || path === "/docs") {
    copy("pinchZoom");
  }
  return { forces, triggers };
}
