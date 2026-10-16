import { Easing, interpolate, interpolateColors, useCurrentFrame } from 'remotion';
import { C, HUD_SIZE, T } from '../constants';
import { HABITS, HUD } from '../timeline';
import { formatTime } from './formatTime';
import { Pips } from './Pips';

export type HudLayout = 'landscape' | 'vertical';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.inOut(Easing.cubic);

/** Completion frames, in pip order: 105, 195, 285, 360 (EMOTIONAL WELL-BEING never completes). */
export const PIP_FILL_FRAMES: readonly (number | null)[] = HABITS.map((h) => h.completesAt);
const COMPLETION_FRAMES = PIP_FILL_FRAMES.filter((f): f is number => f !== null);

/**
 * Horizontal swipe offset, f570–585: 0 → +720 px with Easing.in(cubic).
 * The fingertip in shot 8 uses the same curve, so panel left = fingertip x − 16.
 */
export const hudSwipeOffset = (frame: number) =>
  interpolate(frame, HUD.swipe, [0, HUD_SIZE.swipeDistance], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });

/** 22 + 68 + 10 + 33 + 14 + 16 + 22 + 2 × 1.5 = 188 px. */
export const HUD_PANEL_HEIGHT =
  2 * HUD_SIZE.padY + 2 * HUD_SIZE.border + HUD_SIZE.timerLine + HUD_SIZE.row2Top +
  HUD_SIZE.row2Line + HUD_SIZE.pipsTop + HUD_SIZE.pip;

/**
 * Where the fingertip touches the panel at f570: 16 px inside the middle of its
 * left edge, in screen pixels of a canvas `canvasWidth` wide.
 */
export const hudTouchPoint = (layout: HudLayout, canvasWidth: number) => ({
  x: canvasWidth - HUD_SIZE[layout].right - HUD_SIZE.width + HUD_SIZE.fingertipInset,
  y: HUD_SIZE[layout].top + HUD_PANEL_HEIGHT / 2,
});

const habitIndexAt = (frame: number) => {
  let index = 0;
  HABITS.forEach((h, i) => {
    if (frame >= h.from) index = i;
  });
  return index;
};

type LabelRowProps = {
  /** Frame whose state this row shows (the outgoing row is frozen at its last frame). */
  readonly frame: number;
  readonly habitIndex: number;
  readonly showPill: boolean;
};

/** `[split time] [label] [8 HRS pill]`, right-aligned and vertically centered. */
const LabelRow: React.FC<LabelRowProps & { readonly style?: React.CSSProperties }> = ({
  frame,
  habitIndex,
  showPill,
  style,
}) => {
  const habit = HABITS[habitIndex];
  const done = habit.completesAt !== null && frame >= habit.completesAt;
  const since = done && habit.completesAt !== null ? frame - habit.completesAt : 0;

  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        height: HUD_SIZE.row2Line,
        display: 'flex',
        alignItems: 'center',
        gap: HUD_SIZE.row2Gap,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {done && habit.completesAt !== null ? (
        <span
          style={{
            ...T.hudSplit,
            lineHeight: 1,
            opacity: interpolate(since, [0, HUD.splitFadeFrames], [0, 1], { ...clamp, easing: ease }),
            translate: `${interpolate(since, [0, HUD.splitFadeFrames], [8, 0], { ...clamp, easing: ease })}px 0px`,
          }}
        >
          {formatTime(habit.completesAt)}
        </span>
      ) : null}
      <span
        style={{
          ...T.hudLabel,
          lineHeight: 1,
          // Cancel the trailing letter-spacing so the text sits flush right.
          marginRight: '-0.08em',
          color: done
            ? interpolateColors(
                interpolate(since, [0, HUD.labelGoldFrames], [0, 1], { ...clamp, easing: ease }),
                [0, 1],
                [C.hudLabel, C.gold],
              )
            : C.hudLabel,
        }}
      >
        {habit.label}
      </span>
      {showPill ? (
        <span
          style={{
            ...T.pill,
            lineHeight: 1,
            opacity: interpolate(frame, HUD.pillIn, [0, 1], { ...clamp, easing: ease }),
          }}
        >
          8 HRS
        </span>
      ) : null}
    </div>
  );
};

type HudPanelProps = {
  readonly frame: number;
};

