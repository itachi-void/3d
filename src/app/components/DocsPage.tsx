import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';

// ─── Document data ───────────────────────────────────────────────────────────

interface DocSection {
  heading: string;
  content: string[];      // paragraphs / items
  type: 'text' | 'list' | 'grid' | 'flow';
}

interface DocTab {
  id: string;
  icon: string;
  title: string;
  titleAr: string;
  color: string;
  sections: DocSection[];
}

const DOCS: DocTab[] = [
  {
    id: 'vision',
    icon: '🧭',
    title: 'Project Vision',
    titleAr: 'رؤية المشروع',
    color: '#fbbf24',
    sections: [
      {
        heading: 'MISSION',
        type: 'text',
        content: [
          'Build an award-winning interactive 3D web experience that feels like Doctor Strange meets Minority Report meets an Unreal Engine Tech Demo.',
          'The application must not feel like a demo. It should feel like a real product built by a professional graphics engineer.',
          'Every movement, animation, interaction, and transition should feel premium. The user should immediately feel like they possess magical powers.',
        ],
      },
      {
        heading: 'PRIMARY GOALS',
        type: 'list',
        content: [
          '① Amazing Visual Quality',
          '② Smooth Performance',
          '③ Natural Hand Interaction',
          '④ Cinematic Camera',
          '⑤ Realistic Physics',
          '⑥ Immersive Environment',
          '⑦ Beautiful Animations',
          '⑧ Production Quality Code',
        ],
      },
      {
        heading: 'TECHNOLOGY STACK',
        type: 'grid',
        content: [
          'TypeScript', 'Three.js', 'React + Vite', 'GLSL Shaders',
          'GPU Instancing', 'Post Processing', 'GSAP', 'MediaPipe Vision',
          'Physics Engine', 'Web Workers', 'Draco Compression', 'HDR Environment Maps',
          'Frustum Culling', 'LOD', 'Instanced Rendering', 'WebGPU (if available)',
        ],
      },
      {
        heading: 'VISUAL STYLE',
        type: 'grid',
        content: [
          'Hyper cinematic', 'Dark fantasy', 'Mystical', 'Physically based',
          'Volumetric atmosphere', 'High contrast', 'Film quality', 'Soft bloom',
          'Warm sunlight', 'Cold shadows', 'Natural colors', 'Realistic materials',
        ],
      },
      {
        heading: 'WORLD #1 — THE ANCIENT TEMPLE',
        type: 'list',
        content: [
          'Dense forest with ancient forgotten temple',
          'Large broken pillars, massive stone gate',
          'Flying leaves, birds, wind, dust particles, fog',
          'Sun rays passing through trees, fire torches',
          'Floating magical rocks, interactive statues',
          'Water pool with small waterfall',
          'Ancient glowing symbols — everything casts shadows',
        ],
      },
      {
        heading: 'WORLD #2 — MAGIC CASTLE',
        type: 'list',
        content: ['Large castle with magic library', 'Floating books and flying papers', 'Crystal balls, magic mirrors, spell circles', 'Magic candles, interactive potions', 'Floating stairs, secret doors, magic elevators'],
      },
      {
        heading: 'WORLD #3 — SCI-FI LAB',
        type: 'list',
        content: ['Futuristic laboratory with energy reactors', 'Floating holograms, robotic arms', 'Laser barriers, energy cubes, power cores', 'Moving platforms, interactive consoles', 'Transparent displays'],
      },
      {
        heading: 'WORLD #4 — SPACE STATION',
        type: 'list',
        content: ['Orbiting Earth with stars and nebulas', 'Planets, asteroids, satellites', 'Black holes, floating debris', 'Space dust, zero gravity'],
      },
      {
        heading: 'WORLD #5 — UNDERWATER',
        type: 'list',
        content: ['Ocean floor with fish and corals', 'Sea plants, bubbles, caustic lighting', 'Swimming creatures, sand movement', 'Floating particles, interactive water currents'],
      },
      {
        heading: 'WORLD TRANSITIONS',
        type: 'flow',
        content: ['Portal opens', 'Camera flies through', 'Environment morphs', 'Lighting changes', 'Particles transform', 'Music fades', 'Ambient sounds change'],
      },
      {
        heading: 'DAY / NIGHT SYSTEM',
        type: 'grid',
        content: ['Morning', 'Noon', 'Sunset', 'Night', 'Moonlight', 'Storm Night', 'Dynamic Sky', 'Moving Sun'],
      },
    ],
  },
  {
    id: 'hands',
    icon: '✋',
    title: 'Hand Tracking',
    titleAr: 'التتبع باليد',
    color: '#60a5fa',
    sections: [
      {
        heading: 'TRACKING SYSTEM',
        type: 'text',
        content: [
          'The entire application is controlled using hand gestures. MediaPipe Tasks Vision tracks both hands with full joint-level precision.',
          'Track: Left & Right Hand · Wrist · Palm Center · Palm Rotation · Palm Normal · Every Finger Joint · Fingertips · Hand Velocity · Direction · Distance Between Hands · Confidence',
        ],
      },
      {
        heading: 'TRACKING QUALITY REQUIREMENTS',
        type: 'list',
        content: [
          'No jitter — use interpolation and exponential smoothing',
          'No sudden jumps — use damping and prediction to reduce latency',
          'Ignore accidental detections — confidence thresholds',
          'Switch gestures only after they remain stable for N frames',
          'Prevent flickering — 6-frame stabilization window',
        ],
      },
      {
        heading: 'ONE-HAND GESTURES',
        type: 'list',
        content: [
          '✋ Open Palm — Move: orbit camera · Rotate: rotate object · Hold 2s: Exploration Mode',
          '✊ Closed Fist — Create Black Hole, particles spiral inward, release: everything returns',
          '🤏 Pinch — Grab & move objects · Hold: charge magic energy · Release: explosion + shockwave',
          '☝️ Point — Create magical pointer, highlight object, after 1s: camera focuses and object glows',
          '👍 Thumbs Up — Switch world (Temple → Castle → Sci-Fi → Ocean → Space)',
          '👎 Thumbs Down — Reset current scene, restore objects, reset weather & physics',
          '✌️ Peace Sign — Toggle Interaction Mode ↔ Exploration Mode',
          '👌 OK Sign — Create Portal, connects to another world, cinematic transition',
          '🤟 Rock Gesture — Spawn Lightning, strikes where user points, scorches terrain',
        ],
      },
      {
        heading: 'TWO-HAND GESTURES',
        type: 'list',
        content: [
          'Hands Apart — Zoom In · Increase object/portal size · Increase magic energy',
          'Hands Together — Zoom Out · Compress energy · Shrink object',
          'Move Both Hands — Move selected object · Move camera · Move portal',
          'Rotate Both Hands — Rotate entire world · Rotate sky · Rotate environment',
          'Double Pinch — Create Energy Sphere, grows/compresses with hand distance, Release: Supernova',
        ],
      },
      {
        heading: 'ADVANCED GESTURE DRAWING',
        type: 'list',
        content: [
          '⭕ Circle — Create Portal',
          '△ Triangle — Create Energy Shield',
          '□ Square — Spawn Magic Platform',
          '🌀 Spiral — Create Tornado',
          '∞ Infinity — Enter God Mode',
          '★ Star — Summon Meteor Shower',
          '✕ X — Destroy selected object',
          '♥ Heart — Environment becomes peaceful, weather clears',
        ],
      },
      {
        heading: 'MAGIC COMBINATIONS',
        type: 'list',
        content: [
          'Open Palm + Point → Telekinesis — move objects remotely',
          'Fist + Point → Lightning Beam',
          'Pinch + Rotate Wrist → Energy Drill',
          'Two Open Palms → Shockwave Dome',
          'Two Fists → Gravity Collapse — everything flies inward',
        ],
      },
      {
        heading: 'CAMERA SYSTEM',
        type: 'list',
        content: [
          'Camera must feel like a cinematic drone — never instant movement',
          'Open Palm → Orbit around world',
          'Move Hand Left/Right → Orbit Left/Right',
          'Move Hand Up/Down → Camera rises/lowers',
          'Move Hand Forward/Backward → Move through scene',
          'Rotate Wrist → Camera roll',
          'Pinch + Drag → Grab camera, move freely',
          'Point at object 1s → Lock-On: smooth orbit around object',
          'Camera features: inertia · damping · smooth transitions · collision avoidance · dynamic FOV',
        ],
      },
    ],
  },
  {
    id: 'magic',
    icon: '✨',
    title: 'Magic Engine',
    titleAr: 'محرك السحر',
    color: '#c084fc',
    sections: [
      {
        heading: 'MAGIC SYSTEM OVERVIEW',
        type: 'text',
        content: [
          'Magic is not a visual effect — it is a complete interaction system. Every spell affects: Particles · Physics · Environment · Camera · Lighting · Audio · Weather · Objects · NPCs.',
          'All magical actions must feel powerful. Nothing should look fake.',
        ],
      },
      {
        heading: 'ENERGY SYSTEM',
        type: 'list',
        content: [
          'Unlimited magical energy — every spell generates visible energy',
          'Energy appears as: floating particles · energy ribbons · sparks · smoke · heat distortion · dynamic light',
          'Temple: Gold  |  Castle: Purple  |  Sci-Fi: Blue  |  Space: White  |  Ocean: Cyan',
        ],
      },
      {
        heading: 'TELEKINESIS',
        type: 'flow',
        content: ['Point at object', 'Object highlights', 'Pinch to grab', 'Move hand — object follows with inertia', 'Release — object keeps momentum', 'Object collides with environment'],
      },
      {
        heading: 'OBJECT INTERACTION',
        type: 'grid',
        content: ['Grab', 'Throw', 'Rotate', 'Scale', 'Duplicate', 'Destroy', 'Freeze', 'Burn', 'Electrify', 'Float', 'Collide', 'Stack'],
      },
      {
        heading: 'DESTRUCTION SYSTEM',
        type: 'list',
        content: [
          'Stone Pillars — crack, break into fragments, dust appears, ground shakes',
          'Trees — lose leaves, branches break',
          'Doors — can explode',
          'Glass — shatters realistically',
          'Statues — lose pieces, reveal hidden rooms',
        ],
      },
      {
        heading: 'BLACK HOLE',
        type: 'list',
        content: [
          'Closed fist creates Black Hole at hand position',
          'Particles spiral inward · Leaves fly · Dust rotates · Objects pulled in',
          'Fire bends · Light bends · Camera slightly shakes · Portal distorts',
          'Release: everything slowly returns to original position',
        ],
      },
      {
        heading: 'ELEMENTAL MAGIC',
        type: 'list',
        content: [
          '⚡ Lightning — Rock gesture + point, strikes ground, flash + thunder + burn marks + smoke',
          '🔥 Fire — Hold energy, fire appears, follows hand, spreads to wood/grass/torches, rain reduces it',
          '💧 Water — Open palm over water, generate waves, create sphere, launch projectile, extinguishes fire',
          '❄️ Ice — Freeze water/objects, create ice spikes, frozen objects break differently',
          '💨 Wind — Quick swipe, wind blast, moves clouds/fog/grass/leaves',
          '🌍 Earth — Raise hand, ground rises, stone walls emerge, rocks float, bridges form',
        ],
      },
      {
        heading: 'PORTAL SYSTEM',
        type: 'flow',
        content: ['Draw circle', 'Portal slowly forms with depth + glow + particles + distortion', 'Camera enters portal', 'Environment transforms', 'No loading screen — seamless transition'],
      },
      {
        heading: 'MAGIC COMBINATIONS',
        type: 'list',
        content: [
          'Lightning + Rain → Electric Storm',
          'Fire + Wind → Fire Tornado',
          'Water + Ice → Frozen Lake',
          'Earth + Lightning → Explosive Rocks',
          'Black Hole + Portal → Space Distortion',
        ],
      },
      {
        heading: 'CHAIN REACTIONS',
        type: 'flow',
        content: ['Throw rock', 'Hits pillar', 'Pillar breaks', 'Debris hits torch', 'Torch falls', 'Fire spreads', 'Smoke rises', 'Birds fly away', 'Camera reacts'],
      },
      {
        heading: 'NPC REACTIONS',
        type: 'list',
        content: [
          'Explosion → NPC runs away',
          'Lightning → NPC looks upward',
          'Portal → NPC investigates',
          'Fire → NPC panics',
          'Black Hole → NPC attempts escape',
        ],
      },
      {
        heading: 'PHYSICS ENGINE',
        type: 'grid',
        content: ['Rigid Bodies', 'Soft Bodies', 'Gravity', 'Momentum', 'Mass', 'Friction', 'Bounce', 'Constraints', 'Collision Detection', 'Stacking', 'Wind Force', 'Magic Fields'],
      },
    ],
  },
  {
    id: 'graphics',
    icon: '🎨',
    title: 'Graphics & Audio & UI',
    titleAr: 'الجرافيك والصوت والواجهة',
    color: '#f472b6',
    sections: [
      {
        heading: 'RENDERING',
        type: 'list',
        content: [
          'Target: Unreal Engine 5 quality in the browser — nothing should feel like a prototype',
          'Physically Based Rendering (PBR) with HDR Environment Lighting',
          'ACES Filmic Tone Mapping · Color Grading · Gamma Correction · Linear Workflow',
          'High Resolution Shadows — soft, contact, dynamic, animated',
          'WebGPU if available, optimized WebGL otherwise',
        ],
      },
      {
        heading: 'POST PROCESSING',
        type: 'grid',
        content: [
          'Bloom', 'Selective Bloom', 'Ambient Glow', 'Depth of Field',
          'Screen Space Reflections', 'Chromatic Aberration', 'Vignette', 'Lens Distortion',
          'Lens Dirt', 'Film Grain', 'Color LUT', 'Adaptive Exposure',
          'Motion Blur', 'Volumetric Fog', 'God Rays', 'Light Scattering',
        ],
      },
      {
        heading: 'MATERIALS',
        type: 'grid',
        content: ['Stone', 'Wood', 'Metal', 'Glass', 'Crystal', 'Magic Energy', 'Water', 'Fire', 'Ice', 'Lava', 'Gold', 'Moss'],
      },
      {
        heading: 'PARTICLE RENDERING',
        type: 'list',
        content: [
          'Soft edges · Dynamic glow · Random flicker · Distance fading',
          'Color gradients · Motion trails · Animated opacity',
          'Velocity stretching · Energy pulses',
          'GPU Instancing whenever possible',
          'Particles respond to: Wind · Gravity · Shockwaves · Portals · Lightning · Fire · Black Holes · Tornadoes · Water',
        ],
      },
      {
        heading: 'WEATHER SYSTEM',
        type: 'grid',
        content: ['Sunny', 'Cloudy', 'Rain', 'Storm', 'Snow', 'Fog', 'Magic Storm', 'Meteor Shower'],
      },
      {
        heading: 'AUDIO SYSTEM',
        type: 'list',
        content: [
          'Spatial Audio — every object and environment has unique sound',
          'Forest: birds · wind · leaves · water',
          'Temple: echo · fire · torch',
          'Castle: magic ambience',
          'Sci-Fi: machines · electricity',
          'Ocean: whales · bubbles',
          'Space: silence · radio noise',
          'Magic spells: portal · lightning · explosion · fire · water · wind · ice · black hole · tornado',
        ],
      },
      {
        heading: 'DYNAMIC MUSIC',
        type: 'list',
        content: [
          'Music changes according to: World · Weather · Time · Combat · Magic intensity · Player actions',
          'Smooth crossfading between tracks',
          'Procedural music generation for unique moments',
        ],
      },
      {
        heading: 'USER INTERFACE',
        type: 'list',
        content: [
          'Minimal · Modern · Premium · Glassmorphism · Floating Panels',
          'TOP LEFT: App title · Current world · Time · Weather',
          'TOP RIGHT: FPS · GPU estimate · Particle count · Current spell · Gesture detected · Tracking confidence',
          'BOTTOM RIGHT: Toggle webcam · Photo mode · Record · Reset · Fullscreen · Settings · Quality',
          'BOTTOM LEFT: Gesture guide · Current mode · Magic energy · Selected object',
        ],
      },
      {
        heading: 'QUALITY SETTINGS',
        type: 'grid',
        content: ['Auto (Adaptive)', 'Ultra', 'High', 'Medium', 'Low', 'Very Low'],
      },
      {
        heading: 'ADAPTIVE QUALITY',
        type: 'flow',
        content: ['FPS drops → reduce particles', 'Reduce shadow resolution', 'Reduce post processing', 'Reduce reflections', 'FPS recovers → gradually restore', 'Never switch instantly'],
      },
      {
        heading: 'CAMERA EFFECTS',
        type: 'grid',
        content: ['Explosion Shake', 'Slow Motion', 'Dynamic FOV', 'Focus Pull', 'Depth Changes', 'Camera Breathing', 'Lens Effects', 'Smooth Transitions'],
      },
    ],
  },
  {
    id: 'engineering',
    icon: '⚙️',
    title: 'Engineering',
    titleAr: 'الهندسة البرمجية',
    color: '#34d399',
    sections: [
      {
        heading: 'ENGINEERING PRINCIPLES',
        type: 'list',
        content: [
          'Never sacrifice architecture for speed',
          'Readability · Scalability · Maintainability · Performance · Reusability',
          'Avoid monolithic files — separate concerns clearly',
          'Prefer composition over inheritance',
          'Every module has a single responsibility',
          'Document public APIs · Use comments only where they improve understanding',
        ],
      },
      {
        heading: 'PROJECT STRUCTURE',
        type: 'grid',
        content: [
          'core/', 'render/', 'camera/', 'controls/',
          'gestures/', 'physics/', 'magic/', 'particles/',
          'environment/', 'worlds/', 'portal/', 'lighting/',
          'materials/', 'postprocessing/', 'audio/', 'ui/',
          'assets/', 'utils/', 'config/', 'workers/',
          'shaders/', 'hooks/', 'debug/', 'performance/',
        ],
      },
      {
        heading: 'IMPLEMENTATION ORDER',
        type: 'list',
        content: [
          'Phase 1 — Renderer · Scene · Camera · Lights · Environment',
          'Phase 2 — Hand Tracking · Gesture Recognition · Smoothing · Confidence',
          'Phase 3 — Camera Controller · Interaction System · Telekinesis',
          'Phase 4 — Magic Engine · Portal System · Physics · Spell System',
          'Phase 5 — Particle Engine · GPU Instancing · Morphing · LOD · Performance Manager',
          'Phase 6 — Audio · UI · Post Processing · Loading Screen · Settings',
          'Phase 7 — Optimization · Debug Tools · Accessibility · Final Polish',
        ],
      },
      {
        heading: 'PERFORMANCE TARGETS',
        type: 'list',
        content: [
          'Desktop High-End: 120 FPS+',
          'Desktop Mid-Range: 60 FPS',
          'Older GPU: 45–60 FPS',
          'Laptop Integrated: 30–45 FPS',
          'Adaptive Quality keeps experience smooth across all tiers',
        ],
      },
      {
        heading: 'PERFORMANCE FEATURES',
        type: 'grid',
        content: [
          'Adaptive Resolution', 'Adaptive Particle Count', 'GPU Instancing', 'LOD',
          'Occlusion Culling', 'Frustum Culling', 'Texture Compression', 'Draco Meshes',
          'KTX2/Basis Textures', 'Lazy Loading', 'Asset Streaming', 'Object Pooling',
        ],
      },
      {
        heading: 'ASSET LOADING',
        type: 'list',
        content: [
          'Lazy-load assets whenever possible',
          'Compress textures — use KTX2/Basis when available',
          'Compress meshes — use Draco for models',
          'Show progress during loading with beautiful animated screen',
          'Smooth transition into world after loading',
        ],
      },
      {
        heading: 'DEBUG MODE',
        type: 'grid',
        content: [
          'FPS Graph', 'Frame Time', 'Memory Usage', 'Draw Calls',
          'Triangle Count', 'Active Lights', 'Particle Count', 'Gesture Confidence',
          'Camera Position', 'Physics Stats', 'Object Count', 'Shader Logs',
        ],
      },
      {
        heading: 'EXTRA FEATURES',
        type: 'grid',
        content: [
          'Procedural Worlds', 'NPC AI', 'Voice Commands', 'Eye Tracking',
          'Gesture Recording', 'Replay System', 'Multiplayer', 'VR Support',
          'AR Support', 'Haptic Feedback', 'AI Companion', 'Dynamic Storytelling',
          'Quest System', 'Achievements', 'Save System', 'Procedural Music',
        ],
      },
      {
        heading: 'FINAL QUALITY BAR',
        type: 'text',
        content: [
          'The result must feel like a premium interactive installation — not a coding exercise, not a demo, not a student project.',
          'Think like a Senior Graphics Engineer + Creative Technologist + Technical Artist + Game Engine Programmer + UX Designer + Interactive Experience Director simultaneously.',
          'The final experience should leave users genuinely impressed and curious about how it was built.',
        ],
      },
    ],
  },
];

