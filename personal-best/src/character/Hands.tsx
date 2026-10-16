import { C, shade } from '../constants';
import {
  add,
  Capsule,
  D2R,
  dirDeg,
  lightInto,
  mul,
  norm,
  type Pt,
  ShadedRoundRect,
  sub,
  useSvgId,
} from './shapes';

/**
 * Large hands for shots 1, 5, 6 and 8 (section 5/7). All in scene px.
 */

/** Map a point from a hand's local frame (+x along the fingers) into the scene. */
const frame = (origin: Pt, angle: number) => {
  const ux = dirDeg(angle);
  const uy = dirDeg(angle + 90);
  return (p: Pt): Pt => add(origin, add(mul(ux, p.x), mul(uy, p.y)));
};

// ---------------------------------------------------------------------------
// Shot 1: right hand carrying the phone, then pushing the drawer
// ---------------------------------------------------------------------------

export type CarryHandProps = {
  /** Where the bare forearm comes from (off-frame right). */
  readonly from: Pt;
  readonly wrist: Pt;
  /** Direction the fingers point, degrees (screen). */
  readonly angle: number;
  /** 0 = fingers straight (open / flat on the drawer) … 1 = wrapped over the phone's edge. */
  readonly curl: number;
  readonly light: Pt;
};

/** About 3.4× the rig: palm 110×80, four fingers 24×70, thumb 26×60. Shadow on the left sides. */
export const CARRY = { palm: { l: 110, w: 80 }, finger: { w: 24, l: 70 }, thumb: { w: 26, l: 60 }, forearm: 92 } as const;

