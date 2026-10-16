import { Easing } from 'remotion';
import { NEUTRAL } from '../character/Face';
import { HOLD_BOWL } from '../character/poses';
import { RIG_STAND, Rig } from '../character/Rig';
import { add, Capsule, dirDeg, lerpPt, mul, type Pt } from '../character/shapes';
import { C, shade } from '../constants';
import { S3, SHOT_3 } from '../timeline';
import { Island, KitchenBack } from './Kitchen';
import { quad, SceneSvg, tween, tweenPt, useShotFrame, WhipBlur } from './common';

/**
 * Shot 3: Kitchen morning (f150–224). Medium shot, eye level, static.
 * Key light: window, left. A speed ramp remaps scene time (t3) so the
 * no-look catch lands exactly on f195; the shot whips out at f210–224.
 */

const LIGHT = { x: -1, y: -0.25 };
const SCALE = 1.25;
const CHAR_X = 1060;
/** Pelvis y so the head top sits at y 210. */
const PELVIS_Y = 210 + RIG_STAND.headTopAboveHip * SCALE;

const BOWL = { x: 1010, y: 560 };
const BOWL_HAND_L = { x: 982, y: 590 };
const SPOON_BOWL_HAND = { x: 1052, y: 528 };
const SPOON_MOUTH_HAND = { x: 1068, y: 330 };
const ORANGE_START = { x: 240, y: 430 };
const ORANGE_CTRL = { x: 720, y: 160 };
const ORANGE_END = { x: 1270, y: 430 };
const CATCH_HAND = { x: 1270, y: 456 };
// Spec: pocket at (1060, 700); on this rig the hoodie pocket sits at y ≈ 590 (700 is on his thigh).
const POCKET = { x: 1060, y: 590 };

/** Section 7 shot 3 speed ramp: scene time t3 for composition frame f. */
export const t3 = (f: number) => {
  if (f <= S3.rampStart) return f;
  if (f <= S3.rampMid) return S3.rampStart + (f - S3.rampStart) * S3.rampRateSlow;
  const atMid = S3.rampStart + (S3.rampMid - S3.rampStart) * S3.rampRateSlow; // 184.2
  if (f <= S3.rampEnd) return atMid + (f - S3.rampMid) * S3.rampRateMid;
  const atEnd = atMid + (S3.rampEnd - S3.rampMid) * S3.rampRateMid; // 188.4
  return atEnd + (f - S3.rampEnd);
};

/** Family member's hand (left edge): in, flick at f160, out (t3 = f before the ramp). */
const familyHand = (t: number): Pt => {
  if (t <= S3.armFlick) return tweenPt(t, [S3.armEnter[0], S3.armFlick], { x: -80, y: 470 }, { x: 230, y: 430 });
  if (t <= S3.armEnter[1]) return tweenPt(t, [S3.armFlick, S3.armEnter[1]], { x: 252, y: 418 }, { x: 236, y: 436 });
  return tweenPt(t, S3.armRetract, { x: 236, y: 436 }, { x: -260, y: 520 }, Easing.in(Easing.cubic));
};

/** Orange center for scene time t. */
export const orangeAt = (t: number): Pt => {
  if (t < S3.orangeLaunchT3) return add(familyHand(t), { x: 10, y: 0 });
  const s = Math.min(1, (t - S3.orangeLaunchT3) / (S3.orangeCatchT3 - S3.orangeLaunchT3));
  return quad(ORANGE_START, ORANGE_CTRL, ORANGE_END, s);
};

/** Spoon cycles: 0 = in the bowl, 1 = at the mouth. Two 18-frame cycles from t 150. */
const spoonLift = (t: number) => {
  const p = (t - S3.spoonCycles[0]) / S3.spoonCycleFrames;
  return (1 - Math.cos(2 * Math.PI * Math.max(0, p))) / 2;
};

