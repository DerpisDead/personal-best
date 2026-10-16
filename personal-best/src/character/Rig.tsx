import { BODY, C, shade } from '../constants';
import { Head, NEUTRAL, type FaceParams } from './Face';
import type { Pose } from './poses';
import {
  add,
  angleOf,
  Capsule,
  D2R,
  dirDeg,
  ikJoint,
  len,
  lightInto,
  mul,
  norm,
  type Pt,
  ShadedEllipse,
  ShadedRoundRect,
  sub,
} from './shapes';

/**
 * The parametric rig (section 5), used in shots 3, 4, 7, 9 and 10.
 *
 * Joints live in a body frame: F (forward, the way he faces), S (lateral, his
 * R side positive) and U (up), with the pelvis center at the origin. Pose
 * angles rotate limbs in the F–U plane. A yaw angle projects the body onto the
 * screen, so one rig draws front (yaw 0), 3/4 and profile (yaw ±90; positive
 * faces screen right) views with foreshortening, and limbs are drawn back to
 * front by depth. On screen his R side is to the right when he faces camera.
 *
 * Bone lengths are the section 5 part lengths, joint to joint (thigh 116,
 * shin 108, upper arm 92, forearm 86); capsules are drawn with their rounded
 * caps centered on the joints. That puts the standing hip 244 px above the
 * floor and the head top about 565 px up.
 */

export type Outfit = 'hoodie' | 'pajamas';
export type Side = 'L' | 'R';

export type HandInfo = {
  /** Hand center in scene coordinates. */
  readonly x: number;
  readonly y: number;
  /** Screen angle of the forearm (wrist → fingers), degrees. */
  readonly angle: number;
  readonly scale: number;
};

export type RigProps = {
  /** Pelvis center (midpoint of the hip joints) in scene px. Ignored for y when `ground` is set. */
  readonly x: number;
  readonly y?: number;
  /** If set, the pelvis height is chosen so the lowest sole rests on this scene y. */
  readonly ground?: number;
  readonly scale: number;
  /** 0 = facing camera, +90 = profile facing screen right, −90 = facing screen left. */
  readonly yaw: number;
  readonly pose: Pose;
  readonly face?: FaceParams;
  readonly outfit?: Outfit;
  /** Unit vector toward the key light, in screen space. */
  readonly light: Pt;
  /** Hand targets in scene px (two-bone IK in the picture plane) instead of pose angles. */
  readonly handTargets?: Partial<Record<Side, Pt>>;
  /** Which way each IK elbow bends: +1 clockwise of shoulder→hand, −1 counter-clockwise. */
  readonly elbowBend?: Partial<Record<Side, 1 | -1>>;
  /** Draw something at a hand, in scene coordinates (bowl, phone, keys, orange…). */
  readonly handItems?: Partial<Record<Side, (hand: HandInfo) => React.ReactNode>>;
  /** Roll of the head in degrees (positive = clockwise). */
  readonly headRoll?: number;
  /** Torso breathing scale (shot 10). */
  readonly torsoScale?: number;
  readonly backpack?: boolean;
  /** Shift the hip joints (and so the legs) in body F, e.g. feet planted forward while seated. */
  readonly legForward?: number;
};

// ---------------------------------------------------------------------------
// Body frame
// ---------------------------------------------------------------------------

type V3 = { readonly f: number; readonly s: number; readonly u: number };
const v3 = (f: number, s: number, u: number): V3 => ({ f, s, u });
const vadd = (a: V3, b: V3): V3 => ({ f: a.f + b.f, s: a.s + b.s, u: a.u + b.u });
const vmul = (a: V3, k: number): V3 => ({ f: a.f * k, s: a.s * k, u: a.u * k });

/** Limb direction: `deg` from straight down in the F–U plane, `abd` outward to `side`. */
const limbDir = (deg: number, abd: number, side: number): V3 => ({
  f: Math.sin(deg * D2R) * Math.cos(abd * D2R),
  s: side * Math.sin(abd * D2R),
  u: -Math.cos(deg * D2R) * Math.cos(abd * D2R),
});

