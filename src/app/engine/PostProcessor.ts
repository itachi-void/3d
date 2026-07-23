import * as THREE from 'three';
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  ChromaticAberrationEffect,
  VignetteEffect,
  KernelSize,
  BlendFunction,
} from 'postprocessing';

export class PostProcessor {
  composer: EffectComposer;
  bloom: BloomEffect;
  private chromatic: ChromaticAberrationEffect;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    bloomIntensity: number,
  ) {
    this.composer = new EffectComposer(renderer, {
      frameBufferType: THREE.HalfFloatType,
    });

    this.bloom = new BloomEffect({
      blendFunction: BlendFunction.ADD,
      kernelSize: KernelSize.MEDIUM,
      // Keep bloom on the brightest particle cores only; a low threshold
      // makes dense formations collapse into an unreadable white disk.
      luminanceThreshold: 0.72,
      luminanceSmoothing: 0.22,
      intensity: bloomIntensity,
      mipmapBlur: true,
      radius: 0.38,
      levels: 5,
    });

    this.chromatic = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.0006, 0.0006),
      radialModulation: true,
      modulationOffset: 0.15,
    });

    const vignette = new VignetteEffect({
      darkness: 0.48,
      offset: 0.32,
    });

    this.composer.addPass(new RenderPass(scene, camera));
    this.composer.addPass(
      new EffectPass(camera as THREE.Camera, this.bloom, this.chromatic, vignette),
    );
  }

  setBloomIntensity(v: number): void {
    this.bloom.intensity = v;
  }

  resize(w: number, h: number): void {
    this.composer.setSize(w, h);
  }

  render(dt: number): void {
    this.composer.render(dt);
  }

  dispose(): void {
    this.composer.dispose();
  }
}
