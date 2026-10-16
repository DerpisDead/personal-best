/**
 * Every frame number in the spec, at 30 fps ("f195" in the spec is 195 here).
 *
 * Pairs like `[30, 45]` are interpolation keyframes: the change starts at the
 * first frame and is complete at the second. Shot ranges use `from` and
 * `durationInFrames`, so shot 1 (f0–59) is `{from: 0, durationInFrames: 60}`.
 *
 * This file is plain, type-strippable TypeScript with no imports so that
 * `scripts/verify-timeline.mjs` can load it directly with Node.
 */

export const FPS = 30;
export const DURATION = 870; // 29.0 s
export const LAST_FRAME = 869;
export const BPM = 120;
export const BEAT = 15; // frames per beat at 120 BPM and 30 fps

// ---------------------------------------------------------------------------
// Section 3: shots
// ---------------------------------------------------------------------------

export const SHOT_1 = { from: 0, durationInFrames: 60 }; // Drawer, f0–59
export const SHOT_2 = { from: 60, durationInFrames: 90 }; // Overhead bed, f60–149
export const SHOT_3 = { from: 150, durationInFrames: 75 }; // Kitchen morning, f150–224
export const SHOT_4 = { from: 225, durationInFrames: 75 }; // Stadium steps, f225–299
export const SHOT_5 = { from: 300, durationInFrames: 90 }; // Guitar chord, f300–389
export const SHOT_6 = { from: 390, durationInFrames: 45 }; // Phone insert, f390–434
export const SHOT_7 = { from: 435, durationInFrames: 90 }; // Kitchen walk, f435–524
export const SHOT_8 = { from: 525, durationInFrames: 75 }; // Close-up swipe, f525–599
export const SHOT_9 = { from: 600, durationInFrames: 165 }; // Kitchen floor, f600–764
export const SHOT_10 = { from: 765, durationInFrames: 105 }; // High wide, f765–869

export const SHOTS = [
  { shot: 1, name: 'Drawer', ...SHOT_1 },
  { shot: 2, name: 'Overhead bed', ...SHOT_2 },
  { shot: 3, name: 'Kitchen morning', ...SHOT_3 },
  { shot: 4, name: 'Stadium steps', ...SHOT_4 },
  { shot: 5, name: 'Guitar chord', ...SHOT_5 },
  { shot: 6, name: 'Phone insert', ...SHOT_6 },
  { shot: 7, name: 'Kitchen walk', ...SHOT_7 },
  { shot: 8, name: 'Close-up swipe', ...SHOT_8 },
  { shot: 9, name: 'Kitchen floor', ...SHOT_9 },
  { shot: 10, name: 'High wide', ...SHOT_10 },
] as const;

// ---------------------------------------------------------------------------
// Section 3: key events
// ---------------------------------------------------------------------------

export const F_START = 0; // HUD appears, timer starts, start tone
export const F_DRAWER_SHUT = 45; // thunk, 4 px camera shake f45–51
export const F_LAMP_CLICK = 90; // lighting switches to night
export const F_DAY_CUT = 105; // night to day; SLEEP completes; music starts
export const F_LABEL_NUTRITION = 150;
export const F_ORANGE_CAUGHT = 195; // NUTRITION completes
export const F_WHIP_OUT = 210;
export const F_WHIP_IN = 225; // shot 4 lands; label → PHYSICAL EXERCISE
export const F_TOP_STEP = 285; // PHYSICAL EXERCISE completes
export const F_LABEL_COGNITIVE = 300;
export const F_STRUM_BUZZ = 315;
export const F_STRUM_CLEAN = 360; // COGNITIVE FITNESS completes
export const F_LABEL_EMOTIONAL = 390;
export const F_TAP_CALL = 396;
export const F_TAP_SPEAKER = 414;
export const F_MUSIC_CROSSFADE = 480;
export const F_GLANCE_UP = 510;
export const F_SWIPE_START = 570; // finger touches HUD; music hard stop
export const F_SWIPE_END = 585; // HUD fully off-screen
export const F_SHOT_9 = 600; // slide down the cabinet f600–640
export const F_LAUGH = 660; // f660–690
export const F_WHY_LINE = 675;
export const F_GUITAR_CALLBACK = 705;
export const F_PERSONAL_BEST = 765;
export const F_FIFTH_PIP = 771;
export const F_CTA = 795; // call to action and credit line
export const F_SILENCE = 840; // silence for the last second

