import { Easing } from 'remotion';
import { CarryHand } from '../character/Hands';
import { add, dirDeg, lerpPt, mul, type Pt } from '../character/shapes';
import { C, shade } from '../constants';
import { S1, SHOT_1 } from '../timeline';
import { quad, SceneSvg, tween, useShotFrame } from './common';

/**
 * Shot 1: Drawer (f0–59). Extreme close-up at nightstand height, static.
 * Key light: the lamp, upper right.
 */

const LIGHT = { x: 0.7, y: -0.7 };
const FRONT = { x0: 380, x1: 1540, y0: 600, y1: 940 };
const FRONT_CENTER = { x: 960, y: 770 };
const PHONE = { w: 260, h: 128, r: 22 };

/** Drawer state: front offset 120 → 0 and scale 1.04 → 1.0 over f30–45 (Easing.in(quad)). */
export const drawerState = (f: number) => {
  const offset = tween(f, S1.drawerClose, [120, 0], Easing.in(Easing.quad));
  return { offset, scale: 1 + 0.04 * (offset / 120) };
};

/** Phone center and rotation: arc from (1420, 420, −10°) to (960, 610, 0°), then an 8 px drop. */
export const phoneState = (f: number) => {
  const t = tween(f, S1.phoneArc, [0, 1]);
  const p = quad({ x: 1420, y: 420 }, { x: 1230, y: 330 }, { x: 960, y: 610 }, t);
  const drop = tween(f, S1.phoneDrop, [0, 8], Easing.in(Easing.quad));
  return { x: p.x, y: p.y + drop, rotation: -10 * (1 - t) };
};

/** A point fixed to the drawer front (given in its f-local closed coordinates), moved with it. */
const onFront = (local: Pt, f: number): Pt => {
  const { offset, scale } = drawerState(f);
  return { x: FRONT_CENTER.x + local.x * scale, y: FRONT_CENTER.y + offset + local.y * scale };
};

/** Hand placement for the frame: wrist, finger direction and curl. */
const handState = (f: number) => {
  const ph = phoneState(f);
  const rot = (v: Pt, deg: number): Pt => {
    const a = (deg * Math.PI) / 180;
    return { x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) };
  };
  // Carrying: palm over the phone's top edge, fingers draped down its back.
  const carryWrist = add({ x: ph.x, y: ph.y }, rot({ x: 70, y: -170 }, ph.rotation));
  const carryAngle = 96 + ph.rotation;
  // Released: fingers open and the hand lifts a little.
  const releaseLift = tween(f, S1.fingersOpen, [0, 26]);
  // Flat on the drawer front, palm centered at (1240, 720) at f32, fingers up and to the left.
  const flatAngle = -112;
  const palmToWrist = mul(dirDeg(flatAngle), -55);
  const { offset: off32, scale: s32 } = drawerState(S1.handToDrawer[1]);
  const palmLocal = { x: (1240 - FRONT_CENTER.x) / s32, y: (720 - FRONT_CENTER.y - off32) / s32 };
  const flatWrist = add(onFront(palmLocal, f), palmToWrist);

  if (f < S1.handToDrawer[0]) {
    return {
      wrist: { x: carryWrist.x, y: carryWrist.y - releaseLift },
      angle: carryAngle,
      curl: tween(f, S1.fingersOpen, [0.45, 0]),
    };
  }
  const releasedAt = handStateAt26();
  const t = tween(f, S1.handToDrawer, [0, 1]);
  const wrist = lerpPt(releasedAt.wrist, flatWrist, t);
  const angle = releasedAt.angle + (flatAngle - releasedAt.angle) * t;
  // Withdraw off-frame right, Easing.in(cubic).
  const out = tween(f, S1.handWithdraw, [0, 1], Easing.in(Easing.cubic));
  return { wrist: lerpPt(wrist, { x: 2350, y: 820 }, out), angle, curl: 0 };
};
const handStateAt26 = () => {
  const ph = phoneState(S1.phoneDrop[0]);
  return { wrist: { x: ph.x + 70, y: ph.y - 170 - 26 }, angle: 96 };
};

const Phone: React.FC<{ readonly glowId: string }> = ({ glowId }) => (
  <g>
    <rect
      x={-PHONE.w / 2 - 18}
      y={-PHONE.h / 2 - 18}
      width={PHONE.w + 36}
      height={PHONE.h + 36}
      rx={PHONE.r + 18}
      fill={C.screenGlow}
      opacity={0.4}
      filter={`url(#${glowId})`}
    />
    <rect x={-PHONE.w / 2} y={-PHONE.h / 2} width={PHONE.w} height={PHONE.h} rx={PHONE.r} fill={C.phoneBody} />
    <rect x={-PHONE.w / 2 + 3} y={-PHONE.h / 2 + 3} width={PHONE.w - 6} height={10} rx={5} fill={shade(C.phoneBody, 0.08)} />
    {/* Camera bump, three lenses, no logo */}
    <rect x={-PHONE.w / 2 + 16} y={-PHONE.h / 2 + 16} width={54} height={54} rx={14} fill={C.cameraBump} />
    {[
      { x: 13, y: 13 },
      { x: 13, y: 41 },
      { x: 41, y: 27 },
    ].map((l, i) => (
      <circle key={i} cx={-PHONE.w / 2 + 16 + l.x} cy={-PHONE.h / 2 + 16 + l.y} r={10} fill={C.lens} />
    ))}
  </g>
);