export const RIG = {
  hipHalf: 26,
  pelvis: { front: BODY.pelvis.w, depth: 84, h: BODY.pelvis.h, center: 6 },
  torso: { front: BODY.torso.w, depth: 86, h: BODY.torso.h, base: 14, r: BODY.torso.r },
  shoulder: { s: 50, u: 184 },
  neck: { from: 202, to: 224 },
  headCenter: 268,
  upperArm: BODY.upperArm.h,
  forearm: BODY.forearm.h,
  handReach: 12,
  thigh: BODY.thigh.h,
  shin: BODY.shin.h,
  ankleToSole: 20,
  heel: 18,
  toe: 56,
  armAbduction: 6,
  legAbduction: 2,
} as const;

/** Standing hip height above the soles and head-top height above the hips, at scale 1. */
export const RIG_STAND = {
  hipHeight: RIG.thigh + RIG.shin + RIG.ankleToSole,
  headTopAboveHip: RIG.headCenter + BODY.head.ry + 5,
};

type Projected = Pt & { readonly depth: number };

export type RigSolution = {
  readonly c: number;
  readonly sn: number;
  readonly torsoBase: Projected;
  readonly torsoTop: Projected;
  readonly neckBase: Projected;
  readonly neckTop: Projected;
  readonly head: Projected;
  readonly pelvis: Projected;
  readonly arms: Record<Side, { shoulder: Projected; elbow: Projected; wrist: Projected; hand: Projected }>;
  readonly legs: Record<
    Side,
    { hip: Projected; knee: Projected; ankle: Projected; heel: Projected; toe: Projected; footAngle: number; footLen: number }
  >;
  /** Lowest sole point (local y, scale 1). */
  readonly soleY: number;
};

