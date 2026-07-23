// ─── Shared noise helpers (injected into every frag) ─────────────────────────
const NOISE_GLSL = `
float hash21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float hash31(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
float noise2(vec2 p){
  vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<6;i++){v+=a*noise2(p);p*=2.1;a*=0.45;}return v;}
`;

// ─── 1. Terrain / Ground / Walls ──────────────────────────────────────────────
export const TERRAIN_VERT = `
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewDir;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position,1.0);
  vWorldPos = wp.xyz;
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

export const TERRAIN_FRAG = `
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uAmbient;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uRoughness;
uniform float uScale;
uniform int uType; // 0=stone 1=metal 2=ocean_floor 3=sand 4=grass

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewDir;
${NOISE_GLSL}
void main(){
  vec2 uv = vWorldPos.xz * uScale;
  float n = fbm(uv);
  vec3 albedo = mix(uColor1, uColor2, smoothstep(0.3,0.7,n));

  if(uType==0){ // stone: add cracks
    float c = 1.0 - smoothstep(0.0,0.06,abs(fbm(uv*5.0+1.5)-0.5));
    albedo *= mix(1.0,0.35,c*0.65);
    float moss = smoothstep(0.55,0.75,fbm(uv*1.5+3.0));
    albedo = mix(albedo, vec3(0.18,0.28,0.10), moss*0.5);
  }
  if(uType==1){ // metal: grid seams
    float gx = smoothstep(0.46,0.5,fract(vWorldPos.x*0.4));
    float gz = smoothstep(0.46,0.5,fract(vWorldPos.z*0.4));
    albedo = mix(albedo, uColor2, max(gx,gz)*0.7);
  }
  if(uType==2){ // ocean floor: caustic shimmer
    float cx = abs(sin(vWorldPos.x*1.8+uTime*0.9));
    float cz = abs(sin(vWorldPos.z*2.2+uTime*0.7));
    albedo += vec3(0.0,0.05,0.12) * cx*cz * 2.0;
  }
  if(uType==4){ // grass: vary height
    float g = fbm(uv*3.0+7.0);
    albedo = mix(albedo, albedo*1.3, g);
  }

  float NdotL = max(dot(vNormal,uSunDir),0.0);
  vec3 color = albedo*(uAmbient + uSunColor*NdotL);
  vec3 H = normalize(uSunDir+vViewDir);
  float spec = pow(max(dot(vNormal,H),0.0),64.0)*(1.0-uRoughness);
  color += uSunColor*spec*0.25;

  float fog = smoothstep(uFogNear,uFogFar,length(vWorldPos-cameraPosition));
  color = mix(color, uFogColor, fog);
  gl_FragColor = vec4(color,1.0);
}`;

// ─── 2. Water ──────────────────────────────────────────────────────────────────
export const WATER_VERT = `
uniform float uTime;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewDir;
void main(){
  vUv = uv;
  vec3 pos = position;
  pos.y += sin(pos.x*0.8+uTime*1.2)*0.12 + sin(pos.z*1.1+uTime*0.9)*0.09;
  vec4 wp = modelMatrix * vec4(pos,1.0);
  vWorldPos = wp.xyz;
  vNormal = normalize(normalMatrix * vec3(-0.1*cos(pos.x*0.8+uTime*1.2),1.0,-0.1*cos(pos.z*1.1+uTime*0.9)));
  vViewDir = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

export const WATER_FRAG = `
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewDir;
${NOISE_GLSL}
void main(){
  float fresnel = pow(1.0 - max(dot(vNormal,vViewDir),0.0), 3.0);
  float ripple = fbm(vWorldPos.xz*2.0 + uTime*0.4)*0.5+0.5;
  vec3 deepColor = uColor * 0.4;
  vec3 shallowColor = uColor * 1.1;
  vec3 col = mix(deepColor, shallowColor, fresnel*0.6 + ripple*0.15);
  col += vec3(0.8,0.9,1.0)*pow(fresnel,3.0)*0.5;
  float fog = smoothstep(uFogNear,uFogFar,length(vWorldPos-cameraPosition));
  col = mix(col, uFogColor, fog);
  gl_FragColor = vec4(col, 0.82);
}`;

// ─── 3. GPU Instanced Particles (leaves, dust, fire, bubbles, snow) ──────────
export const PARTICLE_VERT = `
attribute float aType;      // 0=leaf 1=dust 2=fire 3=bubble 4=snow 5=magic
attribute float aLife;      // 0-1 lifetime
attribute float aSize;
attribute float aSeed;
attribute vec3  aVelocity;

uniform float uTime;
uniform float uDeltaTime;
uniform vec3  uWindDir;
uniform float uWindStrength;
uniform vec3  uBlackHolePos;
uniform float uBlackHoleStrength;
uniform vec3  uGravityCenter;

varying float vType;
varying float vLife;
varying float vAlpha;
varying vec3  vColor;

void main(){
  vType = aType;
  vLife = aLife;

  vec3 pos = position;

  // Wind sway
  float windPhase = uTime * 1.2 + aSeed * 6.28;
  pos += uWindDir * uWindStrength * (0.5 + 0.5*sin(windPhase)) * max(0.0, pos.y * 0.1);

  // Black hole attraction
  vec3 toBH = uBlackHolePos - pos;
  float bhDist = length(toBH);
  if(uBlackHoleStrength > 0.0 && bhDist > 0.5){
    pos += normalize(toBH) * uBlackHoleStrength * (1.0/(bhDist*bhDist+1.0)) * 2.0;
    float spiral = uTime * 3.0 + aSeed * 6.28;
    pos += vec3(cos(spiral), 0.0, sin(spiral)) * uBlackHoleStrength * 0.3 / max(bhDist, 0.5);
  }

  // Type-specific motion
  if(aType < 0.5){ // leaf: flutter + fall
    pos.y -= aLife * 1.2;
    pos.x += sin(uTime * 1.5 + aSeed * 4.0) * 0.4;
    pos.z += cos(uTime * 1.3 + aSeed * 5.0) * 0.3;
  }
  if(aType > 0.5 && aType < 1.5){ // dust: slow drift
    pos.y += aLife * 0.3;
    pos += uWindDir * 0.15;
  }
  if(aType > 1.5 && aType < 2.5){ // fire: rise fast
    pos.y += aLife * 2.5;
    pos.x += sin(uTime * 4.0 + aSeed * 6.0) * 0.15 * (1.0-aLife);
  }
  if(aType > 2.5 && aType < 3.5){ // bubble: rise + drift
    pos.y += aLife * 1.8;
    pos.x += sin(uTime * 0.8 + aSeed * 3.0) * 0.2;
  }
  if(aType > 4.5){ // magic: spiral orbit
    float angle = uTime * 2.0 + aSeed * 6.28;
    float r = (1.0-aLife) * 1.5;
    pos.x += cos(angle) * r;
    pos.z += sin(angle) * r;
  }

  vAlpha = sin(aLife * 3.14159);
  if(aType > 1.5 && aType < 2.5) vAlpha = (1.0-aLife) * (1.0-aLife); // fire

  vColor = mix(vec3(1.0), vec3(0.3,0.8,0.2), step(aType, 0.5)); // leaf is green

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = aSize * (300.0 / -mvPos.z);
  gl_PointSize = clamp(gl_PointSize, 1.0, 24.0);
  gl_Position = projectionMatrix * mvPos;
}`;

export const PARTICLE_FRAG = `
uniform sampler2D uMap;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uTime;

varying float vType;
varying float vLife;
varying float vAlpha;
varying vec3  vColor;

void main(){
  vec2 uv = gl_PointCoord;
  float d = length(uv - 0.5) * 2.0;
  if(d > 1.0) discard;

  float soft = 1.0 - smoothstep(0.7, 1.0, d);
  vec3 col;

  if(vType < 0.5){ // leaf
    float vein = abs(uv.y - 0.5) * 2.0;
    col = mix(vec3(0.15,0.45,0.08), vec3(0.35,0.62,0.12), vein);
    col = mix(col, vec3(0.62,0.48,0.08), vLife * 0.7); // golden autumn
  } else if(vType < 1.5){ // dust
    col = uColorA;
    soft = 1.0 - smoothstep(0.3, 1.0, d);
  } else if(vType < 2.5){ // fire
    col = mix(vec3(1.0,0.9,0.2), mix(vec3(1.0,0.4,0.0), vec3(0.4,0.0,0.0), vLife), vLife*0.8);
    col += vec3(1.0,0.8,0.3) * (1.0-vLife) * 0.5;
  } else if(vType < 3.5){ // bubble
    float ring = abs(d - 0.7) * 10.0;
    col = uColorA * (1.0 - smoothstep(0.0, 1.0, ring));
    soft = 1.0 - smoothstep(0.6, 0.8, d);
    col += vec3(0.8,0.95,1.0) * 0.3;
  } else if(vType < 4.5){ // snow
    col = vec3(0.95, 0.97, 1.0);
  } else { // magic
    col = mix(uColorA, uColorB, vLife);
    col += vec3(1.0) * pow(1.0-d, 2.0) * 0.8;
  }

  gl_FragColor = vec4(col, soft * vAlpha * 0.9);
}`;

// ─── 4. Portal Ring ────────────────────────────────────────────────────────────
export const PORTAL_VERT = `
varying vec2 vUv;
varying vec3 vWorldPos;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position,1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

export const PORTAL_FRAG = `
uniform float uTime;
uniform vec3 uColor;
uniform float uOpen; // 0-1 opening progress
varying vec2 vUv;
${NOISE_GLSL}
void main(){
  float angle = atan(vUv.y-0.5, vUv.x-0.5);
  float r = length(vUv - 0.5) * 2.0;
  float ring = 1.0 - abs(r - 0.8) * 8.0;
  ring = max(0.0, ring);

  // Animated swirl
  float swirl = sin(angle * 5.0 - uTime * 3.0 + r * 4.0) * 0.5 + 0.5;
  float inner = 1.0 - smoothstep(0.0, 0.72*uOpen, r);
  float distort = fbm(vec2(angle, r*2.0+uTime*0.5)) * inner;

  vec3 col = uColor * (ring * (0.5 + swirl * 0.5) + distort * 0.3);
  col += uColor * inner * 0.4 * uOpen;
  col += vec3(1.0) * pow(ring, 3.0) * 0.8;

  float alpha = (ring + inner * 0.5) * uOpen;
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}`;

// ─── 5. Glowing Symbol / Rune ──────────────────────────────────────────────────
export const SYMBOL_VERT = `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}`;

export const SYMBOL_FRAG = `
uniform float uTime;
uniform vec3 uColor;
uniform float uPulse;
varying vec2 vUv;
${NOISE_GLSL}
void main(){
  vec2 uv = vUv - 0.5;
  float r = length(uv);
  float angle = atan(uv.y, uv.x);

  // Geometric rune pattern
  float tri = abs(sin(angle * 3.0 + uTime * 0.5));
  float hex = abs(cos(angle * 6.0 + uTime * 0.3));
  float ring1 = 1.0 - abs(r - 0.35) * 20.0;
  float ring2 = 1.0 - abs(r - 0.20) * 25.0;
  float spokes = pow(max(0.0, sin(angle * 8.0) * 0.5 + 0.5), 4.0) * step(r, 0.4);

  float pattern = max(max(ring1, ring2), spokes);
  pattern = max(0.0, pattern);

  float pulse = 0.6 + 0.4 * sin(uTime * 2.0 + hash21(vUv * 4.0) * 6.28);
  float glow = 1.0 - smoothstep(0.0, 0.5, r);

  vec3 col = uColor * pattern * pulse;
  col += uColor * 0.15 * glow;

  gl_FragColor = vec4(col, pattern * pulse * 0.95 + glow * 0.05);
}`;

// ─── 6. Hologram Display (Sci-Fi) ──────────────────────────────────────────────
export const HOLO_VERT = `
varying vec2 vUv;
varying vec3 vWorldPos;
void main(){
  vUv = uv;
  vWorldPos = (modelMatrix * vec4(position,1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}`;

export const HOLO_FRAG = `
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
varying vec3 vWorldPos;
${NOISE_GLSL}
void main(){
  // Scanlines
  float scan = sin(vUv.y * 120.0 + uTime * 4.0) * 0.5 + 0.5;
  float scanFine = sin(vUv.y * 400.0) * 0.5 + 0.5;

  // Data pattern
  float data = noise2(vec2(floor(vUv.x * 32.0), floor((vUv.y + uTime * 0.2) * 24.0)));
  data = step(0.6, data);

  // Grid
  float gx = abs(fract(vUv.x * 12.0) - 0.5) * 2.0;
  float gy = abs(fract(vUv.y * 8.0) - 0.5) * 2.0;
  float grid = smoothstep(0.85, 1.0, max(gx, gy));

  float noise_flicker = 0.85 + 0.15 * sin(uTime * 17.0 + hash21(vUv * 8.0) * 6.28);
  vec3 col = uColor * (scan * 0.4 + scanFine * 0.1 + data * 0.5 + grid * 0.4);
  col *= noise_flicker;

  float alpha = (scan * 0.3 + data * 0.5 + grid * 0.4) * 0.85 * noise_flicker;
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.95));
}`;

// ─── 7. God Rays (additive screen quad) ───────────────────────────────────────
export const GODRAY_VERT = `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

