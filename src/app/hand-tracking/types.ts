// MediaPipe landmark (normalized image coords, y-down, x-right)
export interface NormalizedLandmark {
  x: number; // 0-1
  y: number; // 0-1
  z: number; // relative depth
}

export type GestureType =
  | 'none'
  | 'open_palm'
  | 'fist'
  | 'pinch'
  | 'pointing'
  | 'thumbs_up'
  | 'thumbs_down'
  | 'peace'
  | 'three_fingers'
  | 'four_fingers'
  | 'five_fingers';

// Processed per-hand data after filtering and gesture recognition
export interface HandData {
  present: boolean;
  landmarks: NormalizedLandmark[];   // filtered (image space)
  gesture: GestureType;
  gestureConfidence: number;          // 0-1
  handedness: 'Left' | 'Right';      // person's hand
  score: number;                      // detection confidence
  palmCenter: NormalizedLandmark;     // average of palm landmarks
  indexTip: NormalizedLandmark;
  thumbTip: NormalizedLandmark;
  pinchStrength: number;              // 0-1, 1 = fully pinched
  palmNormalAngle: number;            // palm tilt angle (radians)
}

export interface TwoHandContext {
  handsPresent: number;               // 0, 1, or 2
  left: HandData;
  right: HandData;
  handDistance: number;               // normalized distance between palm centers
  prevHandDistance: number;
  handAngle: number;                  // angle of line connecting two hands
  prevHandAngle: number;
  bothPinching: boolean;
  bothFist: boolean;
  crossedHands: boolean;              // right hand is to left of left hand
  bothAboveCenter: boolean;           // both palms above screen center y
}

// Commands that flow from GestureController into Experience
export interface GestureForces {
  // Continuous forces (updated every frame)
  openPalmRepel: { active: boolean; nx: number; ny: number; nz: number };  // normalized image coords
  blackHole:     { active: boolean; nx: number; ny: number };
  magnetPoint:   { active: boolean; nx: number; ny: number };
  pinchCharge:   { active: boolean; nx: number; ny: number; charge: number; justReleased: boolean };
  palmRotation:  { active: boolean; deltaRotY: number; deltaRotX: number };
  twoHandScale:  { active: boolean; scaleDelta: number };
  twoHandRotate: { active: boolean; angleDelta: number };
  bothPinchCompress: { active: boolean; strength: number };
  // Single-hand pinch zoom: thumb+index distance drives zoom level
  // delta > 0 = fingers spreading = zoom in; delta < 0 = fingers closing = zoom out
  pinchZoom: { active: boolean; delta: number; scale: number };
  // Wrist→midMCP distance → depth proxy → object scale
  handScale: { active: boolean; targetScale: number };
  // The palm center is available independently from gesture classification so
  // visual shapes can remain locked to a visible hand.
  palmAnchor: { active: boolean; nx: number; ny: number; nz: number };
  // Pointing DIRECTION of the index finger (index MCP → tip), normalized and
  // mirrored for the selfie feed. Independent of where the hand sits in frame —
  // only the aim of the fingers matters. dx/dy in ~[-1,1].
  pointDir: { active: boolean; dx: number; dy: number };
}

// One-frame discrete triggers
export interface GestureTriggers {
  thumbsUp: boolean;
  thumbsDown: boolean;
  peace: boolean;
  threeFingers: boolean;
  fourFingers: boolean;
  fiveFingerHeld: boolean;   // open hand held 2 seconds
  supernova: boolean;        // both hands above head
  randomize: boolean;        // crossed hands
  bothPinchRelease: boolean;
  toggleAutoCamera: boolean; // peace sign
}

export const EMPTY_HAND_DATA: HandData = {
  present: false,
  landmarks: [],
  gesture: 'none',
  gestureConfidence: 0,
  handedness: 'Right',
  score: 0,
  palmCenter: { x: 0.5, y: 0.5, z: 0 },
  indexTip: { x: 0.5, y: 0.5, z: 0 },
  thumbTip: { x: 0.5, y: 0.5, z: 0 },
  pinchStrength: 0,
  palmNormalAngle: 0,
};

export const EMPTY_TWO_HAND: TwoHandContext = {
  handsPresent: 0,
  left: { ...EMPTY_HAND_DATA, handedness: 'Left' },
  right: { ...EMPTY_HAND_DATA, handedness: 'Right' },
  handDistance: 0,
  prevHandDistance: 0,
  handAngle: 0,
  prevHandAngle: 0,
  bothPinching: false,
  bothFist: false,
  crossedHands: false,
  bothAboveCenter: false,
};
