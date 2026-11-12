import { Fragment, useEffect, useRef, useState } from 'react';
import { Gauge, Play, Square, Volume2 } from 'lucide-react';
import type { JianpuExample, ListenClip } from './data';
import { jianpuEvents, jianpuToMusicXml, parseJianpu, parseSequence } from './jianpu';
import type { Jianpu, JianpuNote, JianpuToken, MusicEvent } from './jianpu';
import { playEvents } from './audio';
import { useLearning, useStudyClock } from './learning';
import { ScorePreview } from './Tools';

/** Starts and stops one playback at a time and reports the sounding event index. */
function usePlayer() {
  const { notify } = useLearning();
  const [playing, setPlaying] = useState<string | null>(null);
  const [step, setStep] = useState(-1);
  const stop = useRef<(() => void) | null>(null);
  const run = useRef(0);
  useStudyClock(playing !== null);
  useEffect(
    () => () => {
      run.current++;
      stop.current?.();
    },
    [],
  );
  function halt() {
    run.current++;
    stop.current?.();
    stop.current = null;
    setPlaying(null);
    setStep(-1);
  }
  function start(
    id: string,
    events: MusicEvent[],
    bpm: number,
    options: { click?: boolean; instrument?: 'piano' | 'guitar' } = {},
  ) {
    halt();
    const current = ++run.current;
    setPlaying(id);
    playEvents(events, bpm, {
      ...options,
      onStep: index => {
        if (run.current !== current) return;
        if (index < 0) {
          setPlaying(null);
          setStep(-1);
        } else setStep(index);
      },
    })
      .then(dispose => {
        if (run.current === current) stop.current = dispose;
        else dispose();
      })
      .catch(() => {
        if (run.current !== current) return;
        setPlaying(null);
        notify('播放失败，请检查声音权限后重试。');
      });
  }
  return { playing, step, start, halt };
}

const accidentalMark = (value: number) => (value > 0 ? '♯' : value < 0 ? '♭' : '');

function JianpuLine({ score, active }: { score: Jianpu; active: number }) {
  const groups: { tokens: { token: JianpuToken; index: number }[]; bar?: JianpuToken }[] = [{ tokens: [] }];
  score.tokens.forEach((token, index) => {
    if (token.kind === 'bar' && token.style === 'single' && index === 0) return;
    if (token.kind === 'bar') {
      groups[groups.length - 1].bar = token;
      groups.push({ tokens: [] });
    } else groups[groups.length - 1].tokens.push({ token, index });
  });
  return (
    <div className="jp-line">
      {groups.map((group, g) => {
        let position = 0;
        let previousLines = 0;
        return (
          <span className="jp-measure" key={g}>
            {group.tokens.map(({ token, index }) => {
              if (token.kind === 'dash') {
                position += 1;
                previousLines = 0;
                return (
                  <span className="jp-dash" key={index}>
                    –
                  </span>
                );
              }
              const note = token as JianpuNote;
              // Underlines of neighbouring short notes join, except where a new beat starts.
              const breakBeam = note.lines > 0 && previousLines > 0 && Number.isInteger(position);
              position += (1 / 2 ** note.lines) * (note.dot ? 1.5 : 1);
              previousLines = note.lines;
              return (
                <span
                  key={index}
                  className={`jp-note${active === index ? ' active' : ''}${breakBeam ? ' beam-break' : ''}`}
                >
                  <span className="jp-dots up">{'•'.repeat(Math.max(0, note.octave))}</span>
                  <span className="jp-digit">
                    {note.accidental ? <sup>{accidentalMark(note.accidental)}</sup> : null}
                    {note.degree}
                    {note.dot && <span className="jp-dot">·</span>}
                  </span>
                  <span className="jp-lines">
                    {Array.from({ length: note.lines }, (_, i) => (
                      <i key={i} />
                    ))}
                  </span>
                  <span className="jp-dots down">{'•'.repeat(Math.max(0, -note.octave))}</span>
                  {note.tie && <span className="jp-tie" aria-hidden="true" />}
                </span>
              );
            })}
            {group.bar && (
              <span className={`jp-bar ${group.bar.kind === 'bar' ? group.bar.style : ''}`} aria-hidden="true" />
            )}
          </span>
        );
      })}
    </div>
  );
}

