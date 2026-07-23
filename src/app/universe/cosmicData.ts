import type { PlanetData, GalaxyData } from './cosmicTypes';

// Artistic scale — visually appealing, not 1:1 with reality
// All radii and orbit distances in Three.js scene units

export const SOLAR_SYSTEM: PlanetData = {
  id: 'sun',
  name: 'The Sun',
  nameAr: 'الشمس',
  type: 'star',
  orbitRadius: 0, orbitPeriod: 0, orbitInclination: 0, startAngle: 0,
  radius: 2.8,
  axialTilt: 7.25,
  surface: 'star',
  color1: '#ff9500',
  color2: '#ffcc44',
  color3: '#ff4400',
  emissive: true,
  emissiveIntensity: 4.0,
  atmosphere: { color: '#ff8800', scale: 1.25, opacity: 0.18 },
  description: 'The Sun — a G-type main-sequence star at the center of our Solar System',
  descriptionAr: 'الشمس — نجم من النوع G في مركز مجموعتنا الشمسية',
  facts: [
    'Age: 4.6 billion years',
    'Surface temp: 5,500°C',
    'Diameter: 1,392,700 km',
    'Distance to Earth: 149.6 million km',
    'Contains 99.86% of Solar System mass',
  ],
  factsAr: [
    'العمر: 4.6 مليار سنة',
    'درجة حرارة السطح: 5,500°م',
    'القطر: 1,392,700 كم',
    'المسافة للأرض: 149.6 مليون كم',
    'يحتوي 99.86% من كتلة المجموعة الشمسية',
  ],
  moons: [
    // Mercury
    {
      id: 'mercury',
      name: 'Mercury',
      nameAr: 'عطارد',
      type: 'planet',
      orbitRadius: 8.5, orbitPeriod: 0.241, orbitInclination: 7.0, startAngle: 0.8,
      radius: 0.22,
      axialTilt: 0.03,
      surface: 'rocky',
      color1: '#a09080', color2: '#786050', color3: '#c0b0a0',
      description: 'Closest planet to the Sun — a barren, cratered world with extreme temperatures',
      descriptionAr: 'أقرب كوكب للشمس — عالم قاحل مليء بالفوهات مع درجات حرارة متطرفة',
      facts: ['No atmosphere', 'Temp range: -180°C to +430°C', 'Diameter: 4,879 km', 'Year: 88 Earth days', 'No moons'],
      factsAr: ['بلا غلاف جوي', 'نطاق الحرارة: -180°م إلى +430°م', 'القطر: 4,879 كم', 'السنة: 88 يوم أرضي', 'بلا أقمار'],
    },
    // Venus
    {
      id: 'venus',
      name: 'Venus',
      nameAr: 'الزهرة',
      type: 'planet',
      orbitRadius: 13.5, orbitPeriod: 0.615, orbitInclination: 3.39, startAngle: 2.1,
      radius: 0.55,
      axialTilt: 177.4,
      surface: 'venus',
      color1: '#d4a848', color2: '#c07030', color3: '#e8c870',
      atmosphere: { color: '#e8a820', scale: 1.12, opacity: 0.7 },
      description: 'The hottest planet — a hellish world shrouded in thick, toxic clouds',
      descriptionAr: 'أشد الكواكب حرارة — عالم جهنمي مغطى بسحب كثيفة وسامة',
      facts: ['Hottest planet: 465°C avg', 'Diameter: 12,104 km', 'Year: 225 Earth days', 'Spins backwards', 'Crushing 90x Earth pressure'],
      factsAr: ['أشد الكواكب حرارة: 465°م', 'القطر: 12,104 كم', 'السنة: 225 يوم أرضي', 'يدور عكس الاتجاه', 'ضغط 90 ضعف ضغط الأرض'],
    },
    // Earth
    {
      id: 'earth',
      name: 'Earth',
      nameAr: 'الأرض',
      type: 'planet',
      orbitRadius: 19, orbitPeriod: 1.0, orbitInclination: 0.0, startAngle: 4.2,
      radius: 0.58,
      axialTilt: 23.44,
      surface: 'earth',
      color1: '#1a6ba0', color2: '#2d9e4a', color3: '#e8e8e8',
      atmosphere: { color: '#4488ff', scale: 1.08, opacity: 0.35 },
      description: 'Our home — the only known world harboring life',
      descriptionAr: 'موطننا — العالم الوحيد المعروف الذي يحتضن الحياة',
      facts: ['Age: 4.54 billion years', 'Diameter: 12,742 km', '71% covered by water', 'One moon', 'Average temp: 15°C'],
      factsAr: ['العمر: 4.54 مليار سنة', 'القطر: 12,742 كم', '71% مغطى بالماء', 'قمر واحد', 'متوسط الحرارة: 15°م'],
      moons: [
        {
          id: 'moon',
          name: 'The Moon',
          nameAr: 'القمر',
          type: 'moon',
          orbitRadius: 2.2, orbitPeriod: 0.075, orbitInclination: 5.14, startAngle: 1.0,
          radius: 0.15,
          axialTilt: 6.68,
          surface: 'moon',
          color1: '#a0a0a0', color2: '#808080', color3: '#c0c0c0',
          description: "Earth's natural satellite — the fifth largest moon in the Solar System",
          descriptionAr: 'القمر الطبيعي للأرض — خامس أكبر قمر في المجموعة الشمسية',
          facts: ['Diameter: 3,474 km', 'Distance: 384,400 km', 'Period: 27.3 days', 'No atmosphere', 'Tidally locked to Earth'],
          factsAr: ['القطر: 3,474 كم', 'المسافة: 384,400 كم', 'الدورة: 27.3 يوم', 'بلا غلاف جوي', 'مقفل تزامنياً مع الأرض'],
        },
      ],
    },
    // Mars
    {
      id: 'mars',
      name: 'Mars',
      nameAr: 'المريخ',
      type: 'planet',
      orbitRadius: 27, orbitPeriod: 1.881, orbitInclination: 1.85, startAngle: 1.5,
      radius: 0.35,
      axialTilt: 25.19,
      surface: 'rocky',
      color1: '#c1440e', color2: '#8c2a08', color3: '#d4724c',
      atmosphere: { color: '#c07030', scale: 1.04, opacity: 0.12 },
      description: 'The Red Planet — a cold desert with the tallest mountain in the Solar System',
      descriptionAr: 'الكوكب الأحمر — صحراء باردة تحتضن أعلى جبل في المجموعة الشمسية',
      facts: ['Tallest volcano: Olympus Mons (21km)', 'Diameter: 6,779 km', 'Year: 687 Earth days', '2 small moons', 'Avg temp: -63°C'],
      factsAr: ['أعلى بركان: أوليمبوس مونس (21كم)', 'القطر: 6,779 كم', 'السنة: 687 يوم أرضي', 'قمران صغيران', 'متوسط الحرارة: -63°م'],
      moons: [
        { id: 'phobos', name: 'Phobos', nameAr: 'فوبوس', type: 'moon', orbitRadius: 0.8, orbitPeriod: 0.00865, orbitInclination: 1.08, startAngle: 0, radius: 0.06, axialTilt: 0, surface: 'moon', color1: '#806050', color2: '#604030', description: 'Closest Martian moon', descriptionAr: 'أقرب قمري المريخ', facts: [], factsAr: [] },
        { id: 'deimos', name: 'Deimos', nameAr: 'ديموس', type: 'moon', orbitRadius: 1.4, orbitPeriod: 0.034, orbitInclination: 1.79, startAngle: 3.0, radius: 0.04, axialTilt: 0, surface: 'moon', color1: '#807060', color2: '#605040', description: 'Outer Martian moon', descriptionAr: 'القمر الخارجي للمريخ', facts: [], factsAr: [] },
      ],
    },
    // Asteroid Belt (represented as a torus)
    {
      id: 'asteroid_belt',
      name: 'Asteroid Belt',
      nameAr: 'حزام الكويكبات',
      type: 'belt',
      orbitRadius: 35, orbitPeriod: 0, orbitInclination: 0, startAngle: 0,
      radius: 0.08,
      axialTilt: 0,
      surface: 'rocky',
      color1: '#807060', color2: '#605040',
      description: 'A region between Mars and Jupiter containing millions of rocky objects',
      descriptionAr: 'منطقة بين المريخ والمشتري تحتوي على ملايين الأجسام الصخرية',
      facts: ['Contains millions of asteroids', 'Total mass < 4% of Moon', 'Mostly silicate rock', 'Ceres is the largest body'],
      factsAr: ['يحتوي ملايين الكويكبات', 'الكتلة الكلية أقل من 4% من القمر', 'معظمها صخور سيليكاتية', 'سيريس أكبر جسم فيه'],
    },
    // Jupiter
    {
      id: 'jupiter',
      name: 'Jupiter',
      nameAr: 'المشتري',
      type: 'planet',
      orbitRadius: 52, orbitPeriod: 11.86, orbitInclination: 1.3, startAngle: 0.3,
      radius: 2.0,
      axialTilt: 3.13,
      surface: 'gas',
      color1: '#c88040', color2: '#a06030', color3: '#e8b878',
      atmosphere: { color: '#d49060', scale: 1.05, opacity: 0.15 },
      description: "The Solar System's largest planet — a giant storm world with 95 known moons",
      descriptionAr: 'أكبر كواكب المجموعة الشمسية — عالم عواصف عملاق مع 95 قمراً معروفاً',
      facts: ['Diameter: 142,984 km', 'Mass: 318× Earth', 'Great Red Spot: 400yr storm', '95 known moons', 'Day: 9.9 hours'],
      factsAr: ['القطر: 142,984 كم', 'الكتلة: 318 ضعف الأرض', 'البقعة الحمراء: عاصفة 400 سنة', '95 قمراً معروفاً', 'اليوم: 9.9 ساعة'],
      moons: [
        { id: 'io', name: 'Io', nameAr: 'إيو', type: 'moon', orbitRadius: 3.2, orbitPeriod: 0.00484, orbitInclination: 0.05, startAngle: 0.5, radius: 0.22, axialTilt: 0, surface: 'venus', color1: '#e8c030', color2: '#d04010', color3: '#f0e050', description: 'Most volcanically active body in Solar System', descriptionAr: 'الجسم الأكثر نشاطاً بركانياً في المجموعة الشمسية', facts: ['Over 400 active volcanoes'], factsAr: ['أكثر من 400 بركان نشط'] },
        { id: 'europa', name: 'Europa', nameAr: 'يوروبا', type: 'moon', orbitRadius: 5.0, orbitPeriod: 0.00972, orbitInclination: 0.47, startAngle: 2.0, radius: 0.19, axialTilt: 0.1, surface: 'ice', color1: '#c8d8e8', color2: '#a0b8d0', description: 'Ice-covered ocean world — potential habitat for life', descriptionAr: 'عالم بمحيط مغطى بالجليد — موطن محتمل للحياة', facts: ['Subsurface liquid ocean', 'Likely twice Earth water volume'], factsAr: ['محيط سائل تحت السطح', 'ضعف حجم مياه الأرض تقريباً'] },
        { id: 'ganymede', name: 'Ganymede', nameAr: 'غانيميد', type: 'moon', orbitRadius: 7.5, orbitPeriod: 0.0196, orbitInclination: 0.20, startAngle: 4.5, radius: 0.27, axialTilt: 0, surface: 'ice', color1: '#9090a0', color2: '#707080', description: "Largest moon in the Solar System — bigger than Mercury", descriptionAr: 'أكبر قمر في المجموعة الشمسية — أكبر من عطارد', facts: ['Largest moon in Solar System', 'Has its own magnetic field'], factsAr: ['أكبر قمر في المجموعة الشمسية', 'له مجال مغناطيسي خاص'] },
        { id: 'callisto', name: 'Callisto', nameAr: 'كاليستو', type: 'moon', orbitRadius: 10.5, orbitPeriod: 0.0457, orbitInclination: 0.19, startAngle: 1.2, radius: 0.24, axialTilt: 0, surface: 'moon', color1: '#706868', color2: '#504848', description: 'Most heavily cratered object in Solar System', descriptionAr: 'الجسم الأكثر تشابكاً بالفوهات في المجموعة الشمسية', facts: ['Surface age: 4 billion years'], factsAr: ['عمر السطح: 4 مليار سنة'] },
      ],
    },
    // Saturn
    {
      id: 'saturn',
      name: 'Saturn',
      nameAr: 'زحل',
      type: 'planet',
      orbitRadius: 75, orbitPeriod: 29.46, orbitInclination: 2.49, startAngle: 5.2,
      radius: 1.7,
      axialTilt: 26.73,
      surface: 'gas',
      color1: '#d4c090', color2: '#b8a070', color3: '#e8d8a8',
      atmosphere: { color: '#d0b880', scale: 1.04, opacity: 0.12 },
      rings: { innerR: 2.1, outerR: 4.8, color: '#c8b880', opacity: 0.7 },
      description: "The ringed jewel of the Solar System — a gas giant with spectacular icy rings",
      descriptionAr: 'جوهرة المجموعة الشمسية — عملاق غازي بحلقات جليدية مذهلة',
      facts: ['Ring diameter: 282,000 km', 'Diameter: 120,536 km', 'Least dense planet — floats on water!', '146 known moons', 'Day: 10.7 hours'],
      factsAr: ['قطر الحلقات: 282,000 كم', 'القطر: 120,536 كم', 'أقل الكواكب كثافة — يطفو على الماء!', '146 قمراً معروفاً', 'اليوم: 10.7 ساعة'],
      moons: [
        { id: 'titan', name: 'Titan', nameAr: 'تيتان', type: 'moon', orbitRadius: 4.5, orbitPeriod: 0.0437, orbitInclination: 0.33, startAngle: 2.8, radius: 0.24, axialTilt: 0, surface: 'venus', color1: '#c89040', color2: '#a06820', atmosphere: { color: '#d09030', scale: 1.12, opacity: 0.55 }, description: "Saturn's largest moon — has rivers and lakes of liquid methane", descriptionAr: 'أكبر أقمار زحل — له أنهار وبحيرات من الميثان السائل', facts: ['Thick nitrogen atmosphere', 'Liquid methane lakes'], factsAr: ['غلاف جوي كثيف من النيتروجين', 'بحيرات ميثان سائل'] },
        { id: 'enceladus', name: 'Enceladus', nameAr: 'إنسيلادوس', type: 'moon', orbitRadius: 2.8, orbitPeriod: 0.0130, orbitInclination: 0.0, startAngle: 0.5, radius: 0.09, axialTilt: 0, surface: 'ice', color1: '#e8f0f8', color2: '#c8d8e8', description: 'Geysers of water vapor shoot into space from the south pole', descriptionAr: 'ينابيع بخار ماء تنطلق إلى الفضاء من القطب الجنوبي', facts: ['Active water geysers', 'Subsurface ocean'], factsAr: ['ينابيع ماء نشطة', 'محيط تحت السطح'] },
      ],
    },
    // Uranus
    {
      id: 'uranus',
      name: 'Uranus',
      nameAr: 'أورانوس',
      type: 'planet',
      orbitRadius: 90, orbitPeriod: 84.01, orbitInclination: 0.77, startAngle: 3.8,
      radius: 1.0,
      axialTilt: 97.77,
      surface: 'ice',
      color1: '#72c8d8', color2: '#50a8c0', color3: '#90d8e8',
      atmosphere: { color: '#80d8e8', scale: 1.06, opacity: 0.3 },
      rings: { innerR: 1.4, outerR: 1.9, color: '#708090', opacity: 0.25 },
      description: 'The sideways planet — rotates on its side with a dramatic 98° axial tilt',
      descriptionAr: 'الكوكب الجانبي — يدور على جانبه بميل محوري 98°',
      facts: ['Rotates on its side', 'Coldest atmosphere: -224°C', 'Diameter: 51,118 km', '28 known moons', 'Year: 84 Earth years'],
      factsAr: ['يدور على جانبه', 'أبرد غلاف جوي: -224°م', 'القطر: 51,118 كم', '28 قمراً معروفاً', 'السنة: 84 سنة أرضية'],
    },
    // Neptune
    {
      id: 'neptune',
      name: 'Neptune',
      nameAr: 'نبتون',
      type: 'planet',
      orbitRadius: 105, orbitPeriod: 164.8, orbitInclination: 1.77, startAngle: 1.1,
      radius: 0.95,
      axialTilt: 28.32,
      surface: 'ice',
      color1: '#2050c8', color2: '#1030a0', color3: '#3070e0',
      atmosphere: { color: '#3060d8', scale: 1.06, opacity: 0.35 },
      description: 'The windiest planet — supersonic storms up to 2,100 km/h',
      descriptionAr: 'الكوكب الأشد رياحاً — عواصف بسرعة 2,100 كم/ساعة',
      facts: ['Fastest winds: 2,100 km/h', 'Diameter: 49,528 km', '16 known moons', 'Year: 165 Earth years', 'Has a Great Dark Spot'],
      factsAr: ['أسرع رياح: 2,100 كم/س', 'القطر: 49,528 كم', '16 قمراً معروفاً', 'السنة: 165 سنة أرضية', 'له بقعة مظلمة كبيرة'],
      moons: [
        { id: 'triton', name: 'Triton', nameAr: 'تريتون', type: 'moon', orbitRadius: 2.5, orbitPeriod: 0.0160, orbitInclination: 157, startAngle: 0, radius: 0.18, axialTilt: 0, surface: 'ice', color1: '#c8d8e0', color2: '#a0b8c8', description: 'Orbits backwards — captured from the Kuiper Belt', descriptionAr: 'يدور عكس الاتجاه — ملتقط من حزام كويبر', facts: ['Retrograde orbit', 'Active nitrogen geysers'], factsAr: ['مدار رجعي', 'ينابيع نيتروجين نشطة'] },
      ],
    },
    // Pluto
    {
      id: 'pluto',
      name: 'Pluto',
      nameAr: 'بلوتو',
      type: 'dwarf',
      orbitRadius: 118, orbitPeriod: 248.0, orbitInclination: 17.14, startAngle: 5.8,
      radius: 0.2,
      axialTilt: 122.5,
      surface: 'ice',
      color1: '#c8b898', color2: '#a09070', color3: '#d8c8a8',
      description: 'The most famous dwarf planet — demoted in 2006, beloved by many',
      descriptionAr: 'الكوكب القزم الأشهر — تم تصنيفه تغييراً في 2006',
      facts: ['Diameter: 2,377 km', 'Has 5 moons (Charon is huge)', 'Heart-shaped nitrogen glacier', 'Year: 248 Earth years'],
      factsAr: ['القطر: 2,377 كم', 'له 5 أقمار (شارون ضخم)', 'نهر جليدي بشكل قلب من النيتروجين', 'السنة: 248 سنة أرضية'],
    },
  ],
};

