#!/usr/bin/env node
/**
 * Quality check 1 (section 11): asserts that
 *   - PersonalBest and PersonalBestVertical are 870 frames at 30 fps,
 *   - the shot lengths sum to 870 with no gaps or overlaps,
 *   - every key event marked "Yes" in section 3 is a multiple of 15
 *     (as are every cut, chime, music start/stop, the swipe and every
 *     text entrance).
 *
 * Usage: node scripts/verify-timeline.mjs
 * Needs Node 22.18+ (loads src/timeline.ts with Node's built-in type stripping).
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let tl;
try {
  tl = await import(pathToFileURL(path.join(root, 'src/timeline.ts')).href);
} catch (err) {
  console.error('Could not load src/timeline.ts. Use Node 22.18 or newer (type stripping).');
  console.error(err);
  process.exit(1);
}

const failures = [];
let checks = 0;
const check = (ok, message) => {
  checks++;
  if (!ok) failures.push(message);
};

// --- Basic constants --------------------------------------------------------
check(tl.FPS === 30, `FPS is ${tl.FPS}, expected 30`);
check(tl.DURATION === 870, `DURATION is ${tl.DURATION}, expected 870`);
check(tl.LAST_FRAME === tl.DURATION - 1, `LAST_FRAME is ${tl.LAST_FRAME}, expected ${tl.DURATION - 1}`);
check(tl.BEAT === (tl.FPS * 60) / tl.BPM, `BEAT is ${tl.BEAT}, expected ${(tl.FPS * 60) / tl.BPM}`);

// --- Shots: contiguous, sum to 870, every cut on the beat grid ------------
const SPEC_SHOTS = [
  [0, 59], [60, 149], [150, 224], [225, 299], [300, 389],
  [390, 434], [435, 524], [525, 599], [600, 764], [765, 869],
];
check(tl.SHOTS.length === SPEC_SHOTS.length, `${tl.SHOTS.length} shots, expected ${SPEC_SHOTS.length}`);
let cursor = 0;
let sum = 0;
tl.SHOTS.forEach((s, i) => {
  const [first, last] = SPEC_SHOTS[i];
  check(s.from === cursor, `Shot ${s.shot} starts at f${s.from}, expected f${cursor} (gap or overlap)`);
  check(s.from === first && s.from + s.durationInFrames - 1 === last,
    `Shot ${s.shot} is f${s.from}–${s.from + s.durationInFrames - 1}, spec says f${first}–${last}`);
  check(s.from % tl.BEAT === 0, `Cut into shot ${s.shot} at f${s.from} is not on the beat grid`);
  cursor = s.from + s.durationInFrames;
  sum += s.durationInFrames;
});
check(sum === 870, `Shot lengths sum to ${sum}, expected 870`);

// --- Key events: match section 3, "Yes" rows on the grid --------------------
const SPEC_EVENTS = [
  [0, true], [45, true], [90, true], [105, true], [150, true], [195, true],
  [210, true], [225, true], [285, true], [300, true], [315, true], [360, true],
  [390, true], [396, false], [414, false], [480, true], [510, true], [570, true],
  [585, false], [600, true], [660, true], [675, true], [705, true], [765, true],
  [771, false], [795, true], [840, true], [869, false],
];
check(tl.KEY_EVENTS.length === SPEC_EVENTS.length,
  `${tl.KEY_EVENTS.length} key events, expected ${SPEC_EVENTS.length}`);
tl.KEY_EVENTS.forEach((e, i) => {
  const [frame, onGrid] = SPEC_EVENTS[i] ?? [];
  check(e.frame === frame && e.onGrid === onGrid,
    `Key event "${e.event}" is f${e.frame} (grid: ${e.onGrid}), spec says f${frame} (grid: ${onGrid})`);
  if (e.onGrid) {
    check(e.frame % tl.BEAT === 0, `Key event "${e.event}" at f${e.frame} is marked "Yes" but is not a multiple of ${tl.BEAT}`);
  }
});

// --- Other things section 3 puts on the grid -------------------------------
const onGrid = (label, frames) => {
  for (const f of frames) check(f % tl.BEAT === 0, `${label} at f${f} is not a multiple of ${tl.BEAT}`);
};
onGrid('Habit label change', tl.HABITS.map((h) => h.from));
onGrid('Habit completion', tl.HABITS.filter((h) => h.completesAt !== null).map((h) => h.completesAt));
onGrid('Chime', tl.AUDIO.chimes);
onGrid('PERSONAL BEST chime', [tl.AUDIO.pbChime[0]]);
onGrid('Music start/stop', [tl.AUDIO.music[0], tl.AUDIO.music[1], tl.AUDIO.musicMuffled[0], tl.AUDIO.musicMuffled[1]]);
onGrid('Music crossfade', tl.AUDIO.musicCrossfade);
onGrid('Swipe', [tl.HUD.swipe[0]]);
onGrid('Whoosh', tl.AUDIO.whooshes);
onGrid('Text entrance', [tl.OVERLAYS.whyLineIn[0], tl.PB.in[0], tl.OVERLAYS.endCardIn[0]]);
check(tl.AUDIO.silence[0] === 840 && tl.AUDIO.silence[1] === tl.LAST_FRAME, 'Silence must run f840–869');

// --- Registered compositions -------------------------------------------------
const EXPECTED_COMPOSITIONS = {
  PersonalBest: { width: 1920, height: 1080, fps: 30, durationInFrames: 870 },
  PersonalBestVertical: { width: 1080, height: 1920, fps: 30, durationInFrames: 870 },
  HudTest: { width: 1920, height: 1080, fps: 30, durationInFrames: 870 },
  RigTest: { width: 1920, height: 1080, fps: 30, durationInFrames: 300 },
};
const REQUIRED = ['PersonalBest', 'PersonalBestVertical'];

const { bundle } = await import('@remotion/bundler');
const { getCompositions } = await import('@remotion/renderer');
console.log('Bundling to read the registered compositions…');
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts'), rspack: true });
const compositions = await getCompositions(serveUrl, {
  browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || null,
  logLevel: 'error',
});
const byId = Object.fromEntries(compositions.map((c) => [c.id, c]));

for (const [id, expected] of Object.entries(EXPECTED_COMPOSITIONS)) {
  const comp = byId[id];
  if (!comp) {
    check(!REQUIRED.includes(id), `Composition ${id} is not registered`);
    if (!REQUIRED.includes(id)) console.log(`  (${id} not registered yet, skipped)`);
    continue;
  }
  for (const key of Object.keys(expected)) {
    check(comp[key] === expected[key], `${id}.${key} is ${comp[key]}, expected ${expected[key]}`);
  }
}

// --- Report ------------------------------------------------------------------
if (failures.length > 0) {
  console.error(`\n✗ verify-timeline: ${failures.length} of ${checks} checks failed:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`\n✓ verify-timeline: all ${checks} checks passed.`);
