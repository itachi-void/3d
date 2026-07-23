import type { TwoHandContext, GestureForces, GestureTriggers } from './types';

// GestureController translates raw hand context → forces + triggers for Experience
export class GestureController {
  // Continuous output
  forces: GestureForces = makeEmptyForces();
  triggers: GestureTriggers = makeEmptyTriggers();

  // Internal state
  private pinchChargeStart = 0;
  private wasLeftPinching = false;
  private wasRightPinching = false;
  private prevPinchStrength: number | null = null; // for pinchZoom delta
  private smoothHandSize = 0;                      // EMA-smoothed palm size
  private wasBothPinching = false;
  private fiveFingerStart = 0;
  private fiveFingerFired = false;
  private openHandHoldStart = 0;

  private wasThumbsUp = false;
  private wasThumbsDown = false;
  private wasPeace = false;
  private wasThreeFingers = false;
  private wasFourFingers = false;
  private wasBothFist = false;
  private wasBothAboveHead = false;
  private wasCrossed = false;

  private prevHandAngle = 0;
  private prevHandDist = 0;

  update(ctx: TwoHandContext): void {
    this.triggers = makeEmptyTriggers();
    this.forces = makeEmptyForces();

    const { left, right, handsPresent } = ctx;

    // ─── Primary (first non-absent hand wins for single-hand gestures) ─────────
    const primary = (left.present && left.gesture !== 'none') ? left :
                    (right.present && right.gesture !== 'none') ? right : null;
    const anchorHand = left.present ? left : right.present ? right : null;
    if (anchorHand) {
      this.forces.palmAnchor = {
        active: true,
        nx: anchorHand.palmCenter.x,
        ny: anchorHand.palmCenter.y,
        nz: anchorHand.palmCenter.z,
      };
    }
    const now = Date.now();

    if (primary) {
      const gesture = primary.gesture;

      // ── Open palm: palm center controls repulsion/rotation ──────────────────
      if (gesture === 'open_palm' || gesture === 'five_fingers') {
        this.forces.openPalmRepel = {
          active: true,
          nx: primary.palmCenter.x,
          ny: primary.palmCenter.y,
          nz: primary.palmCenter.z,
        };
        this.forces.palmRotation = {
          active: true,
          deltaRotY: primary.palmNormalAngle * 0.0015,
          deltaRotX: (primary.palmCenter.y - 0.5) * -0.002,
        };

        // Five finger hold (2 seconds) → toggle webcam
        if (gesture === 'five_fingers') {
          if (this.fiveFingerStart === 0) this.fiveFingerStart = now;
          if (!this.fiveFingerFired && now - this.fiveFingerStart > 2000) {
            this.triggers.fiveFingerHeld = true;
            this.fiveFingerFired = true;
          }
        } else {
          this.fiveFingerStart = 0;
          this.fiveFingerFired = false;
        }
      } else {
        this.fiveFingerStart = 0;
        this.fiveFingerFired = false;
      }

      // ── Fist → black hole ────────────────────────────────────────────────────
      if (gesture === 'fist') {
        this.forces.blackHole = {
          active: true,
          nx: primary.palmCenter.x,
          ny: primary.palmCenter.y,
        };
      }

      // ── Pinch → charge + explosion ───────────────────────────────────────────
      if (gesture === 'pinch') {
        if (!this.wasLeftPinching && !this.wasRightPinching) {
          this.pinchChargeStart = now;
        }
        const charge = Math.min(1, (now - this.pinchChargeStart) / 3000);
        this.forces.pinchCharge = {
          active: true,
          nx: primary.indexTip.x,
          ny: primary.indexTip.y,
          charge,
          justReleased: false,
        };
      } else if (this.wasLeftPinching || this.wasRightPinching) {
        // Just released pinch → fire explosion
        const charge = Math.min(1, (now - this.pinchChargeStart) / 3000);
        if (charge > 0.05) {
          this.forces.pinchCharge = {
            active: false,
            nx: primary.palmCenter.x,
            ny: primary.palmCenter.y,
            charge,
            justReleased: true,
          };
        }
      }

      // ── Pointing → magnetic attraction + finger-aim direction ────────────────
      if (gesture === 'pointing') {
        this.forces.magnetPoint = {
          active: true,
          nx: primary.indexTip.x,
          ny: primary.indexTip.y,
        };

        // Finger-aim direction: index MCP (5) → index tip (8). Position-agnostic,
        // so the camera reacts to WHERE the finger points, not to hand tilt or
        // where the hand sits in the frame.
        if (primary.landmarks.length >= 9) {
          const mcp = primary.landmarks[5];
          const tip = primary.landmarks[8];
          let dx = tip.x - mcp.x;
          let dy = tip.y - mcp.y;
          const len = Math.hypot(dx, dy) || 1;
          dx /= len;
          dy /= len;
          this.forces.pointDir = {
            active: true,
            dx: -dx, // mirror x for the selfie feed
            dy,      // image y is down; consumers decide sign
          };
        }
      }

      // ── Discrete triggers (rising edge) ─────────────────────────────────────
      if (gesture === 'thumbs_up' && !this.wasThumbsUp) {
        this.triggers.thumbsUp = true;
      }
      if (gesture === 'thumbs_down' && !this.wasThumbsDown) {
        this.triggers.thumbsDown = true;
      }
      if (gesture === 'peace' && !this.wasPeace) {
        this.triggers.peace = true;
        this.triggers.toggleAutoCamera = true;
      }
      if (gesture === 'three_fingers' && !this.wasThreeFingers) {
        this.triggers.threeFingers = true;
      }
      if (gesture === 'four_fingers' && !this.wasFourFingers) {
        this.triggers.fourFingers = true;
      }

      this.wasThumbsUp    = gesture === 'thumbs_up';
      this.wasThumbsDown  = gesture === 'thumbs_down';
      this.wasPeace       = gesture === 'peace';
      this.wasThreeFingers = gesture === 'three_fingers';
      this.wasFourFingers  = gesture === 'four_fingers';
      this.wasLeftPinching  = primary === left  && gesture === 'pinch';
      this.wasRightPinching = primary === right && gesture === 'pinch';
    } else {
      this.resetSingleHandState();
    }

    // ─── Pinch zoom (single-hand, any gesture) ────────────────────────────────
    // pinchStrength: 1 = fingers touching, 0 = fingers fully apart.
    // Spreading fingers (strength decreasing) → delta > 0 → zoom in.
    if (primary) {
      const strength = primary.pinchStrength; // 0-1
      if (this.prevPinchStrength !== null) {
        const delta = this.prevPinchStrength - strength; // positive = spreading
        if (Math.abs(delta) > 0.004) {
          this.forces.pinchZoom = {
            active: true,
            delta,           // positive = zoom in, negative = zoom out
            scale: 1 - strength, // 0 = fully closed, 1 = fully open
          };
        }
      }
      this.prevPinchStrength = strength;
    } else {
      this.prevPinchStrength = null;
    }

    // ─── Hand apparent size → depth proxy (wrist → mid-MCP distance) ─────────
    // Closer hand = larger palm in image = larger object scale
    if (primary && primary.landmarks.length >= 10) {
      const w  = primary.landmarks[0]; // wrist
      const m  = primary.landmarks[9]; // middle finger MCP
      const dx = m.x - w.x;
      const dy = m.y - w.y;
      const raw = Math.sqrt(dx * dx + dy * dy);
      // EMA: fast rise (close = big), slow decay (prevents jumps when hand leaves)
      const alpha = raw > this.smoothHandSize ? 0.25 : 0.12;
      this.smoothHandSize = this.smoothHandSize * (1 - alpha) + raw * alpha;
      // ~0.12 at arm's length = scale 1.0; closer → bigger, farther → smaller
      const targetScale = Math.max(0.25, Math.min(3.0, this.smoothHandSize * 8.5));
      this.forces.handScale = { active: true, targetScale };
    } else {
      this.smoothHandSize = this.smoothHandSize * 0.92; // decay slowly
      const targetScale = Math.max(0.25, Math.min(3.0, this.smoothHandSize * 8.5));
      this.forces.handScale = { active: false, targetScale };
    }

    // ─── Two-hand gestures ────────────────────────────────────────────────────
    if (handsPresent >= 2 && left.present && right.present) {
      // Scale: distance change
      const distDelta = ctx.handDistance - this.prevHandDist;
      if (Math.abs(distDelta) > 0.002) {
        this.forces.twoHandScale = {
          active: true,
          scaleDelta: distDelta * 1.5,
        };
      }

      // Rotation: angle change
      const angleDelta = this.angleDiff(ctx.handAngle, this.prevHandAngle);
      if (Math.abs(angleDelta) > 0.003) {
        this.forces.twoHandRotate = {
          active: true,
          angleDelta: angleDelta * 0.8,
        };
      }

      // Both pinching → compress
      if (ctx.bothPinching) {
        const compress = Math.min(1, (now - this.pinchChargeStart) / 2000);
        this.forces.bothPinchCompress = {
          active: true,
          strength: compress,
        };
        if (!this.wasBothPinching) {
          this.pinchChargeStart = now;
          this.wasBothPinching = true;
        }
      } else if (this.wasBothPinching) {
        this.triggers.bothPinchRelease = true;
        this.wasBothPinching = false;
      }

      // Supernova: both hands raised above screen center
      if (ctx.bothAboveCenter && !this.wasBothAboveHead) {
        this.triggers.supernova = true;
      }
      this.wasBothAboveHead = ctx.bothAboveCenter;

      // Crossed hands → randomize
      if (ctx.crossedHands && !this.wasCrossed) {
        this.triggers.randomize = true;
      }
      this.wasCrossed = ctx.crossedHands;

      this.prevHandDist  = ctx.handDistance;
      this.prevHandAngle = ctx.handAngle;
    } else {
      this.prevHandDist  = 0;
      this.prevHandAngle = 0;
      this.wasBothAboveHead = false;
      this.wasCrossed = false;
      if (this.wasBothPinching) {
        this.triggers.bothPinchRelease = true;
        this.wasBothPinching = false;
      }
    }
  }

