export const PARTICLE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;

  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aNoise;
  attribute float aSpeed;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vSpeed;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float twinkle = 0.87 + 0.13 * sin(uTime * 2.8 + aNoise * 6.2832);
    float perspScale = 350.0 / -mvPosition.z;
    gl_PointSize = aSize * uSize * uPixelRatio * twinkle * perspScale;

    vColor = aColor;
    vAlpha = aAlpha;
    vSpeed = aSpeed;
  }
`;
