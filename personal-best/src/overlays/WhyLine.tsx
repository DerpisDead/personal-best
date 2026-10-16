import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { C, T } from '../constants';
import type { HudLayout } from '../hud/Hud';
import { ease } from '../scenes/common';
import { WHY_LINE } from '../teamText';
import { OVERLAYS } from '../timeline';
import { PlaceholderWarning, WHY_LINE_OK } from './PlaceholderWarning';

const POS = {
  landscape: { left: 120, bottom: 178, maxWidth: 1100, sourceBottom: 130 },
  // Spec max-width 900 would reach x 964, inside the right-side safe zone; 876 stops at x 940.
  vertical: { left: 64, bottom: 520, maxWidth: 876, sourceBottom: 470 },
} as const;

/**
 * Why-line (section 8), f675–764, in shot 9. Rendered inside a <Sequence>
 * starting at f675, so the local frame 0 is the entrance.
 */
export const WhyLine: React.FC<{ readonly layout: HudLayout }> = ({ layout }) => {
  const frame = useCurrentFrame();
  const inFrames = OVERLAYS.whyLineIn[1] - OVERLAYS.whyLineIn[0];
  const opacity = interpolate(frame, [0, inFrames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const y = interpolate(frame, [0, inFrames], [16, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const p = POS[layout];
  return (
    <AbsoluteFill style={{ opacity, translate: `0px ${y}px` }}>
      {/* Scrim: from C.scrim at the bottom edge to transparent 380 px up */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: layout === 'vertical' ? 380 + p.bottom - 178 : 380,
          background: `linear-gradient(to top, ${C.scrim}, rgba(0,0,0,0))`,
        }}
      />
      <div style={{ position: 'absolute', left: p.left, bottom: p.bottom, maxWidth: p.maxWidth }}>
        {WHY_LINE_OK ? (
          <div style={T.whyLine}>{WHY_LINE.trim()}</div>
        ) : (
          <PlaceholderWarning>WHY-LINE: team writes this (max 7 words)</PlaceholderWarning>
        )}
      </div>
      <div style={{ ...T.sourceTag, position: 'absolute', left: p.left, bottom: p.sourceBottom }}>Lancet Commission, 2024</div>
    </AbsoluteFill>
  );
};
