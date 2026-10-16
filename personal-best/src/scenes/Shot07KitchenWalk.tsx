import { GLANCE_UP, mixFace, NEUTRAL } from '../character/Face';
import { HOLD_PHONE_CHEST, walkCycle, withLegs } from '../character/poses';
import { RIG_STAND, Rig, solveRig } from '../character/Rig';
import { lerpPt, type Pt } from '../character/shapes';
import { C } from '../constants';
import { S7, SHOT_7 } from '../timeline';
import { Island, KitchenBack } from './Kitchen';
import { handheld, SceneSvg, tween, useShotFrame } from './common';

/**
 * Shot 7: Kitchen walk (f435–524). Same kitchen as shot 3, late afternoon.
 * Medium shot, handheld follow (A = 3 px). Key light: low, warm window, left.
 */

const LIGHT = { x: -1, y: -0.1 };
const SCALE = 1.25;
const PELVIS_Y = 210 + RIG_STAND.headTopAboveHip * SCALE;
const X_START = 1380;
const X_END = 980;
const KEYS_AT = { x: 1180, y: 650 };
// Constant speed until f480, then steps shorten to a stop at f505: 45v + 25v/2 = 400.
const SPEED = (X_START - X_END) / (S7.slowDown[0] - S7.walk[0] + (S7.walk[1] - S7.slowDown[0]) / 2);

/** Distance walked by frame f (px). */
const walked = (f: number) => {
  const t = Math.max(0, f - S7.walk[0]);
  const cruise = S7.slowDown[0] - S7.walk[0];
  if (t <= cruise) return SPEED * t;
  const slow = Math.min(t - cruise, S7.walk[1] - S7.slowDown[0]);
  const len = S7.walk[1] - S7.slowDown[0];
  return SPEED * cruise + SPEED * (slow - (slow * slow) / (2 * len));
};

export const walkerX = (f: number) => X_START - walked(f);

/** Camera x: the character's x averaged over the last 10 frames (a 10-frame lag). */
const cameraX = (f: number) => {
  let sum = 0;
  for (let i = 0; i <= S7.cameraLagFrames; i++) sum += walkerX(Math.max(S7.walk[0], f - i));
  return sum / (S7.cameraLagFrames + 1);
};

/** Horizontal scene offset so the lagged camera stays centered. */
export const shot7CameraOffset = (f: number) => 960 - cameraX(f);

/** His on-screen x in the 16:9 design space (used for the vertical crop). */
export const shot7ScreenX = (f: number) => walkerX(f) + shot7CameraOffset(f);

const Keys: React.FC<{ readonly at: Pt; readonly angle?: number }> = ({ at, angle = 0 }) => (
  <g transform={`translate(${at.x} ${at.y}) rotate(${angle})`}>
    <circle r={14} fill="none" stroke={C.keyRing} strokeWidth={4} />
    <rect x={-14} y={8} width={10} height={34} rx={3} fill={C.keyGold} transform="rotate(18 -9 8)" />
    <rect x={2} y={10} width={10} height={34} rx={3} fill={C.keyRing} transform="rotate(-12 7 10)" />
  </g>
);

export const Shot07KitchenWalk: React.FC = () => {
  const f = useShotFrame(SHOT_7.from);
  const x = walkerX(f);
  const stride = f < S7.slowDown[0] ? 1 : tween(f, S7.slowDown, [1, 0]);
  // Leg phase follows distance, so the feet don't slide as the steps shorten.
  const cycle = walkCycle((walked(f) / SPEED) * 1, stride);
  // HOLD_PHONE_CHEST's phone arm (L in the table) maps onto rig R here; see below.
  const pose = withLegs(
    { ...HOLD_PHONE_CHEST, shoulderR: HOLD_PHONE_CHEST.shoulderL, elbowR: HOLD_PHONE_CHEST.elbowL, shoulderL: cycle.pose.shoulderL, elbowL: cycle.pose.elbowL },
    cycle.pose,
  );
  const yaw = tween(f, [495, 512], [-60, -20]);
  const glance = tween(f, S7.headTilt, [0, 1]);
  const eyes = f >= S7.glanceUp ? 1 : 0;
  const face = { ...mixFace(NEUTRAL, GLANCE_UP, eyes), headPitch: -12 * glance, pupilY: 1.5 * (1 - eyes) + GLANCE_UP.pupilY * eyes };
  const cam = handheld(f, 3);
  const camX = shot7CameraOffset(f);

  // Facing screen left, his anatomical left side is toward camera. On the rig
  // that is the side labeled R (its R is screen right when facing camera), so
  // the phone (his left hand) rides on rig R and the keys (his right hand) on rig L.
  // His right hand dips to the counter at f465 for the keys, then carries them.
  const sol = solveRig({ yaw, pose });
  const fkKeysHand = { x: x + sol.arms.L.hand.x * SCALE, y: PELVIS_Y + sol.arms.L.hand.y * SCALE };
  const reach = f < S7.keys ? tween(f, [S7.keys - 8, S7.keys], [0, 1]) : tween(f, [S7.keys, S7.keys + 10], [1, 0]);
  const keysHand = reach > 0 ? lerpPt(fkKeysHand, KEYS_AT, reach) : undefined;
  const chest = { x: x - 40, y: PELVIS_Y - 118 };

  return (
    <SceneSvg background={C.kitchenWall}>
      <g transform={`translate(${camX + cam.x} ${cam.y}) rotate(${cam.rotation} ${960 - camX} 540)`}>
        <KitchenBack time="late" x0={-700} x1={2700} />
        {f < S7.keys ? <Keys at={{ x: KEYS_AT.x, y: 642 }} angle={80} /> : null}
        <Rig
          x={x}
          y={PELVIS_Y + (cycle.bob ?? 0)}
          scale={SCALE}
          yaw={yaw}
          pose={pose}
          face={face}
          light={LIGHT}
          backpack
          headRoll={4 * glance}
          handTargets={{ R: chest, L: keysHand }}
          elbowBend={{ R: 1, L: -1 }}
          handItems={{
            R: (h) => (
              <g transform={`translate(${h.x - 6} ${h.y - 44}) rotate(${-8})`}>
                <rect x={-35} y={-70} width={70} height={140} rx={12} fill={C.phoneBody} />
                <rect x={-27} y={-62} width={22} height={22} rx={6} fill={C.cameraBump} />
              </g>
            ),
            L: (h) => (f >= S7.keys ? <Keys at={{ x: h.x, y: h.y + 6 }} angle={20} /> : null),
          }}
        />
        <Island x0={-700} x1={2700} />
      </g>
      {/* Late-afternoon warm grade */}
      <rect x={0} y={0} width={1920} height={1080} fill="#FFB35C" opacity={0.08} style={{ mixBlendMode: 'soft-light' }} />
    </SceneSvg>
  );
};
