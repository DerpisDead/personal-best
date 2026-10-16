import { Easing, random } from 'remotion';
import { FrettingHand, type NeckPt } from '../character/Hands';
import { add, dirDeg, mul, type Pt } from '../character/shapes';
import { C, shade } from '../constants';
import { S5, SHOT_5 } from '../timeline';
import { BlurDef, SceneSvg, tween, useShotFrame } from './common';

/**
 * Shot 5: Guitar chord (f300–389). High-angle over-the-shoulder medium
 * close-up with a slow push-in. Key light: window, upper left.
 * The low E string is nearest the camera (top edge); the fingers reach over
 * the treble edge (bottom) from the hand beyond it.
 */

const LIGHT = { x: -0.7, y: -0.7 };
const NUT = { x: 380, y: 410 };
const ANGLE = 18;
const HALF = 60; // 120 px fretboard
const FRETS = [120, 233, 340, 441, 536, 626, 711];
const INLAYS = [(233 + 340) / 2, (441 + 536) / 2, (626 + 711) / 2]; // positions 3, 5, 7
// Strings across the neck, low E (top) to high E (bottom), inset 15 px, evenly spaced.
const STRINGS = [
  { a: -45, w: 3.4 }, // low E (6th)
  { a: -27, w: 3.0 }, // A (5th)
  { a: -9, w: 2.6 }, // D (4th)
  { a: 9, w: 2.2 }, // G (3rd)
  { a: 27, w: 1.8 }, // B (2nd)
  { a: 45, w: 1.5 }, // high E (1st)
];
const B_STRING = 4;
const FRETBOARD_END = 1120;
const STRING_END = 1600;

const along = dirDeg(ANGLE);
const across = dirDeg(ANGLE + 90);
export const neckAt = ({ d, a }: NeckPt): Pt => add(add(NUT, mul(along, d)), mul(across, a));

const quadPath = (pts: Pt[]) => `M ${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')} Z`;

/** Displacement (px, across the neck) of string i at distance d for frame f. */
const vibration = (i: number, d: number, f: number) => {
  const env = Math.min(1, d / 60);
  if (f >= S5.clean) {
    const A = tween(f, [S5.clean, S5.clean + S5.cleanDecayFrames], [4, 0], Easing.out(Easing.quad));
    return env * A * Math.sin(2 * Math.PI * 0.08 * d + f * 2.3 + i);
  }
  if (f >= S5.buzz) {
    const A = tween(f, [S5.buzz, S5.buzz + S5.buzzDecayFrames], [3, 0], Easing.out(Easing.quad));
    if (i === B_STRING) {
      // Irregular zigzag at 5 px on the B string (the buzz).
      const k = Math.round(d / 7);
      const live = f < S5.buzz + S5.buzzDecayFrames ? 1 : 0;
      return env * live * 5 * (k % 2 === 0 ? 1 : -1) * (0.4 + 0.6 * random(`buzz-${k}-${f}`));
    }
    return env * A * Math.sin(2 * Math.PI * 0.08 * d + f * 2.3 + i);
  }
  return 0;
};

