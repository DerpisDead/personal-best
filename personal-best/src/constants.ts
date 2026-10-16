import type { CSSProperties } from 'react';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadJetBrainsMono } from '@remotion/google-fonts/JetBrainsMono';

// ---------------------------------------------------------------------------
// Palette (section 4)
// ---------------------------------------------------------------------------

export const C = {
  // HUD and text
  hudBg: 'rgba(10,12,16,0.62)', hudBorder: 'rgba(255,255,255,0.14)',
  hudText: '#FFFFFF', hudLabel: '#E6E9EF', gold: '#F5C542',
  goldGlow: 'rgba(245,197,66,0.55)', goldBorderFlash: 'rgba(245,197,66,0.90)',
  goldPillBg: 'rgba(245,197,66,0.16)', pipEmptyStroke: 'rgba(255,255,255,0.50)',
  textWhite: '#FFFFFF', textSoft: '#E6E9EF', textSource: '#C9D1DC',
  scrim: 'rgba(0,0,0,0.55)', warning: '#FF00FF',

  // Lead character (set skin and hair to match your lead; these are placeholders)
  skin: '#B98260', skinShadow: '#9C6A4C', skinHighlight: '#CF9A78',
  hair: '#231A15', eyes: '#1A1A1A', brows: '#231A15', catchlight: '#FFFFFF',
  mouthLine: '#6B3A2E', mouthOpen: '#5A2A22', teeth: '#FFFFFF',
  hoodie: '#2E5AAC', hoodieShadow: '#24498C', hoodieHighlight: '#4A74C2', drawstring: '#E8E8E8',
  jeans: '#34445F', jeansShadow: '#283550',
  shoeUpper: '#F4F4F2', shoeSole: '#C9A27A', shoeLace: '#DADADA', sock: '#FFFFFF',
  pjShirt: '#A7ADB5', pjPants: '#4B5563', backpack: '#3F4A3C',
  // Family member's arm in shot 3 (placeholder)
  skin2: '#8D5A3B', sleeve2: '#8E6C8A',

  // Bedroom
  wallNightInner: '#6B4A33', wallNightOuter: '#1A1410', wallDay: '#B9C3CF',
  floorNight: '#3A3F4A', floorNightLine: '#333844', floorDay: '#CDB89A', floorDayLine: '#B9A383',
  bedFrame: '#6B4A2F', headboard: '#5A3D26', sheet: '#F7F7F2', sheetShadow: '#E2E2DC',
  sheetWrinkle: '#E6E3D8', pillow: '#FFFFFF', pillowSeam: '#EAEAE4', pillowDent: '#EDEBE4',
  blanket: '#E0A93B', blanketFold: '#C8922C', blanketUnderside: '#F1D07A',
  nightstand: '#6B4A2F', nightstandTop: '#7A5536', nightstandEdge: '#9A6E48',
  drawerInside: '#2A1C12', knob: '#C9A227', knobHighlight: '#E8C766',
  lampShadeOn: '#F4E1C1', lampInnerGlow: '#FFD8A0', lampGlow: '#FFB45C',
  lampShadeOff: '#EDE3CF', lampBase: '#3A3A3A',
  nightOverlay: '#1B2A4A', moonlight: '#6E8FC7', sunShaft: '#FFE6A8', dust: '#FFF6D6',

  // Kitchen
  kitchenWall: '#EFE7DA', kitchenWallEvening: '#CDBFA8', backsplash: '#E7DDCC', tileLine: '#DCD0BD',
  cabinet: '#5E8C8A', cabinetShadow: '#4A7270', toeKick: '#2E4544', cabinetHandle: '#B8BEC6',
  counterTop: '#D9CBB4', counterEdge: '#C2B39A', floorWood: '#B07D4F', plankLine: '#9A6A41',
  windowFrame: '#FFFFFF', windowFrameEvening: '#E9E2D6',
  windowMorningTop: '#CFE8FF', windowMorningBottom: '#EAF5FF', morningSpill: '#FFF4D6',
  windowLateTop: '#FFD9A6', windowLateBottom: '#F2B36B', lateSunPatch: '#FFC98A',
  windowEveningTop: '#3A5A8C', windowEveningBottom: '#1F2F52', distantLights: '#FFD9A6',
  pendantShade: '#F4E1C1', pendantInner: '#FFE3B0', pendantGlow: '#FFC27A', pendantCord: '#2A2A2A',
  dimOverlay: '#0E1726', doorJamb: '#2A2320',
  bowl: '#FFFFFF', bowlRim: '#DADADA', oatmeal: '#E8D9B5',
  blueberry: '#3B4BA8', blueberryHighlight: '#6C7BD9', spoon: '#C0C6CE',
  orange: '#F28C28', orangeHighlight: '#FFB15E', leaf: '#3E8E41',
  keyRing: '#B8BEC6', keyGold: '#D4AF37',

  // Stadium
  skyTop: '#DDE3EA', skyBottom: '#F2F4F7', field: '#4F8A4B',
  stepTop: '#BFC3C7', stepRiser: '#9AA0A6', stepShadow: '#7D838A', rail: '#6E7681',

  // Guitar
  fretboard: '#3B2418', fret: '#BFBFBF', string: '#D9D9D9', inlay: '#EDE7D9', nut: '#F1EBDD',
  guitarBody: '#E3B778', guitarBodyEdge: '#C9964F', soundhole: '#1A120C', warmPatch: '#FFE6A8',

  // Phone (generic, original UI)
  phoneBody: '#1C1C1E', cameraBump: '#2A2A2D', lens: '#0B0B0C', screenBg: '#121417',
  screenGlow: '#9FC3FF', avatar: '#5E8C8A', callGreen: '#30A46C', endRed: '#E5484D',
  button: '#2A2F36', buttonActive: '#FFFFFF', statusDots: '#9AA4B2',
  phoneBlurTop: '#E9D8C0', phoneBlurBottom: '#C9A98A',

  // Close-up (shot 8)
  cuBgTop: '#E8C9A0', cuBgBottom: '#B98E6A', bokehA: '#F2B36B', bokehB: '#FFD9A6',
  warmKey: '#FFC27A', coolRim: '#3A5A8C',
} as const;

