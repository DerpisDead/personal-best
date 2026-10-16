import { C, shade } from '../constants';
import {
  add,
  angleOf,
  Capsule,
  D2R,
  ikJoint,
  len,
  lightInto,
  mul,
  norm,
  type Pt,
  ShadedEllipse,
  ShadedRoundRect,
  sub,
  useSvgId,
} from './shapes';

/**
 * Shot 2's top-down sleeper in pajamas (section 7): head circle r 50 with the
 * hair cap toward the headboard, torso 210×300 in pjShirt, arms 36 px wide
 * (pjShirt sleeves, bare forearms), pjPants legs (under the blanket).
 *
 * All coordinates are scene px. The head center rests at (headX, headY); the
 * torso hangs below it. `roll`/`shiftX` turn the upper body toward the lamp
 * for the reach (pivoting at the hips).
 */
export type OverheadSleeperProps = {
  readonly headX: number;
  readonly headY: number;
  /** 0 open … 1 closed (eyelids become arcs). */
  readonly eyesClosed: number;
  /** Hand targets in scene px. */
  readonly handL: Pt;
  readonly handR: Pt;
  /** Upper body roll in degrees around the hips (negative = toward screen left). */
  readonly roll?: number;
  readonly shiftX?: number;
  readonly light: Pt;
};

export const SLEEPER = {
  headR: 50,
  torso: { w: 210, h: 300, top: 290 - 230 }, // torso top sits 60 px below the head center
  shoulderInset: 18,
  shoulderDown: 42,
  arm: { w: 36, upper: 130, fore: 130 },
  handR: 21,
  hipY: 590 - 230, // hips (torso bottom) relative to the head center
  legs: { w: 72, len: 470, apart: 46 },
} as const;

const rotateAround = (p: Pt, c: Pt, deg: number): Pt => {
  const a = deg * D2R;
  const d = sub(p, c);
  return { x: c.x + d.x * Math.cos(a) - d.y * Math.sin(a), y: c.y + d.x * Math.sin(a) + d.y * Math.cos(a) };
};

/** Shoulder positions in scene px for the given placement and roll. */
export const sleeperShoulders = (p: Pick<OverheadSleeperProps, 'headX' | 'headY' | 'roll' | 'shiftX'>) => {
  const hips = { x: p.headX, y: p.headY + SLEEPER.hipY };
  const sy = p.headY + SLEEPER.torso.top + SLEEPER.shoulderDown;
  const half = SLEEPER.torso.w / 2 - SLEEPER.shoulderInset;
  const place = (pt: Pt) => add(rotateAround(pt, hips, p.roll ?? 0), { x: p.shiftX ?? 0, y: 0 });
  return {
    L: place({ x: p.headX - half, y: sy }),
    R: place({ x: p.headX + half, y: sy }),
  };
};

type ArmProps = { readonly shoulder: Pt; readonly hand: Pt; readonly bend: 1 | -1; readonly light: Pt };

/** Arm with IK; if the target is out of reach the arm stretches up to 25% to touch it. */
const Arm: React.FC<ArmProps> = ({ shoulder, hand, bend, light }) => {
  const { upper, fore, w } = SLEEPER.arm;
  const reach = upper + fore + SLEEPER.handR * 0.6;
  const dist = len(sub(hand, shoulder));
  const stretch = Math.min(1.25, Math.max(1, dist / reach));
  const elbow = ikJoint(shoulder, hand, upper * stretch, (fore + SLEEPER.handR * 0.6) * stretch, bend);
  const dir = norm(sub(hand, elbow));
  const wrist = sub(hand, mul(dir, SLEEPER.handR * 0.6));
  const sleeveEnd = add(shoulder, mul(norm(sub(elbow, shoulder)), upper * stretch * 0.55));
  const ang = angleOf(dir);
  const thumb = add(hand, mul({ x: Math.cos((ang - 90 * bend) * D2R), y: Math.sin((ang - 90 * bend) * D2R) }, 14));
  return (
    <g>
      <Capsule a={elbow} b={wrist} w={w - 4} fill={C.skin} shadow={C.skinShadow} highlight={C.skinHighlight} light={light} />
      <Capsule a={shoulder} b={elbow} w={w} fill={C.skin} shadow={C.skinShadow} highlight={C.skinHighlight} light={light} />
      <Capsule a={shoulder} b={sleeveEnd} w={w + 6} fill={C.pjShirt} shadow={shade(C.pjShirt, -0.15)} highlight={shade(C.pjShirt, 0.1)} light={light} />
      <ellipse cx={thumb.x} cy={thumb.y} rx={7} ry={11} fill={C.skinShadow} transform={`rotate(${ang - 90} ${thumb.x} ${thumb.y})`} />
      <ShadedEllipse cx={hand.x} cy={hand.y} rx={SLEEPER.handR} ry={SLEEPER.handR} fill={C.skin} shadow={C.skinShadow} light={light} />
    </g>
  );
};

