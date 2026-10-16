# Personal Best

A 29.0-second animated PSA for the HOSA PSA event ("Maintain My Brain:
Practicing the Pillars of Brain Health"), built with [Remotion](https://www.remotion.dev).
A teen "speedruns" five brain-health habits against a game timer, then swipes
the timer away to keep talking to his grandmother.

> [!WARNING]
> **Every `TEMP_` sound must be replaced with team-made audio before this video
> is used anywhere.** The `TEMP_` files are timing placeholders only. While any
> of them is in use, `npm run audio:check`, the Studio and every render print a
> large **TEMP AUDIO IN USE** warning.

## Requirements

- Node.js 22.18 or newer (the current LTS is fine) and npm
- `npm install` once in this folder

## 1. Write the team text (`src/teamText.ts`)

The team writes every line of on-screen copy. Open `src/teamText.ts` and fill in
the four strings:

| Constant | What goes in it | Limit |
|---|---|---|
| `WHY_LINE` | The why-line shown over the kitchen-floor shot | 7 words |
| `CTA_LINE` | The call to action on the end card | 5 words |
| `CONTACT_NAME` | What the lead actually calls their grandparent (shown on the phone) | — |
| `CHAPTER_NAME` | The chapter's name, without the word HOSA (credit line) | — |

While a line is empty (or too long), the video shows a dashed magenta warning
box in its place: `[NAME]` on the phone, `[CHAPTER]` in the credit line. The
render log also lists what's missing. These are meant to be impossible to miss,
so nothing ships with placeholder text by accident.

The credit line is fixed: `Habits: Hilarity for Charity · wearehfc.org · <CHAPTER_NAME> HOSA`.

## 2. Add the audio (`public/audio/`)

Put the team's recordings in `public/audio/` with exactly these names. Any slot
without a file plays its `TEMP_` placeholder if one is allowed, otherwise
nothing.

| File | Plays (frames at 30 fps) | Volume | Notes |
|---|---|---|---|
| `start-tone.wav` | f0–10 | 0.8 | TEMP allowed |
| `roomtone-bedroom.wav` | f0–105 | 0.25 | |
| `drawer-slide.wav` | f0–30 | 0.7 | |
| `drawer-thunk.wav` | f45–57 | 0.9 | |
| `lamp-click.wav` | f90–96 | 0.8 | |
| `roomtone-night.wav` | f90–105 | 0.3 | |
| `birds.wav` | f105–150 | 0.4 | fades out f140–150 |
| `chime.wav` | f105, 195, 285, 360 (+30 each) | 0.7 | TEMP allowed |
| `music.wav` | f105–570 | 0.55 → 0.35 over f435–450 | crossfades out f480–510; hard stop f570 |
| `music-muffled.wav` | f480–570 | crossfades in f480–510 | hard stop f570; bake the muffled sound into the file |
| `spoon-clink.wav` | f158–168 | 0.5 | |
| `whoosh.wav` | f210, 570 (+20 each) | 0.7 | TEMP allowed |
| `footstep.wav` | f233, 241, 248, 256, 263, 271, 278, 285 (+8 each) | 0.8 | |
| `roomtone-outdoor.wav` | f225–300 | 0.3 | |
| `guitar-buzz.wav` | f315–345 | 0.9 | |
| `guitar-clean.wav` | f360–390, and again f705–760 at 0.45 | 0.9 | the second use is the callback |
| `ui-tap.wav` | f396, 414 (+4 each) | 0.5 | TEMP allowed |
| `phone-ring.wav` | f399–435 | 0.5 | |
| `footsteps-kitchen.wav` | f435–505 | 0.5 | |
| `keys.wav` | f465–480 | 0.6 | |
| `call.wav` | f435–840 | 1.0 | the real recorded call, already phone-EQ'd; fades out f810–840 |
| `roomtone-kitchen.wav` | f570–840 | 0.35 | fridge hum |
| `teen-laugh.wav` | f660–700 | 0.9 | |
| `pb-chime.wav` | f765–820 | 0.8 | TEMP allowed |

Nothing plays from f840 to the end. The slot table lives in
`src/audio/manifest.ts`.

Then run:

```bash
npm run audio:check   # scans public/audio/ and writes src/audio/available.json
```

Run it after every change to `public/audio/`. The preview and render scripts
below run it for you.

To regenerate the placeholders (`TEMP_start-tone`, `TEMP_chime`, `TEMP_pb-chime`,
`TEMP_whoosh`, `TEMP_ui-tap` and a 120 BPM `TEMP_click-track`), run
`npm run audio:temp`. The click track only plays when the composition prop
`clickTrack` is `true` (toggle it in the Studio's props panel) to check sync.

## 3. Preview

```bash
npm run dev
```

This opens Remotion Studio. Compositions:

| ID | Size | Frames | What |
|---|---|---|---|
| `PersonalBest` | 1920×1080 | 870 (29.0 s) | the PSA |
| `PersonalBestVertical` | 1080×1920 | 870 (29.0 s) | the vertical cut |
| `HudTest` | 1920×1080 | 870 | the HUD alone on #444444 |
| `RigTest` | 1920×1080 | 300 | every character pose, cycle, expression and special drawing (review only) |

## 4. Render

```bash
npm run render          # both formats
npm run render:16x9     # out/personal-best-16x9.mp4
npm run render:9x16     # out/personal-best-9x16.mp4
```

These run `npx remotion render <id> out/<file>.mp4 --codec=h264 --crf=18`. A
single review still:

```bash
npx remotion still PersonalBest review/16x9/frame-0195.png --frame=195
```

If Remotion can't download its own headless browser on your machine, point it
at an installed Chrome/Chromium:
`REMOTION_BROWSER_EXECUTABLE=/path/to/chrome npm run render`.

## Checks

```bash
npm run verify   # both main compositions are 870 frames at 30 fps, shots sum
                 # to 870, every on-beat event is a multiple of 15 frames
npm run lint     # ESLint + TypeScript
```

## Where things are

- `src/timeline.ts`: every frame number in the spec, as named constants
- `src/constants.ts`: palette, sizes, typography, fonts (Inter, JetBrains Mono)
- `src/hud/`: timer, labels, pips, PERSONAL BEST
- `src/character/`: the rig, poses, faces, the overhead sleeper, the close-up face, hands
- `src/scenes/`: the ten shots
- `src/overlays/`: why-line, end card, grain, vignette, placeholder warnings
- `src/audio/`: manifest and audio track
- `src/vertical/`: the 9:16 reframing
- `review/16x9/`, `review/9x16/`: review stills; `review/checkpoint-m3/`: rig and HUD review
- `out/`: final renders

## Where the build departs from the spec

- **HUD width:** 520 px instead of 440. At the spec's type sizes, the longest
  rows ("0:09.50 PHYSICAL EXERCISE", "EMOTIONAL WELL-BEING") don't fit inside a
  440 px panel. The fingertip touches the panel's real left edge, so shot 8's
  touch point is x 1320 (16:9) and x 512 (9:16) instead of 1400 and 592.
- **Figure height:** the spec's body-part sizes put the standing figure at
  about 565 px, not 640. The part sizes were kept, since they match shot 9's
  220 px slide down the cabinet.
- **Floor sit:** SIT_FLOOR keeps the table's angles; the pelvis rolls back 45°
  when seated, which is what lifts the knees (read literally, the thighs would
  be level, as if on a chair).
- **Vertical text widths:** the end card is capped at 800 px and the why-line
  at 876 px (spec: 940 and 900), so that long text can't reach into the
  right-side platform-button zone.
