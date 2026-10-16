import { Easing, interpolate } from 'remotion';
import { C, HUD_SIZE } from '../constants';
import { HUD } from '../timeline';

/**
 * Overshooting fill pop: scale 0.6 → 1.25 → 1.0 within 9 frames (section 6).
 * The peak lands on frame 4 of the 9 (chosen; the spec gives no peak frame).
 */
export const pipPop = (framesSinceFill: number) =>
  interpolate(framesSinceFill, [0, 4, HUD.pipSpringFrames], [0.6, 1.25, 1.0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

type PipsProps = {
  /** Current frame, on the same clock as `fillFrames`. */
  readonly frame: number;
  /** Frame at which each of the five pips fills; null = stays empty. */
  readonly fillFrames: readonly (number | null)[];
};

/** Five 16 px pips, gap 10 px, right-aligned by the parent. */
export const Pips: React.FC<PipsProps> = ({ frame, fillFrames }) => {
  return (
    <div style={{ display: 'flex', gap: HUD_SIZE.pipGap }}>
      {fillFrames.map((fillAt, i) => {
        const filled = fillAt !== null && frame >= fillAt;
        return (
          <div
            key={i}
            style={{
              width: HUD_SIZE.pip,
              height: HUD_SIZE.pip,
              boxSizing: 'border-box',
              borderRadius: '50%',
              border: `${HUD_SIZE.pipStroke}px solid ${filled ? C.gold : C.pipEmptyStroke}`,
              backgroundColor: filled ? C.gold : 'transparent',
              boxShadow: filled ? '0 0 12px rgba(245,197,66,0.6)' : 'none',
              scale: filled ? String(pipPop(frame - fillAt)) : '1',
            }}
          />
        );
      })}
    </div>
  );
};