export const OverheadSleeper: React.FC<OverheadSleeperProps> = ({
  headX,
  headY,
  eyesClosed,
  handL,
  handR,
  roll = 0,
  shiftX = 0,
  light,
}) => {
  const hips = { x: headX, y: headY + SLEEPER.hipY };
  const shoulders = sleeperShoulders({ headX, headY, roll, shiftX });
  const { w: tw, h: th } = SLEEPER.torso;
  const torsoTop = headY + SLEEPER.torso.top;
  const r = SLEEPER.headR;
  const lidOpen = 1 - eyesClosed;
  const upper = `translate(${shiftX} 0) rotate(${roll} ${hips.x} ${hips.y})`;
  const torsoLight = lightInto(light, roll);
  const hairClip = useSvgId('sleeper-hair');

  return (
    <g>
      {/* Legs (mostly under the blanket) */}
      {[-1, 1].map((s) => (
        <Capsule
          key={s}
          a={{ x: headX + s * SLEEPER.legs.apart, y: hips.y - 20 }}
          b={{ x: headX + s * (SLEEPER.legs.apart + 8), y: hips.y + SLEEPER.legs.len }}
          w={SLEEPER.legs.w}
          fill={C.pjPants}
          shadow={shade(C.pjPants, -0.15)}
          highlight={shade(C.pjPants, 0.1)}
          light={light}
        />
      ))}
      <g transform={upper}>
        {/* Torso */}
        <ShadedRoundRect
          x={headX - tw / 2}
          y={torsoTop}
          w={tw}
          h={th}
          r={70}
          fill={C.pjShirt}
          shadow={shade(C.pjShirt, -0.15)}
          highlight={shade(C.pjShirt, 0.1)}
          light={torsoLight}
          shadowFrac={0.28}
          soft={8}
        />
        {/* Neckline */}
        <path
          d={`M ${headX - 34} ${torsoTop + 4} Q ${headX} ${torsoTop + 40} ${headX + 34} ${torsoTop + 4}`}
          stroke={shade(C.pjShirt, -0.15)}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
        />
        {/* Neck */}
        <rect x={headX - 22} y={headY + r - 14} width={44} height={30} rx={12} fill={C.skinShadow} />
        {/* Head, seen from above: face up, hair toward the headboard */}
        <ShadedEllipse cx={headX} cy={headY} rx={r} ry={r} fill={C.skin} shadow={C.skinShadow} highlight={C.skinHighlight} light={light} shadowFrac={0.3} soft={5} />
        <clipPath id={hairClip}>
          <circle cx={headX} cy={headY - 2} r={r + 3} />
        </clipPath>
        <path
          d={`M ${headX - r - 6} ${headY - r - 8} L ${headX + r + 6} ${headY - r - 8} L ${headX + r + 6} ${headY - 6}
              Q ${headX + 30} ${headY - 18} ${headX + 8} ${headY - 20} Q ${headX - 4} ${headY - 12} ${headX - 18} ${headY - 22}
              Q ${headX - 34} ${headY - 22} ${headX - r - 6} ${headY - 4} Z`}
          fill={C.hair}
          clipPath={`url(#${hairClip})`}
        />
        {/* Face: brows, eyes (closing to arcs), nose, mouth */}
        {[-1, 1].map((s) => (
          <g key={s}>
            <rect x={headX + s * 17 - 9.5} y={headY - 10} width={19} height={4.5} rx={2.2} fill={C.brows} />
            {lidOpen > 0.05 ? (
              <ellipse cx={headX + s * 17} cy={headY + 4} rx={3.4} ry={4.4 * lidOpen} fill={C.eyes} />
            ) : null}
            {eyesClosed > 0.05 ? (
              <path
                d={`M ${headX + s * 17 - 5} ${headY + 4} Q ${headX + s * 17} ${headY + 8} ${headX + s * 17 + 5} ${headY + 4}`}
                stroke={C.eyes}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                opacity={Math.min(1, eyesClosed * 1.5)}
              />
            ) : null}
          </g>
        ))}
        <path d={`M ${headX + 2} ${headY + 8} Q ${headX + 5} ${headY + 16} ${headX - 2} ${headY + 18}`} stroke={C.skinShadow} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <path d={`M ${headX - 11} ${headY + 28} Q ${headX} ${headY + 30} ${headX + 11} ${headY + 28}`} stroke={C.mouthLine} strokeWidth={3} fill="none" strokeLinecap="round" />
      </g>
      {/* Arms (scene space, from the rolled shoulders) */}
      <Arm shoulder={shoulders.L} hand={handL} bend={1} light={light} />
      <Arm shoulder={shoulders.R} hand={handR} bend={-1} light={light} />
    </g>
  );
};
