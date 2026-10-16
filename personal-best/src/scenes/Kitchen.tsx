import { C, shade } from '../constants';

/**
 * The kitchen set shared by shots 3 (morning) and 7 (late afternoon), in the
 * 1920×1080 design space (section 7, shot 3). `x0`/`x1` widen the set for
 * shot 7's camera follow.
 */
export type KitchenTime = 'morning' | 'late';

type KitchenProps = {
  readonly time: KitchenTime;
  readonly x0?: number;
  readonly x1?: number;
};

const BS_X = 580;

export const KitchenBack: React.FC<KitchenProps> = ({ time, x0 = -40, x1 = 1960 }) => {
  const id = `kitchen-${time}`;
  const glassTop = time === 'morning' ? C.windowMorningTop : C.windowLateTop;
  const glassBottom = time === 'morning' ? C.windowMorningBottom : C.windowLateBottom;
  const width = x1 - x0;
  const doors: number[] = [];
  for (let x = 700; x < x1; x += 300) doors.push(x);
  const tileRows: number[] = [];
  for (let y = 370; y < 640; y += 40) tileRows.push(y);

  return (
    <g>
      <defs>
        <linearGradient id={`${id}-wall`} x1={90} y1={0} x2={1400} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={shade(C.kitchenWall, 0.06)} />
          <stop offset={1} stopColor={C.kitchenWall} />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1={0} y1={130} x2={0} y2={700} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={glassTop} />
          <stop offset={1} stopColor={glassBottom} />
        </linearGradient>
      </defs>
      {/* 1. Wall, 6% lighter near the window */}
      <rect x={x0} y={0} width={width} height={1080} fill={C.kitchenWall} />
      <rect x={Math.max(x0, -40)} y={0} width={1440} height={1080} fill={`url(#${id}-wall)`} />
      {/* 2. Window, left: 18 px frame, mullions at x 325 and y 415 */}
      <rect x={90} y={130} width={470} height={570} fill={C.windowFrame} />
      <rect x={108} y={148} width={434} height={534} fill={`url(#${id}-glass)`} />
      <rect x={319} y={148} width={12} height={534} fill={C.windowFrame} />
      <rect x={108} y={409} width={434} height={12} fill={C.windowFrame} />
      {/* Light spill on the wall to the right of the window */}
      {time === 'morning' ? (
        <path d="M 580 150 L 760 210 L 760 720 L 580 690 Z" fill={C.morningSpill} opacity={0.25} />
      ) : (
        <path d="M 600 300 L 1180 380 L 1180 760 L 600 720 Z" fill={C.lateSunPatch} opacity={0.3} />
      )}
      {/* 3. Upper cabinets with 6 px gaps every 300 px and handles near the bottom */}
      <rect x={700} y={110} width={x1 - 700} height={260} fill={C.cabinet} />
      <rect x={700} y={350} width={x1 - 700} height={20} fill={C.cabinetShadow} opacity={0.6} />
      {doors.map((x) => (
        <g key={x}>
          <rect x={x - 3} y={110} width={6} height={260} fill={C.cabinetShadow} />
          <rect x={x + 300 - 34} y={290} width={8} height={70} rx={4} fill={C.cabinetHandle} />
        </g>
      ))}
      {/* 4. Backsplash with faint staggered tile lines (40 px rows, 80 px tiles) */}
      {/* (It starts right of the window; the counter hides the window's sill.) */}
      <rect x={BS_X} y={370} width={x1 - BS_X} height={270} fill={C.backsplash} />
      {tileRows.map((y, r) => (
        <g key={y}>
          <rect x={BS_X} y={y} width={x1 - BS_X} height={1} fill={C.tileLine} />
          {Array.from({ length: Math.ceil((x1 - BS_X) / 80) }, (_, i) => {
            const x = BS_X + 40 + i * 80 + (r % 2 === 0 ? 0 : 40);
            return <rect key={i} x={x} y={y} width={1} height={40} fill={C.tileLine} />;
          })}
        </g>
      ))}
      {/* 5. Back counter and lower cabinets */}
      <rect x={x0} y={640} width={width} height={40} fill={C.counterTop} />
      <rect x={x0} y={672} width={width} height={8} fill={C.counterEdge} />
      <rect x={x0} y={680} width={width} height={400} fill={C.cabinet} />
      <rect x={x0} y={680} width={width} height={14} fill={C.cabinetShadow} />
    </g>
  );
};

/** 6. The island in the foreground: top y 760–790 with a 16 px edge, front panel below. */
export const Island: React.FC<Pick<KitchenProps, 'x0' | 'x1'>> = ({ x0 = -40, x1 = 1960 }) => (
  <g>
    <rect x={x0} y={760} width={x1 - x0} height={30} fill={C.counterTop} />
    <rect x={x0} y={774} width={x1 - x0} height={16} fill={C.counterEdge} />
    <rect x={x0} y={790} width={x1 - x0} height={290} fill={C.cabinet} />
    <rect x={x0} y={790} width={x1 - x0} height={10} fill={C.cabinetShadow} />
    {Array.from({ length: Math.ceil((x1 - x0) / 480) }, (_, i) => (
      <rect key={i} x={x0 + 240 + i * 480} y={800} width={6} height={280} fill={C.cabinetShadow} />
    ))}
  </g>
);
