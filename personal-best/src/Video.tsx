import { AbsoluteFill } from 'remotion';

export type VideoProps = {
  readonly clickTrack: boolean;
};

/** The 16:9 PSA. Scenes, finishing layers, text, HUD and audio are added per milestone. */
export const PersonalBestVideo: React.FC<VideoProps> = () => {
  return <AbsoluteFill style={{ backgroundColor: '#000000' }} />;
};