const Orange: React.FC<{ readonly at: Pt; readonly spin: number; readonly r?: number; readonly opacity?: number }> = ({
  at,
  spin,
  r = 36,
  opacity = 1,
}) => (
  <g transform={`translate(${at.x} ${at.y}) rotate(${spin})`} opacity={opacity}>
    <circle r={r} fill={C.orange} />
    <path d={`M ${-r * 0.75} ${-r * 0.15} A ${r} ${r} 0 0 1 ${r * 0.15} ${-r * 0.75} A ${r * 0.8} ${r * 0.8} 0 0 0 ${-r * 0.75} ${-r * 0.15} Z`} fill={C.orangeHighlight} />
    <circle r={r} fill="none" stroke={shade(C.orange, -0.12)} strokeWidth={r * 0.18} opacity={0.35} transform={`translate(${r * 0.08} ${r * 0.08})`} />
    <ellipse cx={4} cy={-r - 2} rx={(14 / 36) * r} ry={(8 / 36) * r} fill={C.leaf} transform={`rotate(-20 4 ${-r - 2})`} />
  </g>
);

const Spoon: React.FC<{ readonly at: Pt; readonly angle: number }> = ({ at, angle }) => {
  const tip = add(at, mul(dirDeg(angle), 92));
  return (
    <g>
      <Capsule a={add(at, mul(dirDeg(angle), -6))} b={add(at, mul(dirDeg(angle), 78))} w={8} fill={C.spoon} />
      <ellipse cx={tip.x} cy={tip.y} rx={10} ry={15} fill={C.spoon} transform={`rotate(${angle - 90} ${tip.x} ${tip.y})`} />
      <ellipse cx={tip.x - 2} cy={tip.y - 2} rx={5} ry={8} fill={shade(C.spoon, 0.12)} transform={`rotate(${angle - 90} ${tip.x} ${tip.y})`} />
    </g>
  );
};

const BLUEBERRIES = [
  { x: -60, y: -6 }, { x: -34, y: 6 }, { x: -8, y: -10 }, { x: 18, y: 4 }, { x: 44, y: -8 },
  { x: 66, y: 6 }, { x: -46, y: -14 }, { x: 4, y: 10 }, { x: 30, y: -16 },
];

const Bowl: React.FC = () => (
  <g transform={`translate(${BOWL.x} ${BOWL.y})`}>
    <path d="M -100 0 A 100 74 0 0 0 100 0 Z" fill={C.bowl} />
    <path d="M -100 0 A 100 74 0 0 0 -30 66 A 120 90 0 0 1 -100 0 Z" fill={shade(C.bowl, 0.0)} />
    <path d="M 40 60 A 100 74 0 0 0 100 0 L 86 0 A 92 66 0 0 1 40 60 Z" fill={shade(C.bowl, -0.12)} />
    <ellipse rx={100} ry={32} fill={C.bowlRim} />
    <ellipse rx={90} ry={25} fill={C.oatmeal} />
    {BLUEBERRIES.map((b, i) => (
      <g key={i}>
        <circle cx={b.x} cy={b.y} r={8} fill={C.blueberry} />
        <circle cx={b.x - 2.5} cy={b.y - 2.5} r={1.5} fill={C.blueberryHighlight} />
      </g>
    ))}
  </g>
);

