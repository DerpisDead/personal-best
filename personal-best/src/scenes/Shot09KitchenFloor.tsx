import { Easing } from 'remotion';
import { LAUGH, mixFace, NEUTRAL, SMILE } from '../character/Face';
import { slideDown } from '../character/poses';
import { RIG_STAND, Rig, solveRig } from '../character/Rig';
import { add, lerpPt, type Pt } from '../character/shapes';
import { C } from '../constants';
import { S9, SHOT_9 } from '../timeline';
import { SceneSvg, tween, useShotFrame } from './common';

/**
 * Shot 9: Kitchen floor (f600–764). Floor-level wide, slow push-in.
 * Key light: warm pendant, upper left; cool window, right.
 */

const LIGHT = { x: -0.6, y: -0.8 };
const SCALE = 1;
const X = 880;
const FEET_Y = 900;
const STAND_HIP_Y = FEET_Y - RIG_STAND.hipHeight * SCALE;
const YAW = 40;
const VP = { x: 960, y: 520 };

/** The phone, lying in his hand with the speaker side up (shot 7's 70×140 phone at rig scale 1). */
export const LyingPhone: React.FC<{ readonly at: Pt; readonly angle: number; readonly scale?: number }> = ({ at, angle, scale = 1 }) => (
  <g transform={`translate(${at.x} ${at.y}) rotate(${angle}) scale(${scale})`}>
    <rect x={-56} y={-14} width={112} height={28} rx={8} fill={C.phoneBody} />
    <rect x={-52} y={-12} width={104} height={5} rx={2.5} fill={C.cameraBump} />
  </g>
);

export const KitchenFloorSet: React.FC = () => {
  const doors: number[] = [];
  for (let x = 0; x <= 1920; x += 260) doors.push(x);
  const planks: number[] = [];
  for (let x = -2400; x <= 4400; x += 150) planks.push(x);
  return (
    <g>
      {/* Wall, window (right), pendant (left) */}
      <rect x={-100} y={-100} width={2120} height={540} fill={C.kitchenWallEvening} />
      <rect x={1250} y={90} width={470} height={310} fill={C.windowFrameEvening} />
      <rect x={1264} y={104} width={442} height={282} fill="url(#s9-glass)" />
      {[
        { x: 1330, y: 330 },
        { x: 1470, y: 345 },
        { x: 1610, y: 320 },
      ].map((d) => (
        <circle key={d.x} cx={d.x} cy={d.y} r={3} fill={C.distantLights} />
      ))}
      <rect x={638.5} y={-10} width={3} height={130} fill={C.pendantCord} />
      <path d="M 605 120 L 675 120 L 730 210 L 550 210 Z" fill={C.pendantShade} />
      <ellipse cx={640} cy={210} rx={90} ry={10} fill={C.pendantInner} />
      {/* Countertop edge, lower cabinets, toe kick */}
      <rect x={-100} y={440} width={2120} height={30} fill={C.counterTop} />
      <rect x={-100} y={462} width={2120} height={8} fill={C.counterEdge} />
      <rect x={-100} y={470} width={2120} height={290} fill={C.cabinet} />
      {doors.map((x) => (
        <g key={x}>
          <rect x={x - 3} y={470} width={6} height={270} fill={C.cabinetShadow} />
          <rect x={x + 130 - 35} y={496} width={70} height={8} rx={4} fill={C.cabinetHandle} />
        </g>
      ))}
      <rect x={-100} y={740} width={2120} height={20} fill={C.toeKick} />
      {/* Floor with planks converging toward (960, 520) */}
      <rect x={-100} y={760} width={2120} height={420} fill={C.floorWood} />
      <g clipPath="url(#s9-floor)">
        {planks.map((x) => (
          <line key={x} x1={VP.x} y1={VP.y} x2={x} y2={1400} stroke={C.plankLine} strokeWidth={2} />
        ))}
      </g>
    </g>
  );
};

