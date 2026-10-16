import { Easing } from 'remotion';

/**
 * Poses (section 5). Angles are degrees from straight down; positive swings
 * toward the direction the character faces. Shoulders are measured from the
 * torso axis, hips from straight down. Elbows and knees are flexion: an elbow
 * bends the forearm forward, a knee bends the shin back.
 */
export type Pose = {
  readonly torso: number;
  readonly shoulderL: number;
  readonly elbowL: number;
  readonly shoulderR: number;
  readonly elbowR: number;
  readonly hipL: number;
  readonly kneeL: number;
  readonly hipR: number;
  readonly kneeR: number;
  /** Extras, not in the spec table. Shoulder rise in px (negative drops them). */
  readonly lift?: number;
  /** Foot pitch in degrees (positive raises the toe). */
  readonly footL?: number;
  readonly footR?: number;
  /**
   * Backward roll of the pelvis in degrees; hip angles are measured from it.
   * Sitting on the floor rolls the pelvis back, which is what lifts the knees.
   */
  readonly pelvisTilt?: number;
};

// Rows from the section 5 table. "—" for HOLD_PHONE_CHEST's legs means the
// legs are not part of that pose (they come from STAND or the walk cycle).
export const STAND: Pose = {
  torso: 0, shoulderL: 6, elbowL: 10, shoulderR: -4, elbowR: 8, hipL: 2, kneeL: 0, hipR: -2, kneeR: 0,
};
export const HOLD_BOWL: Pose = {
  torso: 0, shoulderL: 20, elbowL: 85, shoulderR: 15, elbowR: 95, hipL: 2, kneeL: 0, hipR: -2, kneeR: 0,
};
export const CATCH: Pose = {
  torso: 0, shoulderL: 20, elbowL: 85, shoulderR: 150, elbowR: 20, hipL: 2, kneeL: 0, hipR: -2, kneeR: 0,
};
export const HOLD_PHONE_CHEST: Pose = {
  torso: 0, shoulderL: 25, elbowL: 110, shoulderR: -4, elbowR: 8, hipL: STAND.hipL, kneeL: STAND.kneeL, hipR: STAND.hipR, kneeR: STAND.kneeR,
};
// Read literally from straight down, hip 90° / knee 110° leaves the thighs level,
// which looks like sitting on a chair. Shot 9 wants knees up (the phone rests
// on his knee at y 760), so the table angles are kept and measured from a
// pelvis that rolls back 45° on the floor.
export const SIT_FLOOR: Pose = {
  torso: -8, shoulderL: 40, elbowL: 70, shoulderR: 30, elbowR: 60, hipL: 90, kneeL: 110, hipR: 90, kneeR: 110,
  pelvisTilt: 45,
};

const KEYS = ['torso', 'shoulderL', 'elbowL', 'shoulderR', 'elbowR', 'hipL', 'kneeL', 'hipR', 'kneeR', 'lift', 'footL', 'footR', 'pelvisTilt'] as const;

/** Blend two poses; `t` is already eased by the caller (default easing per section 5). */
export const mixPose = (a: Pose, b: Pose, t: number): Pose => {
  const out: Record<string, number> = {};
  for (const k of KEYS) {
    const av = a[k] ?? 0;
    const bv = b[k] ?? 0;
    out[k] = av + (bv - av) * t;
  }
  return out as Pose;
};

/** The default easing for pose interpolation: Easing.inOut(Easing.cubic). */
export const poseEase = Easing.inOut(Easing.cubic);

/** Arms from one pose, legs from another (e.g. HOLD_PHONE_CHEST arms over the walk cycle). */
export const withLegs = (arms: Pose, legs: Pose): Pose => ({
  ...arms,
  hipL: legs.hipL, kneeL: legs.kneeL, hipR: legs.hipR, kneeR: legs.kneeR,
  footL: legs.footL, footR: legs.footR,
});

export type CycleResult = {
  readonly pose: Pose;
  /** Vertical pelvis offset in px (positive = down), at scale 1. */
  readonly bob: number;
};

/**
 * WALK: 16-frame cycle. Hips swing ±22°, knees 0–35°, arms swing opposite ±18°.
 * `stride` 0..1 scales the motion (used when his steps shorten to a stop).
 * The left heel strikes at phase 0.25 (hip fully forward).
 */