export const Shot01Drawer: React.FC = () => {
  const f = useShotFrame(SHOT_1.from);
  const { offset, scale } = drawerState(f);
  const ph = phoneState(f);
  const hand = handState(f);
  // 4 px camera shake on the thunk, decaying to 0 by f51.
  const shakeAmt = f >= S1.shake[0] ? tween(f, S1.shake, [4, 0], Easing.out(Easing.quad)) : 0;
  const shake = { x: shakeAmt * Math.sin(f * 2.7), y: shakeAmt * Math.cos(f * 3.3) };
  const cavityBottom = 560 + offset * (160 / 120);
  const masked = f >= S1.phoneDrop[0];
  const frontLight = shade(C.nightstand, 0.06);

  return (
    <SceneSvg background={C.wallNightOuter}>
      <defs>
        <radialGradient id="s1-wall" cx={1500} cy={220} r={1100} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={C.wallNightInner} />
          <stop offset={1} stopColor={C.wallNightOuter} />
        </radialGradient>
        <radialGradient id="s1-glow" cx={1550} cy={300} r={650} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={C.lampGlow} stopOpacity={0.35} />
          <stop offset={1} stopColor={C.lampGlow} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="s1-cabinet" x1={0} y1={0} x2={1920} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={C.nightstand} />
          <stop offset={1} stopColor={shade(C.nightstand, 0.06)} />
        </linearGradient>
        <linearGradient id="s1-front" x1={380} y1={0} x2={1540} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={frontLight} />
          <stop offset={1} stopColor={shade(frontLight, 0.05)} />
        </linearGradient>
        <filter id="s1-phoneglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
        <clipPath id="s1-cavity">
          <rect x={FRONT.x0} y={560} width={FRONT.x1 - FRONT.x0} height={Math.max(0, cavityBottom - 560)} />
        </clipPath>
      </defs>
      <g transform={`translate(${shake.x} ${shake.y})`}>
        {/* 1. Wall */}
        <rect x={-20} y={-20} width={1960} height={1120} fill="url(#s1-wall)" />
        {/* 2. Lamp, upper right */}
        <rect x={1520} y={330} width={60} height={190} fill={C.lampBase} />
        <rect x={1520} y={330} width={18} height={190} fill={shade(C.lampBase, -0.15)} />
        <path d="M 1440 140 L 1660 140 L 1710 330 L 1390 330 Z" fill={C.lampShadeOn} />
        <path d="M 1600 140 L 1660 140 L 1710 330 L 1640 330 Z" fill={shade(C.lampShadeOn, 0.08)} opacity={0.7} />
        <ellipse cx={1550} cy={330} rx={160} ry={16} fill={C.lampInnerGlow} />
        <rect x={-20} y={-20} width={1960} height={1120} fill="url(#s1-glow)" />
        {/* 3–4. Nightstand top and cabinet body */}
        <rect x={-20} y={560} width={1960} height={540} fill="url(#s1-cabinet)" />
        <rect x={-20} y={520} width={1960} height={40} fill={C.nightstandTop} />
        <rect x={-20} y={520} width={1960} height={3} fill={C.nightstandEdge} />
        <rect x={-20} y={556} width={1960} height={4} fill={shade(C.nightstandTop, -0.15)} />
        {/* 5. Drawer opening (dark band), then the phone inside it */}
        {cavityBottom > 560.5 ? (
          <rect x={FRONT.x0} y={560} width={FRONT.x1 - FRONT.x0} height={cavityBottom - 560} fill={C.drawerInside} />
        ) : null}
        <g clipPath={masked ? 'url(#s1-cavity)' : undefined}>
          <g transform={`translate(${ph.x} ${ph.y}) rotate(${ph.rotation})`}>
            <Phone glowId="s1-phoneglow" />
          </g>
        </g>
        {/* Drawer front with a 10 px bevel shadow and the knob */}
        <g transform={`translate(${FRONT_CENTER.x} ${FRONT_CENTER.y + offset}) scale(${scale}) translate(${-FRONT_CENTER.x} ${-FRONT_CENTER.y})`}>
          <rect x={FRONT.x0} y={FRONT.y0} width={FRONT.x1 - FRONT.x0} height={FRONT.y1 - FRONT.y0} fill="url(#s1-front)" />
          <rect
            x={FRONT.x0 + 5}
            y={FRONT.y0 + 5}
            width={FRONT.x1 - FRONT.x0 - 10}
            height={FRONT.y1 - FRONT.y0 - 10}
            fill="none"
            stroke={shade(C.nightstand, -0.15)}
            strokeWidth={10}
          />
          <rect x={FRONT.x0} y={FRONT.y0} width={FRONT.x1 - FRONT.x0} height={3} fill={C.nightstandEdge} opacity={0.6} />
          <circle cx={960} cy={770} r={26} fill={C.knob} />
          <path d="M 976 752 A 24 24 0 0 1 978 786 A 30 30 0 0 0 976 752 Z" fill={C.knobHighlight} />
          <circle cx={963} cy={775} r={26} fill="none" stroke={shade(C.knob, -0.2)} strokeWidth={2} opacity={0.5} />
        </g>
        {/* 7. The hand */}
        <CarryHand
          from={{ x: 2000, y: 300 + Math.max(0, hand.wrist.y - 500) * 0.6 }}
          wrist={hand.wrist}
          angle={hand.angle}
          curl={hand.curl}
          light={LIGHT}
        />
      </g>
    </SceneSvg>
  );
};
