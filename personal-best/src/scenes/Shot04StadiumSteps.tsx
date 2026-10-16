import { Easing } from 'remotion';
import { FOCUSED } from '../character/Face';
import { RUN_FRAMES, RUN_STEP_SPLIT, runUpStairsCycle } from '../character/poses';
import { Rig, solveRig } from '../character/Rig';
import type { Pt } from '../character/shapes';
import { C, shade } from '../constants';
import { S4, SHOT_4 } from '../timeline';
import { BlurDef, handheldTransform, SceneSvg, tween, useShotFrame, WhipBlur } from './common';

/**
 * Shot 4: Stadium steps (f225–299). Low angle at step level, profile view,
 * handheld (A = 2 px). Key light: soft overcast from above.
 */

const LIGHT = { x: 0.25, y: -1 };
const SCALE = 1.6;
const TREAD = 220;
const RISE = 88;
const TREAD_THICK = 24;
const STEPS = 13;

/** Top surface y of step k (the first riser's bottom-left corner is at (−120, 1080)). */
const treadTop = (k: number) => 1080 - RISE * (k + 1);
const treadFront = (k: number) => -120 + TREAD * k;

/**
 * Footfalls (section 3/7): each lands on the next tread. Before f233 he is on
 * tread 0 and the ground; after f285 the schedule continues off-frame.
 */
const FOOTFALLS: { f: number; foot: 'L' | 'R'; k: number }[] = [
  { f: 218, foot: 'L', k: -1 },
  { f: 226, foot: 'R', k: 0 },
  ...S4.footfalls.map((f, i) => ({ f, foot: (i % 2 === 0 ? 'L' : 'R') as 'L' | 'R', k: i + 1 })),
  { f: 293, foot: 'L', k: 9 },
  { f: 300, foot: 'R', k: 10 },
  { f: 308, foot: 'L', k: 11 },
];

const landing = (k: number): Pt => (k < 0 ? { x: -230, y: 1080 } : { x: treadFront(k) + 110, y: treadTop(k) });

/** Pose and placement of the runner at frame f, with the stance foot planted. */
export const runnerAt = (f: number) => {
  let i = 0;
  while (i < FOOTFALLS.length - 2 && FOOTFALLS[i + 1].f <= f) i++;
  const cur = FOOTFALLS[i];
  const next = FOOTFALLS[i + 1];
  const stepT = Math.max(0, Math.min(0.999, (f - cur.f) / (next.f - cur.f)));
  const cycleFrame = cur.foot === 'L' ? stepT * RUN_STEP_SPLIT : RUN_STEP_SPLIT + stepT * (RUN_FRAMES - RUN_STEP_SPLIT);
  const { pose } = runUpStairsCycle(cycleFrame);
  const sol = solveRig({ yaw: 90, pose });
  const leg = sol.legs[cur.foot];
  const footMid = { x: (leg.heel.x + leg.toe.x) / 2, y: Math.max(leg.heel.y, leg.toe.y) };
  const plant = landing(cur.k);
  return { pose, x: plant.x - footMid.x * SCALE, y: plant.y - footMid.y * SCALE };
};

