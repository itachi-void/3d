import * as THREE from 'three';

export class Renderer {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  gl: THREE.WebGLRenderer;

  constructor(canvas: HTMLCanvasElement, pixelRatio: number) {
    this.scene = new THREE.Scene();

    const aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
    this.camera = new THREE.PerspectiveCamera(58, aspect, 0.1, 2000);
    this.camera.position.set(0, 0, 55);

    this.gl = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: false,
    });
    this.gl.setPixelRatio(pixelRatio);
    this.gl.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.gl.setClearColor(0x000005, 1);
    this.warnIfIntegratedGPU();
    this.gl.toneMapping = THREE.ACESFilmicToneMapping;
    this.gl.toneMappingExposure = 0.92;

    this.addStarField();
  }

  private addStarField(): void {
    const COUNT = 3500;
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const colors = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 300 + Math.random() * 300;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      sizes[i] = 0.25 + Math.random() * 0.55;

      const b = 0.25 + Math.random() * 0.55;
      colors[i * 3]     = b * (0.6 + Math.random() * 0.3);
      colors[i * 3 + 1] = b * (0.7 + Math.random() * 0.2);
      colors[i * 3 + 2] = b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float aSize;
        attribute vec3 aColor;
        varying vec3 vColor;
        void main() {
          vColor = aColor;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * (200.0 / -mv.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          if (d > 1.0) discard;
          float a = pow(1.0 - d, 2.0) * 0.6;
          gl_FragColor = vec4(vColor, a);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });

    const stars = new THREE.Points(geo, mat);
    this.scene.add(stars);
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
    this.gl.setSize(width, height, false);
  }

  /** Returns the active GPU renderer string (e.g. "NVIDIA Quadro M2000M") */
  getGPUInfo(): { vendor: string; renderer: string } {
    const ctx = this.gl.getContext();
    const ext = ctx.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return { vendor: 'unknown', renderer: 'unknown' };
    return {
      vendor:   ctx.getParameter(ext.UNMASKED_VENDOR_WEBGL)   as string,
      renderer: ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string,
    };
  }

  private warnIfIntegratedGPU(): void {
    const { vendor, renderer } = this.getGPUInfo();
    const isIntegrated = /intel|HD Graphics|UHD Graphics/i.test(renderer);
    if (isIntegrated) {
      console.warn(
        `%c⚠ GPU Warning`,
        'color:#f90;font-weight:bold;font-size:14px',
        `\nActive GPU: ${renderer} (${vendor})` +
        `\nThis is an integrated GPU. For best performance:` +
        `\n→ NVIDIA Control Panel → Manage 3D Settings → Program Settings` +
        `\n→ Add msedge.exe / chrome.exe → "High-performance NVIDIA processor"`,
      );
    } else {
      console.info(
        `%c✓ GPU OK`,
        'color:#4f4;font-weight:bold',
        `\nActive GPU: ${renderer} (${vendor})`,
      );
    }
  }

  dispose(): void {
    this.gl.dispose();
  }
}
