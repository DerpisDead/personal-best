import { Easing, interpolate, useCurrentFrame, type EasingFunction } from 'remotion';
import type { Pt } from '../character/shapes';

/** Default easing (section 0): Easing.inOut(Easing.cubic). */
export const ease = Easing.inOut(Easing.cubic);

/**
 * Clamped interpolation over a frame range with the default easing.
 * `range` is a pair of keyframes like `[30, 45]` from timeline.ts.
 */
export const tween = (
  f: number,
  range: readonly number[],
  out: readonly number[],
  easing: EasingFunction = ease,
) =>
  interpolate(f, range as number[], out as number[], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const tweenPt = (f: number, range: readonly number[], a: Pt, b: Pt, easing: EasingFunction = ease): Pt => ({
  x: tween(f, range, [a.x, b.x], easing),
  y: tween(f, range, [a.y, b.y], easing),
});

/** Absolute composition frame inside a shot's <Sequence>. */
export const useShotFrame = (from: number) => useCurrentFrame() + from;

/**
 * Handheld camera (section 4), t in seconds:
 * x = A·sin(2π·0.7t + 1.3) + 0.5A·sin(2π·1.9t)
 * y = A·sin(2π·0.9t + 0.4) + 0.5A·sin(2π·2.3t + 2.1)
 * rotation = 0.15·sin(2π·0.5t) degrees
 */
export const handheld = (frame: number, A: number) => {
  const t = frame / 30;
  const TAU = Math.PI * 2;
  return {
    x: A * Math.sin(TAU * 0.7 * t + 1.3) + 0.5 * A * Math.sin(TAU * 1.9 * t),
    y: A * Math.sin(TAU * 0.9 * t + 0.4) + 0.5 * A * Math.sin(TAU * 2.3 * t + 2.1),
    rotation: 0.15 * Math.sin(TAU * 0.5 * t),
  };
};

/** SVG transform string for a handheld offset, rotating around the frame center. */
export const handheldTransform = (frame: number, A: number) => {
  const h = handheld(frame, A);
  return `translate(${h.x} ${h.y}) rotate(${h.rotation} 960 540)`;
};

/** Quadratic Bézier point. */
export const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => ({
  x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
});

type SceneSvgProps = {
  readonly children: React.ReactNode;
  readonly background?: string;
};

/** A 1920×1080 SVG scene in the design space. */
export const SceneSvg: React.FC<SceneSvgProps> = ({ children, background }) => (
  <svg
    width={1920}
    height={1080}
    viewBox="0 0 1920 1080"
    style={{ position: 'absolute', left: 0, top: 0, backgroundColor: background, overflow: 'hidden' }}
  >
    {children}
  </svg>
);

type WhipBlurProps = {
  readonly id: string;
  /** Horizontal blur stdDeviation (section 4: stdDeviation="X 0"). */
  readonly amount: number;
  readonly children: React.ReactNode;
};

/** Horizontal-only Gaussian blur over the whole scene group, used for the whip-pan. */
export const WhipBlur: React.FC<WhipBlurProps> = ({ id, amount, children }) => {
  if (amount <= 0.01) return <g>{children}</g>;
  return (
    <g>
      <filter id={id} x="-10%" y="0%" width="120%" height="100%" filterUnits="objectBoundingBox">
        <feGaussianBlur stdDeviation={`${amount} 0`} edgeMode="duplicate" />
      </filter>
      <g filter={`url(#${id})`}>{children}</g>
    </g>
  );
};

/** Soft blur filter definition; reference with url(#id). */
export const BlurDef: React.FC<{ readonly id: string; readonly amount: number }> = ({ id, amount }) => (
  <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation={amount} />
  </filter>
);

/** A simple handset glyph (original), centered on (0, 0), about 44 px wide. */
export const HandsetGlyph: React.FC<{ readonly fill: string; readonly rotate?: number }> = ({ fill, rotate = 0 }) => (
  <path
    transform={`rotate(${rotate})`}
    d="M -20 -6 C -20 -14 -14 -16 -9 -16 L -5 -16 C -2 -16 -1 -14 -1 -11 L -1 -6 C -1 -3 -4 -2 -7 -2 L -9 -2
       C -9 6 -6 10 2 10 L 2 8 C 2 5 4 3 7 3 L 12 3 C 15 3 16 5 16 8 L 16 12 C 16 17 13 21 6 21
       C -10 21 -20 10 -20 -6 Z"
    fill={fill}
  />
);
