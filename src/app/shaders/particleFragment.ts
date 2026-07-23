export const PARTICLE_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSpeed;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv) * 2.0;

    if (dist > 1.0) discard;

    float core  = 1.0 - smoothstep(0.0, 0.28, dist);
    float halo  = pow(1.0 - dist, 1.9);
    float speed = clamp(vSpeed * 0.7, 0.0, 0.75);

    vec3 col   = mix(vColor, vec3(1.0), core * 0.18 + speed * 0.12);
    float alpha = halo * vAlpha;

    gl_FragColor = vec4(col, alpha);
  }
`;