const StringLine: React.FC<{ readonly i: number; readonly f: number }> = ({ i, f }) => {
  const s = STRINGS[i];
  const moving = (f >= S5.buzz && f < S5.buzz + S5.buzzDecayFrames) || (f >= S5.clean && f < S5.clean + S5.cleanDecayFrames);
  const step = moving ? 3 : 200;
  const pts: string[] = [];
  for (let d = -40; d <= STRING_END; d += step) {
    const p = neckAt({ d, a: s.a + vibration(i, d, f) });
    pts.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  return <path d={`M ${pts.join(' L ')}`} stroke={C.string} strokeWidth={s.w} fill="none" strokeLinejoin="round" />;
};

export const Shot05GuitarChord: React.FC = () => {
  const f = useShotFrame(SHOT_5.from);
  const push = tween(f, S5.pushIn, [1, 1.08], Easing.linear);
  const ringD = tween(f, S5.fix, [305, 315]);
  const indexShadow = tween(f, S5.fix, [3, 5]);
  const glow = f >= S5.clean ? tween(f, [S5.clean, S5.clean + S5.glowFrames], [0.15, 0], Easing.out(Easing.quad)) : 0;

  const board = quadPath([neckAt({ d: -30, a: -HALF }), neckAt({ d: FRETBOARD_END, a: -HALF }), neckAt({ d: FRETBOARD_END, a: HALF }), neckAt({ d: -30, a: HALF })]);
  const neckBack = quadPath([neckAt({ d: -30, a: -HALF - 10 }), neckAt({ d: FRETBOARD_END, a: -HALF - 10 }), neckAt({ d: FRETBOARD_END, a: HALF + 10 }), neckAt({ d: -30, a: HALF + 10 })]);
  const headstock = quadPath([neckAt({ d: -700, a: -70 }), neckAt({ d: -30, a: -HALF - 6 }), neckAt({ d: -30, a: HALF + 6 }), neckAt({ d: -700, a: 70 })]);

  return (
    <SceneSvg background={C.wallDay}>
      <defs>
        <BlurDef id="s5-warm" amount={40} />
        <BlurDef id="s5-shoulder" amount={6} />
        <clipPath id="s5-board">
          <path d={board} />
        </clipPath>
      </defs>
      <g transform={`translate(560 470) scale(${push}) translate(-560 -470)`}>
        <rect x={-100} y={-100} width={2120} height={1280} fill={C.wallDay} />
        <path d="M -100 -100 L 700 -100 L 300 600 L -100 600 Z" fill={C.warmPatch} opacity={0.25} filter="url(#s5-warm)" />
        {/* Guitar body, lower right, with its rim and the sound hole */}
        <path d="M 1300 1100 C 1300 830 1430 650 1650 612 C 1800 590 1920 640 1960 660 L 1960 1100 Z" fill={C.guitarBody} />
        <path d="M 1300 1100 C 1300 830 1430 650 1650 612 C 1800 590 1920 640 1960 660" fill="none" stroke={C.guitarBodyEdge} strokeWidth={12} />
        <path d="M 1500 1100 C 1520 980 1600 900 1760 860 C 1860 840 1960 860 1960 860 L 1960 1100 Z" fill={shade(C.guitarBody, -0.08)} opacity={0.5} />
        <circle cx={1560} cy={820} r={118} fill="none" stroke={C.guitarBodyEdge} strokeWidth={8} />
        <circle cx={1560} cy={820} r={110} fill={C.soundhole} />
        {/* Neck: headstock off-frame upper left, fretboard, nut, frets, inlays */}
        <path d={headstock} fill={shade(C.fretboard, -0.1)} />
        <path d={neckBack} fill={shade(C.guitarBodyEdge, -0.35)} />
        <path d={board} fill={C.fretboard} />
        <g clipPath="url(#s5-board)">
          {FRETS.map((d) => (
            <line key={d} x1={neckAt({ d, a: -HALF }).x} y1={neckAt({ d, a: -HALF }).y} x2={neckAt({ d, a: HALF }).x} y2={neckAt({ d, a: HALF }).y} stroke={C.fret} strokeWidth={4} />
          ))}
          {INLAYS.map((d) => (
            <circle key={d} cx={neckAt({ d, a: 0 }).x} cy={neckAt({ d, a: 0 }).y} r={9} fill={C.inlay} />
          ))}
          {/* Warm glow across the fretboard on the clean strum */}
          {glow > 0 ? <path d={board} fill={C.warmPatch} opacity={glow} /> : null}
        </g>
        <path d={quadPath([neckAt({ d: -8, a: -HALF }), neckAt({ d: 6, a: -HALF }), neckAt({ d: 6, a: HALF }), neckAt({ d: -8, a: HALF })])} fill={C.nut} />
        {STRINGS.map((_, i) => (
          <StringLine key={i} i={i} f={f} />
        ))}
        {/* F major barre chord: index across all strings behind fret 1, middle G fret 2, ring A fret 3, pinky D fret 3 */}
        <FrettingHand
          at={neckAt}
          neckAngle={ANGLE}
          edge={HALF}
          barreD={104}
          tips={{ middle: { d: 207, a: 9 }, ring: { d: ringD, a: -27 }, pinky: { d: 322, a: -9 } }}
          indexShadow={indexShadow}
          light={LIGHT}
        />
        {/* Foreground: his left shoulder, soft (over the shoulder) */}
        <path d="M -60 1120 L -60 760 C 80 690 330 690 470 780 C 540 830 560 960 540 1120 Z" fill={C.hoodie} filter="url(#s5-shoulder)" />
        <path d="M 330 720 C 440 760 520 840 540 1120 L 470 1120 C 470 900 420 800 330 740 Z" fill={C.hoodieShadow} filter="url(#s5-shoulder)" opacity={0.8} />
      </g>
    </SceneSvg>
  );
};
