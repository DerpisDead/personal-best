import { Easing, random, spring, useVideoConfig } from 'remotion';
import { OverheadSleeper } from '../character/OverheadSleeper';
import { C } from '../constants';
import { S2, SHOT_2 } from '../timeline';
import { BlurDef, SceneSvg, tween, tweenPt, useShotFrame } from './common';

/**
 * Shot 2: Overhead bed (f60–149). Top-down, locked off.
 * Night f60–104 (lamp lit, then lamp off at f90); hard cut to day at f105.
 */

const LIGHT = { x: -0.75, y: -0.65 }; // the lamp is to his upper left in this view

const Bed: React.FC<{ readonly day: boolean }> = ({ day }) => (
  <g>
    <rect x={380} y={20} width={1160} height={1080} fill={C.bedFrame} />
    <rect x={380} y={20} width={1160} height={70} fill={C.headboard} />
    <rect x={404} y={96} width={1112} height={1004} fill={C.sheet} />
    <rect x={414} y={106} width={1092} height={1004} fill="none" stroke={C.sheetShadow} strokeWidth={20} />
    {/* Pillow with a seam and a shadow below it */}
    <rect x={644} y={140} width={636} height={182} rx={48} fill={C.sheetShadow} />
    <rect x={640} y={120} width={640} height={190} rx={48} fill={C.pillow} />
    <rect x={650} y={130} width={620} height={170} rx={40} fill="none" stroke={C.pillowSeam} strokeWidth={2} />
    {day ? (
      <>
        <ellipse cx={960} cy={220} rx={130} ry={45} fill={C.pillowDent} />
        {[
          'M 520 520 Q 640 470 760 540',
          'M 1150 430 Q 1260 500 1380 470',
          'M 600 660 Q 720 620 860 690',
          'M 1040 600 Q 1150 650 1300 620',
        ].map((d) => (
          <path key={d} d={d} stroke={C.sheetWrinkle} strokeWidth={3} fill="none" strokeLinecap="round" />
        ))}
      </>
    ) : null}
  </g>
);

const Nightstand: React.FC<{ readonly lampOn: boolean }> = ({ lampOn }) => (
  <g>
    <rect x={110} y={110} width={240} height={220} fill={C.nightstandTop} />
    <rect x={110} y={110} width={240} height={220} fill="none" stroke={C.nightstandEdge} strokeWidth={3} opacity={0.6} />
    <circle cx={230} cy={220} r={78} fill={lampOn ? C.lampShadeOn : C.lampShadeOff} />
    <circle cx={230} cy={220} r={40} fill={lampOn ? C.lampInnerGlow : C.lampShadeOff} />
    <circle cx={230} cy={220} r={10} fill={C.lampBase} opacity={lampOn ? 0.4 : 0.8} />
  </g>
);

const Floor: React.FC<{ readonly day: boolean }> = ({ day }) => (
  <g>
    <rect x={0} y={0} width={1920} height={1080} fill={day ? C.floorDay : C.floorNight} />
    {Array.from({ length: 17 }, (_, i) => (
      <rect key={i} x={i * 120} y={0} width={2} height={1080} fill={day ? C.floorDayLine : C.floorNightLine} />
    ))}
  </g>
);