/** Solve every joint in rig-local screen space (pelvis at 0,0; scale 1). */
export const solveRig = (props: Pick<RigProps, 'yaw' | 'pose' | 'handTargets' | 'elbowBend' | 'legForward'> & {
  /** IK targets already converted to rig-local coordinates. */
  readonly localTargets?: Partial<Record<Side, Pt>>;
}): RigSolution => {
  const { yaw, pose, elbowBend, legForward = 0, localTargets } = props;
  const c = Math.cos(yaw * D2R);
  const sn = Math.sin(yaw * D2R);
  const P = (p: V3): Projected => ({ x: p.s * c + p.f * sn, y: -p.u, depth: p.f * c - p.s * sn });

  const tau = pose.torso;
  const lift = pose.lift ?? 0;
  const torsoPt = (f: number, s: number, u: number): V3 =>
    v3(u * Math.sin(tau * D2R) + f * Math.cos(tau * D2R), s, u * Math.cos(tau * D2R) - f * Math.sin(tau * D2R));
  const lifted = (p: V3): V3 => vadd(p, v3(0, 0, lift));

  const torsoBase = torsoPt(0, 0, RIG.torso.base);
  const torsoTop = torsoPt(0, 0, RIG.torso.base + RIG.torso.h);
  const neckBase = lifted(torsoPt(2, 0, RIG.neck.from));
  const neckTop = lifted(torsoPt(4, 0, RIG.neck.to));
  const head = lifted(torsoPt(6, 0, RIG.headCenter));

  const arm = (side: Side) => {
    const sgn = side === 'R' ? 1 : -1;
    const shoulder = lifted(torsoPt(0, sgn * RIG.shoulder.s, RIG.shoulder.u));
    const sh = side === 'R' ? pose.shoulderR : pose.shoulderL;
    const el = side === 'R' ? pose.elbowR : pose.elbowL;
    const upper = limbDir(sh + tau, RIG.armAbduction, sgn);
    const elbow = vadd(shoulder, vmul(upper, RIG.upperArm));
    const fore = limbDir(sh + tau + el, RIG.armAbduction, sgn);
    const wrist = vadd(elbow, vmul(fore, RIG.forearm));
    const hand = vadd(wrist, vmul(fore, RIG.handReach));
    const sP = P(shoulder);
    const target = localTargets?.[side];
    if (!target) return { shoulder: sP, elbow: P(elbow), wrist: P(wrist), hand: P(hand) };
    // IK in the picture plane; depth borrowed from the FK solution for draw order.
    const bend = elbowBend?.[side] ?? (side === 'R' ? 1 : -1);
    const reach = RIG.forearm + RIG.handReach;
    const e = ikJoint(sP, target, RIG.upperArm, reach, bend);
    const fdir = norm(sub(target, e));
    const w = sub(target, mul(fdir, RIG.handReach));
    const d = P(hand).depth;
    return {
      shoulder: sP,
      elbow: { ...e, depth: d },
      wrist: { ...w, depth: d },
      hand: { ...target, depth: d },
    };
  };

  const leg = (side: Side) => {
    const sgn = side === 'R' ? 1 : -1;
    const hip = v3(legForward, sgn * RIG.hipHalf, 0);
    const hipA = (side === 'R' ? pose.hipR : pose.hipL) + (pose.pelvisTilt ?? 0);
    const kneeA = side === 'R' ? pose.kneeR : pose.kneeL;
    const pitch = (side === 'R' ? pose.footR : pose.footL) ?? 0;
    const thigh = limbDir(hipA, RIG.legAbduction, sgn);
    const knee = vadd(hip, vmul(thigh, RIG.thigh));
    const shin = limbDir(hipA - kneeA, RIG.legAbduction, sgn);
    const ankle = vadd(knee, vmul(shin, RIG.shin));
    const fwd = v3(Math.cos(pitch * D2R), 0, Math.sin(pitch * D2R));
    const up = v3(-Math.sin(pitch * D2R), 0, Math.cos(pitch * D2R));
    const sole = vadd(ankle, vmul(up, -RIG.ankleToSole));
    const heel = vadd(sole, vmul(fwd, -RIG.heel));
    const toe = vadd(sole, vmul(fwd, RIG.toe));
    const hP = P(heel);
    const tP = P(toe);
    return {
      hip: P(hip),
      knee: P(knee),
      ankle: P(ankle),
      heel: hP,
      toe: tP,
      footAngle: angleOf(sub(tP, hP)),
      footLen: len(sub(tP, hP)),
    };
  };

  const legs = { L: leg('L'), R: leg('R') };
  const soleY = Math.max(legs.L.heel.y, legs.L.toe.y, legs.R.heel.y, legs.R.toe.y);

  return {
    c,
    sn,
    torsoBase: P(torsoBase),
    torsoTop: P(torsoTop),
    neckBase: P(neckBase),
    neckTop: P(neckTop),
    head: P(head),
    pelvis: P(v3(0, 0, RIG.pelvis.center)),
    arms: { L: arm('L'), R: arm('R') },
    legs,
    soleY,
  };
};

/** Scene-space pelvis y for a rig whose lowest sole should rest on `ground`. */
export const groundedY = (ground: number, scale: number, sol: RigSolution) => ground - sol.soleY * scale;

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

const outfitColors = (outfit: Outfit) =>
  outfit === 'hoodie'
    ? {
        top: C.hoodie, topShadow: C.hoodieShadow, topHighlight: C.hoodieHighlight,
        sleeve: C.hoodie, forearm: C.hoodie, forearmShadow: C.hoodieShadow, forearmHighlight: C.hoodieHighlight,
        pants: C.jeans, pantsShadow: C.jeansShadow, pantsHighlight: shade(C.jeans, 0.1),
      }
    : {
        top: C.pjShirt, topShadow: shade(C.pjShirt, -0.15), topHighlight: shade(C.pjShirt, 0.1),
        sleeve: C.pjShirt, forearm: C.skin, forearmShadow: C.skinShadow, forearmHighlight: C.skinHighlight,
        pants: C.pjPants, pantsShadow: shade(C.pjPants, -0.15), pantsHighlight: shade(C.pjPants, 0.1),
      };

type ShoeProps = {
  readonly heel: Pt;
  readonly toe: Pt;
  readonly frontness: number;
  readonly light: Pt;
};

