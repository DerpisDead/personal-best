import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, T, TEST } from '../constants';
import { CloseUpFace } from './CloseUpFace';
import { CarryHand, FrettingHand, PointingHand, Thumb } from './Hands';
import { OverheadSleeper } from './OverheadSleeper';
import { add, Capsule, dirDeg, mul } from './shapes';
import { EXPRESSIONS, Head } from './Face';
import { STATIC_POSES, runUpStairsCycle, slideDown, walkCycle, SLIDE_DROP, WALK_FRAMES, RUN_FRAMES, type Pose } from './poses';
import { RIG_STAND, Rig } from './Rig';

/**
 * RigTest (section 2/5): every pose and both cycles for 30 frames each on
 * #EFE7DA, labeled in small gray text for review only. Each pose is shown
 * front-on, in 3/4 and in profile. 300 frames = 10 slots:
 *   0 STAND · 1 HOLD_BOWL · 2 CATCH · 3 HOLD_PHONE_CHEST · 4 SIT_FLOOR
 *   5 WALK · 6 RUN_UP_STAIRS · 7 SLIDE_DOWN · 8 expressions · 9 special drawings
 */

const SLOT = 30;
const FLOOR = 940;
const SCALE = 0.95;
const LIGHT = { x: -0.8, y: -0.6 };
const VIEWS = [
  { name: 'front (yaw 0°)', yaw: 0, x: 420 },
  { name: '3/4 (yaw −35°)', yaw: -35, x: 960 },
  { name: 'profile (yaw 90°)', yaw: 90, x: 1500 },
] as const;

const Label: React.FC<{ readonly x: number; readonly y: number; readonly children: React.ReactNode; readonly anchor?: 'start' | 'middle' }> = ({
  x,
  y,
  children,
  anchor = 'middle',
}) => (
  <text x={x} y={y} textAnchor={anchor} style={T.testLabel} fill={T.testLabel.color}>
    {children}
  </text>
);

const Floor: React.FC = () => <line x1={80} y1={FLOOR} x2={1840} y2={FLOOR} stroke="#D8CDBB" strokeWidth={2} />;

type PoseSlotProps = {
  readonly title: string;
  readonly poseAt: (frame: number) => { pose: Pose; bob: number; seated?: boolean };
};

const PoseSlot: React.FC<PoseSlotProps> = ({ title, poseAt }) => {
  const frame = useCurrentFrame();
  const { pose, bob, seated } = poseAt(frame);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <Label x={80} y={60} anchor="start">{title}</Label>
      <Floor />
      {VIEWS.map((v) => {
        // Standing poses rest their lowest sole on the floor; seated ones sit
        // the pelvis on it (feet resting where the legs put them).
        const seatedY = FLOOR - (RIG_STAND.hipHeight - bob) * SCALE;
        return (
          <g key={v.name}>
            <Rig
              x={v.x}
              y={seated ? seatedY : undefined}
              ground={seated ? undefined : FLOOR - bob * SCALE}
              scale={SCALE}
              yaw={v.yaw}
              pose={pose}
              light={LIGHT}
            />
            <Label x={v.x} y={FLOOR + 50}>{v.name}</Label>
          </g>
        );
      })}
    </svg>
  );
};

const ExpressionSlot: React.FC = () => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <Label x={80} y={60} anchor="start">EXPRESSIONS (head at 3×, front and 3/4)</Label>
    {EXPRESSIONS.map((e, i) => (
      <g key={e.name}>
        <g transform={`translate(${210 + i * 300} 360) scale(3)`}>
          <Head yaw={0} face={e.face} light={LIGHT} />
        </g>
        <g transform={`translate(${210 + i * 300} 720) scale(3)`}>
          <Head yaw={-35} face={e.face} light={LIGHT} />
        </g>
        <Label x={210 + i * 300} y={960}>{e.name}</Label>
      </g>
    ))}
  </svg>
);

const Box: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly label: string;
  readonly children: React.ReactNode;
}> = ({ x, y, w, h, label, children }) => {
  const id = `rigtest-box-${x}-${y}`;
  return (
    <g>
      <clipPath id={id}>
        <rect x={x} y={y} width={w} height={h} rx={12} />
      </clipPath>
      <rect x={x} y={y} width={w} height={h} rx={12} fill="#E6DCCB" />
      <g clipPath={`url(#${id})`}>{children}</g>
      <Label x={x + w / 2} y={y + h + 30}>{label}</Label>
    </g>
  );
};

/** The neck stub used to preview the fretting hand (same geometry rules as shot 5). */
const FRETS = [120, 233, 340, 441, 536, 626, 711];
const NeckStub: React.FC<{ readonly angle: number }> = ({ angle }) => {
  const along = dirDeg(angle);
  const across = dirDeg(angle + 90);
  const p = (d: number, a: number) => add(mul(along, d), mul(across, a));
  const corner = [p(-40, -60), p(800, -60), p(800, 60), p(-40, 60)];
  return (
    <g>
      <path d={`M ${corner.map((q) => `${q.x} ${q.y}`).join(' L ')} Z`} fill={C.fretboard} />
      <Capsule a={p(0, -60)} b={p(0, 60)} w={14} fill={C.nut} ext={0} />
      {FRETS.map((d) => (
        <Capsule key={d} a={p(d, -60)} b={p(d, 60)} w={4} fill={C.fret} ext={0} />
      ))}
      {[-45, -27, -9, 9, 27, 45].map((a, i) => (
        <line key={a} x1={p(-40, a).x} y1={p(-40, a).y} x2={p(800, a).x} y2={p(800, a).y} stroke={C.string} strokeWidth={[3.4, 3.0, 2.6, 2.2, 1.8, 1.5][i]} />
      ))}
    </g>
  );
};

