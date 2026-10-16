import { Easing } from 'remotion';
import { Thumb } from '../character/Hands';
import type { Pt } from '../character/shapes';
import { C, T } from '../constants';
import { CONTACT_NAME } from '../teamText';
import { S6, SHOT_6 } from '../timeline';
import { BlurDef, HandsetGlyph, handheldTransform, SceneSvg, tween, tweenPt, useShotFrame } from './common';

/**
 * Shot 6: Phone insert (f390–434). High-angle close-up over the shoulder,
 * handheld (A = 3 px), drifting translateX 0 → −30. A generic, original
 * phone interface: no status bar text, no real phone-maker design.
 */

const LIGHT = { x: -0.6, y: -0.8 };
const PHONE = { cx: 980, cy: 610, w: 560, h: 1120, r: 64, rot: -8, sy: 0.96, inset: 22 };
const SCREEN_H = PHONE.h - 2 * PHONE.inset;
const AVATAR_Y = -SCREEN_H / 2 + 0.3 * SCREEN_H;
const NAME_Y = AVATAR_Y + 150;
const BUTTON_Y = 330;
const CALL_BTN: Pt = { x: 0, y: BUTTON_Y };
const SPEAKER_BTN: Pt = { x: 0, y: BUTTON_Y };

/** Phone-local point → scene point. */
const toScene = (p: Pt): Pt => {
  const a = (PHONE.rot * Math.PI) / 180;
  const x = p.x;
  const y = p.y * PHONE.sy;
  return { x: PHONE.cx + x * Math.cos(a) - y * Math.sin(a), y: PHONE.cy + x * Math.sin(a) + y * Math.cos(a) };
};

export const contactName = () => (CONTACT_NAME.trim() === '' ? null : CONTACT_NAME.trim());

const MicGlyph: React.FC<{ readonly fill: string }> = ({ fill }) => (
  <g>
    <rect x={-7} y={-18} width={14} height={24} rx={7} fill={fill} />
    <path d="M -13 -2 A 13 13 0 0 0 13 -2" stroke={fill} strokeWidth={3.5} fill="none" strokeLinecap="round" />
    <rect x={-1.75} y={11} width={3.5} height={8} fill={fill} />
  </g>
);

const SpeakerGlyph: React.FC<{ readonly fill: string }> = ({ fill }) => (
  <g>
    <path d="M -16 -6 L -9 -6 L 0 -14 L 0 14 L -9 6 L -16 6 Z" fill={fill} />
    <path d="M 6 -7 A 9 9 0 0 1 6 7" stroke={fill} strokeWidth={3} fill="none" strokeLinecap="round" />
    <path d="M 11 -13 A 17 17 0 0 1 11 13" stroke={fill} strokeWidth={3} fill="none" strokeLinecap="round" />
  </g>
);

/** Thumb tip (scene px) for frame f: hover, tap call at f396, hover, tap speaker at f414. */
const thumbTip = (f: number): Pt => {
  const rest = toScene({ x: 210, y: 520 });
  const callHover = toScene({ x: 36, y: BUTTON_Y + 70 });
  const spkHover = toScene({ x: 40, y: BUTTON_Y + 74 });
  const call = toScene({ x: CALL_BTN.x + 10, y: CALL_BTN.y + 18 });
  const spk = toScene({ x: SPEAKER_BTN.x + 10, y: SPEAKER_BTN.y + 18 });
  // Each tap moves the thumb 20 px toward the button and back.
  const press = (at: number) => (f >= at && f <= at + 4 ? Math.sin(((f - at) / 4) * Math.PI) : 0);
  const dir = { x: -0.57, y: -0.82 };
  let p: Pt;
  if (f < S6.tapCall) p = tweenPt(f, [S6.contactCard[0], S6.tapCall], rest, call);
  else if (f < S6.tapCall + 8) p = call;
  else if (f < S6.tapSpeaker - 6) p = tweenPt(f, [S6.tapCall + 8, S6.tapSpeaker - 6], call, spkHover);
  else if (f <= S6.tapSpeaker) p = tweenPt(f, [S6.tapSpeaker - 6, S6.tapSpeaker], spkHover, spk);
  else p = tweenPt(f, [S6.tapSpeaker + 6, S6.calling[1]], spk, callHover);
  const k = 20 * (press(S6.tapCall) + press(S6.tapSpeaker));
  return { x: p.x + dir.x * k, y: p.y + dir.y * k };
};