export const GODRAY_FRAG = `
uniform float uTime;
uniform vec2 uLightPos; // NDC light position
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;
${NOISE_GLSL}
void main(){
  vec2 dir = vUv - uLightPos;
  float d = length(dir);
  float ray = 1.0 / (d * 6.0 + 0.5);

  float angle = atan(dir.y, dir.x);
  float shaft = pow(max(0.0, sin(angle * 8.0 + uTime * 0.3)), 3.0);
  shaft += pow(max(0.0, sin(angle * 5.0 - uTime * 0.2)), 4.0);

  float n = noise2(vec2(angle * 3.0, d * 4.0 + uTime * 0.5));
  float volume = ray * shaft * (0.7 + 0.3 * n) * uIntensity;
  volume *= smoothstep(1.0, 0.0, d);

  gl_FragColor = vec4(uColor * volume, volume * 0.4);
}`;

// ─── 8. Sky / Atmosphere ───────────────────────────────────────────────────────
export const SKY_VERT = `
varying vec3 vDir;
void main(){
  vDir = normalize((modelMatrix * vec4(position,0.0)).xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}`;

export const SKY_FRAG = `
uniform float uTime;
uniform vec3 uSkyTop;
uniform vec3 uSkyHorizon;
uniform vec3 uSunColor;
uniform vec3 uSunDir;
uniform float uSunSize;
varying vec3 vDir;
${NOISE_GLSL}
void main(){
  vec3 dir = normalize(vDir);
  float up = dir.y * 0.5 + 0.5;
  vec3 sky = mix(uSkyHorizon, uSkyTop, smoothstep(0.0, 0.6, up));

  // Sun disk + glow
  float sunDot = max(dot(dir, uSunDir), 0.0);
  float sun = pow(sunDot, 256.0 / (uSunSize + 0.01));
  float glow = pow(sunDot, 8.0) * 0.3;
  sky += uSunColor * (sun + glow);

  // Clouds
  vec2 cloudUV = vec2(atan(dir.z, dir.x) / 6.28 + uTime * 0.01, asin(dir.y) / 3.14);
  float cloud = fbm(cloudUV * 5.0) * smoothstep(0.0, 0.3, up) * 0.6;
  sky = mix(sky, vec3(1.0, 0.98, 0.95), cloud * smoothstep(0.1, 0.4, up));

  gl_FragColor = vec4(sky, 1.0);
}`;

