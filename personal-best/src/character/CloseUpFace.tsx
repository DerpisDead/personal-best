import { C, shade } from '../constants';
import { Shaded, ShadedEllipse, useSvgId } from './shapes';

/**
 * Shot 8's close-up (section 7), in scene px: head center (880, 600), ellipse
 * rx 300 / ry 360; hair cap; ear on the left; 60 px hood ring at the bottom;
 * hoodie shoulders across y 900–1080. Eyes 34×44 with r 6 catchlights, brows
 * 110×18, a curved nose, an 8 px mouth 120 wide. Warm key from the left
 * (30% soft-light over the left half), cool rim on the right (15%).
 *
 * The head is turned a little toward screen right, which is why only the
 * left ear shows.
 */
export type CloseUpFaceProps = {
  /** Eye offset in px (the eyes are solid dark ellipses, so the whole eye moves). */
  readonly pupilX: number;
  readonly pupilY: number;
  /** Brows lower by this many px. */
  readonly browDrop: number;
  /** 0..1: brows flatter (relaxed). */
  readonly browFlat: number;
  /** 0 open … 1 closed. */
  readonly blink: number;
  /** Mouth corners up by this many px. */
  readonly smile: number;
  /** Shoulders drop by this many px (exhale). */
  readonly shoulderDrop: number;
};

export const CU = {
  head: { cx: 880, cy: 600, rx: 300, ry: 360 },
  eyes: [
    { x: 772, y: 588 },
    { x: 1002, y: 588 },
  ],
  eye: { rx: 17, ry: 22 },
  catchlight: 6,
  brow: { w: 110, h: 18, y: 478 },
  mouth: { x: 897, y: 808, w: 120, stroke: 8 },
  ear: { cx: 590, cy: 628, rx: 44, ry: 74 },
} as const;

const KEY = { x: -1, y: -0.25 };

