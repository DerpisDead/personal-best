import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { AudioTrack } from '../audio/AudioTrack';
import { PointingHand } from '../character/Hands';
import { Hud } from '../hud/Hud';
import { PersonalBest } from '../hud/PersonalBest';
import { EndCard } from '../overlays/EndCard';
import { Grain } from '../overlays/Grain';
import { Vignette } from '../overlays/Vignette';
import { WhyLine } from '../overlays/WhyLine';
import { Scenes } from '../scenes/Scenes';
import { fingerAngle, fingertip } from '../scenes/Shot08CloseUpSwipe';
import { DURATION, F_CTA, F_WHY_LINE, OVERLAYS, S8, SHOT_8 } from '../timeline';
import type { VideoProps } from '../Video';
import { cropLeft, V_SCALE } from './reframe';

/** The 16:9 shots, scaled to fill the height and cropped around each shot's focus x. */
const Reframed: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transformOrigin: '0 0',
          scale: String(V_SCALE),
          translate: `${-cropLeft(frame) * V_SCALE}px 0px`,
        }}
      >
        <Scenes vertical />
      </div>
    </AbsoluteFill>
  );
};

/**
 * Shot 8's hand in screen space (section 10): the fingertip runs from
 * (1300, 2100) to the middle of the HUD panel's left edge, then straight
 * right, dragging the HUD off-screen. Drawn at the same on-screen size as
 * the 16:9 hand (at the reframed scene's 1.78× it would cover his face).
 */
const ScreenSpaceHand: React.FC = () => {
  const frame = useCurrentFrame() + SHOT_8.from;
  if (frame < S8.handEnter[0]) return null;
  const tip = fingertip(frame, 'vertical', { x: 1300, y: 2100 }, { x: 1500, y: 2350 }, 1080);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <PointingHand tip={tip} angle={fingerAngle(frame) + 6} light={{ x: -1, y: -0.25 }} />
      </svg>
    </AbsoluteFill>
  );
};

/** The 9:16 PSA (section 10). Same layer order as the 16:9 version. */
export const PersonalBestVertical: React.FC<VideoProps> = ({ clickTrack }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      <Reframed />
      <Sequence name="Shot 8 hand (screen space)" from={SHOT_8.from} durationInFrames={SHOT_8.durationInFrames} premountFor={fps}>
        <ScreenSpaceHand />
      </Sequence>
      <Vignette />
      <Grain />
      <Sequence name="Why-line" from={F_WHY_LINE} durationInFrames={OVERLAYS.whyLineEnd - F_WHY_LINE} premountFor={fps}>
        <WhyLine layout="vertical" />
      </Sequence>
      <Sequence name="End card" from={F_CTA} durationInFrames={DURATION - F_CTA} premountFor={fps}>
        <EndCard layout="vertical" />
      </Sequence>
      <Hud layout="vertical" />
      <PersonalBest layout="vertical" />
      <AudioTrack clickTrack={clickTrack} />
    </AbsoluteFill>
  );
};