  private angleDiff(a: number, b: number): number {
    let d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  private resetSingleHandState(): void {
    this.wasThumbsUp = false;
    this.wasThumbsDown = false;
    this.wasPeace = false;
    this.wasThreeFingers = false;
    this.wasFourFingers = false;
    if (this.wasLeftPinching || this.wasRightPinching) {
      // Release any active pinch charge silently
      this.wasLeftPinching = false;
      this.wasRightPinching = false;
    }
    this.fiveFingerStart = 0;
    this.fiveFingerFired = false;
  }
}

function makeEmptyForces(): GestureForces {
  return {
    openPalmRepel:      { active: false, nx: 0.5, ny: 0.5, nz: 0 },
    blackHole:          { active: false, nx: 0.5, ny: 0.5 },
    magnetPoint:        { active: false, nx: 0.5, ny: 0.5 },
    pinchCharge:        { active: false, nx: 0.5, ny: 0.5, charge: 0, justReleased: false },
    palmRotation:       { active: false, deltaRotY: 0, deltaRotX: 0 },
    twoHandScale:       { active: false, scaleDelta: 0 },
    twoHandRotate:      { active: false, angleDelta: 0 },
    bothPinchCompress:  { active: false, strength: 0 },
    pinchZoom:          { active: false, delta: 0, scale: 0.5 },
    handScale:          { active: false, targetScale: 1.0 },
    palmAnchor:         { active: false, nx: 0.5, ny: 0.5, nz: 0 },
    pointDir:           { active: false, dx: 0, dy: 0 },
  };
}

function makeEmptyTriggers(): GestureTriggers {
  return {
    thumbsUp: false,
    thumbsDown: false,
    peace: false,
    threeFingers: false,
    fourFingers: false,
    fiveFingerHeld: false,
    supernova: false,
    randomize: false,
    bothPinchRelease: false,
    toggleAutoCamera: false,
  };
}
