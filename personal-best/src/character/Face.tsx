import { BODY, C, shade } from '../constants';
import { D2R, type Pt, Shaded, ShadedEllipse, useSvgId } from './shapes';

/**
 * Face and head at rig scale 1.0 (section 5): eyes 6×8 at (±15, −4) from the
 * head center, brows 18×4 at (±15, −18), a small curved nose, a 22 px mouth.
 *
 * Expressions are numeric so they can be blended frame by frame.
 */
export type FaceParams = {
  /** Brows lower by this many px. */
  readonly browDrop: number;
  /** Brows angled inward by this many degrees. */
  readonly browAngle: number;
  /** 0..1: brows flatter (exhale). */
  readonly browFlat: number;
  /** Pupil offset in px (eyes are solid dark ellipses, so the whole eye moves). */
  readonly pupilX: number;
  readonly pupilY: number;
  /** 1 open … 0 closed (eyelids become arcs). */
  readonly eyeOpen: number;
  /** 0..1: squinting arcs (laugh). */
  readonly squint: number;
  /** −1..1: mouth curve; positive curves the corners up (smile). */
  readonly mouthCurve: number;
  /** 0..1: open laughing mouth (24×14 ellipse with a 20×5 teeth bar). */
  readonly mouthOpen: number;
  /** 0..1: softened mouth (exhale). */
  readonly mouthSoft: number;
  /** Head pitch in degrees; negative tilts the face up. */
  readonly headPitch: number;
};

export const NEUTRAL: FaceParams = {
  browDrop: 0, browAngle: 0, browFlat: 0, pupilX: 0, pupilY: 0, eyeOpen: 1, squint: 0,
  mouthCurve: 0, mouthOpen: 0, mouthSoft: 0, headPitch: 0,
};
/** Brows 3 px lower, angled 8° inward. */
export const FOCUSED: FaceParams = { ...NEUTRAL, browDrop: 3, browAngle: 8 };
/** Pupils +3 x, −3 y, head tilted −12°. */
export const GLANCE_UP: FaceParams = { ...NEUTRAL, pupilX: 3, pupilY: -3, headPitch: -12 };
/** Brows 2 px lower and flatter, mouth softened. */
export const EXHALE: FaceParams = { ...NEUTRAL, browDrop: 2, browFlat: 1, mouthSoft: 1 };
/** Open mouth with teeth, squinting arcs, head back 6°. */
export const LAUGH: FaceParams = { ...NEUTRAL, mouthOpen: 1, squint: 1, mouthCurve: 0.6, headPitch: -6 };
/** Mouth arc curving up. */
export const SMILE: FaceParams = { ...NEUTRAL, mouthCurve: 1 };

export const EXPRESSIONS = [
  { name: 'neutral', face: NEUTRAL },
  { name: 'focused', face: FOCUSED },
  { name: 'glance-up', face: GLANCE_UP },
  { name: 'exhale', face: EXHALE },
  { name: 'laugh', face: LAUGH },
  { name: 'smile', face: SMILE },
] as const;

