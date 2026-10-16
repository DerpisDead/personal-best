import { Easing } from 'remotion';
import { LAUGH, mixFace, SMILE } from '../character/Face';
import { SIT_FLOOR } from '../character/poses';
import { Rig, solveRig } from '../character/Rig';
import { add, type Pt } from '../character/shapes';
import { C, shade } from '../constants';
import { S10, SHOT_10 } from '../timeline';
import { LyingPhone } from './Shot09KitchenFloor';
import { SceneSvg, tween, useShotFrame } from './common';

/**
 * Shot 10: High wide from the doorway (f765–869). High angle looking down
 * into the kitchen, nearly static.
 */

const LIGHT = { x: -0.3, y: -1 };
const SCALE = 0.42;
const SEAT = { x: 1240, y: 760 };
const YAW = -60;
const VP = { x: 960, y: -600 };

export const Shot10HighWide: React.FC = () => {
  const f = useShotFrame(SHOT_10.from);
  const push = tween(f, S10.pushIn, [1, 1.03], Easing.linear);
  const breath = 1 + 0.005 * (1 - Math.cos(((f - S10.personalBest) / S10.breathCycleFrames) * 2 * Math.PI));
  const laugh = f >= S10.laughBounce && f < S10.laughBounce + 10 ? Math.sin(((f - S10.laughBounce) / 10) * Math.PI) : 0;
  const pose = { ...SIT_FLOOR, lift: 5 * laugh };
  const face = mixFace(SMILE, LAUGH, laugh);
  const sol = solveRig({ yaw: YAW, pose });
  const toScene = (p: Pt): Pt => ({ x: SEAT.x + p.x * SCALE, y: SEAT.y + p.y * SCALE });
  const kneeR = toScene(sol.legs.R.knee);
  const kneeL = toScene(sol.legs.L.knee);
  const planks: number[] = [];
  for (let x = -1200; x <= 3200; x += 110) planks.push(x);

  return (
    <SceneSvg background={C.floorWood}>
      <defs>
        <clipPath id="s10-floor">
          <rect x={0} y={300} width={1920} height={780} />
        </clipPath>
        <radialGradient id="s10-pool" cx={SEAT.x} cy={SEAT.y} r={380} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={C.pendantGlow} stopOpacity={0.55} />
          <stop offset={1} stopColor={C.pendantGlow} stopOpacity={0} />
        </radialGradient>
        {/* Dim outside the pool: radial mask feathered over 120 px */}
        <radialGradient id="s10-dim" cx={SEAT.x} cy={SEAT.y} r={500} gradientUnits="userSpaceOnUse">
          <stop offset={260 / 500} stopColor={C.dimOverlay} stopOpacity={0} />
          <stop offset={380 / 500} stopColor={C.dimOverlay} stopOpacity={0.45} />
        </radialGradient>
      </defs>
      <g transform={`translate(${SEAT.x} ${SEAT.y}) scale(${push}) translate(${-SEAT.x} ${-SEAT.y})`}>
        {/* Far wall and floor with planks converging above the frame */}
        <rect x={-100} y={-100} width={2120} height={400} fill={C.kitchenWallEvening} />
        <rect x={-100} y={300} width={2120} height={880} fill={C.floorWood} />
        <g clipPath="url(#s10-floor)">
          {planks.map((x) => (
            <line key={x} x1={VP.x} y1={VP.y} x2={x} y2={1200} stroke={C.plankLine} strokeWidth={2} />
          ))}
        </g>
        {/* Lower cabinets along the right wall, counter tops on them */}
        <path d="M 1440 200 L 1500 200 L 1360 1080 L 1300 1080 Z" fill={C.cabinet} />
        <path d="M 1490 200 L 1830 200 L 1830 1080 L 1350 1080 Z" fill={C.counterTop} />
        <path d="M 1490 200 L 1500 200 L 1362 1080 L 1350 1080 Z" fill={C.counterEdge} />
        {[300, 450, 620, 810].map((y) => {
          const x = 1440 - ((y - 200) / 880) * 140;
          return <line key={y} x1={x} y1={y} x2={x + 60} y2={y} stroke={C.cabinetShadow} strokeWidth={4} />;
        })}
        {/* Island from above: counter top with cabinet sides; the orange from shot 3 */}
        <path d="M 420 560 L 1000 560 L 990 620 L 430 620 Z" fill={C.cabinet} />
        <path d="M 455 360 L 985 360 L 1000 560 L 420 560 Z" fill={C.counterTop} />
        <path d="M 420 560 L 1000 560 L 1000 566 L 420 566 Z" fill={C.counterEdge} />
        <circle cx={640} cy={470} r={14} fill={C.orange} />
        <circle cx={636} cy={466} r={5} fill={C.orangeHighlight} />
        <ellipse cx={642} cy={457} rx={5} ry={3} fill={C.leaf} />
        {/* Backpack leaning on the island */}
        <rect x={1045} y={548} width={74} height={98} rx={20} fill={C.backpack} transform="rotate(-12 1080 600)" />
        <rect x={1060} y={562} width={44} height={10} rx={5} fill={shade(C.backpack, -0.15)} transform="rotate(-12 1080 600)" />
        {/* Running shoes by the doorway */}
        {[
          { x: 300, y: 960, a: -14 },
          { x: 360, y: 975, a: 8 },
        ].map((s) => (
          <g key={s.x} transform={`translate(${s.x} ${s.y}) rotate(${s.a})`}>
            <rect x={-30} y={-12} width={60} height={24} rx={10} fill={C.shoeUpper} />
            <rect x={-30} y={7} width={60} height={5} rx={2} fill={C.shoeSole} />
          </g>
        ))}
        {/* Guitar leaning at the left */}
        <g>
          <line x1={205} y1={700} x2={176} y2={380} stroke={C.fretboard} strokeWidth={22} strokeLinecap="round" />
          <ellipse cx={200} cy={735} rx={50} ry={70} fill={C.guitarBody} stroke={C.guitarBodyEdge} strokeWidth={4} />
          <ellipse cx={196} cy={820} rx={55} ry={80} fill={C.guitarBody} stroke={C.guitarBodyEdge} strokeWidth={4} />
          <circle cx={199} cy={760} r={16} fill={C.soundhole} />
        </g>
        {/* Him, seated against the right cabinets, phone on his knee */}
        <Rig
          x={SEAT.x}
          y={SEAT.y}
          scale={SCALE}
          yaw={YAW}
          pose={pose}
          face={face}
          light={LIGHT}
          torsoScale={breath}
          handTargets={{ R: add(kneeR, { x: 2, y: -7 }), L: add(kneeL, { x: 10, y: 10 }) }}
          elbowBend={{ R: 1, L: -1 }}
          handItems={{ R: (h) => <LyingPhone at={{ x: h.x, y: h.y - 6 }} angle={-8} scale={SCALE} /> }}
        />
        <rect x={-100} y={-100} width={2120} height={1280} fill="url(#s10-pool)" />
        <rect x={-100} y={-100} width={2120} height={1280} fill="url(#s10-dim)" style={{ mixBlendMode: 'multiply' }} />
      </g>
      {/* Frame within a frame: door jambs and header */}
      <rect x={0} y={0} width={90} height={1080} fill={C.doorJamb} />
      <rect x={1830} y={0} width={90} height={1080} fill={C.doorJamb} />
      <rect x={0} y={0} width={1920} height={60} fill={C.doorJamb} />
      <rect x={84} y={60} width={6} height={1020} fill={shade(C.doorJamb, 0.12)} />
      <rect x={1830} y={60} width={6} height={1020} fill={shade(C.doorJamb, 0.12)} />
    </SceneSvg>
  );
};