const SpecialSlot: React.FC = () => {
  const neck = 18;
  const along = dirDeg(neck);
  const across = dirDeg(neck + 90);
  const p = (d: number, a: number) => add(mul(along, d), mul(across, a));
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <Label x={80} y={60} anchor="start">SPECIAL DRAWINGS (scaled down to fit)</Label>
      <Box x={60} y={90} w={520} h={420} label="overhead sleeper (shot 2), eyes open / closing">
        <g transform="translate(60 90) scale(0.44) translate(-380 -110)">
          <rect x={380} y={110} width={1160} height={980} fill={C.sheet} />
          <rect x={640} y={120} width={640} height={190} rx={48} fill={C.pillow} />
          <OverheadSleeper headX={960} headY={230} eyesClosed={0.6} handL={{ x: 800, y: 600 }} handR={{ x: 1120, y: 600 }} light={{ x: -0.6, y: -0.8 }} />
        </g>
      </Box>
      <Box x={620} y={90} w={720} h={420} label="close-up face (shot 8), looking up and right">
        <g transform="translate(620 98) scale(0.375)">
          <rect x={0} y={0} width={1920} height={1080} fill={C.cuBgTop} />
          <CloseUpFace pupilX={12} pupilY={-14} browDrop={0} browFlat={0} blink={0} smile={0} shoulderDrop={0} />
        </g>
      </Box>
      <Box x={1380} y={90} w={480} h={420} label="pointing hand (shot 8)">
        <g transform="translate(1560 140) scale(0.3)">
          <PointingHand tip={{ x: 0, y: 0 }} angle={-100} light={{ x: -1, y: -0.25 }} />
        </g>
      </Box>
      <Box x={60} y={600} w={420} h={400} label="carry grip (shot 1)">
        <g transform="translate(230 800) scale(0.62)">
          <g transform="rotate(-10)">
            <rect x={-130} y={-64} width={260} height={128} rx={22} fill={C.phoneBody} />
            <rect x={-118} y={-52} width={54} height={54} rx={14} fill={C.cameraBump} />
          </g>
          <CarryHand from={{ x: 700, y: -420 }} wrist={{ x: 150, y: -110 }} angle={160} curl={1} light={{ x: 0.8, y: -0.6 }} />
        </g>
      </Box>
      <Box x={520} y={600} w={420} h={400} label="flat palm push (shot 1)">
        <g transform="translate(700 850) scale(0.62)">
          <CarryHand from={{ x: 500, y: 260 }} wrist={{ x: 60, y: 40 }} angle={-150} curl={0} light={{ x: 0.8, y: -0.6 }} />
        </g>
      </Box>
      <Box x={980} y={600} w={480} h={400} label="F barre chord (shot 5)">
        <g transform="translate(1010 690) scale(0.55)">
          <NeckStub angle={neck} />
          <FrettingHand
            at={({ d, a }) => p(d, a)}
            neckAngle={neck}
            edge={60}
            barreD={100}
            tips={{ middle: { d: 208, a: 9 }, ring: { d: 315, a: -27 }, pinky: { d: 318, a: -9 } }}
            indexShadow={5}
            light={{ x: -0.7, y: -0.7 }}
          />
        </g>
      </Box>
      <Box x={1500} y={600} w={360} h={400} label="thumb (shot 6)">
        <g transform="translate(1640 720) scale(0.55)">
          <rect x={-300} y={-260} width={420} height={300} rx={40} fill={C.screenBg} />
          <Thumb tip={{ x: 0, y: 0 }} angle={-125} light={{ x: -0.6, y: -0.8 }} />
        </g>
      </Box>
    </svg>
  );
};

export const RigTest: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: TEST.rigBg }}>
      {STATIC_POSES.map((p, i) => (
        <Sequence key={p.name} name={p.name} from={i * SLOT} durationInFrames={SLOT} premountFor={fps}>
          <PoseSlot title={p.name} poseAt={() =>
              p.name === 'SIT_FLOOR' ? { pose: p.pose, bob: SLIDE_DROP, seated: true } : { pose: p.pose, bob: 0 }
            } />
        </Sequence>
      ))}
      <Sequence name="WALK" from={5 * SLOT} durationInFrames={SLOT} premountFor={fps}>
        <PoseSlot title={`WALK (${WALK_FRAMES}-frame cycle)`} poseAt={(f) => walkCycle(f)} />
      </Sequence>
      <Sequence name="RUN_UP_STAIRS" from={6 * SLOT} durationInFrames={SLOT} premountFor={fps}>
        <PoseSlot title={`RUN_UP_STAIRS (${RUN_FRAMES}-frame cycle, in place)`} poseAt={(f) => runUpStairsCycle(f)} />
      </Sequence>
      <Sequence name="SLIDE_DOWN" from={7 * SLOT} durationInFrames={SLOT} premountFor={fps}>
        <PoseSlot
          title="SLIDE_DOWN (STAND torso −6° → SIT_FLOOR, hips down 220 px)"
          poseAt={(f) => ({ ...slideDown(f / (SLOT - 1)), seated: true })}
        />
      </Sequence>
      <Sequence name="Expressions" from={8 * SLOT} durationInFrames={SLOT} premountFor={fps}>
        <ExpressionSlot />
      </Sequence>
      <Sequence name="Special drawings" from={9 * SLOT} durationInFrames={SLOT} premountFor={fps}>
        <SpecialSlot />
      </Sequence>
    </AbsoluteFill>
  );
};