const Steps: React.FC = () => {
  const profile: string[] = [`M ${treadFront(0)} 1100`];
  for (let k = 0; k < STEPS; k++) {
    profile.push(`L ${treadFront(k)} ${treadTop(k)}`, `L ${treadFront(k + 1)} ${treadTop(k)}`);
  }
  profile.push(`L ${treadFront(STEPS)} 1100 Z`);
  const railY = (x: number) => treadTop(0) - 380 - ((x - treadFront(0)) * RISE) / TREAD;
  const posts: number[] = [];
  for (let x = treadFront(0) + 60; x < 2100; x += 440) posts.push(x);
  return (
    <g>
      {/* Railing behind the runner: 12 px tube, 380 px above the tread edges, 8 px posts every 440 px */}
      {posts.map((x) => {
        const k = Math.floor((x - treadFront(0)) / TREAD);
        return <rect key={x} x={x - 4} y={railY(x)} width={8} height={treadTop(k) - railY(x)} fill={shade(C.rail, -0.08)} />;
      })}
      <line x1={-200} y1={railY(-200)} x2={2200} y2={railY(2200)} stroke={C.rail} strokeWidth={12} strokeLinecap="round" />
      <line x1={-200} y1={railY(-200) - 3} x2={2200} y2={railY(2200) - 3} stroke={shade(C.rail, 0.15)} strokeWidth={3} />
      {/* Stair block: risers, treads (24 px thick) and a 4 px shadow under each lip */}
      <path d={profile.join(' ')} fill={C.stepRiser} />
      {Array.from({ length: STEPS }, (_, k) => (
        <g key={k}>
          <rect x={treadFront(k) - 8} y={treadTop(k)} width={TREAD + 8} height={TREAD_THICK} fill={C.stepTop} />
          <rect x={treadFront(k) - 8} y={treadTop(k) + TREAD_THICK} width={TREAD + 8} height={4} fill={C.stepShadow} />
          <rect x={treadFront(k)} y={treadTop(k) + TREAD_THICK + 4} width={10} height={RISE - TREAD_THICK - 4} fill={shade(C.stepRiser, -0.06)} />
        </g>
      ))}
    </g>
  );
};

export const Shot04StadiumSteps: React.FC = () => {
  const f = useShotFrame(SHOT_4.from);
  const runner = runnerAt(f);
  const tilt = tween(f, S4.tilt, [0, 60], Easing.inOut(Easing.sin));
  const whipX = tween(f, S4.whipIn, [1400, 0], Easing.out(Easing.cubic));
  const blur = tween(f, S4.whipIn, [40, 0], Easing.out(Easing.cubic));

  return (
    <SceneSvg background={C.skyBottom}>
      <defs>
        <linearGradient id="s4-sky" x1={0} y1={0} x2={0} y2={520} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={C.skyTop} />
          <stop offset={1} stopColor={C.skyBottom} />
        </linearGradient>
        <BlurDef id="s4-cloud" amount={30} />
        <BlurDef id="s4-far" amount={4} />
        <BlurDef id="s4-stands" amount={6} />
      </defs>
      <WhipBlur id="s4-whip" amount={blur}>
        <g transform={`translate(${whipX} 0) ${handheldTransform(f, 2)}`}>
          <g transform={`translate(0 ${tilt})`}>
            {/* Sky with three soft clouds */}
            <rect x={-200} y={-200} width={2400} height={720} fill="url(#s4-sky)" />
            <g filter="url(#s4-cloud)" opacity={0.4}>
              <ellipse cx={420} cy={170} rx={260} ry={60} fill="#FFFFFF" />
              <ellipse cx={1180} cy={110} rx={320} ry={70} fill="#FFFFFF" />
              <ellipse cx={1700} cy={260} rx={240} ry={55} fill="#FFFFFF" />
            </g>
            {/* Distant field and the stands below it */}
            <rect x={-200} y={520} width={2400} height={40} fill={C.field} filter="url(#s4-far)" />
            <rect x={-200} y={560} width={2400} height={700} fill={shade(C.stepRiser, 0.12)} filter="url(#s4-stands)" />
            {Array.from({ length: 6 }, (_, i) => (
              <rect key={i} x={-200} y={600 + i * 90} width={2400} height={6} fill={shade(C.stepRiser, 0.02)} opacity={0.6} filter="url(#s4-stands)" />
            ))}
            <Steps />
            <Rig x={runner.x} y={runner.y} scale={SCALE} yaw={90} pose={runner.pose} face={FOCUSED} light={LIGHT} />
          </g>
        </g>
      </WhipBlur>
    </SceneSvg>
  );
};
