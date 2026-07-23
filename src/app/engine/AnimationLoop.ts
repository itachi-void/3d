type TickFn = (time: number, dt: number) => void;

export class AnimationLoop {
  private rafId = 0;
  private prevTime = 0;
  private running = false;

  constructor(private onTick: TickFn) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.prevTime = performance.now();
    this.tick(this.prevTime);
  }

  private tick = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min((now - this.prevTime) / 1000, 0.05);
    this.prevTime = now;
    this.onTick(now / 1000, dt);
    this.rafId = requestAnimationFrame(this.tick);
  };

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  dispose(): void {
    this.stop();
  }
}
