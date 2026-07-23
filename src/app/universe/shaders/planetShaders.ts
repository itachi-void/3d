// ─── Shared vertex shader ────────────────────────────────────────────────────
export const PLANET_VERT = /* glsl */`
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vViewDir;
  varying float vFresnel;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    vFresnel = 1.0 - max(0.0, dot(vViewDir, vNormal));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// ─── Noise utilities (shared) ────────────────────────────────────────────────
const NOISE_GLSL = /* glsl */`
  vec3 _h3(vec3 p) {
    p = vec3(dot(p, vec3(127.1,311.7,74.7)),
             dot(p, vec3(269.5,183.3,246.1)),
             dot(p, vec3(113.5,271.9,124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
  }
  float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    vec3 u = f*f*(3.0-2.0*f);
    return mix(mix(mix(dot(_h3(i),f),              dot(_h3(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),
                   mix(dot(_h3(i+vec3(0,1,0)),f-vec3(0,1,0)), dot(_h3(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
               mix(mix(dot(_h3(i+vec3(0,0,1)),f-vec3(0,0,1)), dot(_h3(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),
                   mix(dot(_h3(i+vec3(0,1,1)),f-vec3(0,1,1)), dot(_h3(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z)*0.5+0.5;
  }
  float fbm(vec3 p, int oct) {
    float v=0.0, a=0.5;
    for(int i=0;i<8;i++){
      if(i>=oct)break;
      v+=a*noise3(p); p=p*2.0+vec3(5.2,1.3,7.8); a*=0.5;
    }
    return v;
  }
`;

// ─── Rocky planet (Mercury, Mars, Moon-like) ─────────────────────────────────
export const ROCKY_FRAG = /* glsl */`
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uSunDir;
  uniform float uRoughness;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  ${NOISE_GLSL}

  void main() {
    float h = fbm(vWorldPos * 2.2, 6);
    float h2 = fbm(vWorldPos * 5.5 + vec3(1.7, 2.3, 0.9), 4);
    float t1 = smoothstep(0.35, 0.65, h);
    float t2 = smoothstep(0.6, 0.8, h + h2 * 0.3);
    vec3 col = mix(uColor1, uColor2, t1);
    col = mix(col, uColor3, t2 * 0.5);
    // Craters — dark rings
    float crater = smoothstep(0.44, 0.46, h2) * smoothstep(0.48, 0.46, h2);
    col = mix(col, col * 0.45, crater * 0.8);
    // Diffuse lighting
    float diff = max(0.0, dot(vNormal, uSunDir));
    float ambient = 0.04;
    col = col * (ambient + diff * 0.96);
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ─── Earth-like ───────────────────────────────────────────────────────────────
export const EARTH_FRAG = /* glsl */`
  uniform vec3 uSunDir;
  uniform float uTime;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec2 vUv;
  ${NOISE_GLSL}

  void main() {
    // Ocean / land
    float land = fbm(vWorldPos * 1.8, 7);
    float isOcean = step(land, 0.50);
    vec3 oceanCol = mix(vec3(0.04,0.18,0.55), vec3(0.08,0.35,0.75), fbm(vWorldPos*4.0,3));
    vec3 landCol = mix(vec3(0.18,0.42,0.12), vec3(0.5,0.38,0.22), fbm(vWorldPos*3.5+vec3(5),4));
    // Desert / mountain
    float high = smoothstep(0.62, 0.78, land);
    landCol = mix(landCol, vec3(0.72,0.62,0.50), high);
    vec3 col = mix(landCol, oceanCol, isOcean);
    // Ice caps (polar)
    float lat = abs(vWorldPos.y);
    float ice = smoothstep(0.72, 0.82, lat + fbm(vWorldPos*3.0,3)*0.15);
    col = mix(col, vec3(0.92,0.96,1.0), ice);
    // Cloud layer
    float cloud = fbm(vWorldPos * 2.5 + vec3(uTime*0.03, 0.0, 0.0), 5);
    cloud = smoothstep(0.52, 0.72, cloud);
    col = mix(col, vec3(0.96, 0.97, 1.0), cloud * 0.75);
    // Lighting
    float diff = max(0.0, dot(vNormal, uSunDir));
    float specular = isOcean * (1.0-ice) * pow(max(0.0, dot(reflect(-uSunDir, vNormal), normalize(cameraPosition - vWorldPos))), 24.0) * 0.4;
    col = col * (0.05 + diff * 0.95) + specular;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ─── Venus-like (cloudy hot) ──────────────────────────────────────────────────
export const VENUS_FRAG = /* glsl */`
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uSunDir;
  uniform float uTime;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  ${NOISE_GLSL}

  void main() {
    float cloud = fbm(vWorldPos * 1.5 + vec3(uTime*0.025,0,0), 5);
    float swirl = fbm(vWorldPos * 3.0 + vec3(0, uTime*0.02, 0), 4);
    float t = smoothstep(0.35, 0.65, cloud + swirl * 0.25);
    vec3 col = mix(uColor2, uColor1, t);
    col = mix(col, uColor1*1.3, fbm(vWorldPos*6.0,3)*0.3);
    float diff = max(0.0, dot(vNormal, uSunDir));
    col = col * (0.08 + diff * 0.92);
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ─── Gas giant (Jupiter/Saturn bands) ────────────────────────────────────────
export const GAS_FRAG = /* glsl */`
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uSunDir;
  uniform float uTime;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec2 vUv;
  ${NOISE_GLSL}

  void main() {
    // Bands based on normalized Y
    float latitude = normalize(vWorldPos).y;
    float band = sin(latitude * 18.0 + fbm(vWorldPos * 2.5, 4) * 2.8 + uTime * 0.15) * 0.5 + 0.5;
    float band2 = sin(latitude * 34.0 + fbm(vWorldPos * 4.5, 3) * 1.5 - uTime * 0.08) * 0.5 + 0.5;
    vec3 col = mix(uColor1, uColor2, band);
    col = mix(col, uColor3, band2 * 0.35);
    // Great red spot / storm
    vec2 spot = vec2(vUv.x - 0.6, vUv.y - 0.42);
    float storm = 1.0 - smoothstep(0.0, 0.08, length(spot * vec2(2.5, 1.0)));
    col = mix(col, vec3(0.8, 0.25, 0.1), storm * 0.7);
    float diff = max(0.0, dot(vNormal, uSunDir));
    col = col * (0.06 + diff * 0.94);
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ─── Ice giant (Uranus/Neptune) ───────────────────────────────────────────────
export const ICE_FRAG = /* glsl */`
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uSunDir;
  uniform float uTime;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  ${NOISE_GLSL}

  void main() {
    float n = fbm(vWorldPos * 2.0 + vec3(uTime*0.05, 0, 0), 5);
    float band = sin(normalize(vWorldPos).y * 10.0 + n * 1.5) * 0.5 + 0.5;
    vec3 col = mix(uColor1, uColor2, band);
    col = mix(col, uColor1 * 1.4, n * 0.2);
    float diff = max(0.0, dot(vNormal, uSunDir));
    float spec = pow(max(0.0, dot(reflect(-uSunDir, vNormal), normalize(cameraPosition - vWorldPos))), 16.0) * 0.15;
    col = col * (0.06 + diff * 0.94) + spec;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ─── Moon/barren (grey, cratered) ────────────────────────────────────────────
export const MOON_FRAG = /* glsl */`
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uSunDir;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  ${NOISE_GLSL}

  void main() {
    float h = fbm(vWorldPos * 3.5, 6);
    float crater1 = smoothstep(0.44, 0.46, fbm(vWorldPos*2.0,4)) * smoothstep(0.49,0.46,fbm(vWorldPos*2.0,4));
    float crater2 = smoothstep(0.45, 0.47, fbm(vWorldPos*5.0,3)) * smoothstep(0.49,0.46,fbm(vWorldPos*5.0,3));
    vec3 col = mix(uColor1, uColor2, smoothstep(0.4,0.7,h));
    col = mix(col, col * 0.3, (crater1 + crater2) * 0.9);
    float diff = max(0.0, dot(vNormal, uSunDir));
    col = col * (0.03 + diff * 0.97);
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ─── Star (sun) ───────────────────────────────────────────────────────────────
export const STAR_FRAG = /* glsl */`
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uTime;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vFresnel;
  ${NOISE_GLSL}

  void main() {
    float n = fbm(vWorldPos * 1.2 + uTime * 0.12, 5);
    float n2 = fbm(vWorldPos * 2.8 - uTime * 0.08, 4);
    float t = smoothstep(0.3, 0.8, n + n2 * 0.4);
    vec3 col = mix(uColor3, uColor1, t);
    col = mix(col, uColor2, smoothstep(0.7, 1.0, n) * 0.6);
    // Sunspot darkening
    float spot = fbm(vWorldPos * 4.0 + uTime * 0.03, 4);
    col = mix(col, col * 0.4, smoothstep(0.72, 0.75, spot) * 0.8);
    // Limb darkening
    float limb = 1.0 - pow(vFresnel, 0.4);
    col = mix(col * 0.5, col, limb);
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ─── Atmosphere glow ──────────────────────────────────────────────────────────
export const ATMO_VERT = /* glsl */`
  varying float vFresnel;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
    vec3 viewDir = normalize(cameraPosition - worldPos.xyz);
    vFresnel = 1.0 - abs(dot(viewDir, worldNormal));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
export const ATMO_FRAG = /* glsl */`
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFresnel;
  void main() {
    float f = pow(vFresnel, 2.5);
    gl_FragColor = vec4(uColor, f * uOpacity);
  }
`;

// ─── Saturn ring ──────────────────────────────────────────────────────────────
export const RING_VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
export const RING_FRAG = /* glsl */`
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uInnerR;
  uniform float uOuterR;
  uniform vec3 uSunDir;
  varying vec2 vUv;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float norm = (r - uInnerR) / (uOuterR - uInnerR);
    if (norm < 0.0 || norm > 1.0) discard;
    // Ring density bands
    float band = sin(norm * 120.0) * 0.5 + 0.5;
    float detail = sin(norm * 480.0 + hash(norm*100.0)*6.28) * 0.5 + 0.5;
    float density = mix(0.3, 1.0, band) * mix(0.5, 1.0, detail);
    // Edge fade
    float edge = smoothstep(0.0,0.08,norm) * smoothstep(1.0,0.92,norm);
    gl_FragColor = vec4(uColor * density, uOpacity * density * edge);
  }
`;

// ─── Galaxy star particles ────────────────────────────────────────────────────
export const GALAXY_VERT = /* glsl */`
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aBrightness;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vBright;

  void main() {
    vColor = aColor;
    vBright = aBrightness;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (280.0 / -mvPos.z);
    gl_PointSize = clamp(gl_PointSize, 0.5, 8.0);
    gl_Position = projectionMatrix * mvPos;
  }
`;
export const GALAXY_FRAG = /* glsl */`
  varying vec3 vColor;
  varying float vBright;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = 1.0 - smoothstep(0.0, 0.18, d);
    float halo = 1.0 - smoothstep(0.0, 0.5, d);
    float alpha = core * 0.9 + halo * 0.25;
    gl_FragColor = vec4(vColor * vBright, alpha);
  }
`;

// ─── Universe galaxy sprites ──────────────────────────────────────────────────
export const UNIVERSE_GALAXY_VERT = /* glsl */`
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aRotation;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vRot;
  void main() {
    vColor = aColor;
    vRot = aRotation;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (600.0 / -mvPos.z);
    gl_PointSize = clamp(gl_PointSize, 3.0, 80.0);
    gl_Position = projectionMatrix * mvPos;
  }
`;
export const UNIVERSE_GALAXY_FRAG = /* glsl */`
  varying vec3 vColor;
  varying float vRot;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    // Rotate
    float c = cos(vRot), s = sin(vRot);
    vec2 r = vec2(c*uv.x - s*uv.y, s*uv.x + c*uv.y);
    // Elliptical galaxy shape
    float d = length(r * vec2(1.0, 0.45));
    if (d > 0.5) discard;
    float core = 1.0 - smoothstep(0.0, 0.12, d);
    float disk = 1.0 - smoothstep(0.0, 0.5, d);
    float a = core * 0.9 + disk * 0.4;
    gl_FragColor = vec4(vColor, a);
  }
`;

// ─── Orbit line ───────────────────────────────────────────────────────────────
export const ORBIT_VERT = /* glsl */`
  void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
export const ORBIT_FRAG = /* glsl */`
  uniform float uOpacity;
  uniform vec3 uColor;
  void main() { gl_FragColor = vec4(uColor, uOpacity); }
`;
