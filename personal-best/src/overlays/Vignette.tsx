import { AbsoluteFill } from 'remotion';

/** Section 4 vignette, above the scene art. */
export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.18) 100%)',
      pointerEvents: 'none',
    }}
  />
);