const FACE_KEYS = Object.keys(NEUTRAL) as (keyof FaceParams)[];
export const mixFace = (a: FaceParams, b: FaceParams, t: number): FaceParams => {
  const out: Record<string, number> = {};
  for (const k of FACE_KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out as FaceParams;
};

/** Projected head radius across the view (the head is a little deeper than wide). */
export const headRx = (yaw: number) =>
  Math.hypot(BODY.head.rx * Math.cos(yaw * D2R), (BODY.head.rx + 4) * Math.sin(yaw * D2R));

const FACE_DEPTH = 34; // how far the eyes/brows sit in front of the head's center

/** Screen x and visibility of a facial feature at lateral offset s (rig R side = +s). */
const feature = (s: number, depth: number, yaw: number) => {
  const c = Math.cos(yaw * D2R);
  const sn = Math.sin(yaw * D2R);
  const d = depth * c - s * sn;
  return { x: s * c + depth * sn, depthOut: d, squash: Math.max(0.45, Math.min(1, d / depth)) };
};

/**
 * Hair cap over the top 40% of the head with a small side-swept fringe. The
 * hairline sits at the temples (y ≈ −11), rises over the forehead (≈ −29) and,
 * in 3/4 and profile, runs down the back of the head to the nape.
 */
const hairPath = (yaw: number, rx: number, ry: number) => {
  const c = Math.cos(yaw * D2R);
  const sn = Math.sin(yaw * D2R);
  const dir = sn >= 0 ? 1 : -1;
  const faceX = FACE_DEPTH * sn;
  const halfW = 26 * (0.45 + 0.55 * Math.abs(c)) + 4;
  // The fringe sweeps toward his R side and stops short of the brows (y −20).
  const fringeX = feature(7, FACE_DEPTH, yaw).x;
  const pts: string[] = [];
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const x = -rx - 4 + ((2 * rx + 8) * i) / n;
    const u = (x - faceX) / halfW;
    let y = -11 - 18 * Math.exp(-(u ** 4));
    y += 7 * Math.exp(-(((x - fringeX) / (0.42 * halfW)) ** 2));
    const back = Math.max(0, (-x * dir) / rx) * Math.abs(sn);
    y += 34 * back * back;
    pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `M ${-rx - 6} ${-ry - 14} L ${pts.join(' L ')} L ${rx + 6} ${-ry - 14} Z`;
};

type HeadProps = {
  readonly yaw: number;
  readonly face: FaceParams;
  readonly light: Pt;
};

/** Head at scale 1, centered on (0, 0): ears (3/4 views), shaded head, hair and face. */
export const Head: React.FC<HeadProps> = ({ yaw, face, light }) => {
  const clipId = useSvgId('hair');
  const rx = headRx(yaw);
  const ry = BODY.head.ry;
  const c = Math.cos(yaw * D2R);
  const sn = Math.sin(yaw * D2R);
  const dir = sn >= 0 ? 1 : -1;
  const profile = Math.abs(sn);

  // Pitch: features slide up (negative pitch) across the face.
  const pitchY = Math.sin(face.headPitch * D2R) * ry * 0.7;

  // Ear: only in 3/4 and profile views, on the back-of-head side.
  const showEar = Math.abs(yaw) > 10;
  const earX = -dir * rx * 0.8 * Math.abs(c) * (1 - 0.25 * profile) - dir * 4 * profile;

  const eyes = [-1, 1].map((side) => feature(side * BODY.eye.x, FACE_DEPTH, yaw));
  const brows = [-1, 1].map((side) => feature(side * BODY.brow.x, FACE_DEPTH - 2, yaw));
  const nose = feature(0, BODY.head.rx + 2, yaw);
  // The nose's shadow falls on the side away from the light (the far side in 3/4).
  const noseSide = Math.abs(sn) > 0.2 ? -dir : light.x <= 0 ? 1 : -1;
  const mouth = feature(0, FACE_DEPTH + 2, yaw);
  const mouthW = BODY.mouthWidth * (0.55 + 0.45 * Math.abs(c)) * (1 - 0.18 * face.mouthSoft);

  const eyeRy = (BODY.eye.h / 2) * face.eyeOpen * (1 - face.squint);
  const lidArc = (1 - face.eyeOpen) * (1 - face.squint);
  const mouthY = 22 + pitchY;
  const curve = face.mouthCurve * 5 + face.mouthSoft * 1.5;

  return (
    <g>
      <ShadedEllipse
        cx={0}
        cy={0}
        rx={rx}
        ry={ry}
        fill={C.skin}
        shadow={C.skinShadow}
        highlight={C.skinHighlight}
        light={light}
        shadowFrac={0.3}
        highlightFrac={0.12}
        soft={4}
      />
      {showEar ? (
        <g>
          <ellipse cx={earX} cy={-2 + pitchY * 0.3} rx={BODY.ear.w / 2} ry={BODY.ear.h / 2} fill={C.skinShadow} />
          <path
            d={`M ${earX + dir * 1.5} ${-6 + pitchY * 0.3} Q ${earX - dir * 2} ${-2 + pitchY * 0.3} ${earX + dir * 1} ${3 + pitchY * 0.3}`}
            stroke={shade(C.skinShadow, -0.18)}
            strokeWidth={1.4}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      ) : null}
      <clipPath id={clipId}>
        <ellipse cx={0} cy={-3} rx={rx + 1.5} ry={ry + 5} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <Shaded
          shape={({ dx, dy, fill }) => <path d={hairPath(yaw, rx, ry)} transform={`translate(${dx} ${dy})`} fill={fill} />}
          extent={2 * ry}
          fill={C.hair}
          shadow={shade(C.hair, -0.12)}
          highlight={shade(C.hair, 0.1)}
          light={light}
          shadowFrac={0.25}
          highlightFrac={0.1}
        />
      </g>

      {/* Brows */}
      {brows.map((b, i) => {
        if (b.depthOut < -4) return null;
        const side = i === 0 ? -1 : 1;
        // Rig R side is +s; "inward" means toward the nose.
        const inward = -side * face.browAngle * (1 - face.browFlat);
        return (
          <rect
            key={`brow${i}`}
            x={b.x + face.pupilX * 0.3 - (BODY.brow.w * b.squash) / 2}
            y={BODY.brow.y + face.browDrop + pitchY - BODY.brow.h / 2}
            width={BODY.brow.w * b.squash}
            height={BODY.brow.h * (1 - 0.15 * face.browFlat)}
            rx={BODY.brow.h / 2}
            fill={C.brows}
            transform={`rotate(${inward} ${b.x} ${BODY.brow.y + face.browDrop + pitchY})`}
          />
        );
      })}

      {/* Eyes */}
      {eyes.map((e, i) => {
        if (e.depthOut < -4) return null;
        const ex = e.x + face.pupilX;
        const ey = BODY.eye.y + face.pupilY + pitchY;
        const erx = (BODY.eye.w / 2) * e.squash;
        return (
          <g key={`eye${i}`}>
            {eyeRy > 0.3 ? <ellipse cx={ex} cy={ey} rx={erx} ry={eyeRy} fill={C.eyes} /> : null}
            {lidArc > 0.02 ? (
              // Closed lids: a downward arc.
              <path
                d={`M ${ex - erx - 1} ${ey} Q ${ex} ${ey + 3.5} ${ex + erx + 1} ${ey}`}
                stroke={C.eyes}
                strokeWidth={1.8}
                fill="none"
                strokeLinecap="round"
                opacity={Math.min(1, lidArc * 1.5)}
              />
            ) : null}
            {face.squint > 0.02 ? (
              // Squinting arcs: curve upward.
              <path
                d={`M ${ex - erx - 1.5} ${ey + 1} Q ${ex} ${ey - 3.5} ${ex + erx + 1.5} ${ey + 1}`}
                stroke={C.eyes}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                opacity={face.squint}
              />
            ) : null}
          </g>
        );
      })}

      {/* Nose: small curved path in skinShadow */}
      {profile > 0.6 ? (
        <path
          d={`M ${nose.x - dir * 3} ${-3 + pitchY} Q ${nose.x + dir * 6} ${9 + pitchY} ${nose.x - dir * 1} ${12 + pitchY}`}
          stroke={C.skinShadow}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <path
          d={`M ${nose.x + noseSide * 2} ${1 + pitchY} Q ${nose.x + noseSide * 4.5} ${9 + pitchY} ${nose.x - noseSide * 2} ${11.5 + pitchY}`}
          stroke={C.skinShadow}
          strokeWidth={2.4}
          fill="none"
          strokeLinecap="round"
        />
      )}

      {/* Mouth */}
      {face.mouthOpen < 0.98 ? (
        <path
          d={`M ${mouth.x - mouthW / 2} ${mouthY - curve * 0.4} Q ${mouth.x} ${mouthY + curve} ${mouth.x + mouthW / 2} ${mouthY - curve * 0.4}`}
          stroke={C.mouthLine}
          strokeWidth={BODY.mouthStroke}
          fill="none"
          strokeLinecap="round"
          opacity={1 - face.mouthOpen}
        />
      ) : null}
      {face.mouthOpen > 0.02 ? (
        <g opacity={face.mouthOpen}>
          <clipPath id={`${clipId}-m`}>
            <ellipse cx={mouth.x} cy={mouthY + 2} rx={12 * (0.6 + 0.4 * Math.abs(c))} ry={7 * face.mouthOpen} />
          </clipPath>
          <ellipse cx={mouth.x} cy={mouthY + 2} rx={12 * (0.6 + 0.4 * Math.abs(c))} ry={7 * face.mouthOpen} fill={C.mouthOpen} />
          <rect
            x={mouth.x - 10 * (0.6 + 0.4 * Math.abs(c))}
            y={mouthY + 2 - 7 * face.mouthOpen}
            width={20 * (0.6 + 0.4 * Math.abs(c))}
            height={5}
            fill={C.teeth}
            clipPath={`url(#${clipId}-m)`}
          />
        </g>
      ) : null}
    </g>
  );
};
