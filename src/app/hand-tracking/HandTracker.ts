import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { HandLandmarkFilter, ScalarEMA } from './HandFilter';
import type { HandData, NormalizedLandmark, TwoHandContext } from './types';
import { EMPTY_TWO_HAND, EMPTY_HAND_DATA } from './types';
import { GestureRecognizer } from './GestureRecognizer';

export type HandTrackingCallback = (ctx: TwoHandContext) => void;

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// MediaPipe hand landmark indices
const LM = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_TIP: 12,
  RING_TIP: 16,
  PINKY_MCP: 17, PINKY_TIP: 20,
} as const;

export class HandTracker {
  private landmarker: HandLandmarker | null = null;
  private video: HTMLVideoElement;
  private stream: MediaStream | null = null;
  private running = false;
  private rafId = 0;
  private lastDetectionAt = 0;

  // One filter per hand slot (MediaPipe returns up to 2 hands)
  private filters = [new HandLandmarkFilter(), new HandLandmarkFilter()];
  private pinchEMA = [new ScalarEMA(0, 0.3), new ScalarEMA(0, 0.3)];
  // Gesture stabilization must be independent per hand. A shared recognizer
  // makes left/right gestures overwrite each other's debounce history.
  private recognizers = [new GestureRecognizer(), new GestureRecognizer()];

  // Two-hand context tracking
  private prevHandDist = 0;
  private prevHandAngle = 0;

  onResults: HandTrackingCallback = () => {};
  onCameraReady: () => void = () => {};
  onError: (err: Error) => void = () => {};

  status: 'idle' | 'loading' | 'active' | 'error' = 'idle';

  // Expose video and stream for external use
  get videoElement(): HTMLVideoElement { return this.video; }
  get mediaStream(): MediaStream | null { return this.stream; }

  constructor() {
    this.video = document.createElement('video');
    this.video.playsInline = true;
    this.video.muted = true;
    // Keep off-screen by default; caller mounts it visually
    this.video.style.cssText =
      'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(this.video);
  }

