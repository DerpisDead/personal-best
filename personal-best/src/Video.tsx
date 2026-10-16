import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { Hud } from './hud/Hud';
import { PersonalBest } from './hud/PersonalBest';
import { EndCard } from './overlays/EndCard';
import { Grain } from './overlays/Grain';
import { Vignette } from './overlays/Vignette';
import { WhyLine } from './overlays/WhyLine';
import { Scenes } from './scenes/Scenes';
import { DURATION, OVERLAYS, F_CTA, F_WHY_LINE } from './timeline';

export type VideoProps = {
  /** Plays TEMP_click-track.wav for checking sync (section 9). */
  readonly clickTrack: boolean;
};

/**
 * The 16:9 PSA. Finishing layers in section 4's z-order:
 * scene art → vignette → grain → why-line / end card → HUD / PERSONAL BEST.
 */
export const PersonalBestVideo: React.FC<VideoProps> = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      <Scenes />
      <Vignette />
      <Grain />
      <Sequence name="Why-line" from={F_WHY_LINE} durationInFrames={OVERLAYS.whyLineEnd - F_WHY_LINE} premountFor={fps}>
        <WhyLine layout="landscape" />
      </Sequence>
      <Sequence name="End card" from={F_CTA} durationInFrames={DURATION - F_CTA} premountFor={fps}>
        <EndCard layout="landscape" />
      </Sequence>
      <Hud layout="landscape" />
      <PersonalBest layout="landscape" />
    </AbsoluteFill>
  );
};
