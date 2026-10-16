import { Easing } from 'remotion';
import { tween } from '../scenes/common';
import { orangeAt, t3 } from '../scenes/Shot03KitchenMorning';
import { runnerAt } from '../scenes/Shot04StadiumSteps';
import { shot7ScreenX } from '../scenes/Shot07KitchenWalk';
import { S4, SHOT_2, SHOT_3, SHOT_4, SHOT_5, SHOT_6, SHOT_7, SHOT_8, SHOT_9, SHOT_10, VERTICAL } from '../timeline';

/**
 * Section 10 reframing: each 1920×1080 shot is scaled by 1920/1080 to fill
 * the 1920 px height, and a 607.5 px wide window is cropped around a focus x.
 */
export const V_SCALE = 1920 / 1080;
export const V_VISIBLE = 1080 / V_SCALE; // 607.5 design px

/** Focus x (16:9 design coordinates) per shot. */
export const focusX = (f: number): number => {
  if (f < SHOT_2.from) return tween(f, VERTICAL.shot1Focus, [1300, 1000]);
  if (f < SHOT_3.from) return 960;
  if (f < SHOT_4.from) {
    // 700 at f160 → 1200 at f195, following the orange, then 1100.
    if (f <= VERTICAL.shot3Focus[1]) {
      const follow = tween(f, VERTICAL.shot3Focus, [0, 1], Easing.linear);
      const orange = Math.min(1200, Math.max(700, orangeAt(t3(f)).x));
      const eased = tween(f, VERTICAL.shot3Focus, [700, 1200]);
      return follow <= 0 ? 700 : (orange + eased) / 2;
    }
    return tween(f, VERTICAL.shot3Settle, [1200, 1100]);
  }
  if (f < SHOT_5.from) {
    // The runner's x, plus the whip-pan offset while it lands.
    const whip = tween(f, S4.whipIn, [1400, 0], Easing.out(Easing.cubic));
    return runnerAt(f).x + 40 + whip;
  }
  if (f < SHOT_6.from) return 600;
  if (f < SHOT_7.from) return 980;
  if (f < SHOT_8.from) return shot7ScreenX(f);
  if (f < SHOT_9.from) return 900;
  if (f < SHOT_10.from) return 900;
  return 1240;
};

/** Left edge of the crop window, clamped so the crop never leaves the art. */
export const cropLeft = (f: number) => Math.min(1920 - V_VISIBLE, Math.max(0, focusX(f) - V_VISIBLE / 2));