/** Rounded 74×26 shoe, radius 10, 6 px sole, 3 lace lines (foreshortened in front views). */
const Shoe: React.FC<ShoeProps> = ({ heel, toe, frontness, light }) => {
  const along = sub(toe, heel);
  const profileLen = len(along);
  const L = Math.max(profileLen, 0) + 32 * frontness;
  const flip = along.x < 0 ? -1 : 1;
  // Angle of the toe direction, folded so the sole always stays at the bottom.
  const ang = profileLen > 8 ? angleOf({ x: along.x * flip, y: along.y }) : 0;
  const center = add(heel, mul(along, 0.5));
  const h = BODY.shoe.h;
  const toeDir = profileLen > 8 ? 1 : 0;
  const local = lightInto({ x: light.x * flip, y: light.y }, ang);
  return (
    <g transform={`translate(${center.x} ${center.y - h / 2}) scale(${flip} 1) rotate(${ang})`}>
      <ShadedRoundRect
        x={-L / 2}
        y={-h / 2}
        w={L}
        h={h}
        r={BODY.shoe.r}
        fill={C.shoeUpper}
        shadow="#D9D9D5"
        light={local}
        shadowFrac={0.3}
        highlightFrac={0}
      />
      <rect x={-L / 2} y={h / 2 - BODY.shoe.sole} width={L} height={BODY.shoe.sole} rx={3} fill={C.shoeSole} />
      {[0, 1, 2].map((i) => {
        const lx = toeDir ? L * (0.02 + 0.12 * i) : -6 + 6 * i;
        return toeDir ? (
          <line key={i} x1={lx} y1={-h / 2 + 3} x2={lx + 5} y2={-h / 2 + 9} stroke={C.shoeLace} strokeWidth={2} strokeLinecap="round" />
        ) : (
          <line key={i} x1={-6} y1={-h / 2 + 4 + 4 * i} x2={6} y2={-h / 2 + 4 + 4 * i} stroke={C.shoeLace} strokeWidth={2} strokeLinecap="round" />
        );
      })}
    </g>
  );
};

/** Hand: circle r 16 plus a thumb ellipse 8×12. */
const Hand: React.FC<{ readonly at: Pt; readonly angle: number; readonly thumbSide: number; readonly light: Pt }> = ({
  at,
  angle,
  thumbSide,
  light,
}) => {
  const perp = dirDeg(angle + 90 * thumbSide);
  const thumb = add(add(at, mul(perp, 12)), mul(dirDeg(angle), -3));
  return (
    <g>
      <ellipse
        cx={thumb.x}
        cy={thumb.y}
        rx={BODY.hand.thumbW / 2}
        ry={BODY.hand.thumbH / 2}
        fill={C.skinShadow}
        transform={`rotate(${angle - 90} ${thumb.x} ${thumb.y})`}
      />
      <ShadedEllipse
        cx={at.x}
        cy={at.y}
        rx={BODY.hand.r}
        ry={BODY.hand.r}
        fill={C.skin}
        shadow={C.skinShadow}
        highlight={C.skinHighlight}
        light={light}
      />
    </g>
  );
};

