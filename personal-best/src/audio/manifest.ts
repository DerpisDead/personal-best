import { AUDIO } from '../timeline.ts';

/**
 * Audio manifest (section 9). The team records and supplies every real
 * sound as public/audio/<file>. A slot plays the team's file if it exists,
 * otherwise its TEMP_ placeholder if one is allowed and present, otherwise
 * nothing. scripts/check-audio.mjs writes the list of present files to
 * src/audio/available.json; run it before every preview and render.
 *
 * Plain data with no React or Remotion imports, so remotion.config.ts and
 * the scripts can read it too.
 */

export type Ramp = { readonly frames: readonly [number, number]; readonly to: number };

export type AudioSlot = {
  readonly slot: string;
  /** Team file name in public/audio/. */
  readonly file: string;
  /** Start frames (one clip per start). */
  readonly starts: readonly number[];
  /** Either an absolute end frame (single-start slots) or a length per clip. */
  readonly end?: number;
  readonly length?: number;
  /** Starting volume; `ramps` change it over absolute frame ranges (eased linearly). */
  readonly volume: number;
  readonly ramps?: readonly Ramp[];
  /** Whether a TEMP_ placeholder may stand in (file name TEMP_<file>). */
  readonly tempAllowed?: boolean;
  readonly notes?: string;
};