export const KEY_EVENTS = [
  { frame: F_START, event: 'HUD appears, timer starts, start tone', onGrid: true },
  { frame: F_DRAWER_SHUT, event: 'Drawer shuts', onGrid: true },
  { frame: F_LAMP_CLICK, event: 'Lamp click; night lighting', onGrid: true },
  { frame: F_DAY_CUT, event: 'Cut to day; SLEEP completes; music starts', onGrid: true },
  { frame: F_LABEL_NUTRITION, event: 'Label → NUTRITION', onGrid: true },
  { frame: F_ORANGE_CAUGHT, event: 'Orange caught; NUTRITION completes', onGrid: true },
  { frame: F_WHIP_OUT, event: 'Whip-pan out begins', onGrid: true },
  { frame: F_WHIP_IN, event: 'Whip-pan in lands shot 4; label → PHYSICAL EXERCISE', onGrid: true },
  { frame: F_TOP_STEP, event: 'Top step; PHYSICAL EXERCISE completes', onGrid: true },
  { frame: F_LABEL_COGNITIVE, event: 'Label → COGNITIVE FITNESS', onGrid: true },
  { frame: F_STRUM_BUZZ, event: 'First strum (buzz)', onGrid: true },
  { frame: F_STRUM_CLEAN, event: 'Second strum (clean); COGNITIVE FITNESS completes', onGrid: true },
  { frame: F_LABEL_EMOTIONAL, event: 'Label → EMOTIONAL WELL-BEING', onGrid: true },
  { frame: F_TAP_CALL, event: 'Thumb taps call', onGrid: false },
  { frame: F_TAP_SPEAKER, event: 'Thumb taps speaker', onGrid: false },
  { frame: F_MUSIC_CROSSFADE, event: 'Music begins crossfade to muffled version', onGrid: true },
  { frame: F_GLANCE_UP, event: 'He glances up at the timer', onGrid: true },
  { frame: F_SWIPE_START, event: 'Finger touches HUD; swipe begins; music hard stop', onGrid: true },
  { frame: F_SWIPE_END, event: 'HUD fully off-screen', onGrid: false },
  { frame: F_SHOT_9, event: 'Shot 9 begins', onGrid: true },
  { frame: F_LAUGH, event: 'Laugh begins', onGrid: true },
  { frame: F_WHY_LINE, event: 'Why-line appears', onGrid: true },
  { frame: F_GUITAR_CALLBACK, event: 'Guitar chord callback (audio)', onGrid: true },
  { frame: F_PERSONAL_BEST, event: 'PERSONAL BEST appears', onGrid: true },
  { frame: F_FIFTH_PIP, event: 'Fifth pip fills', onGrid: false },
  { frame: F_CTA, event: 'Call to action and credit line appear', onGrid: true },
  { frame: F_SILENCE, event: 'Silence for the last second', onGrid: true },
  { frame: LAST_FRAME, event: 'Last frame', onGrid: false },
] as const;

// Off-grid frames the spec allows (sound effects and small actions only).
export const FOOTFALLS = [233, 241, 248, 256, 263, 271, 278, 285] as const;
export const F_KEYS = 465;

// ---------------------------------------------------------------------------
// Section 6: HUD
// ---------------------------------------------------------------------------

export const HABITS = [
  { label: 'SLEEP', from: 0, completesAt: 105 },
  { label: 'NUTRITION', from: 150, completesAt: 195 },
  { label: 'PHYSICAL EXERCISE', from: 225, completesAt: 285 },
  { label: 'COGNITIVE FITNESS', from: 300, completesAt: 360 },
  { label: 'EMOTIONAL WELL-BEING', from: 390, completesAt: null },
] as const;