// Test-composition backgrounds and review labels (section 2 and 5).
export const TEST = {
  hudBg: '#444444',
  rigBg: '#EFE7DA',
  label: '#666666',
} as const;

/**
 * Shift a hex color toward black (negative amount) or white (positive amount).
 * Used for the per-shape shadow (12–18% darker) and highlight (~10% lighter)
 * tones of section 4, and for the "6% lighter" surfaces in section 7.
 */
export const shade = (hex: string, amount: number): string => {
  const n = parseInt(hex.slice(1), 16);
  const target = amount < 0 ? 0 : 255;
  const t = Math.abs(amount);
  const ch = (v: number) => Math.round(v + (target - v) * t);
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
};

/** A palette hex color at the given opacity, as an rgba() string. */
export const alpha = (hex: string, a: number): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

export const LANDSCAPE = { width: 1920, height: 1080 } as const;
export const PORTRAIT = { width: 1080, height: 1920 } as const;

/**
 * HUD panel (section 6). Height works out to 188 px, spanning y 64–252.
 *
 * Width: the spec says 440 px, but at the spec's type sizes the widest label
 * row ("0:09.50  PHYSICAL EXERCISE") is 462 px of glyphs and the inner width
 * of a 440 px panel is only 385 px, so the text spilled out of the panel.
 * 520 px is the smallest round width that fits (462 + 2×26 padding + 3 border).
 * The panel spans x 1304–1824 (16:9) and x 496–1016 (9:16).
 */
export const HUD_SIZE = {
  landscape: { right: 96, top: 64 },
  vertical: { right: 64, top: 220 },
  width: 520,
  padX: 26,
  padY: 22,
  radius: 16,
  border: 1.5,
  blur: 6,
  timerLine: 68,
  row2Gap: 12,
  row2Top: 10,
  row2Line: 33, // chosen so the panel is exactly 188 px tall (y 64–252)
  pipsTop: 14,
  pip: 16,
  pipGap: 10,
  pipStroke: 2,
  swipeDistance: 720,
  fingertipInset: 16, // panel left edge = fingertip x − 16
  trail: [
    { offset: -28, opacity: 0.3 },
    { offset: -56, opacity: 0.18 },
    { offset: -84, opacity: 0.08 },
  ],
} as const;

