import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, HUD_SIZE, PB_SIZE, T } from '../constants';
import { PB } from '../timeline';
import type { HudLayout } from './Hud';
import { Pips } from './Pips';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.inOut(Easing.cubic);

type PersonalBestProps = {
  readonly layout: HudLayout;
};

/**
 * PERSONAL BEST, f765–869 (section 6). Same anchor as the HUD, no panel.
 * Uses the composition's absolute frame, so it must not sit inside a shifted Sequence.
 */
export const PersonalBest: React.FC<PersonalBestProps> = ({ layout }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < PB.in[0]) return null;

  const anchor = HUD_SIZE[layout];
  const since = frame - PB.in[0];
  const pop = spring({ frame: since, fps, config: { damping: 12, stiffness: 180, mass: 0.6 } });
  const glowBlur = interpolate(frame, PB.glow, [28, 40, 28], { ...clamp, easing: ease });

  // Gold particles from the fifth pip: 8 × r 3 px, 30 px outward, fading over 12 frames.
  const sincePip = frame - PB.fifthPip;
  const particleT = interpolate(sincePip, [0, PB.particleFrames], [0, 1], clamp);
  const particlesVisible = sincePip >= 0 && sincePip <= PB.particleFrames;

  return (
    <div
      style={{
        position: 'absolute',
        right: anchor.right,
        top: anchor.top,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        opacity: interpolate(frame, PB.in, [0, 1], { ...clamp, easing: ease }),
        scale: String(interpolate(pop, [0, 1], [0.86, 1])),
        transformOrigin: 'right center',
      }}
    >
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <div
          style={{
            ...T.personalBest,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            // Cancel the trailing letter-spacing so the underline matches the glyphs.
            marginRight: '-0.06em',
            textShadow: `0 0 ${glowBlur}px rgba(245,197,66,0.65)`,
          }}
        >
          PERSONAL BEST
        </div>
        <div
          style={{
            marginTop: PB_SIZE.underlineGap,
            height: PB_SIZE.underlineHeight,
            width: `${interpolate(frame, PB.underline, [0, 100], { ...clamp, easing: ease })}%`,
            backgroundColor: C.gold,
          }}
        />
      </div>
      <div style={{ position: 'relative', marginTop: PB_SIZE.pipsGap }}>
        <Pips frame={frame} fillFrames={[0, 0, 0, 0, PB.fifthPip]} />
        {particlesVisible
          ? new Array(PB_SIZE.particles).fill(true).map((_, i) => {
              const angle = (i / PB_SIZE.particles) * Math.PI * 2;
              const d = PB_SIZE.particleTravel * Easing.out(Easing.cubic)(particleT);
              // Fifth pip is the rightmost: its center sits 8 px in from the row's right edge.
              const cx = 5 * HUD_SIZE.pip + 4 * HUD_SIZE.pipGap - HUD_SIZE.pip / 2;
              const cy = HUD_SIZE.pip / 2;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: cx + Math.cos(angle) * d - PB_SIZE.particleRadius,
                    top: cy + Math.sin(angle) * d - PB_SIZE.particleRadius,
                    width: PB_SIZE.particleRadius * 2,
                    height: PB_SIZE.particleRadius * 2,
                    borderRadius: '50%',
                    backgroundColor: C.gold,
                    opacity: 1 - particleT,
                  }}
                />
              );
            })
          : null}
      </div>
    </div>
  );
};