export const CloseUpFace: React.FC<CloseUpFaceProps> = ({ pupilX, pupilY, browDrop, browFlat, blink, smile, shoulderDrop }) => {
  const headClip = useSvgId('cu-head');
  const keyGrad = useSvgId('cu-key');
  const rimClip = useSvgId('cu-rim');
  const bodyClip = useSvgId('cu-body');
  const { cx, cy, rx, ry } = CU.head;
  const open = 1 - blink;
  const sd = shoulderDrop;

  const shouldersPath = `M 240 1080 C 280 990 420 ${930 + sd} 640 ${912 + sd} L 1120 ${912 + sd} C 1340 ${930 + sd} 1480 990 1520 1080 Z`;
  // Side-swept cap: outer contour ~12 px above the skull, a part on the left
  // and a fringe sweeping right that stops above the right brow.
  const hairPath = `M 588 560 C 560 420 640 230 880 222 C 1120 230 1205 410 1188 548
    C 1172 505 1146 470 1116 452 C 1098 462 1072 462 1046 452
    C 1000 436 956 418 906 406 C 826 390 724 396 664 430 C 624 456 600 500 588 560 Z`;

  return (
    <g>
      <defs>
        <clipPath id={rimClip}>
          <rect x={CU.head.cx + 140} y={0} width={1920} height={1080} />
        </clipPath>
        <linearGradient id={keyGrad} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.warmKey} stopOpacity={0.3} />
          <stop offset="0.6" stopColor={C.warmKey} stopOpacity={0.3} />
          <stop offset="1" stopColor={C.warmKey} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Hoodie shoulders, neck and hood ring */}
      <g>
        <clipPath id={bodyClip}>
          <path d={shouldersPath} />
        </clipPath>
        <Shaded
          shape={({ dx, dy, fill }) => <path d={shouldersPath} transform={`translate(${dx} ${dy})`} fill={fill} />}
          extent={1280}
          fill={C.hoodie}
          shadow={C.hoodieShadow}
          highlight={C.hoodieHighlight}
          light={KEY}
          shadowFrac={0.3}
          highlightFrac={0.1}
          soft={30}
        />
        <rect x={760} y={820 + sd * 0.5} width={240} height={180} rx={60} fill={C.skinShadow} />
        <path
          d={`M 650 ${985 + sd} C 700 ${1050 + sd} 1060 ${1050 + sd} 1110 ${985 + sd}`}
          stroke={C.hoodieShadow}
          strokeWidth={60}
          fill="none"
          strokeLinecap="round"
        />
        {/* Cool rim along the right edge of the shoulders */}
        <g clipPath={`url(#${bodyClip})`}>
          <rect x={1380} y={900} width={160} height={180} fill={C.coolRim} opacity={0.15} style={{ mixBlendMode: 'screen' }} />
        </g>
      </g>

      {/* Ear on the left */}
      <ellipse cx={CU.ear.cx} cy={CU.ear.cy} rx={CU.ear.rx} ry={CU.ear.ry} fill={C.skinShadow} />
      <path
        d={`M ${CU.ear.cx - 10} ${CU.ear.cy - 44} C ${CU.ear.cx - 34} ${CU.ear.cy - 10} ${CU.ear.cx - 26} ${CU.ear.cy + 30} ${CU.ear.cx - 4} ${CU.ear.cy + 46}`}
        stroke={shade(C.skinShadow, -0.15)}
        strokeWidth={9}
        fill="none"
        strokeLinecap="round"
      />

      {/* Head */}
      <ShadedEllipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={C.skin}
        shadow={C.skinShadow}
        highlight={C.skinHighlight}
        light={KEY}
        shadowFrac={0.24}
        highlightFrac={0.04}
        soft={34}
      />
      <clipPath id={headClip}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
      </clipPath>
      <g clipPath={`url(#${headClip})`}>
        {/* Warm key over the left half (feathered into the center); cool rim along the right edge */}
        <rect x={cx - rx} y={cy - ry} width={rx * 1.25} height={2 * ry} fill={`url(#${keyGrad})`} style={{ mixBlendMode: 'soft-light' }} />
        <g clipPath={`url(#${rimClip})`}>
          <ellipse cx={cx + 40} cy={cy} rx={rx} ry={ry + 6} fill="none" stroke={C.coolRim} strokeWidth={56} opacity={0.15} />
        </g>
      </g>

      {/* Hair cap with a fringe */}
      <Shaded
        shape={({ dx, dy, fill }) => <path d={hairPath} transform={`translate(${dx} ${dy})`} fill={fill} />}
        extent={700}
        fill={C.hair}
        shadow={shade(C.hair, -0.1)}
        highlight={shade(C.hair, 0.12)}
        light={KEY}
        shadowFrac={0.2}
        highlightFrac={0.12}
        soft={14}
      />

      {/* Brows */}
      {CU.eyes.map((e, i) => {
        const tilt = (i === 0 ? -5 : 5) * (1 - browFlat);
        const by = CU.brow.y + browDrop;
        return (
          <rect
            key={`b${i}`}
            x={e.x - CU.brow.w / 2 + pupilX * 0.2}
            y={by - CU.brow.h / 2 + Math.min(0, pupilY) * 0.25}
            width={CU.brow.w}
            height={CU.brow.h}
            rx={CU.brow.h / 2}
            fill={C.brows}
            transform={`rotate(${tilt} ${e.x} ${by})`}
          />
        );
      })}

      {/* Eyes with catchlights; blink closes them to arcs */}
      {CU.eyes.map((e, i) => {
        const ex = e.x + pupilX;
        const ey = e.y + pupilY;
        return (
          <g key={`e${i}`}>
            <path
              d={`M ${e.x - 34} ${e.y - 30 + pupilY * 0.3} Q ${e.x} ${e.y - 52 + pupilY * 0.3} ${e.x + 34} ${e.y - 30 + pupilY * 0.3}`}
              stroke={C.skinShadow}
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
              opacity={0.8}
            />
            {open > 0.04 ? (
              <>
                <ellipse cx={ex} cy={ey} rx={CU.eye.rx} ry={CU.eye.ry * open} fill={C.eyes} />
                {open > 0.5 ? <circle cx={ex - 6} cy={ey - 8 * open} r={CU.catchlight} fill={C.catchlight} /> : null}
              </>
            ) : null}
            {blink > 0.04 ? (
              <path
                d={`M ${ex - 22} ${ey} Q ${ex} ${ey + 12} ${ex + 22} ${ey}`}
                stroke={C.eyes}
                strokeWidth={6}
                fill="none"
                strokeLinecap="round"
                opacity={Math.min(1, blink * 1.6)}
              />
            ) : null}
          </g>
        );
      })}

      {/* Nose */}
      <path d="M 912 604 C 930 650 948 690 936 712 C 926 730 896 734 878 724" stroke={C.skinShadow} strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d="M 850 716 C 860 728 872 732 882 728" stroke={C.skinShadow} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.8} />

      {/* Mouth: corners rise with the smile */}
      <path
        d={`M ${CU.mouth.x - CU.mouth.w / 2} ${CU.mouth.y - smile} Q ${CU.mouth.x} ${CU.mouth.y + 4 + smile * 0.6} ${CU.mouth.x + CU.mouth.w / 2} ${CU.mouth.y - smile}`}
        stroke={C.mouthLine}
        strokeWidth={CU.mouth.stroke}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
};