// ─── 9. Space Sky ──────────────────────────────────────────────────────────────
export const SPACE_SKY_FRAG = `
uniform float uTime;
varying vec3 vDir;
${NOISE_GLSL}
void main(){
  vec3 dir = normalize(vDir);
  float n = fbm(dir.xy * 4.0 + dir.z);
  float n2 = fbm(dir.yz * 3.5 + dir.x + 0.5);
  vec3 nebula = mix(vec3(0.05,0.0,0.12), vec3(0.0,0.04,0.18), n);
  nebula = mix(nebula, vec3(0.15,0.0,0.08), n2 * 0.4);
  float starField = hash31(floor(dir * 120.0));
  float star = step(0.985, starField) * step(0.0, dir.y + dir.x);
  vec3 col = nebula + vec3(star);
  gl_FragColor = vec4(col, 1.0);
}`;

// ─── 10. Underwater Caustic Sky ────────────────────────────────────────────────
export const UNDERWATER_SKY_FRAG = `
uniform float uTime;
varying vec3 vDir;
${NOISE_GLSL}
void main(){
  float caustic = abs(sin(vDir.x*4.0+uTime*0.6)*sin(vDir.z*3.5+uTime*0.5));
  vec3 col = mix(vec3(0.0,0.06,0.15), vec3(0.0,0.2,0.4), caustic * 0.4 + 0.2);
  col += vec3(0.0,0.12,0.25) * pow(max(0.0,vDir.y),1.5);
  gl_FragColor = vec4(col, 1.0);
}`;