export const WALK_FRAMES = 16;
export const walkCycle = (frame: number, stride = 1): CycleResult => {
  const phase = (((frame % WALK_FRAMES) + WALK_FRAMES) % WALK_FRAMES) / WALK_FRAMES;
  const a = phase * Math.PI * 2;
  const hipL = 22 * Math.sin(a) * stride;
  const hipR = -hipL;
  // Knee flexes while the leg swings forward (hip angle increasing).
  const kneeL = 35 * Math.max(0, Math.cos(a)) * stride;
  const kneeR = 35 * Math.max(0, -Math.cos(a)) * stride;
  return {
    pose: {
      torso: 2 * stride,
      shoulderL: -18 * Math.sin(a) * stride, elbowL: 12 + 6 * stride,
      shoulderR: 18 * Math.sin(a) * stride, elbowR: 12 + 6 * stride,
      hipL, kneeL, hipR, kneeR,
      // The trailing heel lifts (toe down) as the leg goes behind the body.
      footL: -Math.max(0, -hipL) * 0.6, footR: -Math.max(0, -hipR) * 0.6,
    },
    // The rig's floor grounding supplies the vertical bob for walking.
    bob: 0,
  };
};

/**
 * RUN_UP_STAIRS: 15-frame cycle, two footfalls per cycle (8 frames then 7).
 * Knees lift to 95°, arms pump ±40°. `frame` counts from a left footfall.
 * Returns the pose plus which foot is planted and how far through its step.
 */
export const RUN_FRAMES = 15;
export const RUN_STEP_SPLIT = 8;
export const runUpStairsCycle = (frame: number): CycleResult & { readonly stance: 'L' | 'R'; readonly stepT: number } => {
  const f = ((frame % RUN_FRAMES) + RUN_FRAMES) % RUN_FRAMES;
  const stance: 'L' | 'R' = f < RUN_STEP_SPLIT ? 'L' : 'R';
  const stepT = stance === 'L' ? f / RUN_STEP_SPLIT : (f - RUN_STEP_SPLIT) / (RUN_FRAMES - RUN_STEP_SPLIT);
  // Stance leg: from bent-forward on landing (hip 55°, knee 70°) to extended
  // back at push-off (−25°, 8°). The swing leg runs the reverse, driving the
  // knee up to about 95° mid-swing, so every footfall hands over seamlessly.
  const e = poseEase(stepT);
  const s = Math.sin(stepT * Math.PI);
  const stanceHip = 55 - 80 * stepT;
  const stanceKnee = 70 - 62 * stepT;
  const swingHip = -25 + 80 * e + 18 * s;
  const swingKnee = 8 + 62 * stepT + 56 * s;
  const pump = 40 * Math.cos(stepT * Math.PI); // arms pump ±40°, opposite to the legs
  const legs =
    stance === 'L'
      ? { hipL: stanceHip, kneeL: stanceKnee, hipR: swingHip, kneeR: swingKnee, footL: 0, footR: 18 * s }
      : { hipR: stanceHip, kneeR: stanceKnee, hipL: swingHip, kneeL: swingKnee, footR: 0, footL: 18 * s };
  const arms =
    stance === 'L'
      ? { shoulderL: -pump, shoulderR: pump }
      : { shoulderL: pump, shoulderR: -pump };
  return {
    pose: { torso: 14, ...arms, elbowL: 85, elbowR: 85, ...legs },
    bob: -10 * s, // the body rises through each push-off
    stance,
    stepT,
  };
};

/**
 * SLIDE_DOWN: from STAND with the torso at −6° (back against the cabinet) to
 * SIT_FLOOR, while the hips move down 220 px. `t` runs 0..1 (eased inside).
 */
export const SLIDE_DROP = 220;
export const SLIDE_START: Pose = { ...STAND, torso: -6 };
export const slideDown = (t: number): CycleResult => {
  const e = poseEase(Math.max(0, Math.min(1, t)));
  return { pose: mixPose(SLIDE_START, SIT_FLOOR, e), bob: SLIDE_DROP * e };
};

/** Named list for RigTest. */
export const STATIC_POSES = [
  { name: 'STAND', pose: STAND },
  { name: 'HOLD_BOWL', pose: HOLD_BOWL },
  { name: 'CATCH', pose: CATCH },
  { name: 'HOLD_PHONE_CHEST', pose: HOLD_PHONE_CHEST },
  { name: 'SIT_FLOOR', pose: SIT_FLOOR },
] as const;
