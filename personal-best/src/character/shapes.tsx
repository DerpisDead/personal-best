import { useId } from 'react';

/**
 * Shared drawing primitives for the character: shaded capsules, ellipses and
 * rounded rects, plus 2D vector helpers and two-bone IK.
 *
 * Shading follows section 4/5: one shadow tone on the side away from the key
 * light and one highlight tone toward it. `light` is a unit vector in screen
 * space pointing toward the key light (e.g. {x: -1, y: -0.3} = upper left).
 */

export type Pt = { readonly x: number; readonly y: number };

export const D2R = Math.PI / 180;
export const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k });
export const len = (a: Pt) => Math.hypot(a.x, a.y);
export const norm = (a: Pt): Pt => {
  const l = len(a) || 1;
  return { x: a.x / l, y: a.y / l };
};
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
/** Unit vector at `deg` degrees, screen convention (0 = +x, 90 = +y/down). */
export const dirDeg = (deg: number): Pt => ({ x: Math.cos(deg * D2R), y: Math.sin(deg * D2R) });
export const angleOf = (v: Pt) => Math.atan2(v.y, v.x) / D2R;

/**
 * Two-bone IK in the picture plane. Returns the middle joint for a chain from
 * `root` to `target` with bone lengths l1 and l2. `bend` = +1 / −1 picks the
 * side the joint bends toward (clockwise / counter-clockwise of root→target).
 * Targets out of reach are clamped so the chain ends fully extended.
 */
export const ikJoint = (root: Pt, target: Pt, l1: number, l2: number, bend: 1 | -1): Pt => {
  const d = Math.min(len(sub(target, root)), (l1 + l2) * 0.9999);
  const base = angleOf(sub(target, root));
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * Math.max(d, 1e-6));
  const a = Math.acos(Math.max(-1, Math.min(1, cosA))) / D2R;
  return add(root, mul(dirDeg(base + bend * a), l1));
};

/** Stable SVG id from React's useId (which may contain characters invalid in url()). */
export const useSvgId = (prefix: string) => `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

/** Signed light amount on a side whose outward normal is `n`, mapped to −1..1. */
const sideLight = (n: Pt, light: Pt) => Math.max(-1, Math.min(1, (n.x * light.x + n.y * light.y) / 0.35));

type CapsuleProps = {
  readonly a: Pt;
  readonly b: Pt;
  readonly w: number;
  readonly fill: string;
  readonly shadow?: string;
  readonly highlight?: string;
  readonly light?: Pt;
  /** How far the rounded ends reach past a and b (default w/2: caps centered on the joints). */
  readonly ext?: number;
  readonly opacity?: number;
};

/**
 * A capsule from joint a to joint b. Section 5 limb shading: a strip 35% of the
 * width in the shadow tone on the side away from the light and a 15% strip in
 * the highlight tone toward it. Strips shrink smoothly to nothing as the light
 * lines up with the limb, so swinging limbs never flicker.
 */
export const Capsule: React.FC<CapsuleProps> = ({ a, b, w, fill, shadow, highlight, light, ext, opacity }) => {
  const id = useSvgId('cap');
  const v = sub(b, a);
  const L = len(v);
  const ang = angleOf(v);
  const e = ext ?? w / 2;
  // Local +x after rotate(ang − 90) is screen (sin ang, −cos ang).
  const t = light ? sideLight({ x: Math.sin(ang * D2R), y: -Math.cos(ang * D2R) }, light) : 0;
  const shadowW = 0.35 * w * Math.abs(t);
  const highW = 0.15 * w * Math.abs(t);
  const shadowX = t >= 0 ? -w / 2 : w / 2 - shadowW;
  const highX = t >= 0 ? w / 2 - highW : -w / 2;

  return (
    <g transform={`translate(${a.x} ${a.y}) rotate(${ang - 90})`} opacity={opacity}>
      <clipPath id={id}>
        <rect x={-w / 2} y={-e} width={w} height={L + 2 * e} rx={Math.min(w / 2, (L + 2 * e) / 2)} />
      </clipPath>
      <rect x={-w / 2} y={-e} width={w} height={L + 2 * e} rx={Math.min(w / 2, (L + 2 * e) / 2)} fill={fill} />
      {light && (shadow || highlight) ? (
        <g clipPath={`url(#${id})`}>
          {shadow && shadowW > 0.01 ? (
            <rect x={shadowX} y={-e} width={shadowW} height={L + 2 * e} fill={shadow} />
          ) : null}
          {highlight && highW > 0.01 ? (
            <rect x={highX} y={-e} width={highW} height={L + 2 * e} fill={highlight} />
          ) : null}
        </g>
      ) : null}
    </g>
  );
};

