import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { C, T } from '../constants';
import type { HudLayout } from '../hud/Hud';
import { ease } from '../scenes/common';
import { CHAPTER_NAME, CTA_LINE } from '../teamText';
import { OVERLAYS } from '../timeline';
import { CHAPTER_OK, CTA_LINE_OK, PlaceholderWarning } from './PlaceholderWarning';

const POS = {
  landscape: { ctaTop: 820, creditTop: 930, maxWidth: 1600 },
  // Spec max-width is 940; centered text that wide would reach x 1010, inside
  // the right-side platform-button zone (x > 940, y 900–1700). 800 keeps it clear.
  vertical: { ctaTop: 1180, creditTop: 1300, maxWidth: 800 },
} as const;

/**
 * End card text (section 8): call to action and credit line, entering at
 * f795. Rendered inside a <Sequence> starting at f795.
 */
export const EndCard: React.FC<{ readonly layout: HudLayout }> = ({ layout }) => {
  const frame = useCurrentFrame();
  const inFrames = OVERLAYS.endCardIn[1] - OVERLAYS.endCardIn[0];
  const opacity = interpolate(frame, [0, inFrames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const y = interpolate(frame, [0, inFrames], [14, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const p = POS[layout];
  const centered: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    translate: `-50% ${y}px`,
    width: 'max-content',
    maxWidth: p.maxWidth,
    textAlign: 'center',
  };
  return (
    <AbsoluteFill style={{ opacity }}>
      <div style={{ ...centered, top: p.ctaTop }}>
        {CTA_LINE_OK ? (
          <div style={{ ...T.cta, lineHeight: 1.1 }}>{CTA_LINE.trim()}</div>
        ) : (
          <PlaceholderWarning>CTA: team writes this (max 5 words)</PlaceholderWarning>
        )}
      </div>
      <div style={{ ...centered, ...T.credit, top: p.creditTop, lineHeight: 1.3 }}>
        {'Habits: Hilarity for Charity · wearehfc.org · '}
        {CHAPTER_OK ? CHAPTER_NAME.trim() : <span style={{ color: C.warning, opacity: 1 }}>[CHAPTER]</span>}
        {' HOSA'}
      </div>
    </AbsoluteFill>
  );
};