export const CarryHand: React.FC<CarryHandProps> = ({ from, wrist, angle, curl, light }) => {
  const T = frame(wrist, angle);
  const local = lightInto(light, angle);
  const knuckles = [-30, -10, 10, 30];
  const lengths = [0.92, 1, 0.96, 0.8];
  return (
    <g>
      <Capsule a={from} b={wrist} w={CARRY.forearm} fill={C.skin} shadow={C.skinShadow} highlight={C.skinHighlight} light={light} />
      {/* Thumb from the base of the palm */}
      {(() => {
        const base = T({ x: 34, y: 36 });
        const tip = T({ x: 34 + 50 * Math.cos((48 - 30 * curl) * D2R), y: 36 + 50 * Math.sin((48 - 30 * curl) * D2R) });
        return <Capsule a={base} b={tip} w={CARRY.thumb.w} fill={C.skin} shadow={C.skinShadow} highlight={C.skinHighlight} light={light} />;
      })()}
      <g transform={`translate(${wrist.x} ${wrist.y}) rotate(${angle})`}>
        <ShadedRoundRect
          x={0}
          y={-CARRY.palm.w / 2}
          w={CARRY.palm.l}
          h={CARRY.palm.w}
          r={30}
          fill={C.skin}
          shadow={C.skinShadow}
          highlight={C.skinHighlight}
          light={local}
          shadowFrac={0.3}
          soft={6}
        />
      </g>
      {/* Fingers: two segments; curling folds the tip segment under (shorter on screen) */}
      {knuckles.map((ky, i) => {
        const L = CARRY.finger.l * lengths[i];
        const k = T({ x: CARRY.palm.l - 10, y: ky });
        const bend1 = curl * 35;
        const mid = T({ x: CARRY.palm.l - 10 + L * 0.55 * Math.cos(bend1 * D2R), y: ky + L * 0.55 * Math.sin(bend1 * D2R) });
        const bend2 = curl * 85;
        const segAng = angle + bend1 + bend2 - bend1 * 0;
        const tipLen = L * 0.45 * (1 - 0.55 * curl);
        const tip = add(mid, mul(dirDeg(segAng), tipLen));
        return (
          <g key={i}>
            <Capsule a={k} b={mid} w={CARRY.finger.w} fill={C.skin} shadow={C.skinShadow} light={light} />
            <Capsule a={mid} b={tip} w={CARRY.finger.w - 1} fill={shade(C.skin, -0.03 * curl)} shadow={C.skinShadow} light={light} />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Shot 5: left hand fretting an F major barre chord
// ---------------------------------------------------------------------------

/** A point on the neck: `d` px from the nut along the neck, `a` px across it (+ toward the treble edge). */
export type NeckPt = { readonly d: number; readonly a: number };

export type FrettingHandProps = {
  /** Maps neck coordinates to scene px (shot 5 owns the neck geometry). */
  readonly at: (p: NeckPt) => Pt;
  readonly neckAngle: number;
  /** Half the fretboard width (60 for a 120 px fretboard). */
  readonly edge: number;
  /** Where the index barre lies (just behind fret 1), px from the nut. */
  readonly barreD: number;
  readonly tips: { readonly middle: NeckPt; readonly ring: NeckPt; readonly pinky: NeckPt };
  /** Index drop shadow offset (3 → 5 px as it presses harder). */
  readonly indexShadow: number;
  readonly light: Pt;
};

/**
 * Seen over the player's shoulder: the back of the hand sits beyond the
 * treble edge of the fretboard and the fingers arch up over it onto the
 * strings. Index: a capsule 26×150 across all six strings. Skin with
 * skinShadow at the knuckles.
 */
export const FrettingHand: React.FC<FrettingHandProps> = ({ at, neckAngle, edge, barreD, tips, indexShadow, light }) => {
  const blurId = useSvgId('fret-sh');
  const shadowOff = mul(norm({ x: -light.x, y: -light.y }), indexShadow);
  const knuckleA = edge + 18;
  const fingers = [
    { key: 'middle', knuckle: { d: barreD + 62, a: knuckleA }, tip: tips.middle },
    { key: 'ring', knuckle: { d: barreD + 122, a: knuckleA }, tip: tips.ring },
    { key: 'pinky', knuckle: { d: barreD + 178, a: knuckleA }, tip: tips.pinky },
  ];
  const palmCenter = at({ d: barreD + 92, a: edge + 78 });
  return (
    <g>
      <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={2.5} />
      </filter>
      {/* Back of the hand beyond the treble edge */}
      <g transform={`translate(${palmCenter.x} ${palmCenter.y}) rotate(${neckAngle})`}>
        <ShadedRoundRect x={-140} y={-66} w={280} h={140} r={62} fill={C.skin} shadow={C.skinShadow} highlight={C.skinHighlight} light={lightInto(light, neckAngle)} soft={6} />
      </g>
      {/* Fingertip shadows on the fretboard */}
      <g filter={`url(#${blurId})`}>
        {fingers.map((f) => (
          <circle key={f.key} cx={at(f.tip).x + shadowOff.x} cy={at(f.tip).y + shadowOff.y} r={12} fill="rgba(0,0,0,0.4)" />
        ))}
        <Capsule
          a={add(at({ d: barreD, a: -edge - 15 }), shadowOff)}
          b={add(at({ d: barreD, a: edge }), shadowOff)}
          w={26}
          fill="rgba(0,0,0,0.42)"
          ext={13}
        />
      </g>
      {/* Middle, ring and pinky arch from their knuckles onto the strings */}
      {fingers.map((f) => {
        const k = at(f.knuckle);
        const tip = at(f.tip);
        const mid = add(at({ d: (f.knuckle.d + f.tip.d) / 2 - 14, a: (f.knuckle.a + f.tip.a) / 2 + 6 }), { x: 0, y: 0 });
        return (
          <g key={f.key}>
            <Capsule a={k} b={mid} w={26} fill={C.skin} shadow={C.skinShadow} highlight={C.skinHighlight} light={light} />
            <Capsule a={mid} b={tip} w={23} fill={C.skin} shadow={C.skinShadow} highlight={C.skinHighlight} light={light} />
            <circle cx={mid.x} cy={mid.y} r={8} fill={C.skinShadow} opacity={0.6} />
            <circle cx={k.x} cy={k.y} r={9} fill={C.skinShadow} opacity={0.5} />
          </g>
        );
      })}
      {/* Index: base segment from its knuckle, then the barre across all six strings */}
      <Capsule a={at({ d: barreD + 8, a: knuckleA + 16 })} b={at({ d: barreD, a: edge })} w={27} fill={C.skin} shadow={C.skinShadow} light={light} />
      <Capsule
        a={at({ d: barreD, a: -edge - 15 + 13 })}
        b={at({ d: barreD, a: edge + 15 - 13 })}
        w={26}
        fill={C.skin}
        shadow={C.skinShadow}
        highlight={C.skinHighlight}
        light={light}
        ext={13}
      />
      <circle cx={at({ d: barreD, a: edge - 4 }).x} cy={at({ d: barreD, a: edge - 4 }).y} r={8} fill={C.skinShadow} opacity={0.6} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Shot 6: thumb tapping the phone
// ---------------------------------------------------------------------------

export type ThumbProps = {
  readonly tip: Pt;
  /** Direction from the base toward the tip, degrees. */
  readonly angle: number;
  readonly light: Pt;
};

/** Thumb capsule 70×170 entering from the lower right, with a nail; its base continues off-frame. */
export const Thumb: React.FC<ThumbProps> = ({ tip, angle, light }) => {
  const d = dirDeg(angle);
  const tipC = sub(tip, mul(d, 35));
  const base = sub(tipC, mul(d, 170 - 70));
  const nail = sub(tip, mul(d, 40));
  const side = dirDeg(angle + 90);
  return (
    <g>
      {/* Base of the thumb (thenar), running off-frame behind it */}
      <Capsule a={add(sub(base, mul(d, 420)), mul(side, 40))} b={add(base, mul(side, 22))} w={130} fill={C.skin} shadow={C.skinShadow} light={light} />
      <Capsule a={sub(base, mul(d, 60))} b={tipC} w={70} fill={C.skin} shadow={C.skinShadow} highlight={C.skinHighlight} light={light} />
      <g transform={`translate(${nail.x} ${nail.y}) rotate(${angle - 90})`}>
        <rect x={-21} y={-26} width={42} height={52} rx={18} fill={C.skinHighlight} />
        <rect x={-21} y={18} width={42} height={8} rx={4} fill={shade(C.skinHighlight, 0.12)} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Shot 8: right hand, index finger extended, other fingers curled
// ---------------------------------------------------------------------------

export type PointingHandProps = {
  /** Index fingertip, scene px. */
  readonly tip: Pt;
  /** Direction the index finger points, degrees (−90 = straight up). */
  readonly angle: number;
  readonly light: Pt;
};

/**
 * Hoodie-sleeve forearm, skin hand, index extended, other fingers curled
 * (palm toward camera: the folded fingertips and the thumb cross the palm).
 */
export const PointingHand: React.FC<PointingHandProps> = ({ tip, angle, light }) => {
  const back = angle + 180; // local +x runs from the fingertip back toward the wrist
  const T = frame(tip, back);
  const local = lightInto(light, back);
  const wrist = T({ x: 540, y: 40 });
  const elbow = T({ x: 1600, y: 120 });
  return (
    <g>
      {/* Sleeve and cuff */}
      <Capsule a={elbow} b={wrist} w={250} fill={C.hoodie} shadow={C.hoodieShadow} highlight={C.hoodieHighlight} light={light} />
      <Capsule a={T({ x: 580, y: 42 })} b={T({ x: 540, y: 40 })} w={256} fill={C.hoodieShadow} ext={128} />
      <g transform={`translate(${tip.x} ${tip.y}) rotate(${back})`}>
        {/* Palm with the curled fingers folded into it */}
        <ShadedRoundRect x={200} y={-62} w={330} h={220} r={96} fill={C.skin} shadow={C.skinShadow} highlight={C.skinHighlight} light={local} soft={12} />
        {/* Folded fingertips: three rounded pads with creases */}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={196} y={-6 + i * 52} width={104} height={50} rx={25} fill={shade(C.skin, -0.04)} />
            <path d={`M ${270} ${-2 + i * 52} Q ${258} ${19 + i * 52} ${270} ${40 + i * 52}`} stroke={C.skinShadow} strokeWidth={6} fill="none" strokeLinecap="round" />
          </g>
        ))}
        {/* Thumb crossing over the folded fingers */}
        <g transform="rotate(-24 420 -10)">
          <ShadedRoundRect x={250} y={-40} w={230} h={66} r={33} fill={C.skin} shadow={C.skinShadow} highlight={C.skinHighlight} light={lightInto(local, -24)} shadowFrac={0.4} />
          <rect x={256} y={-30} width={50} height={46} rx={18} fill={C.skinHighlight} />
        </g>
      </g>
      {/* Index finger, fully extended */}
      <Capsule a={T({ x: 270, y: -8 })} b={T({ x: 32, y: 0 })} w={64} fill={C.skin} shadow={C.skinShadow} highlight={C.skinHighlight} light={light} ext={32} />
      <circle cx={T({ x: 150, y: -3 }).x} cy={T({ x: 150, y: -3 }).y} r={8} fill={C.skinShadow} opacity={0.45} />
      <circle cx={T({ x: 75, y: -1 }).x} cy={T({ x: 75, y: -1 }).y} r={6} fill={C.skinShadow} opacity={0.35} />
    </g>
  );
};