export const HUD = {
  fadeIn: [0, 3], // opacity 0→1, translateY −8→0
  labelGoldFrames: 4, // label color hudLabel → gold
  splitFadeFrames: 6, // split time opacity 0→1, translateX 8→0
  pipSpringFrames: 9, // pip scale 0.6 → 1.25 → 1.0
  borderFlashFrames: 8, // border goldBorderFlash → hudBorder
  labelOutFrames: 3, // old label and split fade out
  labelInFrames: 6, // new label rises from translateY +10
  pillIn: [105, 110], // "8 HRS" fades in
  pillLast: 149, // "8 HRS" last visible frame
  swipe: [570, 585], // panel follows the fingertip, translateX 0 → +720
  swipeFade: [578, 585], // opacity 1 → 0
  trail: [570, 585], // ghost copies visible
  hiddenFrom: 586, // HUD not rendered from here on
} as const;

export const PB = {
  in: [765, 769], // spring scale-in, opacity 0→1
  underline: [765, 780], // underline width 0 → 100%
  fifthPip: 771,
  particleFrames: 12, // particles radiate and fade
  glow: [765, 780, 795], // text-shadow blur 28 → 40 → 28
} as const;

// ---------------------------------------------------------------------------
// Section 7: shot-by-shot
// ---------------------------------------------------------------------------

export const S1 = {
  phoneArc: [0, 22], // phone moves on an arc into the drawer, rotation −10° → 0°
  phoneDrop: [22, 26], // released, drops 8 px
  fingersOpen: [22, 26],
  handToDrawer: [26, 32], // palm flat on the drawer front
  drawerClose: [30, 45], // band 120→0, offset 120→0, scale 1.04→1.0
  shake: [45, 51], // 4 px decaying to 0
  handWithdraw: [45, 59],
} as const;

export const S2 = {
  dropIn: [60, 74], // body settles with a spring
  blanketPull: [74, 84], // blanket top edge y 700 → 470
  reachLamp: [82, 90], // left hand reaches to the lamp
  eyesClose: [86, 92],
  lampOff: 90,
  darkHold: [90, 104],
  dayCut: 105,
  dustDrift: [105, 150], // dust drifts over 45 frames
} as const;

export const S3 = {
  spoonCycles: [150, 186], // two spoon-to-mouth cycles
  spoonCycleFrames: 18,
  armEnter: [150, 162], // family member's arm enters
  armFlick: 160, // release
  armRetract: [162, 172],
  rampStart: 177, // speed ramp: 0.4× from here
  rampMid: 195, // 0.7× from here (catch)
  rampEnd: 201, // 1× from here
  rampRateSlow: 0.4,
  rampRateMid: 0.7,
  orangeLaunchT3: 160, // in scene time t3
  orangeCatchT3: 184.2, // in scene time t3; equals f195
  orangeSpinPerFrame: 18, // degrees per frame at normal speed
  ghosts: [177, 195], // ghost copies of the orange
  catch: 195,
  squashFrames: 2,
  tuck: [198, 209], // orange into the pocket, back to eating
  whipOut: [210, 224], // translateX 0 → −1400, blur 0 → 40
} as const;

export const S4 = {
  whipIn: [225, 233], // translateX +1400 → 0, blur 40 → 0
  footfalls: FOOTFALLS,
  tilt: [225, 299], // translateY 0 → +60
  complete: 285,
  exit: [285, 299], // runner exits top-right
  runCycleFrames: 15, // two footfalls per cycle (8 then 7 frames)
} as const;

export const S5 = {
  wrongChord: [300, 329], // ring fingertip 10 px short
  fix: [330, 350], // ring slides in; index shadow 3 → 5 px
  buzz: 315,
  buzzDecayFrames: 14,
  clean: 360,
  cleanDecayFrames: 24,
  glowFrames: 20,
  pushIn: [300, 389], // scale 1.00 → 1.08
} as const;

export const S6 = {
  drift: [390, 434], // translateX 0 → −30
  contactCard: [390, 398],
  tapCall: 396,
  pressFrames: 3, // call button scales to 0.92
  calling: [399, 434],
  tapSpeaker: 414,
  popFrames: 3, // speaker button scale pop
} as const;