  async init(): Promise<void> {
    this.status = 'loading';
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.55,
        minHandPresenceConfidence: 0.55,
        minTrackingConfidence: 0.5,
      });
    } catch (e) {
      this.status = 'error';
      this.onError(e as Error);
      throw e;
    }
  }

  async startCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user', frameRate: { ideal: 30 } },
      });
      this.video.srcObject = this.stream;
      await new Promise<void>((resolve) => {
        this.video.onloadeddata = () => resolve();
      });
      await this.video.play();
      this.status = 'active';
      this.running = true;
      this.onCameraReady();
      this.tick();
    } catch (e) {
      this.status = 'error';
      this.onError(e as Error);
      throw e;
    }
  }

  showCameraFeed(visible: boolean): void {
    this.video.style.opacity = visible ? '0.35' : '0';
  }

  stopCamera(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.status = 'idle';
  }

  dispose(): void {
    this.stopCamera();
    document.body.removeChild(this.video);
    this.landmarker?.close();
  }

  // ─── Frame processing ────────────────────────────────────────────────────────

  private tick = (): void => {
    if (!this.running || !this.landmarker) return;
    if (this.video.readyState >= 2) {
      const ts = performance.now();
      // MediaPipe inference is expensive and the camera is configured for 30fps.
      // Running it again on every 60/120Hz render frame causes visible frame drops
      // without providing new camera data.
      if (ts - this.lastDetectionAt >= 33) {
        this.lastDetectionAt = ts;
        const result = this.landmarker.detectForVideo(this.video, ts);
        const ctx = this.processResult(result, ts);
        this.onResults(ctx);
      }
    }
    this.rafId = requestAnimationFrame(this.tick);
  };

  private processResult(result: HandLandmarkerResult, ts: number): TwoHandContext {
    const { landmarks, handedness } = result;
    if (!landmarks.length) {
      this.filters[0].reset();
      this.filters[1].reset();
      return { ...EMPTY_TWO_HAND };
    }

    // Sort: find which result is Left / Right (person's perspective).
    // Bind each filter+EMA slot to a fixed side so hands never swap smoothing
    // state when MediaPipe reorders its results between frames.
    const hands: HandData[] = landmarks.map((raw, idx) => {
      const side = (handedness[idx]?.[0]?.categoryName ?? 'Right') as 'Left' | 'Right';
      const score = handedness[idx]?.[0]?.score ?? 0;
      const slot = side === 'Left' ? 0 : 1;
      const filtered = this.filters[slot].filter(
        raw.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z })),
        ts,
      );
      return this.buildHandData(filtered, side, score, slot, ts);
    });

    // Assign left/right slots
    let left = hands.find((h) => h.handedness === 'Left');
    let right = hands.find((h) => h.handedness === 'Right');

    // Fallback: if only one hand, determine from position
    if (!left && !right) return { ...EMPTY_TWO_HAND };
    if (!left) left = hands.find((h) => h.handedness !== 'Right') ?? hands[0];
    if (!right) right = hands.find((h) => h.handedness !== 'Left') ?? hands[0];

    const leftH = left ?? { ...EMPTY_HAND_DATA as HandData, handedness: 'Left' as const };
    const rightH = right ?? { ...EMPTY_HAND_DATA as HandData, handedness: 'Right' as const };

    const handsPresent = landmarks.length;

    // Two-hand metrics
    let handDistance = this.prevHandDist;
    let handAngle = this.prevHandAngle;
    let crossedHands = false;
    let bothAboveCenter = false;

    if (handsPresent === 2 && leftH.present && rightH.present) {
      const dx = rightH.palmCenter.x - leftH.palmCenter.x;
      const dy = rightH.palmCenter.y - leftH.palmCenter.y;
      handDistance = Math.hypot(dx, dy);
      handAngle = Math.atan2(dy, dx);
      crossedHands = rightH.palmCenter.x < leftH.palmCenter.x;
      bothAboveCenter = leftH.palmCenter.y < 0.4 && rightH.palmCenter.y < 0.4;
    }

    const ctx: TwoHandContext = {
      handsPresent,
      left: leftH,
      right: rightH,
      handDistance,
      prevHandDistance: this.prevHandDist,
      handAngle,
      prevHandAngle: this.prevHandAngle,
      bothPinching: leftH.pinchStrength > 0.75 && rightH.pinchStrength > 0.75,
      bothFist: leftH.gesture === 'fist' && rightH.gesture === 'fist',
      crossedHands,
      bothAboveCenter,
    };

    this.prevHandDist = handDistance;
    this.prevHandAngle = handAngle;
    return ctx;
  }

  private buildHandData(
    filtered: NormalizedLandmark[],
    side: 'Left' | 'Right',
    score: number,
    idx: number,
    ts: number,
  ): HandData {
    const wrist = filtered[LM.WRIST];
    const indexTip = filtered[LM.INDEX_TIP];
    const thumbTip = filtered[LM.THUMB_TIP];

    // Palm center = average of wrist, index/middle/ring/pinky MCP
    const palmCenter: NormalizedLandmark = {
      x: (wrist.x + filtered[LM.INDEX_MCP].x + filtered[LM.MIDDLE_MCP].x + filtered[LM.PINKY_MCP].x) / 4,
      y: (wrist.y + filtered[LM.INDEX_MCP].y + filtered[LM.MIDDLE_MCP].y + filtered[LM.PINKY_MCP].y) / 4,
      z: (wrist.z + filtered[LM.INDEX_MCP].z + filtered[LM.MIDDLE_MCP].z + filtered[LM.PINKY_MCP].z) / 4,
    };

    // Pinch: distance between thumb tip and index tip, normalized by palm length
    // so it reads the same whether the hand is near or far from the camera.
    const palmLen = Math.max(
      1e-3,
      Math.hypot(
        filtered[LM.MIDDLE_MCP].x - wrist.x,
        filtered[LM.MIDDLE_MCP].y - wrist.y,
        filtered[LM.MIDDLE_MCP].z - wrist.z,
      ),
    );
    const pinchDist = Math.hypot(
      thumbTip.x - indexTip.x,
      thumbTip.y - indexTip.y,
      thumbTip.z - indexTip.z,
    );
    const pinchRatio = pinchDist / palmLen;                 // ~0.2 pinched, ~1.0 open
    const rawPinch = Math.max(0, Math.min(1, (0.75 - pinchRatio) / 0.55));
    const pinchStrength = this.pinchEMA[idx].update(rawPinch);

    // Palm normal angle (tilt around Z): angle of wrist→middle vector
    const mx = filtered[LM.MIDDLE_MCP].x - wrist.x;
    const my = filtered[LM.MIDDLE_MCP].y - wrist.y;
    const palmNormalAngle = Math.atan2(mx, -my); // 0 = palm pointing up

    const { gesture, confidence } = this.recognizers[idx].recognize(filtered, side);

    return {
      present: true,
      landmarks: filtered,
      gesture,
      gestureConfidence: confidence,
      handedness: side,
      score,
      palmCenter,
      indexTip,
      thumbTip,
      pinchStrength,
      palmNormalAngle,
    };
  }
}