const Night: React.FC<{ readonly f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  // Drop-in: starts 60 px higher at scale 1.12, settles with a spring (damping 14).
  const drop = spring({ frame: f - S2.dropIn[0], fps, config: { damping: 14 }, durationInFrames: S2.dropIn[1] - S2.dropIn[0] });
  const dy = -60 * (1 - drop);
  const sc = 1.12 - 0.12 * drop;
  const shadowOpacity = 0.25 * Math.min(1, drop);
  const edge = tween(f, S2.blanketPull, [700, 470], Easing.out(Easing.cubic));
  const lampOn = f < S2.lampOff;

  // Hands: at his sides, then on the blanket's edge, then the left one reaches for the lamp.
  const onEdgeL = { x: 790, y: edge + 8 };
  const onEdgeR = { x: 1130, y: edge + 8 };
  const restL = { x: 860, y: 600 };
  const restR = { x: 1060, y: 600 };
  const grab = tween(f, [S2.blanketPull[0] - 4, S2.blanketPull[0] + 2], [0, 1]);
  const handR = tweenPt(grab, [0, 1], restR, onEdgeR);
  const handLBase = tweenPt(grab, [0, 1], restL, onEdgeL);
  const reach = tween(f, S2.reachLamp, [0, 1]);
  const handL = tweenPt(reach, [0, 1], { x: 760, y: 480 }, { x: 300, y: 230 });
  const leftHand = f >= S2.reachLamp[0] ? handL : handLBase;
  const roll = -22 * reach;
  const shiftX = -110 * reach;
  const eyes = tween(f, S2.eyesClose, [0, 1]);
  const body = { headX: 960, headY: 230, eyesClosed: eyes, handL: leftHand, handR, roll, shiftX, light: LIGHT };
  const bodyTransform = `translate(0 ${dy}) translate(960 560) scale(${sc}) translate(-960 -560)`;

  return (
    <g>
      <defs>
        <BlurDef id="s2-shadow" amount={14} />
        <radialGradient id="s2-lampglow" cx={230} cy={220} r={700} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={C.lampGlow} stopOpacity={0.3} />
          <stop offset={1} stopColor={C.lampGlow} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="s2-moon" x1={1920} y1={0} x2={1100} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={C.moonlight} stopOpacity={0.25} />
          <stop offset={1} stopColor={C.moonlight} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Floor day={false} />
      <Bed day={false} />
      <Nightstand lampOn={lampOn} />
      {/* Soft shadow under the body */}
      <g transform={`${bodyTransform} translate(14 12)`} opacity={shadowOpacity} filter="url(#s2-shadow)">
        <circle cx={960} cy={230} r={50} fill="#000" />
        <rect x={855} y={290} width={210} height={300} rx={70} fill="#000" />
        <rect x={870} y={560} width={180} height={480} rx={60} fill="#000" />
      </g>
      <g transform={bodyTransform}>
        <OverheadSleeper {...body} part="body" />
      </g>
      {/* Blanket, folded down, pulled up to y 470 over f74–84 */}
      <path d={`M 404 ${edge} L 1516 ${edge} L 1516 1100 L 404 1100 Z`} fill={C.blanket} />
      <rect x={404} y={edge} width={1112} height={50} fill={C.blanketFold} />
      <rect x={404} y={edge + 46} width={1112} height={6} fill={C.blanket} opacity={0.5} />
      <g transform={bodyTransform}>
        <OverheadSleeper {...body} part="arms" />
      </g>
      {lampOn ? <rect x={0} y={0} width={1920} height={1080} fill="url(#s2-lampglow)" /> : null}
      {/* Lamp click: night overlay (multiply 70%) and moonlight from the right */}
      {!lampOn ? (
        <>
          <rect x={0} y={0} width={1920} height={1080} fill={C.nightOverlay} opacity={0.7} style={{ mixBlendMode: 'multiply' }} />
          <rect x={0} y={0} width={1920} height={1080} fill="url(#s2-moon)" />
        </>
      ) : null}
    </g>
  );
};

const Day: React.FC<{ readonly f: number }> = ({ f }) => {
  const drift = tween(f, S2.dustDrift, [0, 1], Easing.linear);
  // Sun shafts: parallelograms from the top-right edge, slanting down-left at 30°.
  const shaft = (x: number, w: number) => {
    const len = 1500;
    const dx = -Math.sin((30 * Math.PI) / 180) * len;
    const dy = Math.cos((30 * Math.PI) / 180) * len;
    return `M ${x} -20 L ${x + w} -20 L ${x + w + dx} ${dy} L ${x + dx} ${dy} Z`;
  };
  return (
    <g>
      <defs>
        <BlurDef id="s2-sun" amount={24} />
      </defs>
      <Floor day />
      <Bed day />
      <Nightstand lampOn={false} />
      {/* Blanket thrown back, with the folded corner showing its underside */}
      <path d="M 404 760 L 1516 760 L 1516 1100 L 404 1100 Z" fill={C.blanket} />
      <rect x={404} y={760} width={1112} height={50} fill={C.blanketFold} />
      <path d="M 1180 760 L 1516 760 L 1516 900 Z" fill={C.blanketUnderside} />
      <path d="M 1180 760 L 1516 900" stroke={C.blanketFold} strokeWidth={4} />
      <g filter="url(#s2-sun)" opacity={0.35}>
        <path d={shaft(1380, 260)} fill={C.sunShaft} />
        <path d={shaft(1720, 160)} fill={C.sunShaft} />
      </g>
      {Array.from({ length: 12 }, (_, i) => {
        const x = 700 + random(`dust-${i}-x`) * 1000;
        const y = 80 + random(`dust-${i}-y`) * 760;
        const r = 2 + random(`dust-${i}-r`) * 2;
        return <circle key={i} cx={x + 10 * drift} cy={y - 20 * drift} r={r} fill={C.dust} opacity={0.5} />;
      })}
    </g>
  );
};

export const Shot02OverheadBed: React.FC = () => {
  const f = useShotFrame(SHOT_2.from);
  return <SceneSvg background={C.floorNight}>{f < S2.dayCut ? <Night f={f} /> : <Day f={f} />}</SceneSvg>;
};
