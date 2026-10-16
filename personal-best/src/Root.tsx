import { Composition } from 'remotion';
import { PersonalBestVideo } from './Video';
import { PersonalBestVertical } from './vertical/Vertical';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PersonalBest"
        component={PersonalBestVideo}
        durationInFrames={870}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ clickTrack: false }}
      />
      <Composition
        id="PersonalBestVertical"
        component={PersonalBestVertical}
        durationInFrames={870}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ clickTrack: false }}
      />
    </>
  );
};