export const SLOTS: readonly AudioSlot[] = [
  { slot: 'start_tone', file: 'start-tone.wav', starts: [AUDIO.startTone[0]], end: AUDIO.startTone[1], volume: 0.8, tempAllowed: true },
  { slot: 'roomtone_bedroom', file: 'roomtone-bedroom.wav', starts: [AUDIO.roomtoneBedroom[0]], end: AUDIO.roomtoneBedroom[1], volume: 0.25 },
  { slot: 'drawer_slide', file: 'drawer-slide.wav', starts: [AUDIO.drawerSlide[0]], end: AUDIO.drawerSlide[1], volume: 0.7 },
  { slot: 'drawer_thunk', file: 'drawer-thunk.wav', starts: [AUDIO.drawerThunk[0]], end: AUDIO.drawerThunk[1], volume: 0.9 },
  { slot: 'lamp_click', file: 'lamp-click.wav', starts: [AUDIO.lampClick[0]], end: AUDIO.lampClick[1], volume: 0.8 },
  { slot: 'roomtone_night', file: 'roomtone-night.wav', starts: [AUDIO.roomtoneNight[0]], end: AUDIO.roomtoneNight[1], volume: 0.3 },
  {
    slot: 'birds', file: 'birds.wav', starts: [AUDIO.birds[0]], end: AUDIO.birds[1], volume: 0.4,
    ramps: [{ frames: [AUDIO.birdsFadeOut[0], AUDIO.birdsFadeOut[1]], to: 0 }], notes: 'fade out f140–150',
  },
  { slot: 'chime', file: 'chime.wav', starts: AUDIO.chimes, length: AUDIO.chimeFrames, volume: 0.7, tempAllowed: true },
  {
    slot: 'music', file: 'music.wav', starts: [AUDIO.music[0]], end: AUDIO.music[1], volume: 0.55,
    ramps: [
      { frames: [AUDIO.musicDuck[0], AUDIO.musicDuck[1]], to: 0.35 },
      { frames: [AUDIO.musicCrossfade[0], AUDIO.musicCrossfade[1]], to: 0 },
    ],
    notes: 'eased to 0.35 over f435–450; crossfade out over f480–510; hard stop f570',
  },
  {
    slot: 'music_muffled', file: 'music-muffled.wav', starts: [AUDIO.musicMuffled[0]], end: AUDIO.musicMuffled[1], volume: 0,
    ramps: [{ frames: [AUDIO.musicCrossfade[0], AUDIO.musicCrossfade[1]], to: 0.35 }],
    notes: 'crossfade in over f480–510 (to the music level, 0.35); hard stop f570; the team bakes the muffled sound in',
  },
  { slot: 'spoon', file: 'spoon-clink.wav', starts: [AUDIO.spoon[0]], end: AUDIO.spoon[1], volume: 0.5 },
  { slot: 'whoosh', file: 'whoosh.wav', starts: AUDIO.whooshes, length: AUDIO.whooshFrames, volume: 0.7, tempAllowed: true },
  { slot: 'footstep', file: 'footstep.wav', starts: AUDIO.footsteps, length: AUDIO.footstepFrames, volume: 0.8 },
  { slot: 'roomtone_outdoor', file: 'roomtone-outdoor.wav', starts: [AUDIO.roomtoneOutdoor[0]], end: AUDIO.roomtoneOutdoor[1], volume: 0.3 },
  { slot: 'guitar_buzz', file: 'guitar-buzz.wav', starts: [AUDIO.guitarBuzz[0]], end: AUDIO.guitarBuzz[1], volume: 0.9 },
  { slot: 'guitar_clean', file: 'guitar-clean.wav', starts: [AUDIO.guitarClean[0]], end: AUDIO.guitarClean[1], volume: 0.9 },
  { slot: 'ui_tap', file: 'ui-tap.wav', starts: AUDIO.uiTaps, length: AUDIO.uiTapFrames, volume: 0.5, tempAllowed: true },
  { slot: 'ring', file: 'phone-ring.wav', starts: [AUDIO.ring[0]], end: AUDIO.ring[1], volume: 0.5 },
  { slot: 'footsteps_kitchen', file: 'footsteps-kitchen.wav', starts: [AUDIO.footstepsKitchen[0]], end: AUDIO.footstepsKitchen[1], volume: 0.5 },
  { slot: 'keys', file: 'keys.wav', starts: [AUDIO.keys[0]], end: AUDIO.keys[1], volume: 0.6 },
  {
    slot: 'call', file: 'call.wav', starts: [AUDIO.call[0]], end: AUDIO.call[1], volume: 1.0,
    ramps: [{ frames: [AUDIO.callFadeOut[0], AUDIO.callFadeOut[1]], to: 0 }],
    notes: "the team's real recorded call, already phone-EQ'd; fade out f810–840",
  },
  { slot: 'roomtone_kitchen', file: 'roomtone-kitchen.wav', starts: [AUDIO.roomtoneKitchen[0]], end: AUDIO.roomtoneKitchen[1], volume: 0.35, notes: 'fridge hum' },
  { slot: 'teen_laugh', file: 'teen-laugh.wav', starts: [AUDIO.teenLaugh[0]], end: AUDIO.teenLaugh[1], volume: 0.9 },
  { slot: 'guitar_callback', file: 'guitar-clean.wav', starts: [AUDIO.guitarCallback[0]], end: AUDIO.guitarCallback[1], volume: 0.45 },
  { slot: 'pb_chime', file: 'pb-chime.wav', starts: [AUDIO.pbChime[0]], end: AUDIO.pbChime[1], volume: 0.8, tempAllowed: true },
];

/** Plays only when the composition prop `clickTrack` is true. */
export const CLICK_TRACK = 'TEMP_click-track.wav';

export const TEMP_PREFIX = 'TEMP_';

/** Which file a slot plays, given the files present in public/audio/. */
export const resolveSlot = (slot: AudioSlot, available: readonly string[]) => {
  if (available.includes(slot.file)) return { file: slot.file, temp: false };
  const temp = `${TEMP_PREFIX}${slot.file}`;
  if (slot.tempAllowed && available.includes(temp)) return { file: temp, temp: true };
  return null;
};

/** Clips for a slot: absolute start frame and duration. Nothing plays from f840 (section 9). */
export const slotClips = (slot: AudioSlot) =>
  slot.starts.map((from) => {
    const end = slot.end ?? from + (slot.length ?? 0);
    return { from, durationInFrames: Math.max(1, end - from) };
  });

/** Volume at an absolute frame, applying the slot's ramps in order (linear). */
export const slotVolume = (slot: AudioSlot, frame: number) => {
  let v = slot.volume;
  for (const r of slot.ramps ?? []) {
    const [a, b] = r.frames;
    if (frame >= b) v = r.to;
    else if (frame > a) v = v + (r.to - v) * ((frame - a) / (b - a));
  }
  return v;
};