export const Rig: React.FC<RigProps> = (props) => {
  const {
    x,
    scale,
    yaw,
    face = NEUTRAL,
    outfit = 'hoodie',
    light,
    handTargets,
    handItems,
    headRoll = 0,
    torsoScale = 1,
    backpack = false,
  } = props;
  const colors = outfitColors(outfit);
  const l = norm(light);

  // First pass without IK to find the pelvis position, then convert targets to local space.
  const fk = solveRig({ ...props, localTargets: undefined });
  const y = props.ground !== undefined ? groundedY(props.ground, scale, fk) : (props.y ?? 0);
  const toLocal = (p: Pt): Pt => ({ x: (p.x - x) / scale, y: (p.y - y) / scale });
  const localTargets = handTargets
    ? {
        L: handTargets.L ? toLocal(handTargets.L) : undefined,
        R: handTargets.R ? toLocal(handTargets.R) : undefined,
      }
    : undefined;
  const sol = handTargets ? solveRig({ ...props, localTargets }) : fk;
  const { c, sn } = sol;
  const frontness = Math.abs(c);
  const dir = sn >= 0 ? 1 : -1;

  // --- Torso geometry (in a group rotated along the torso axis) -----------
  const torsoAxis = sub(sol.torsoTop, sol.torsoBase);
  const torsoAng = angleOf(torsoAxis) + 90; // rotate so local −y runs up the torso
  const torsoLen = len(torsoAxis);
  const torsoW = Math.hypot(RIG.torso.front * c, RIG.torso.depth * sn);
  const pelvisW = Math.hypot(RIG.pelvis.front * c, RIG.pelvis.depth * sn);
  const torsoLight = lightInto(l, torsoAng);
  const frontShift = (RIG.torso.depth / 2) * sn * 0.85; // where the chest's front surface projects
  const showFront = Math.abs(sn) < 0.88;

  const limbOrder: { key: string; depth: number; node: React.ReactNode }[] = [];

  // --- Legs ----------------------------------------------------------------
  (['L', 'R'] as const).forEach((side) => {
    const g = sol.legs[side];
    const depth = (g.hip.depth + g.knee.depth + g.ankle.depth) / 3;
    limbOrder.push({
      key: `leg${side}`,
      depth,
      node: (
        <g key={`leg${side}`}>
          <Capsule a={g.knee} b={g.ankle} w={BODY.shin.w} fill={colors.pants} shadow={colors.pantsShadow} highlight={colors.pantsHighlight} light={l} />
          <Capsule a={g.hip} b={g.knee} w={BODY.thigh.w} fill={colors.pants} shadow={colors.pantsShadow} highlight={colors.pantsHighlight} light={l} />
          {/* Sock band between the hem and the shoe */}
          <Capsule a={g.ankle} b={add(g.ankle, mul(norm(sub(g.ankle, g.knee)), 4))} w={BODY.shin.w - 6} fill={C.sock} ext={6} />
          <Shoe heel={g.heel} toe={g.toe} frontness={frontness} light={l} />
        </g>
      ),
    });
  });

  // --- Arms ----------------------------------------------------------------
  (['L', 'R'] as const).forEach((side) => {
    const a = sol.arms[side];
    const depth = (a.shoulder.depth + a.elbow.depth + a.hand.depth) / 3 + 0.5;
    const foreAng = angleOf(sub(a.hand, a.wrist));
    const cuffStart = add(a.wrist, mul(norm(sub(a.elbow, a.wrist)), 10));
    const item = handItems?.[side];
    limbOrder.push({
      key: `arm${side}`,
      depth,
      node: (
        <g key={`arm${side}`}>
          <Capsule a={a.shoulder} b={a.elbow} w={BODY.upperArm.w} fill={colors.sleeve} shadow={colors.topShadow} highlight={colors.topHighlight} light={l} />
          <Capsule a={a.elbow} b={a.wrist} w={BODY.forearm.w} fill={colors.forearm} shadow={colors.forearmShadow} highlight={colors.forearmHighlight} light={l} />
          {outfit === 'hoodie' ? (
            <Capsule a={cuffStart} b={a.wrist} w={BODY.forearm.w + 1} fill={C.hoodieShadow} ext={BODY.forearm.w / 2} />
          ) : null}
          <Hand at={a.hand} angle={foreAng} thumbSide={side === 'R' ? -1 : 1} light={l} />
          {item ? (
            <g transform={`scale(${1 / scale}) translate(${-x} ${-y})`}>
              {item({ x: x + a.hand.x * scale, y: y + a.hand.y * scale, angle: foreAng, scale })}
            </g>
          ) : null}
        </g>
      ),
    });
  });

  // --- Body: backpack, pelvis, torso, neck, head --------------------------
  const backX = -dir * Math.abs(sn) * (RIG.torso.depth / 2 + 46);
  const body = (
    <g key="body">
      {backpack ? (
        <ShadedRoundRect
          x={sol.torsoBase.x + backX - 90 * (0.5 + 0.5 * frontness)}
          y={sol.torsoTop.y + 8}
          w={180 * (0.5 + 0.5 * frontness)}
          h={230}
          r={30}
          fill={C.backpack}
          shadow="#333D31"
          light={l}
        />
      ) : null}
      <ShadedRoundRect
        x={sol.pelvis.x - pelvisW / 2}
        y={sol.pelvis.y - RIG.pelvis.h / 2}
        w={pelvisW}
        h={RIG.pelvis.h}
        r={14}
        fill={colors.pants}
        shadow={colors.pantsShadow}
        light={l}
      />
      <g transform={`translate(${sol.torsoBase.x} ${sol.torsoBase.y}) rotate(${torsoAng}) scale(${torsoScale})`}>
        <ShadedRoundRect
          x={-torsoW / 2}
          y={-torsoLen}
          w={torsoW}
          h={torsoLen}
          r={RIG.torso.r}
          fill={colors.top}
          shadow={colors.topShadow}
          highlight={colors.topHighlight}
          light={torsoLight}
          shadowFrac={0.3}
          soft={6}
        />
        {outfit === 'hoodie' && showFront ? (
          <>
            {/* Pocket: trapezoid at the bottom center */}
            <path
              d={(() => {
                const pw = BODY.pocket.w * (0.4 + 0.6 * frontness);
                const ph = BODY.pocket.h;
                const px = frontShift;
                const yb = -10;
                return `M ${px - pw / 2} ${yb} L ${px + pw / 2} ${yb} L ${px + pw / 2 - 10} ${yb - ph} L ${px - pw / 2 + 10} ${yb - ph} Z`;
              })()}
              fill={C.hoodieShadow}
            />
            {/* Drawstrings */}
            {[-1, 1].map((s) => {
              const sx = s * 12 * c + frontShift * 0.95;
              const visible = s * sn * -1 > -0.6 || frontness > 0.5;
              return visible ? (
                <rect
                  key={s}
                  x={sx - BODY.drawstring.w / 2}
                  y={-(RIG.neck.from - RIG.torso.base) + 14}
                  width={BODY.drawstring.w}
                  height={BODY.drawstring.h}
                  rx={1.5}
                  fill={C.drawstring}
                />
              ) : null;
            })}
          </>
        ) : null}
        {outfit === 'hoodie' ? (
          // Hood ring around the neckline, 14 px thick.
          <ellipse
            cx={-dir * 14 * Math.abs(sn)}
            cy={-(RIG.neck.from - RIG.torso.base) + 4}
            rx={30 * frontness + 18 * Math.abs(sn)}
            ry={9}
            fill="none"
            stroke={C.hoodieShadow}
            strokeWidth={BODY.hoodRing}
          />
        ) : null}
      </g>
      {/* Neck */}
      <Capsule a={sol.neckBase} b={sol.neckTop} w={BODY.neck.w} fill={C.skinShadow} ext={4} />
      {outfit === 'hoodie' ? (
        // Front half of the hood ring sits over the neck.
        <path
          d={(() => {
            const cx = sol.neckBase.x - dir * 14 * Math.abs(sn);
            const cy = sol.neckBase.y + 4;
            const rx = 30 * frontness + 18 * Math.abs(sn);
            return `M ${cx - rx} ${cy} A ${rx} 9 0 0 0 ${cx + rx} ${cy}`;
          })()}
          fill="none"
          stroke={C.hoodieShadow}
          strokeWidth={BODY.hoodRing}
          opacity={frontness}
        />
      ) : null}
      <g transform={`translate(${sol.head.x} ${sol.head.y}) rotate(${headRoll + (face.headPitch * dir * Math.abs(sn))})`}>
        <Head yaw={yaw} face={face} light={lightInto(l, headRoll)} />
      </g>
      {backpack ? (
        // Strap over the right shoulder.
        <Capsule
          a={add(sol.arms.R.shoulder, { x: -8 * dir, y: -6 })}
          b={add(sol.torsoBase, { x: sol.arms.R.shoulder.x * 0.2 + 10, y: -30 })}
          w={22}
          fill="#353F33"
          ext={11}
        />
      ) : null}
    </g>
  );
  limbOrder.push({ key: 'body', depth: 0, node: body });

  limbOrder.sort((a, b) => a.depth - b.depth);

  return <g transform={`translate(${x} ${y}) scale(${scale})`}>{limbOrder.map((item) => item.node)}</g>;
};
