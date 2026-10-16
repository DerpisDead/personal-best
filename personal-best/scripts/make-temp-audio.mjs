#!/usr/bin/env node
/**
 * Writes clearly labeled TEMP_ timing placeholders to public/audio/ as 48 kHz,
 * 16-bit mono WAVs (section 9). These exist only for timing. Every TEMP_
 * sound must be replaced with team-made audio before the video is used.
 *
 * Usage: node scripts/make-temp-audio.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public/audio');
const RATE = 48000;

const writeWav = (name, samples) => {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(outDir, name), Buffer.concat([header, data]));
  console.log(`  wrote public/audio/${name} (${(samples.length / RATE).toFixed(3)} s)`);
};

const make = (seconds, fn) => Array.from({ length: Math.round(seconds * RATE) }, (_, i) => fn(i / RATE));
const sine = (hz, t) => Math.sin(2 * Math.PI * hz * t);

// Deterministic noise (mulberry32) so the files are identical on every run.
const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

fs.mkdirSync(outDir, { recursive: true });
console.log('Writing TEMP_ placeholder audio (replace all of it with team-made audio):');

// 880 Hz sine, 120 ms, 5 ms attack, 80 ms release.
writeWav('TEMP_start-tone.wav', make(0.12, (t) => {
  const env = Math.min(1, t / 0.005) * Math.min(1, (0.12 - t) / 0.08);
  return 0.6 * env * sine(880, t);
}));

// F5 + C6 at 0.35 each, 4 ms attack, exponential decay τ = 0.22 s, 0.9 s long.
writeWav('TEMP_chime.wav', make(0.9, (t) => {
  const env = Math.min(1, t / 0.004) * Math.exp(-t / 0.22);
  return env * (0.35 * sine(698.46, t) + 0.35 * sine(1046.5, t));
}));

// F4 A4 C5 F5 C6, 10 ms attack, τ = 0.6 s, 2.0 s long.
writeWav('TEMP_pb-chime.wav', make(2.0, (t) => {
  const env = Math.min(1, t / 0.01) * Math.exp(-t / 0.6);
  return env * 0.18 * [349.23, 440.0, 523.25, 698.46, 1046.5].reduce((s, hz) => s + sine(hz, t), 0);
}));

// White noise, 0.35 s, band-pass sweeping 300 Hz → 3 kHz, Hann envelope.
{
  const n = Math.round(0.35 * RATE);
  const rand = rng(7);
  const out = new Array(n);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const Q = 1.4;
  for (let i = 0; i < n; i++) {
    const p = i / (n - 1);
    const fc = 300 * Math.pow(3000 / 300, p);
    const w0 = (2 * Math.PI * fc) / RATE;
    const alpha = Math.sin(w0) / (2 * Q);
    const a0 = 1 + alpha;
    const b0 = alpha / a0, b2 = -alpha / a0, a1 = (-2 * Math.cos(w0)) / a0, a2 = (1 - alpha) / a0;
    const x0 = rand() * 2 - 1;
    const y0 = b0 * x0 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x0; y2 = y1; y1 = y0;
    const hann = 0.5 - 0.5 * Math.cos(2 * Math.PI * p);
    out[i] = 0.9 * hann * y0;
  }
  writeWav('TEMP_whoosh.wav', out);
}

// 2 kHz click, 8 ms.
writeWav('TEMP_ui-tap.wav', make(0.008, (t) => 0.7 * Math.exp(-t / 0.0025) * sine(2000, t)));

// 1 kHz ticks, 15 ms each, at 120 BPM for 29 s (a tick every 0.5 s).
writeWav('TEMP_click-track.wav', make(29, (t) => {
  const local = t % 0.5;
  return local < 0.015 ? 0.6 * Math.min(1, (0.015 - local) / 0.005) * sine(1000, local) : 0;
}));

console.log('Done. Run `node scripts/check-audio.mjs` next.');