export const Shot03KitchenMorning: React.FC = () => {
  const f = useShotFrame(SHOT_3.from);
  const t = t3(f);

  // --- His right hand -------------------------------------------------------
  const spoonAngle = (s: number) => 110 + 105 * s; // into the bowl → up toward his mouth
  let handR: Pt;
  let spoonInHand = true;
  let spoonS = spoonLift(t);
  if (t <= S3.rampStart) {
    handR = lerpPt(SPOON_BOWL_HAND, SPOON_MOUTH_HAND, spoonS);
  } else if (f < S3.catch) {
    // Spoon stays in his mouth; the hand rises to the catch point (no look).
    spoonInHand = false;
    handR = tweenPt(t, [S3.rampStart, S3.orangeCatchT3], SPOON_MOUTH_HAND, CATCH_HAND, Easing.out(Easing.cubic));
  } else if (f < S3.tuck[0]) {
    spoonInHand = false;
    handR = CATCH_HAND;
  } else if (f < 205) {
    spoonInHand = false;
    handR = tweenPt(f, [S3.tuck[0], 205], CATCH_HAND, POCKET);
  } else if (f < S3.tuck[1]) {
    spoonInHand = false;
    handR = tweenPt(f, [205, S3.tuck[1]], POCKET, SPOON_MOUTH_HAND);
  } else {
    // Back to eating: the spoon goes back down to the bowl.
    spoonS = tween(f, [S3.tuck[1], SHOT_3.from + SHOT_3.durationInFrames], [1, 0]);
    handR = lerpPt(SPOON_BOWL_HAND, SPOON_MOUTH_HAND, spoonS);
  }
  if (f >= S3.tuck[1]) spoonInHand = true;
  const squash = f >= S3.catch && f < S3.catch + S3.squashFrames ? 0.92 : 1;

  // --- The orange -----------------------------------------------------------
  const orangeFlying = t >= S3.orangeLaunchT3 && f < S3.catch;
  const orange = f < S3.catch ? orangeAt(t) : f < S3.tuck[0] ? ORANGE_END : tweenPt(f, [S3.tuck[0], 205], ORANGE_END, add(POCKET, { x: 0, y: -18 }));
  const orangeVisible = f < 205;
  const spin = t >= S3.orangeLaunchT3 ? (Math.min(t, S3.orangeCatchT3) - S3.orangeLaunchT3) * S3.orangeSpinPerFrame : 0;
  const ghosts = f >= S3.ghosts[0] && f <= S3.ghosts[1] ? [0.22, 0.16, 0.1, 0.05] : [];

  // --- Whip-pan out ------------------------------------------------------------
  const whipX = tween(f, S3.whipOut, [0, -1400], Easing.in(Easing.cubic));
  const blur = tween(f, S3.whipOut, [0, 40], Easing.in(Easing.cubic));

  const family = familyHand(t);
  const familyVisible = t < S3.armRetract[1];
  const face = { ...NEUTRAL, pupilY: 2.5, headPitch: 10 };
  const mouthSpoon = { at: SPOON_MOUTH_HAND, angle: spoonAngle(1) };

  return (
    <SceneSvg background={C.kitchenWall}>
      <WhipBlur id="s3-whip" amount={blur}>
        <g transform={`translate(${whipX} 0)`}>
          <KitchenBack time="morning" x0={-40} x1={3400} />
          {!spoonInHand ? <Spoon {...mouthSpoon} /> : null}
          <Rig
            x={CHAR_X}
            y={PELVIS_Y}
            scale={SCALE}
            yaw={-20}
            pose={HOLD_BOWL}
            face={face}
            light={LIGHT}
            handTargets={{ L: BOWL_HAND_L, R: handR }}
            elbowBend={{ L: 1, R: -1 }}
            handSquash={{ R: squash }}
            handItems={{
              R: (h) => (spoonInHand ? <Spoon at={{ x: h.x, y: h.y }} angle={spoonAngle(spoonS)} /> : null),
            }}
          />
          <Bowl />
          {/* Family member's arm from the left edge */}
          {familyVisible ? (
            <g>
              <Capsule a={{ x: -360, y: 560 }} b={add(family, { x: -22, y: 6 })} w={46} fill={C.sleeve2} shadow={shade(C.sleeve2, -0.15)} light={LIGHT} />
              <circle cx={family.x} cy={family.y} r={21} fill={C.skin2} />
              <ellipse cx={family.x + 6} cy={family.y - 16} rx={6} ry={10} fill={shade(C.skin2, -0.15)} transform={`rotate(40 ${family.x + 6} ${family.y - 16})`} />
            </g>
          ) : null}
          {/* Ghost copies of the orange during the slow-motion stretch */}
          {ghosts.map((o, i) => (
            <Orange key={i} at={orangeAt(t3(f - (i + 1)))} spin={(t3(f - (i + 1)) - S3.orangeLaunchT3) * S3.orangeSpinPerFrame} opacity={o} />
          ))}
          {orangeVisible ? <Orange at={orange} spin={orangeFlying || f >= S3.catch ? spin : 0} /> : null}
          {f >= 205 ? (
            // The orange's top peeking out of the hoodie pocket.
            <circle cx={POCKET.x} cy={POCKET.y - 6} r={20} fill={C.orange} opacity={0.9} />
          ) : null}
          <Island x0={-40} x1={3400} />
        </g>
      </WhipBlur>
    </SceneSvg>
  );
};