type ShapeRender = (p: { readonly dx: number; readonly dy: number; readonly fill: string }) => React.ReactElement;

type ShadedProps = {
  /** Draws the shape offset by (dx, dy) in the given fill. */
  readonly shape: ShapeRender;
  /** Extent of the shape measured along the light direction. */
  readonly extent: number;
  readonly fill: string;
  readonly shadow: string;
  readonly highlight?: string;
  readonly light: Pt;
  readonly shadowFrac?: number;
  readonly highlightFrac?: number;
  /** Blur radius (px) for the tone edges: soft gradient shading instead of hard crescents. */
  readonly soft?: number;
};

/**
 * Generic shading for a closed shape: base fill, a shadow crescent on the far
 * side from the light and a thin highlight crescent on the near side.
 */
export const Shaded: React.FC<ShadedProps> = ({
  shape,
  extent,
  fill,
  shadow,
  highlight,
  light,
  shadowFrac = 0.35,
  highlightFrac = 0.15,
  soft = 0,
}) => {
  const clipId = useSvgId('shc');
  const maskId = useSvgId('shm');
  const blurId = useSvgId('shb');
  const l = norm(light);
  const s = extent * shadowFrac;
  const h = extent * highlightFrac;
  const filter = soft > 0 ? `url(#${blurId})` : undefined;
  return (
    <g>
      {soft > 0 ? (
        <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={soft} />
        </filter>
      ) : null}
      <clipPath id={clipId}>{shape({ dx: 0, dy: 0, fill: '#000' })}</clipPath>
      {shape({ dx: 0, dy: 0, fill: shadow })}
      <g clipPath={`url(#${clipId})`}>
        <g filter={filter}>{shape({ dx: l.x * s, dy: l.y * s, fill })}</g>
        {highlight ? (
          <>
            <mask id={maskId} maskUnits="userSpaceOnUse" x={-1e4} y={-1e4} width={2e4} height={2e4}>
              <rect x={-1e4} y={-1e4} width={2e4} height={2e4} fill="#fff" />
              <g filter={filter}>{shape({ dx: -l.x * h, dy: -l.y * h, fill: '#000' })}</g>
            </mask>
            <g mask={`url(#${maskId})`}>{shape({ dx: 0, dy: 0, fill: highlight })}</g>
          </>
        ) : null}
      </g>
    </g>
  );
};

type EllipseProps = {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly fill: string;
  readonly shadow: string;
  readonly highlight?: string;
  readonly light: Pt;
  readonly shadowFrac?: number;
  readonly highlightFrac?: number;
  readonly soft?: number;
};

export const ShadedEllipse: React.FC<EllipseProps> = ({ cx, cy, rx, ry, light, ...rest }) => {
  const l = norm(light);
  return (
    <Shaded
      {...rest}
      light={l}
      extent={2 * Math.hypot(rx * l.x, ry * l.y)}
      shape={({ dx, dy, fill }) => <ellipse cx={cx + dx} cy={cy + dy} rx={rx} ry={ry} fill={fill} />}
    />
  );
};

type RoundRectProps = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly r: number;
  readonly fill: string;
  readonly shadow: string;
  readonly highlight?: string;
  readonly light: Pt;
  readonly shadowFrac?: number;
  readonly highlightFrac?: number;
  readonly soft?: number;
};

export const ShadedRoundRect: React.FC<RoundRectProps> = ({ x, y, w, h, r, light, ...rest }) => {
  const l = norm(light);
  return (
    <Shaded
      {...rest}
      light={l}
      extent={Math.abs(w * l.x) + Math.abs(h * l.y)}
      shape={({ dx, dy, fill }) => (
        <rect x={x + dx} y={y + dy} width={w} height={h} rx={Math.min(r, w / 2, h / 2)} fill={fill} />
      )}
    />
  );
};

/** Rotate a screen-space light vector into a group rotated by `deg`. */
export const lightInto = (light: Pt, deg: number): Pt => {
  const c = Math.cos(-deg * D2R);
  const s = Math.sin(-deg * D2R);
  return { x: light.x * c - light.y * s, y: light.x * s + light.y * c };
};