export const PB_SIZE = {
  underlineHeight: 6,
  underlineGap: 10,
  pipsGap: 14,
  particles: 8,
  particleRadius: 3,
  particleTravel: 30,
} as const;

/** Rig body parts at scale 1.0, standing height 640 px (section 5). */
export const BODY = {
  height: 640,
  head: { rx: 40, ry: 48 },
  ear: { w: 9, h: 13 },
  neck: { w: 26, h: 22 },
  torso: { w: 128, h: 196, r: 30 },
  hoodRing: 14,
  pocket: { w: 84, h: 44 },
  drawstring: { w: 3, h: 40 },
  upperArm: { w: 30, h: 92 },
  forearm: { w: 28, h: 86 },
  hand: { r: 16, thumbW: 8, thumbH: 12 },
  pelvis: { w: 120, h: 40 },
  thigh: { w: 40, h: 116 },
  shin: { w: 36, h: 108 },
  shoe: { w: 74, h: 26, r: 10, sole: 6 },
  // Face, scale 1.0
  eye: { w: 6, h: 8, x: 15, y: -4 },
  brow: { w: 18, h: 4, x: 15, y: -18 },
  mouthWidth: 22,
  mouthStroke: 3,
  // Limb shading (section 5)
  shadowStrip: 0.35,
  highlightStrip: 0.15,
} as const;

// ---------------------------------------------------------------------------
// Typography (section 4)
// ---------------------------------------------------------------------------

export const INTER = loadInter('normal', {
  weights: ['500', '600', '700', '800'],
  subsets: ['latin'],
}).fontFamily;

export const MONO = loadJetBrainsMono('normal', {
  weights: ['600', '700'],
  subsets: ['latin'],
}).fontFamily;

export const T = {
  hudTimer: {
    fontFamily: MONO, fontWeight: 700, fontSize: 68, lineHeight: '68px',
    fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em', color: C.hudText,
  },
  hudLabel: {
    fontFamily: INTER, fontWeight: 700, fontSize: 30,
    textTransform: 'uppercase', letterSpacing: '0.08em', color: C.hudLabel,
  },
  hudSplit: { fontFamily: MONO, fontWeight: 600, fontSize: 26, color: C.gold },
  pill: {
    fontFamily: INTER, fontWeight: 700, fontSize: 20, color: C.gold,
    backgroundColor: C.goldPillBg, padding: '4px 10px', borderRadius: 999,
  },
  phoneName: { fontFamily: INTER, fontWeight: 600, fontSize: 56, color: C.textWhite },
  phoneInitial: { fontFamily: INTER, fontWeight: 700, fontSize: 96, color: C.textWhite },
  whyLine: {
    fontFamily: INTER, fontWeight: 700, fontSize: 56, lineHeight: 1.15, color: C.textWhite,
    textShadow: '0 2px 10px rgba(0,0,0,0.45)',
  },
  sourceTag: { fontFamily: INTER, fontWeight: 500, fontSize: 24, color: C.textSource },
  personalBest: {
    fontFamily: INTER, fontWeight: 800, fontSize: 84, letterSpacing: '0.06em', color: C.gold,
    textShadow: '0 0 28px rgba(245,197,66,0.65)',
  },
  cta: {
    fontFamily: INTER, fontWeight: 800, fontSize: 72, color: C.textWhite,
    textShadow: '0 2px 14px rgba(0,0,0,0.55)',
  },
  credit: { fontFamily: INTER, fontWeight: 500, fontSize: 26, color: C.textSoft, opacity: 0.9 },
  warning: { fontFamily: INTER, fontWeight: 600, fontSize: 32, color: C.warning },
  testLabel: { fontFamily: INTER, fontWeight: 500, fontSize: 20, color: TEST.label },
} as const satisfies Record<string, CSSProperties>;