function JianpuCard({
  example,
  id,
  player,
}: {
  example: JianpuExample;
  id: string;
  player: ReturnType<typeof usePlayer>;
}) {
  const [slow, setSlow] = useState(false);
  const score = parseJianpu(example.score);
  const events = jianpuEvents(score);
  const view = example.view ?? 'jianpu';
  const playing = player.playing === id;
  const active = playing && player.step >= 0 ? (events[player.step]?.token ?? -1) : -1;
  const tempo = (example.tempo ?? 80) * (slow ? 0.75 : 1);
  return (
    <div className="jianpu-card">
      <div className="jp-head">
        <div>
          <strong>{example.title}</strong>
          <span>
            1={score.key.replace('b', '♭').replace('#', '♯')} · {score.beats}/{score.beatType}
          </span>
        </div>
        <div className="jp-actions">
          <button
            className={`text-button${slow ? ' selected' : ''}`}
            aria-pressed={slow}
            onClick={() => setSlow(value => !value)}
          >
            <Gauge size={14} />
            慢速
          </button>
          <button
            className="button primary small"
            onClick={() => (playing ? player.halt() : player.start(id, events, tempo))}
          >
            {playing ? <Square size={14} /> : <Play size={14} />}
            {playing ? '停止' : '播放'}
          </button>
        </div>
      </div>
      {view !== 'staff' && <JianpuLine score={score} active={active} />}
      {view !== 'jianpu' && (
        <ScorePreview
          xml={jianpuToMusicXml(score)}
          label={`${example.title}（五线谱）`}
          fallback="请对照上方的简谱或直接播放。"
        />
      )}
      {example.note && <p className="muted jp-note-text">{example.note}</p>}
    </div>
  );
}

export function JianpuWidget({ examples }: { examples: JianpuExample[] }) {
  const player = usePlayer();
  return (
    <div className="jianpu-widget">
      {examples.map((example, index) => (
        <Fragment key={example.title}>
          <JianpuCard example={example} id={`jp-${index}`} player={player} />
        </Fragment>
      ))}
      <p className="muted fineprint">播放时会高亮正在发声的音。参考音色为合成钢琴，不代表真实乐器或人声。</p>
    </div>
  );
}

export function ListenWidget({ clips }: { clips: ListenClip[] }) {
  const player = usePlayer();
  return (
    <div className="listen-widget">
      {clips.map((clip, index) => {
        const id = `clip-${index}`;
        const playing = player.playing === id;
        return (
          <button
            key={clip.label}
            className={`listen-clip${playing ? ' playing' : ''}`}
            aria-pressed={playing}
            onClick={() =>
              playing
                ? player.halt()
                : player.start(id, parseSequence(clip.seq), clip.tempo ?? 90, {
                    click: clip.click,
                    instrument: clip.instrument,
                  })
            }
          >
            <span className="listen-clip-icon">{playing ? <Square size={15} /> : <Volume2 size={16} />}</span>
            <span>
              <strong>{clip.label}</strong>
              {clip.note && <small>{clip.note}</small>}
            </span>
          </button>
        );
      })}
      <p className="muted fineprint">声音只在点击后播放；再次点击可停止。参考音色为合成音色。</p>
    </div>
  );
}

/** Plays the sound of a listening question. */
export function QuestionSound({ seq }: { seq: string }) {
  const player = usePlayer();
  const playing = player.playing === 'q';
  return (
    <button
      className="button outline small question-sound"
      onClick={() => (playing ? player.halt() : player.start('q', parseSequence(seq), 80))}
    >
      {playing ? <Square size={14} /> : <Volume2 size={15} />}
      {playing ? '停止' : '先听一听'}
    </button>
  );
}