/** The panel contents, without position or swipe; reused for the motion-trail ghosts. */
const HudPanel: React.FC<HudPanelProps & { readonly style?: React.CSSProperties }> = ({
  frame,
  style,
}) => {
  const habitIndex = habitIndexAt(frame);
  const changeAt = HABITS[habitIndex].from;
  const sinceChange = frame - changeAt;
  const outgoingVisible = habitIndex > 0 && sinceChange < HUD.labelOutFrames;

  // Border flashes gold at each completion and eases back by +8 frames.
  const lastCompletion = COMPLETION_FRAMES.filter((f) => frame >= f).pop();
  const borderColor =
    lastCompletion === undefined
      ? C.hudBorder
      : interpolateColors(
          interpolate(frame - lastCompletion, [0, HUD.borderFlashFrames], [0, 1], { ...clamp, easing: ease }),
          [0, 1],
          [C.goldBorderFlash, C.hudBorder],
        );

  return (
    <div
      style={{
        width: HUD_SIZE.width,
        boxSizing: 'border-box',
        padding: `${HUD_SIZE.padY}px ${HUD_SIZE.padX}px`,
        borderRadius: HUD_SIZE.radius,
        backgroundColor: C.hudBg,
        border: `${HUD_SIZE.border}px solid ${borderColor}`,
        backdropFilter: `blur(${HUD_SIZE.blur}px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        ...style,
      }}
    >
      <div style={{ ...T.hudTimer, height: HUD_SIZE.timerLine, textAlign: 'right' }}>
        {formatTime(frame)}
      </div>
      <div
        style={{
          position: 'relative',
          alignSelf: 'stretch',
          marginTop: HUD_SIZE.row2Top,
          height: HUD_SIZE.row2Line,
        }}
      >
        {outgoingVisible ? (
          // Old label and split time fade out over 3 frames.
          <LabelRow
            frame={changeAt - 1}
            habitIndex={habitIndex - 1}
            showPill={false}
            style={{
              opacity: interpolate(sinceChange, [0, HUD.labelOutFrames], [1, 0], { ...clamp, easing: ease }),
            }}
          />
        ) : null}
        <LabelRow
          frame={frame}
          habitIndex={habitIndex}
          showPill={frame >= HUD.pillIn[0] && frame <= HUD.pillLast}
          style={
            habitIndex > 0
              ? {
                  // New label rises from +10 px with opacity 0→1 over 6 frames.
                  opacity: interpolate(sinceChange, [0, HUD.labelInFrames], [0, 1], { ...clamp, easing: ease }),
                  translate: `0px ${interpolate(sinceChange, [0, HUD.labelInFrames], [10, 0], { ...clamp, easing: ease })}px`,
                }
              : undefined
          }
        />
      </div>
      <div style={{ marginTop: HUD_SIZE.pipsTop }}>
        <Pips frame={frame} fillFrames={PIP_FILL_FRAMES} />
      </div>
    </div>
  );
};

type HudProps = {
  readonly layout: HudLayout;
};

/** The speedrun HUD, f0–585 (section 6). Renders nothing from f586 on. */
export const Hud: React.FC<HudProps> = ({ layout }) => {
  const frame = useCurrentFrame();
  if (frame >= HUD.hiddenFrom) return null;

  const anchor = HUD_SIZE[layout];
  const swipeX = hudSwipeOffset(frame);
  const entering = interpolate(frame, HUD.fadeIn, [0, 1], { ...clamp, easing: ease });
  const swipeFade = interpolate(frame, HUD.swipeFade, [1, 0], { ...clamp, easing: ease });
  const trailVisible = frame >= HUD.trail[0] && frame <= HUD.trail[1];
  // A ghost never shows where the panel hasn't been yet: the trail reaches its
  // full opacity once the panel has travelled the trail's length (84 px).
  const trailRamp = interpolate(swipeX, [0, -HUD_SIZE.trail[2].offset], [0, 1], clamp);
  const position: React.CSSProperties = { position: 'absolute', right: anchor.right, top: anchor.top };

  return (
    <>
      {trailVisible
        ? HUD_SIZE.trail.map((ghost) => (
            <HudPanel
              key={ghost.offset}
              frame={frame}
              style={{
                ...position,
                opacity: ghost.opacity * swipeFade * trailRamp,
                translate: `${swipeX + ghost.offset}px 0px`,
              }}
            />
          ))
        : null}
      <HudPanel
        frame={frame}
        style={{
          ...position,
          opacity: entering * swipeFade,
          translate: `${swipeX}px ${interpolate(frame, HUD.fadeIn, [-8, 0], { ...clamp, easing: ease })}px`,
        }}
      />
    </>
  );
};