export const S7 = {
  walk: [435, 505], // x 1380 → 980
  slowDown: [480, 505], // steps shorten to zero
  keys: F_KEYS, // right hand dips to the counter
  headTilt: [505, 524], // head tilts up 12°
  glanceUp: 510, // pupils to the upper right
  walkCycleFrames: 16,
  cameraLagFrames: 10,
} as const;

export const S8 = {
  lookUp: [525, 548],
  exhale: [548, 560], // shoulders drop, brows relax
  blink: [552, 556],
  smile: [556, 566],
  handEnter: [560, 570], // fingertip (1500, 1200) → (1400, 158)
  swipe: [570, 585], // fingertip → (2120, 158)
  handDrop: [585, 599], // hand drops out; eyes return to the phone
} as const;

export const S9 = {
  slideDown: [600, 640], // hips descend 220 px
  sit: 640,
  settle: [640, 660], // small shoulder roll
  laugh: [660, 690], // three 6 px shoulder bounces
  laughBounceFrames: 10,
  whyLine: F_WHY_LINE,
  nod: [720, 732], // head down 5° and back
  pushIn: [600, 764], // scale 1.00 → 1.12
} as const;

export const S10 = {
  personalBest: F_PERSONAL_BEST,
  fifthPip: F_FIFTH_PIP,
  laughBounce: 780,
  cta: F_CTA,
  hold: [840, 869],
  breathCycleFrames: 45,
  pushIn: [765, 869], // scale 1.00 → 1.03
} as const;

// ---------------------------------------------------------------------------
// Section 8: team text overlays
// ---------------------------------------------------------------------------

export const OVERLAYS = {
  whyLineIn: [675, 687], // opacity 0→1, translateY 16→0 over 12 frames
  whyLineEnd: 765, // ends with the cut
  endCardIn: [795, 809], // opacity 0→1, translateY 14→0 over 14 frames
  grainSeedFrames: 2, // new grain seed every 2 frames
} as const;

// ---------------------------------------------------------------------------
// Section 9: audio (start frame, end frame)
// ---------------------------------------------------------------------------

export const AUDIO = {
  startTone: [0, 10],
  roomtoneBedroom: [0, 105],
  drawerSlide: [0, 30],
  drawerThunk: [45, 57],
  lampClick: [90, 96],
  roomtoneNight: [90, 105],
  birds: [105, 150],
  birdsFadeOut: [140, 150],
  chimes: [105, 195, 285, 360],
  chimeFrames: 30,
  music: [105, 570],
  musicDuck: [435, 450], // 0.55 → 0.35
  musicCrossfade: [480, 510], // music out, music_muffled in
  musicMuffled: [480, 570],
  spoon: [158, 168],
  whooshes: [210, 570],
  whooshFrames: 20,
  footsteps: FOOTFALLS,
  footstepFrames: 8,
  roomtoneOutdoor: [225, 300],
  guitarBuzz: [315, 345],
  guitarClean: [360, 390],
  uiTaps: [396, 414],
  uiTapFrames: 4,
  ring: [399, 435],
  footstepsKitchen: [435, 505],
  keys: [465, 480],
  call: [435, 840],
  callFadeOut: [810, 840],
  roomtoneKitchen: [570, 840],
  teenLaugh: [660, 700],
  guitarCallback: [705, 760],
  pbChime: [765, 820],
  silence: [840, 869],
} as const;

// ---------------------------------------------------------------------------
// Section 10: vertical version
// ---------------------------------------------------------------------------

export const VERTICAL = {
  shot1Focus: [0, 22], // focus x 1300 → 1000
  shot3Focus: [160, 195], // focus x 700 → 1200 (follows the orange)
  shot3Settle: [195, 210], // then 1200 → 1100 (eased, chosen: no number in spec)
  handEnter: [560, 570], // screen-space fingertip (1300, 2100) → (592, 314)
  swipe: [570, 585], // fingertip → (1312, 314)
} as const;
