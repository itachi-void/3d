import type { NormalizedLandmark, GestureType } from './types';

// Landmark index constants
const L = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5,  INDEX_PIP: 6,  INDEX_DIP: 7,  INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13,  RING_PIP: 14,  RING_DIP: 15,  RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
} as const;

// Hand skeleton connections for rendering
export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],                   // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],                   // Index
  [0, 9], [9, 10], [10, 11], [11, 12],               // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],             // Ring
  [0, 17], [17, 18], [18, 19], [19, 20],             // Pinky
  [5, 9], [9, 13], [13, 17],                         // Palm
];

function dist(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

// Cosine of the angle at joint `b` formed by a→b→c. 1 = straight, 0 = right angle.
function jointCos(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark): number {
  const ax = b.x - a.x, ay = b.y - a.y, az = b.z - a.z;
  const bx = c.x - b.x, by = c.y - b.y, bz = c.z - b.z;
  const la = Math.hypot(ax, ay, az);
  const lb = Math.hypot(bx, by, bz);
  if (la < 1e-6 || lb < 1e-6) return 1;
  return (ax * bx + ay * by + az * bz) / (la * lb);
}

// A finger is extended when it is roughly straight (joints aligned) AND the tip
// reaches beyond the knuckle. Both tests are orientation- and scale-independent.
function fingerExtended(
  lms: NormalizedLandmark[],
  mcp: number, pip: number, tip: number,
  ref: number,
): boolean {
  const straight = jointCos(lms[mcp], lms[pip], lms[tip]) > 0.55;    // < ~57° bend
  const reach    = dist(lms[tip], lms[L.WRIST]) > dist(lms[mcp], lms[L.WRIST]) + ref * 0.15;
  return straight && reach;
}

export class GestureRecognizer {
  private stableGesture: GestureType = 'none';
  private candidate: GestureType = 'none';
  private candidateCount = 0;
  private stableCount = 0;

  recognize(lms: NormalizedLandmark[], handedness: 'Left' | 'Right'): {
    gesture: GestureType;
    confidence: number;
  } {
    const raw = this.classifyRaw(lms, handedness);
    const stable = this.stabilize(raw);
    return { gesture: stable, confidence: stable === 'none' ? 0 : Math.min(1, 0.8 + this.stableCount * 0.04) };
  }

  private classifyRaw(lms: NormalizedLandmark[], _hand: 'Left' | 'Right'): GestureType {
    if (lms.length < 21) return 'none';

    const wrist = lms[L.WRIST];

    // Palm length — the scale reference that makes every threshold distance-invariant
    const ref = Math.max(1e-3, dist(wrist, lms[L.MIDDLE_MCP]));

    const indexExt  = fingerExtended(lms, L.INDEX_MCP,  L.INDEX_PIP,  L.INDEX_TIP,  ref);
    const middleExt = fingerExtended(lms, L.MIDDLE_MCP, L.MIDDLE_PIP, L.MIDDLE_TIP, ref);
    const ringExt   = fingerExtended(lms, L.RING_MCP,   L.RING_PIP,   L.RING_TIP,   ref);
    const pinkyExt  = fingerExtended(lms, L.PINKY_MCP,  L.PINKY_PIP,  L.PINKY_TIP,  ref);
    const extCount  = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

    // Thumb: extended if it juts away from the wrist; direction from tip vs knuckles
    const thumbOut = dist(lms[L.THUMB_TIP], wrist) / ref;
    const thumbExt = thumbOut > 1.15 && jointCos(lms[L.THUMB_MCP], lms[L.THUMB_IP], lms[L.THUMB_TIP]) > 0.2;
    const thumbDy  = (lms[L.INDEX_MCP].y - lms[L.THUMB_TIP].y) / ref; // + = tip above knuckles
    const thumbUp   = thumbDy > 0.55;
    const thumbDown = thumbDy < -0.55;

    // Pinch is deliberately independent of the other fingers. People naturally
    // pinch with an open hand, especially when reaching toward the camera.
    // A stricter scale-relative ratio prevents an open palm from stealing it.
    const pinchRatio = dist(lms[L.THUMB_TIP], lms[L.INDEX_TIP]) / ref;
    if (pinchRatio < 0.38) return 'pinch';

    // Fist: nothing extended
    if (extCount === 0 && !thumbExt) return 'fist';

    // Thumbs up / down: fingers curled, thumb clearly vertical
    if (extCount === 0 && thumbExt && thumbUp)   return 'thumbs_up';
    if (extCount === 0 && thumbExt && thumbDown) return 'thumbs_down';

    // Pointing (index only)
    if (indexExt && !middleExt && !ringExt && !pinkyExt) return 'pointing';

    // Peace (index + middle)
    if (indexExt && middleExt && !ringExt && !pinkyExt) return 'peace';

    // Three fingers (index + middle + ring)
    if (indexExt && middleExt && ringExt && !pinkyExt) return 'three_fingers';

    // Four fingers (all four, thumb tucked)
    if (extCount === 4 && !thumbExt) return 'four_fingers';

    // Open palm / five fingers
    if (extCount >= 3) return (extCount === 4 && thumbExt) ? 'five_fingers' : 'open_palm';

    return 'none';
  }

  private stabilize(raw: GestureType): GestureType {
    if (raw === this.stableGesture) {
      this.stableCount = Math.min(this.stableCount + 1, 30);
      this.candidate = raw;
      this.candidateCount = 0;
      return this.stableGesture;
    }

    if (raw === this.candidate) {
      this.candidateCount++;
      // Intentional, high-signal poses lock in faster than ambiguous ones
      const needed = (raw === 'pinch' || raw === 'fist' || raw === 'none') ? 3 : 5;
      if (this.candidateCount >= needed) {
        this.stableGesture = this.candidate;
        this.stableCount = 0;
      }
    } else {
      this.candidate = raw;
      this.candidateCount = 1;
    }

    return this.stableGesture;
  }

  reset(): void {
    this.stableGesture = 'none';
    this.candidate = 'none';
    this.candidateCount = 0;
    this.stableCount = 0;
  }
}