// ─── Section renderers ────────────────────────────────────────────────────────

function renderSection(section: DocSection, accent: string) {
  if (section.type === 'grid') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {section.content.map((item, i) => (
          <span key={i} style={{
            fontSize: '11px', letterSpacing: '0.08em',
            color: 'rgba(195,218,245,0.9)',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '5px 11px', borderRadius: '5px',
          }}>
            {item}
          </span>
        ))}
      </div>
    );
  }

  if (section.type === 'flow') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
        {section.content.map((item, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '11px', color: 'rgba(195,218,245,0.9)',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${accent}40`,
              padding: '5px 11px', borderRadius: '20px',
            }}>
              {item}
            </span>
            {i < section.content.length - 1 && (
              <span style={{ fontSize: '12px', color: `${accent}80` }}>→</span>
            )}
          </span>
        ))}
      </div>
    );
  }

  if (section.type === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {section.content.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ color: `${accent}90`, flexShrink: 0, marginTop: '2px', fontSize: '11px' }}>◆</span>
            <span style={{ fontSize: '12px', color: 'rgba(195,215,245,0.88)', lineHeight: '1.7' }}>
              {item}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // text
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {section.content.map((para, i) => (
        <p key={i} style={{
          fontSize: '12px', color: 'rgba(190,212,242,0.85)',
          lineHeight: '1.8', margin: 0,
        }}>
          {para}
        </p>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DocsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(DOCS[0].id);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['MISSION', 'TRACKING SYSTEM', 'MAGIC SYSTEM OVERVIEW', 'RENDERING', 'ENGINEERING PRINCIPLES']));

  const activeDoc = DOCS.find(d => d.id === activeTab)!;

  const toggleSection = (heading: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(heading)) next.delete(heading);
      else next.add(heading);
      return next;
    });
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#000008',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'DM Mono', monospace",
      overflow: 'hidden',
    }}>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
        background: 'rgba(0,0,10,0.8)',
        backdropFilter: 'blur(12px)',
      }}>
        <button
          onClick={() => navigate('/')}
          aria-label="العودة للصفحة الرئيسية"
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '7px', color: 'rgba(195,215,245,0.9)', cursor: 'pointer',
            padding: '7px 14px', fontSize: '12px', letterSpacing: '0.15em',
          }}
        >
          ← HOME
        </button>
        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ fontSize: '11px', letterSpacing: '0.25em', color: 'rgba(180,205,245,0.6)' }}>
          📖 MAGIC SANDBOX — PROJECT SPECIFICATION
        </span>
        <div style={{ marginLeft: 'auto', fontSize: '10px', color: 'rgba(150,175,225,0.5)', letterSpacing: '0.15em' }}>
          5 DOCUMENTS
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Sidebar tabs ── */}
        <div style={{
          width: '200px', flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', gap: '4px',
          padding: '16px 10px',
          overflowY: 'auto',
          background: 'rgba(0,0,8,0.5)',
        }}>
          {DOCS.map((doc, i) => {
            const active = doc.id === activeTab;
            return (
              <button
                key={doc.id}
                onClick={() => setActiveTab(doc.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '12px 10px',
                  borderRadius: '8px',
                  background: active ? `${doc.color}12` : 'transparent',
                  border: active ? `1px solid ${doc.color}40` : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>{doc.icon}</span>
                <div>
                  <div style={{
                    fontSize: '11px', letterSpacing: '0.12em',
                    color: active ? doc.color : 'rgba(180,205,240,0.6)',
                    marginBottom: '3px',
                  }}>
                    {String(i + 1).padStart(2, '0')} {doc.title.toUpperCase()}
                  </div>
                  <div style={{
                    fontSize: '11px', direction: 'rtl',
                    color: active ? `${doc.color}cc` : 'rgba(150,175,220,0.5)',
                    letterSpacing: '0.03em',
                  }}>
                    {doc.titleAr}
                  </div>
                </div>
              </button>
            );
          })}

          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '7px', letterSpacing: '0.2em', color: 'rgba(100,130,180,0.25)', lineHeight: '1.8' }}>
              INTERACTIVE<br />MAGIC SANDBOX<br />v2.0 SPEC
            </div>
          </div>
        </div>

        {/* ── Content area ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Doc header */}
              <div style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: `1px solid ${activeDoc.color}20` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '28px' }}>{activeDoc.icon}</span>
                  <div>
                    <h2 style={{
                      fontSize: '18px', letterSpacing: '0.2em', margin: 0,
                      color: activeDoc.color, fontWeight: 300,
                    }}>
                      {activeDoc.title.toUpperCase()}
                    </h2>
                    <div style={{ fontSize: '10px', color: `${activeDoc.color}60`, direction: 'rtl', marginTop: '2px' }}>
                      {activeDoc.titleAr}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '8px', letterSpacing: '0.3em', color: 'rgba(100,130,200,0.3)' }}>
                  MAGIC SANDBOX — PROJECT SPECIFICATION — PART {DOCS.findIndex(d => d.id === activeTab) + 1} OF 5
                </div>
              </div>

              {/* Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeDoc.sections.map((section) => {
                  const expanded = expandedSections.has(section.heading);
                  return (
                    <div
                      key={section.heading}
                      style={{
                        border: `1px solid ${expanded ? `${activeDoc.color}20` : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: '10px',
                        overflow: 'hidden',
                        background: expanded ? `${activeDoc.color}06` : 'rgba(255,255,255,0.015)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Section header */}
                      <button
                        onClick={() => toggleSection(section.heading)}
                        aria-expanded={expanded}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 16px', background: 'none', border: 'none',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <span style={{
                          fontSize: '12px', letterSpacing: '0.2em',
                          color: expanded ? activeDoc.color : 'rgba(180,205,240,0.65)',
                        }}>
                          {section.heading}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          color: expanded ? `${activeDoc.color}80` : 'rgba(120,150,200,0.3)',
                          transform: expanded ? 'rotate(90deg)' : 'none',
                          transition: 'transform 0.2s ease',
                        }}>
                          ›
                        </span>
                      </button>

                      {/* Section content */}
                      <AnimatePresence>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{ padding: '4px 16px 16px' }}>
                              {renderSection(section, activeDoc.color)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              <div style={{ height: '40px' }} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