export const Shot06PhoneInsert: React.FC = () => {
  const f = useShotFrame(SHOT_6.from);
  const drift = tween(f, S6.drift, [0, -30], Easing.linear);
  const calling = f >= S6.calling[0];
  const name = contactName();
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const callPress = f >= S6.tapCall && f < S6.tapCall + S6.pressFrames ? 0.92 : 1;
  const speakerOn = f >= S6.tapSpeaker;
  const speakerPop = f >= S6.tapSpeaker && f < S6.tapSpeaker + S6.popFrames ? [1.12, 1.06, 1.0][f - S6.tapSpeaker] : 1;
  const BLOCKS = [
    { x: -60, y: 40, w: 420, h: 300 },
    { x: 1500, y: -40, w: 520, h: 360 },
    { x: 1560, y: 520, w: 460, h: 300 },
    { x: -80, y: 640, w: 380, h: 420 },
    { x: 380, y: 920, w: 360, h: 200 },
    { x: 1350, y: 900, w: 420, h: 220 },
  ];

  return (
    <SceneSvg background={C.phoneBlurBottom}>
      <defs>
        <linearGradient id="s6-bg" x1={0} y1={0} x2={0} y2={1080} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={C.phoneBlurTop} />
          <stop offset={1} stopColor={C.phoneBlurBottom} />
        </linearGradient>
        <BlurDef id="s6-blur" amount={18} />
        <BlurDef id="s6-shadow" amount={30} />
      </defs>
      <g transform={`translate(${drift} 0) ${handheldTransform(f, 3)}`}>
        <rect x={-100} y={-100} width={2120} height={1280} fill="url(#s6-bg)" />
        <g filter="url(#s6-blur)" opacity={0.4}>
          {BLOCKS.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={24} fill={C.cabinet} />
          ))}
        </g>
        <g transform={`translate(${PHONE.cx} ${PHONE.cy}) rotate(${PHONE.rot}) scale(1 ${PHONE.sy})`}>
          <rect x={-PHONE.w / 2 + 30} y={-PHONE.h / 2 + 40} width={PHONE.w} height={PHONE.h} rx={PHONE.r} fill="#000" opacity={0.3} filter="url(#s6-shadow)" />
          <rect x={-PHONE.w / 2} y={-PHONE.h / 2} width={PHONE.w} height={PHONE.h} rx={PHONE.r} fill={C.phoneBody} />
          <rect
            x={-PHONE.w / 2 + PHONE.inset}
            y={-PHONE.h / 2 + PHONE.inset}
            width={PHONE.w - 2 * PHONE.inset}
            height={SCREEN_H}
            rx={PHONE.r - PHONE.inset}
            fill={C.screenBg}
          />
          {/* Contact card */}
          <circle cx={0} cy={AVATAR_Y} r={96} fill={C.avatar} />
          <text x={0} y={AVATAR_Y} textAnchor="middle" dominantBaseline="central" style={T.phoneInitial} fill={T.phoneInitial.color}>
            {initial}
          </text>
          {name ? (
            <text x={0} y={NAME_Y} textAnchor="middle" dominantBaseline="central" style={T.phoneName} fill={T.phoneName.color}>
              {name}
            </text>
          ) : (
            <g>
              <rect x={-120} y={NAME_Y - 40} width={240} height={80} fill="none" stroke={C.warning} strokeWidth={4} strokeDasharray="12 8" />
              <text x={0} y={NAME_Y} textAnchor="middle" dominantBaseline="central" style={T.phoneName} fill={C.warning}>
                [NAME]
              </text>
            </g>
          )}
          {!calling ? (
            <g transform={`translate(${CALL_BTN.x} ${CALL_BTN.y}) scale(${callPress})`}>
              <circle r={58} fill={C.callGreen} />
              <HandsetGlyph fill="#FFFFFF" />
            </g>
          ) : (
            <>
              {/* Calling: three dots pulse in sequence (no words) */}
              {[-1, 0, 1].map((i) => {
                const phase = ((f - S6.calling[0]) / 12 - (i + 1) / 3) % 1;
                const pulse = 0.35 + 0.65 * Math.max(0, Math.sin(Math.max(0, phase) * Math.PI));
                return <circle key={i} cx={i * 26} cy={NAME_Y + 74} r={6} fill={C.statusDots} opacity={pulse} />;
              })}
              <g transform={`translate(-150 ${BUTTON_Y})`}>
                <circle r={52} fill={C.button} />
                <MicGlyph fill="#FFFFFF" />
              </g>
              <g transform={`translate(0 ${BUTTON_Y}) scale(${speakerPop})`}>
                <circle r={52} fill={speakerOn ? C.buttonActive : C.button} />
                <SpeakerGlyph fill={speakerOn ? C.screenBg : '#FFFFFF'} />
              </g>
              <g transform={`translate(150 ${BUTTON_Y})`}>
                <circle r={52} fill={C.endRed} />
                <HandsetGlyph fill="#FFFFFF" rotate={135} />
              </g>
            </>
          )}
        </g>
        <Thumb tip={thumbTip(f)} angle={-125} light={LIGHT} />
      </g>
    </SceneSvg>
  );
};
