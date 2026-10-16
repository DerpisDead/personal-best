import { Easing, random } from 'remotion';
import { CloseUpFace } from '../character/CloseUpFace';
import { PointingHand } from '../character/Hands';
import type { Pt } from '../character/shapes';
import { C } from '../constants';
import { hudSwipeOffset, hudTouchPoint, type HudLayout } from '../hud/Hud';
import { S8, SHOT_8 } from '../timeline';
import { BlurDef, SceneSvg, tween, tweenPt, useShotFrame } from './common';

/**
 * Shot 8: Close-up and swipe (f525–599). Eye level, static.
 * Key light warm from the left; cool rim on the right.
 */

const LIGHT = { x: -1, y: -0.25 };

/**
 * Fingertip position for the swipe, in the screen pixels of the given layout.
 * f560–570 it enters to the middle of the HUD panel's left edge (ease out),
 * f570–585 it moves straight right, dragging the HUD (same curve as the HUD),
 * f585–599 the hand drops out to the bottom right (Easing.in(quad)).
 */
export const fingertip = (f: number, layout: HudLayout, enter: Pt, exit: Pt, canvasWidth: number): Pt => {
  const touch = hudTouchPoint(layout, canvasWidth);
  if (f < S8.swipe[0]) return tweenPt(f, S8.handEnter, enter, touch, Easing.out(Easing.cubic));
  const swiped = { x: touch.x + hudSwipeOffset(f), y: touch.y };
  if (f <= S8.handDrop[0]) return swiped;
  const end = { x: touch.x + hudSwipeOffset(S8.handDrop[0]), y: touch.y };
  return tweenPt(f, S8.handDrop, end, exit, Easing.in(Easing.quad));
};

/** Pointing angle: up and a little left on the way in, more upright in the swipe, tipping over as it drops. */
export const fingerAngle = (f: number) =>
  f < S8.swipe[0] ? -104 : f < S8.handDrop[0] ? tween(f, S8.swipe, [-104, -96]) : tween(f, S8.handDrop, [-96, -60]);

const BOKEH = Array.from({ length: 9 }, (_, i) => ({
  x: 80 + random(`bokeh-x-${i}`) * 1760,
  y: 60 + random(`bokeh-y-${i}`) * 900,
  r: 40 + random(`bokeh-r-${i}`) * 70,
  o: 0.15 + random(`bokeh-o-${i}`) * 0.1,
  c: i % 2 === 0 ? C.bokehA : C.bokehB,
}));

type Shot08Props = {
  /** The vertical version draws the hand in screen space instead (section 10). */
  readonly showHand?: boolean;
};

export const Shot08CloseUpSwipe: React.FC<Shot08Props> = ({ showHand = true }) => {
  const f = useShotFrame(SHOT_8.from);
  // Eyes: up and right at the timer, then back down and left toward the phone.
  const back = tween(f, [S8.handDrop[0], S8.handDrop[0] + 8], [0, 1]);
  const pupilX = 12 + (-10 - 12) * back;
  const pupilY = -14 + (12 + 14) * back;
  const exhale = tween(f, S8.exhale, [0, 1]);
  const blink = f >= S8.blink[0] && f <= S8.blink[1] ? Math.sin(((f - S8.blink[0]) / (S8.blink[1] - S8.blink[0])) * Math.PI) : 0;
  const smile = tween(f, S8.smile, [0, 6]);
  const tip = fingertip(f, 'landscape', { x: 1500, y: 1200 }, { x: 2150, y: 1450 }, 1920);

  return (
    <SceneSvg background={C.cuBgBottom}>
      <defs>
        <linearGradient id="s8-bg" x1={0} y1={0} x2={0} y2={1080} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={C.cuBgTop} />
          <stop offset={1} stopColor={C.cuBgBottom} />
        </linearGradient>
        <BlurDef id="s8-bokeh" amount={20} />
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#s8-bg)" />
      <g filter="url(#s8-bokeh)">
        {BOKEH.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={b.c} opacity={b.o} />
        ))}
      </g>
      <CloseUpFace
        pupilX={pupilX}
        pupilY={pupilY}
        browDrop={4 * exhale}
        browFlat={exhale}
        blink={blink}
        smile={smile}
        shoulderDrop={8 * exhale}
      />
      {showHand && f >= S8.handEnter[0] ? <PointingHand tip={tip} angle={fingerAngle(f)} light={LIGHT} /> : null}
    </SceneSvg>
  );
};
