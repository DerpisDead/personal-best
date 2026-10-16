import { AbsoluteFill } from 'remotion';
import { TEST } from '../constants';
import { Hud } from './Hud';
import { PersonalBest } from './PersonalBest';

/** HUD and PERSONAL BEST alone on #444444, for testing (section 2). */
export const HudTest: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: TEST.hudBg }}>
      <Hud layout="landscape" />
      <PersonalBest layout="landscape" />
    </AbsoluteFill>
  );
};
