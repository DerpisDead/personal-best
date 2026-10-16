import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { SHOT_1, SHOT_2 } from '../timeline';
import { Shot01Drawer } from './Shot01Drawer';
import { Shot02OverheadBed } from './Shot02OverheadBed';

export type ScenesProps = {
  /** Vertical version: shot 8 draws its hand in screen space instead (section 10). */
  readonly vertical?: boolean;
};

/** The scene art of all ten shots, each in a <Sequence> at its section 3 frames (1920×1080 design space). */
export const Scenes: React.FC<ScenesProps> = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ width: 1920, height: 1080, overflow: 'hidden' }}>
      <Sequence name="Shot 1: Drawer" from={SHOT_1.from} durationInFrames={SHOT_1.durationInFrames} premountFor={fps}>
        <Shot01Drawer />
      </Sequence>
      <Sequence name="Shot 2: Overhead bed" from={SHOT_2.from} durationInFrames={SHOT_2.durationInFrames} premountFor={fps}>
        <Shot02OverheadBed />
      </Sequence>
    </AbsoluteFill>
  );
};
