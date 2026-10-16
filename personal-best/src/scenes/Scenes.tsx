import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { SHOT_1, SHOT_2, SHOT_3, SHOT_4, SHOT_5, SHOT_6, SHOT_7, SHOT_8, SHOT_9, SHOT_10 } from '../timeline';
import { Shot01Drawer } from './Shot01Drawer';
import { Shot02OverheadBed } from './Shot02OverheadBed';
import { Shot03KitchenMorning } from './Shot03KitchenMorning';
import { Shot04StadiumSteps } from './Shot04StadiumSteps';
import { Shot05GuitarChord } from './Shot05GuitarChord';
import { Shot06PhoneInsert } from './Shot06PhoneInsert';
import { Shot07KitchenWalk } from './Shot07KitchenWalk';
import { Shot08CloseUpSwipe } from './Shot08CloseUpSwipe';
import { Shot09KitchenFloor } from './Shot09KitchenFloor';
import { Shot10HighWide } from './Shot10HighWide';

export type ScenesProps = {
  /** Vertical version: shot 8 draws its hand in screen space instead (section 10). */
  readonly vertical?: boolean;
};

/** The scene art of all ten shots, each in a <Sequence> at its section 3 frames (1920×1080 design space). */
export const Scenes: React.FC<ScenesProps> = ({ vertical = false }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ width: 1920, height: 1080, overflow: 'hidden' }}>
      <Sequence name="Shot 1: Drawer" from={SHOT_1.from} durationInFrames={SHOT_1.durationInFrames} premountFor={fps}>
        <Shot01Drawer />
      </Sequence>
      <Sequence name="Shot 2: Overhead bed" from={SHOT_2.from} durationInFrames={SHOT_2.durationInFrames} premountFor={fps}>
        <Shot02OverheadBed />
      </Sequence>
      <Sequence name="Shot 3: Kitchen morning" from={SHOT_3.from} durationInFrames={SHOT_3.durationInFrames} premountFor={fps}>
        <Shot03KitchenMorning />
      </Sequence>
      <Sequence name="Shot 4: Stadium steps" from={SHOT_4.from} durationInFrames={SHOT_4.durationInFrames} premountFor={fps}>
        <Shot04StadiumSteps />
      </Sequence>
      <Sequence name="Shot 5: Guitar chord" from={SHOT_5.from} durationInFrames={SHOT_5.durationInFrames} premountFor={fps}>
        <Shot05GuitarChord />
      </Sequence>
      <Sequence name="Shot 6: Phone insert" from={SHOT_6.from} durationInFrames={SHOT_6.durationInFrames} premountFor={fps}>
        <Shot06PhoneInsert />
      </Sequence>
      <Sequence name="Shot 7: Kitchen walk" from={SHOT_7.from} durationInFrames={SHOT_7.durationInFrames} premountFor={fps}>
        <Shot07KitchenWalk />
      </Sequence>
      <Sequence name="Shot 8: Close-up swipe" from={SHOT_8.from} durationInFrames={SHOT_8.durationInFrames} premountFor={fps}>
        <Shot08CloseUpSwipe showHand={!vertical} />
      </Sequence>
      <Sequence name="Shot 9: Kitchen floor" from={SHOT_9.from} durationInFrames={SHOT_9.durationInFrames} premountFor={fps}>
        <Shot09KitchenFloor />
      </Sequence>
      <Sequence name="Shot 10: High wide" from={SHOT_10.from} durationInFrames={SHOT_10.durationInFrames} premountFor={fps}>
        <Shot10HighWide />
      </Sequence>
    </AbsoluteFill>
  );
};