export const Shot09KitchenFloor: React.FC = () => {
  const f = useShotFrame(SHOT_9.from);
  const slideT = tween(f, S9.slideDown, [0, 1], Easing.linear);
  const { pose: base, bob } = slideDown(slideT);
  // Settle with a small shoulder roll, three 6 px laugh bounces, then a nod.
  const roll = f >= S9.settle[0] && f < S9.settle[1] ? -4 * Math.sin(((f - S9.settle[0]) / (S9.settle[1] - S9.settle[0])) * Math.PI) : 0;
  const bounce = f >= S9.laugh[0] && f < S9.laugh[1] ? 6 * Math.abs(Math.sin(((f - S9.laugh[0]) / S9.laughBounceFrames) * Math.PI)) : 0;
  const pose = { ...base, lift: roll + bounce };
  const hipY = STAND_HIP_Y + bob * SCALE;

  const laughIn = tween(f, [S9.laugh[0], S9.laugh[0] + 4], [0, 1]);
  const laughOut = tween(f, [S9.laugh[1] - 2, S9.laugh[1] + 6], [0, 1]);
  const smileIn = tween(f, [S9.settle[0], S9.laugh[0]], [0, 0.6]);
  let face = mixFace(NEUTRAL, SMILE, smileIn);
  face = mixFace(face, LAUGH, laughIn * (1 - laughOut));
  if (f >= S9.laugh[1]) face = mixFace(LAUGH, SMILE, laughOut);
  const nod = f >= S9.nod[0] && f <= S9.nod[1] ? 5 * Math.sin(((f - S9.nod[0]) / (S9.nod[1] - S9.nod[0])) * Math.PI) : 0;
  face = { ...face, headPitch: face.headPitch + nod, pupilX: face.pupilX - 2, pupilY: face.pupilY + 1 };

  // Hands: phone at chest while standing; on his right knee once seated, left arm around his left knee.
  const sol = solveRig({ yaw: YAW, pose });
  const toScene = (p: Pt): Pt => ({ x: X + p.x * SCALE, y: hipY + p.y * SCALE });
  const kneeR = toScene(sol.legs.R.knee);
  const kneeL = toScene(sol.legs.L.knee);
  const seated = tween(f, [S9.slideDown[0] + 18, S9.sit], [0, 1]);
  const chest = { x: X + 14, y: hipY - 158 };
  const handR = lerpPt(chest, add(kneeR, { x: 4, y: -16 }), seated);
  const fkL = toScene(sol.arms.L.hand);
  const handL = lerpPt(fkL, add(kneeL, { x: -26, y: 24 }), seated);

  const push = tween(f, S9.pushIn, [1, 1.12], Easing.inOut(Easing.sin));

  return (
    <SceneSvg background={C.kitchenWallEvening}>
      <defs>
        <linearGradient id="s9-glass" x1={0} y1={90} x2={0} y2={400} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={C.windowEveningTop} />
          <stop offset={1} stopColor={C.windowEveningBottom} />
        </linearGradient>
        <clipPath id="s9-floor">
          <rect x={-100} y={760} width={2120} height={420} />
        </clipPath>
        <radialGradient id="s9-cone" cx={760} cy={640} r={620} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={C.pendantGlow} stopOpacity={0.45} />
          <stop offset={1} stopColor={C.pendantGlow} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="s9-dim" cx={760} cy={640} r={760} gradientUnits="userSpaceOnUse">
          <stop offset={0.62} stopColor={C.dimOverlay} stopOpacity={0} />
          <stop offset={0.86} stopColor={C.dimOverlay} stopOpacity={0.25} />
        </radialGradient>
        <linearGradient id="s9-cool" x1={1920} y1={0} x2={1300} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={C.windowEveningTop} stopOpacity={0.12} />
          <stop offset={1} stopColor={C.windowEveningTop} stopOpacity={0} />
        </linearGradient>
      </defs>
      <g transform={`translate(900 720) scale(${push}) translate(-900 -720)`}>
        <KitchenFloorSet />
        <Rig
          x={X}
          y={hipY}
          scale={SCALE}
          yaw={YAW}
          pose={pose}
          face={face}
          light={LIGHT}
          handTargets={{ R: handR, L: handL }}
          elbowBend={{ R: seated > 0.5 ? -1 : 1, L: 1 }}
          handItems={{ R: (h) => <LyingPhone at={{ x: h.x - 4, y: h.y - 14 }} angle={-12} /> }}
        />
        {/* Warm pendant cone (soft-light), cool window light from the right, evening dim outside the cone */}
        <rect x={-200} y={-200} width={2320} height={1480} fill="url(#s9-cone)" style={{ mixBlendMode: 'soft-light' }} />
        <rect x={-200} y={-200} width={2320} height={1480} fill="url(#s9-cool)" />
        <rect x={-200} y={-200} width={2320} height={1480} fill="url(#s9-dim)" style={{ mixBlendMode: 'multiply' }} />
      </g>
    </SceneSvg>
  );
};
