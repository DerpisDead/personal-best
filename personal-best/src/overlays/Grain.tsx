import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { OVERLAYS } from '../timeline';

/**
 * Full-frame film grain (section 4): SVG feTurbulence (baseFrequency 0.9,
 * numOctaves 2), a new seed every 2 frames, opacity 0.04, overlay blend.
 */
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const seed = Math.floor(frame / OVERLAYS.grainSeedFrames);
  return (
    <AbsoluteFill style={{ opacity: 0.04, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <filter id="grain-noise" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={width} height={height} filter="url(#grain-noise)" />
      </svg>
    </AbsoluteFill>
  );
};
