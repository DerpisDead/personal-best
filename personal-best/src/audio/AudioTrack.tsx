import { Audio } from '@remotion/media';
import { Sequence, staticFile, useVideoConfig } from 'remotion';
import available from './available.json';
import { CLICK_TRACK, resolveSlot, SLOTS, slotClips, slotVolume } from './manifest';

const files: readonly string[] = available.files;

const resolved = SLOTS.map((slot) => ({ slot, source: resolveSlot(slot, files) }));
const tempInUse = resolved.filter((r) => r.source?.temp).map((r) => r.source?.file);

if (tempInUse.length > 0) {
  console.warn(
    [
      '',
      '########################################################',
      '###                TEMP AUDIO IN USE                 ###',
      '###  Replace every TEMP_ sound with team-made audio  ###',
      '###  before this video is used anywhere.             ###',
      '########################################################',
      ...tempInUse.map((f) => `  - ${f}`),
    ].join('\n'),
  );
}

type AudioTrackProps = {
  readonly clickTrack: boolean;
};

/** Every audio slot of section 9, each clip at its absolute frames. */
export const AudioTrack: React.FC<AudioTrackProps> = ({ clickTrack }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence name="Audio" layout="none">
      {resolved.flatMap(({ slot, source }) =>
        source
          ? slotClips(slot).map((clip) => (
              <Audio
                key={`${slot.slot}-${clip.from}`}
                name={`${slot.slot}${source.temp ? ' (TEMP)' : ''}`}
                src={staticFile(`audio/${source.file}`)}
                from={clip.from}
                durationInFrames={clip.durationInFrames}
                premountFor={fps}
                volume={(f) => slotVolume(slot, clip.from + f)}
              />
            ))
          : [],
      )}
      {clickTrack && files.includes(CLICK_TRACK) ? (
        <Audio name="Click track (TEMP)" src={staticFile(`audio/${CLICK_TRACK}`)} volume={0.6} />
      ) : null}
    </Sequence>
  );
};
