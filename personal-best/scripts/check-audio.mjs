#!/usr/bin/env node
/**
 * Scans public/audio/ and writes src/audio/available.json, which the audio
 * track reads to decide what each slot plays: the team's file if present,
 * otherwise its TEMP_ placeholder (if allowed), otherwise nothing.
 * Run it before every preview and render (section 9).
 *
 * Usage: node scripts/check-audio.mjs
 * Needs Node 22.18+ (loads src/audio/manifest.ts with type stripping).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const audioDir = path.join(root, 'public/audio');
const { SLOTS, CLICK_TRACK, resolveSlot } = await import(pathToFileURL(path.join(root, 'src/audio/manifest.ts')).href);

const files = fs.existsSync(audioDir)
  ? fs.readdirSync(audioDir).filter((f) => /\.(wav|mp3|aac|m4a|ogg|flac)$/i.test(f)).sort()
  : [];
fs.writeFileSync(path.join(root, 'src/audio/available.json'), `${JSON.stringify({ files }, null, 2)}\n`);

const rows = SLOTS.map((slot) => {
  const r = resolveSlot(slot, files);
  return { slot: slot.slot, file: slot.file, plays: r ? (r.temp ? `${r.file}  (TEMP)` : r.file) : '— (silent)' };
});
const w = Math.max(...rows.map((r) => r.slot.length));
console.log(`Audio slots (${files.length} file(s) in public/audio/):`);
for (const r of rows) console.log(`  ${r.slot.padEnd(w)}  ${r.plays}`);
console.log(`  ${'click track'.padEnd(w)}  ${files.includes(CLICK_TRACK) ? `${CLICK_TRACK}  (TEMP, only with clickTrack: true)` : '— (missing)'}`);

const unknown = files.filter((f) => !f.startsWith('TEMP_') && !SLOTS.some((s) => s.file === f));
if (unknown.length > 0) console.log(`\nUnrecognized files (not used): ${unknown.join(', ')}`);

if (rows.some((r) => r.plays.includes('(TEMP)'))) {
  console.log(`
########################################################
###                TEMP AUDIO IN USE                 ###
###  Replace every TEMP_ sound with team-made audio  ###
###  before this video is used anywhere.             ###
########################################################`);
}
console.log('\nWrote src/audio/available.json');