// ─── 11. Magic Trail / Beam ────────────────────────────────────────────────────
export const BEAM_VERT = `
uniform float uTime;
attribute float aProgress;
varying float vProgress;
void main(){
  vProgress = aProgress;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}`;

export const BEAM_FRAG = `
uniform float uTime;
uniform vec3 uColor;
varying float vProgress;
void main(){
  float alpha = sin(vProgress * 3.14159) * (0.6 + 0.4*sin(uTime*8.0));
  gl_FragColor = vec4(uColor + vec3(0.5)*alpha, alpha);
}`;

// ─── 12. Lightning Bolt ────────────────────────────────────────────────────────
export const LIGHTNING_VERT = `
attribute float aProgress;
varying float vProgress;
void main(){
  vProgress = aProgress;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}`;

export const LIGHTNING_FRAG = `
uniform float uTime;
varying float vProgress;
void main(){
  float core = 1.0 - abs(vProgress - 0.5)*2.0;
  float glow = pow(core, 2.0);
  float flicker = 0.7 + 0.3*sin(uTime*40.0);
  vec3 col = mix(vec3(0.4,0.6,1.0), vec3(1.0,1.0,1.0), glow);
  float alpha = glow * flicker;
  gl_FragColor = vec4(col, alpha);
}`;

// ─── 13. Energy Charge Ring (pinch charge indicator) ──────────────────────────
export const CHARGE_VERT = `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}`;

export const CHARGE_FRAG = `
uniform float uTime;
uniform float uCharge; // 0-1
uniform vec3 uColor;
varying vec2 vUv;
void main(){
  vec2 uv = vUv - 0.5;
  float r = length(uv);
  float angle = atan(uv.y, uv.x) / 6.28318 + 0.5; // 0-1
  float ring = 1.0 - abs(r - 0.4) * 12.0;
  float progress = step(angle, uCharge);
  float alpha = max(0.0,ring) * progress;
  float pulse = 0.7 + 0.3*sin(uTime*6.0);
  vec3 col = uColor * (1.0 + uCharge);
  gl_FragColor = vec4(col * pulse, alpha);
}`;
