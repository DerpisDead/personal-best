import { AbsoluteFill } from 'remotion';
import { Hud } from './hud/Hud';
import { PersonalBest } from './hud/PersonalBest';
import { Grain } from './overlays/Grain';
import { Vignette } from './overlays/Vignette';
import { Scenes } from './scenes/Scenes';

export type VideoProps = {
  /** Plays TEMP_click-track.wav for checking sync (section 9). */
  readonly clickTrack: boolean;
};

/**
 * The 16:9 PSA. Finishing layers in section 4's z-order:
 * scene art → vignette → grain → why-line / end card → HUD / PERSONAL BEST.
 */
export const PersonalBestVideo: React.FC<VideoProps> = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      <Scenes />
      <Vignette />
      <Grain />
      <Hud layout="landscape" />
      <PersonalBest layout="landscape" />
    </AbsoluteFill>
  );
};