export const GALAXY_CONFIG: GalaxyData = {
  numStars: 120_000,
  numArms: 4,
  armAngle: Math.PI * 0.6,
  spread: 0.18,
  radius: 220,
  bulgeRadius: 28,
};

// Other galaxies in universe view
export interface GalaxySprite {
  id: string;
  name: string;
  nameAr: string;
  position: [number, number, number];
  color: string;
  size: number;
  type: 'spiral' | 'elliptical' | 'irregular';
  distance: string;
  description: string;
  descriptionAr: string;
}

export const UNIVERSE_GALAXIES: GalaxySprite[] = [
  { id: 'milky_way', name: 'Milky Way', nameAr: 'درب التبانة', position: [0, 0, 0], color: '#88aaff', size: 18, type: 'spiral', distance: 'Our home galaxy', description: 'Our home galaxy — a barred spiral containing ~200-400 billion stars', descriptionAr: 'مجرتنا — حلزونية تحتوي 200-400 مليار نجم' },
  { id: 'andromeda', name: 'Andromeda (M31)', nameAr: 'أندروميدا (M31)', position: [680, 40, -120], color: '#ffddaa', size: 22, type: 'spiral', distance: '2.537 million light-years', description: 'Nearest large galaxy — heading toward us at 110 km/s, will collide in ~4.5 billion years', descriptionAr: 'أقرب مجرة كبيرة — تتجه نحونا بسرعة 110 كم/ث، ستصطدم خلال 4.5 مليار سنة' },
  { id: 'triangulum', name: 'Triangulum (M33)', nameAr: 'المثلث (M33)', position: [840, -60, 80], color: '#aaccff', size: 10, type: 'spiral', distance: '2.73 million light-years', description: 'Third largest galaxy in the Local Group', descriptionAr: 'ثالث أكبر مجرة في المجموعة المحلية' },
  { id: 'lmc', name: 'Large Magellanic Cloud', nameAr: 'سحابة ماجلان الكبيرة', position: [-220, -180, 60], color: '#ffbbcc', size: 8, type: 'irregular', distance: '163,000 light-years', description: 'A satellite galaxy of the Milky Way — visible from Southern Hemisphere', descriptionAr: 'مجرة تابعة لدرب التبانة — مرئية من نصف الكرة الجنوبي' },
  { id: 'smc', name: 'Small Magellanic Cloud', nameAr: 'سحابة ماجلان الصغيرة', position: [-200, -220, 40], color: '#ffccdd', size: 5, type: 'irregular', distance: '200,000 light-years', description: 'Dwarf irregular galaxy — companion to the Milky Way', descriptionAr: 'مجرة قزمية غير منتظمة — رفيقة لدرب التبانة' },
  { id: 'm81', name: 'Bode\'s Galaxy (M81)', nameAr: 'مجرة بود (M81)', position: [320, 280, -400], color: '#ddbbff', size: 12, type: 'spiral', distance: '11.8 million light-years', description: 'One of the brightest galaxies visible from Earth', descriptionAr: 'من أبرز المجرات المرئية من الأرض' },
  { id: 'm82', name: 'Cigar Galaxy (M82)', nameAr: 'مجرة السيجار (M82)', position: [340, 300, -390], color: '#ffaa88', size: 7, type: 'irregular', distance: '12 million light-years', description: 'Starburst galaxy — forming stars 10x faster than the Milky Way', descriptionAr: 'مجرة انفجار نجمي — تُشكّل نجوماً أسرع 10 مرات من درب التبانة' },
  { id: 'sombrero', name: 'Sombrero Galaxy (M104)', nameAr: 'مجرة السومبريرو (M104)', position: [-580, -120, 260], color: '#aaddff', size: 11, type: 'elliptical', distance: '31.1 million light-years', description: 'Has a brilliant white core and a dark dust lane forming its signature hat shape', descriptionAr: 'قلب أبيض لامع وشريط من الغبار يشكل شكل القبعة المميزة' },
  { id: 'whirlpool', name: 'Whirlpool Galaxy (M51)', nameAr: 'مجرة الدوامة (M51)', position: [420, 360, -500], color: '#88ffcc', size: 9, type: 'spiral', distance: '31 million light-years', description: 'Grand design spiral interacting with a companion galaxy', descriptionAr: 'حلزونية رائعة تتفاعل مع مجرة رفيقة' },
  { id: 'centaurus', name: 'Centaurus A', nameAr: 'قنطورس A', position: [-300, -400, 180], color: '#ffcc44', size: 14, type: 'elliptical', distance: '13.7 million light-years', description: 'Closest radio galaxy to Earth — contains an active supermassive black hole', descriptionAr: 'أقرب مجرة راديوية للأرض — تحتوي ثقباً أسود ضخماً نشطاً' },
];
