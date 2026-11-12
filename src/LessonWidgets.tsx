import { Fragment, useEffect, useRef, useState } from 'react';
import {
  Cable,
  Circle,
  Eye,
  Gauge,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Shuffle,
  Square,
  Trash2,
  Volume2,
} from 'lucide-react';
import { Note } from 'tonal';
import type { JianpuExample, ListenClip, PitchTask, PlayTarget, RecordTask, TabExample } from './data';
import { detectPitch, matchesTarget, nearestNote } from './pitch';
import type { NoteReading } from './pitch';
import { parseTab, tabEvents } from './tab';
import {
  jianpuEvents,
  jianpuToMusicXml,
  mergeParts,
  parseJianpu,
  parseSequence,
  rhythmAccuracy,
  shiftOctaves,
  sightReading,
} from './jianpu';
import type { Jianpu, JianpuNote, JianpuToken, MusicEvent, SightOptions } from './jianpu';
import { playEvents, playNote } from './audio';
import { createMidiConnection } from './midi';
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
    options: { click?: boolean; instrument?: 'piano' | 'guitar' | 'wind' } = {},
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
  // A left-hand part shares the right hand's key and time signature unless it states its own.
  const left = example.left
    ? parseJianpu(
        /^1=/.test(example.left) ? example.left : `1=${score.key} ${score.beats}/${score.beatType} ${example.left}`,
      )
    : undefined;
  const events = shiftOctaves(
    left ? mergeParts(jianpuEvents(score), jianpuEvents(left)) : jianpuEvents(score),
    example.playOctave,
  );
  const view = example.view ?? 'jianpu';
  const playing = player.playing === id;
  // The latest sounding note of each hand is highlighted.
  const activeFor = (part?: 'right' | 'left') => {
    if (!playing || player.step < 0) return -1;
    for (let i = player.step; i >= 0; i--) if (!left || events[i].part === part) return events[i].token ?? -1;
    return -1;
  };
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
            onClick={() =>
              playing ? player.halt() : player.start(id, events, tempo, { instrument: example.instrument })
            }
          >
            {playing ? <Square size={14} /> : <Play size={14} />}
            {playing ? '停止' : '播放'}
          </button>
        </div>
      </div>
      {view !== 'staff' &&
        (left ? (
          <div className="jp-hands">
            <span className="jp-hand-label">右手</span>
            <JianpuLine score={score} active={activeFor('right')} />
            <span className="jp-hand-label">左手</span>
            <JianpuLine score={left} active={activeFor('left')} />
          </div>
        ) : (
          <JianpuLine score={score} active={activeFor()} />
        ))}
      {view !== 'jianpu' && (
        <ScorePreview
          xml={jianpuToMusicXml(score, '', { clef: example.clef, left })}
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
      <p className="muted fineprint">播放时会高亮正在发声的音。参考音色为合成音色，不代表真实乐器或人声。</p>
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

/** A keyboard covering the given MIDI range, for screen presses; highlights the next expected key. */
function RangeKeyboard({
  low,
  high,
  next,
  pressed,
  onPress,
}: {
  low: number;
  high: number;
  next?: number;
  pressed: number[];
  onPress: (midi: number) => void;
}) {
  const keys = Array.from({ length: high - low + 1 }, (_, i) => low + i);
  const isBlack = (midi: number) => [1, 3, 6, 8, 10].includes(midi % 12);
  const whites = keys.filter(midi => !isBlack(midi));
  const unit = 100 / whites.length;
  const keyProps = (midi: number) => ({
    onPointerDown: (event: React.PointerEvent) => {
      event.preventDefault();
      onPress(midi);
    },
    onClick: (event: React.MouseEvent) => {
      if (event.detail === 0) onPress(midi);
    },
    'aria-label': `弹奏 ${Note.fromMidi(midi)}`,
  });
  return (
    <div
      className="keyboard range-keyboard"
      role="group"
      aria-label={`从 ${Note.fromMidi(low)} 到 ${Note.fromMidi(high)} 的钢琴键盘`}
    >
      {whites.map(midi => (
        <button
          key={midi}
          className={`white-key${pressed.includes(midi) ? ' pressed' : ''}${next === midi ? ' next' : ''}`}
          {...keyProps(midi)}
        >
          <span>{midi % 12 === 0 ? Note.fromMidi(midi) : ''}</span>
        </button>
      ))}
      {keys.filter(isBlack).map(midi => {
        const before = whites.filter(white => white < midi).length;
        return (
          <button
            key={midi}
            style={{ left: `calc(${before * unit}% - ${unit * 0.28}%)`, width: `${unit * 0.56}%` }}
            className={`black-key${pressed.includes(midi) ? ' pressed' : ''}${next === midi ? ' next' : ''}`}
            {...keyProps(midi)}
          />
        );
      })}
    </div>
  );
}

/**
 * Play-along check: plays the target, then follows the learner note by note on the screen keyboard or a MIDI
 * keyboard. Pitches must match; timing is reported as a share of the written proportions, not graded.
 */
function PlayCheckCard({
  target,
  id,
  player,
}: {
  target: PlayTarget;
  id: string;
  player: ReturnType<typeof usePlayer>;
}) {
  const { exercise, notify } = useLearning();
  const score = parseJianpu(target.score);
  const events = jianpuEvents(score);
  // Notes with their start in beats, so rests count toward the gap before the next note.
  const expected: { midi: number; start: number; token?: number }[] = [];
  let at = 0;
  for (const event of events) {
    if (event.notes.length) expected.push({ midi: Note.midi(event.notes[0])!, start: at, token: event.token });
    at += event.beats;
  }
  const low = Math.floor(Math.min(...expected.map(item => item.midi)) / 12) * 12;
  const high = Math.max(low + 12, Math.ceil((Math.max(...expected.map(item => item.midi)) + 1) / 12) * 12);
  const [index, setIndex] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [pressed, setPressed] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [rounds, setRounds] = useState(0);
  const [midiState, setMidiState] = useState({ connected: false, connecting: false, status: '' });
  const midi = useRef<ReturnType<typeof createMidiConnection> | null>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useStudyClock(index > 0);
  function press(note: number) {
    playNote(Note.fromMidi(note)).catch(() => notify('暂时无法发声，请检查浏览器的声音权限。'));
    setPressed(list => [...list.filter(item => item !== note), note]);
    const timeout = setTimeout(() => {
      setPressed(list => list.filter(item => item !== note));
      timers.current.delete(timeout);
    }, 240);
    timers.current.add(timeout);
    const want = expected[index];
    if (note !== want.midi) {
      setMessage(`这是 ${Note.fromMidi(note)}，下一个音是 ${Note.fromMidi(want.midi)}。`);
      return;
    }
    const played = [...times, performance.now()];
    if (index < expected.length - 1) {
      setTimes(played);
      setIndex(index + 1);
      setMessage(index === 0 ? '开始了，按自己的速度保持均匀。' : '');
      return;
    }
    const gaps = expected.slice(1).map((item, i) => item.start - expected[i].start);
    const accuracy = rhythmAccuracy(gaps, played);
    exercise();
    setRounds(value => value + 1);
    setMessage(
      `音高全部正确！${accuracy === null ? '' : `节奏比例吻合度约 ${accuracy}%（只比较音与音之间的长短关系）。`}可以再弹一遍。`,
    );
    setIndex(0);
    setTimes([]);
  }
  const latest = useRef(press);
  useEffect(() => {
    latest.current = press;
  });
  useEffect(() => {
    const list = timers.current;
    const connection = createMidiConnection(
      () => navigator.requestMIDIAccess({ sysex: false }),
      note => latest.current(note),
      state =>
        setMidiState({
          connected: state.phase === 'connected',
          connecting: state.phase === 'connecting',
          status:
            state.phase === 'connecting'
              ? '正在等待 MIDI 访问权限…'
              : state.phase === 'denied'
                ? '未获得 MIDI 访问权限，仍可使用屏幕键盘。'
                : state.phase === 'disconnected'
                  ? '键盘已断开'
                  : state.inputCount
                    ? `已连接 ${state.inputCount} 个键盘，可以直接弹`
                    : '尚未发现键盘，请插入 MIDI 设备',
        }),
    );
    midi.current = connection;
    return () => {
      connection.dispose();
      midi.current = null;
      list.forEach(clearTimeout);
    };
  }, []);
  const playing = player.playing === id;
  const demoToken = playing && player.step >= 0 ? (events[player.step]?.token ?? -1) : -1;
  return (
    <div className="play-check">
      <div className="jp-head">
        <div>
          <strong>{target.title}</strong>
          <span>
            第 {Math.min(index + 1, expected.length)} / {expected.length} 个音{rounds ? ` · 已完成 ${rounds} 遍` : ''}
          </span>
        </div>
        <div className="jp-actions">
          <button
            className="text-button"
            onClick={() => (playing ? player.halt() : player.start(id, events, target.tempo ?? 80))}
          >
            {playing ? <Square size={14} /> : <Play size={14} />}
            {playing ? '停止' : '听示范'}
          </button>
          <button
            className="text-button"
            onClick={() => {
              setIndex(0);
              setTimes([]);
              setMessage('');
            }}
          >
            <RotateCcw size={14} />
            重新开始
          </button>
          <button
            className="button subtle small"
            disabled={midiState.connecting}
            onClick={() => {
              if (!navigator.requestMIDIAccess) {
                setMidiState(state => ({ ...state, status: '当前浏览器不支持 MIDI，请使用屏幕键盘。' }));
                return;
              }
              void midi.current?.toggle();
            }}
          >
            <Cable size={14} />
            {midiState.connecting ? '正在连接…' : midiState.connected ? '断开 MIDI' : '连接 MIDI 键盘'}
          </button>
        </div>
      </div>
      <JianpuLine score={score} active={playing ? demoToken : (expected[index]?.token ?? -1)} />
      <RangeKeyboard low={low} high={high} next={expected[index]?.midi} pressed={pressed} onPress={press} />
      {(message || midiState.status) && (
        <p className="tool-feedback" role="status">
          {message || midiState.status}
        </p>
      )}
      {target.note && <p className="muted jp-note-text">{target.note}</p>}
    </div>
  );
}

export function PlayCheck({ targets }: { targets: PlayTarget[] }) {
  const player = usePlayer();
  return (
    <div className="jianpu-widget">
      {targets.map((target, index) => (
        <PlayCheckCard key={target.title} target={target} id={`play-${index}`} player={player} />
      ))}
      <p className="muted fineprint">
        高亮的数字和琴键是下一个要弹的音。网站只核对音高和音与音之间的长短比例，不判断触键、力度和手型。
      </p>
    </div>
  );
}

const sightLevels: { id: string; title: string; options: SightOptions }[] = [
  { id: 'five', title: '五指位 do–sol', options: { range: [0, 4] } },
  { id: 'octave', title: '一个八度', options: { range: [-3, 7] } },
  { id: 'eighths', title: '一个八度 + 八分音符', options: { range: [-3, 7], eighths: true } },
];

/** Generates short melodies to read: staff first, the 简谱 answer and playback on request. */
export function SightReading({ options, choose = false }: { options?: SightOptions; choose?: boolean }) {
  const player = usePlayer();
  const { exercise } = useLearning();
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000));
  const [reveal, setReveal] = useState(false);
  const [level, setLevel] = useState(sightLevels[0].id);
  const [key, setKey] = useState<'C' | 'G' | 'F' | 'D'>(options?.key ?? 'C');
  const [meter, setMeter] = useState<2 | 3 | 4>(options?.meter ?? 4);
  const settings: SightOptions = choose
    ? { ...sightLevels.find(item => item.id === level)!.options, key, meter }
    : (options ?? {});
  const source = sightReading(seed, settings);
  const score = parseJianpu(source);
  const events = shiftOctaves(jianpuEvents(score), settings.playOctave);
  const playing = player.playing === 'sight';
  const active = playing && player.step >= 0 ? (events[player.step]?.token ?? -1) : -1;
  return (
    <div className="sight-reading">
      {choose && (
        <div className="sight-options">
          <div className="segmented" role="group" aria-label="难度">
            {sightLevels.map(item => (
              <button key={item.id} className={level === item.id ? 'selected' : ''} onClick={() => setLevel(item.id)}>
                {item.title}
              </button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label="调">
            {(['C', 'G', 'F'] as const).map(item => (
              <button key={item} className={key === item ? 'selected' : ''} onClick={() => setKey(item)}>
                {item} 大调
              </button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label="拍号">
            {([2, 3, 4] as const).map(item => (
              <button key={item} className={meter === item ? 'selected' : ''} onClick={() => setMeter(item)}>
                {item}/4
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="jianpu-card">
        <div className="jp-head">
          <div>
            <strong>视奏第 {seed % 1000} 条</strong>
            <span>先看谱：找调号、拍号和第一个音，再在心里数一小节拍子。</span>
          </div>
          <div className="jp-actions">
            <button className="text-button" aria-pressed={reveal} onClick={() => setReveal(value => !value)}>
              <Eye size={14} />
              {reveal ? '隐藏简谱' : '显示简谱'}
            </button>
            <button
              className="text-button"
              onClick={() =>
                playing ? player.halt() : player.start('sight', events, 72, { instrument: settings.instrument })
              }
            >
              {playing ? <Square size={14} /> : <Play size={14} />}
              {playing ? '停止' : '播放对照'}
            </button>
            <button
              className="button primary small"
              onClick={() => {
                player.halt();
                exercise();
                setReveal(false);
                setSeed(value => value + 1);
              }}
            >
              <Shuffle size={14} />
              下一条
            </button>
          </div>
        </div>
        <ScorePreview xml={jianpuToMusicXml(score)} label="视奏练习（五线谱）" fallback="请点“显示简谱”。" />
        {reveal && <JianpuLine score={score} active={active} />}
      </div>
      <p className="muted fineprint">旋律由程序随机生成，以级进为主；点“下一条”计为一次练习。</p>
    </div>
  );
}

const stringNames = ['e', 'B', 'G', 'D', 'A', 'E'];

/** Six-line tablature with playback on the guitar voice; the sounding column is highlighted. */
function TabCard({ example, id, player }: { example: TabExample; id: string; player: ReturnType<typeof usePlayer> }) {
  const [slow, setSlow] = useState(false);
  const tab = parseTab(example.score);
  const events = tabEvents(tab);
  const playing = player.playing === id;
  const active = playing && player.step >= 0 ? (events[player.step]?.token ?? -1) : -1;
  const tempo = (example.tempo ?? 80) * (slow ? 0.75 : 1);
  return (
    <div className="jianpu-card">
      <div className="jp-head">
        <div>
          <strong>{example.title}</strong>
          <span>
            六线谱 · {tab.beats}/{tab.beatType} · 最上面一条线是第 1 弦
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
            onClick={() => (playing ? player.halt() : player.start(id, events, tempo, { instrument: 'guitar' }))}
          >
            {playing ? <Square size={14} /> : <Play size={14} />}
            {playing ? '停止' : '播放'}
          </button>
        </div>
      </div>
      <div className="tab-staff" role="img" aria-label={`${example.title}：六线谱 ${example.score}`}>
        <div className="tab-labels" aria-hidden="true">
          {stringNames.map((name, i) => (
            <span key={i}>{name}</span>
          ))}
        </div>
        {tab.tokens.map((token, index) =>
          token.kind === 'bar' ? (
            <span key={index} className={`tab-bar${token.final ? ' final' : ''}`} aria-hidden="true" />
          ) : (
            <span
              key={index}
              className={`tab-col${active === index ? ' active' : ''}${token.kind === 'note' && token.up ? ' up' : ''}`}
              style={{ flexGrow: token.beats, minWidth: `${Math.max(24, token.beats * 30)}px` }}
              aria-hidden="true"
            >
              {[1, 2, 3, 4, 5, 6].map(string => {
                const note = token.kind === 'note' ? token.notes.find(item => item.string === string) : undefined;
                return <span key={string}>{note ? <b>{note.fret}</b> : null}</span>;
              })}
            </span>
          ),
        )}
      </div>
      {example.note && <p className="muted jp-note-text">{example.note}</p>}
    </div>
  );
}

export function TabWidget({ examples }: { examples: TabExample[] }) {
  const player = usePlayer();
  return (
    <div className="jianpu-widget">
      {examples.map((example, index) => (
        <TabCard key={example.title} example={example} id={`tab-${index}`} player={player} />
      ))}
      <p className="muted fineprint">
        横线代表六根弦，数字是品位，0 是空弦。播放使用合成拨弦音色，不代表真实吉他的音色。
      </p>
    </div>
  );
}

const showNote = (note: string) => note.replace('#', '♯');

/**
 * Live pitch from the microphone. Free mode shows the nearest note and its deviation; with targets the learner
 * holds each note in tune for a moment to move on. Sound is analysed on the page and never recorded or sent.
 */
export function PitchWidget({ task }: { task: PitchTask }) {
  const { exercise, notify } = useLearning();
  const targets = task.targets ?? [];
  const tolerance = task.tolerance ?? 25;
  const hold = task.hold ?? 1;
  const [running, setRunning] = useState(false);
  const [reading, setReading] = useState<NoteReading | null>(null);
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(0);
  const [status, setStatus] = useState('');
  const session = useRef<(() => void) | null>(null);
  useStudyClock(running);
  useEffect(() => () => session.current?.(), []);
  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('当前浏览器不支持麦克风。');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      context.createMediaStreamSource(stream).connect(analyser);
      const buffer = new Float32Array(analyser.fftSize);
      const recent: number[] = [];
      const progress = { index: 0, held: 0 };
      let last = performance.now();
      let frame = 0;
      const loop = () => {
        frame = requestAnimationFrame(loop);
        const now = performance.now();
        if (now - last < 60) return;
        const elapsed = Math.min(0.2, (now - last) / 1000);
        last = now;
        analyser.getFloatTimeDomainData(buffer);
        const result = detectPitch(buffer, context.sampleRate);
        if (!result || result.clarity < 0.8) {
          recent.length = 0;
          setReading(null);
          return;
        }
        // The median of the last three readings smooths out single wrong frames.
        recent.push(result.frequency);
        if (recent.length > 3) recent.shift();
        const sorted = [...recent].sort((a, b) => a - b);
        const current = nearestNote(sorted[Math.floor(sorted.length / 2)]);
        setReading(current);
        if (progress.index >= targets.length) return;
        progress.held = matchesTarget(current, targets[progress.index], tolerance, task.anyOctave)
          ? progress.held + elapsed
          : Math.max(0, progress.held - elapsed);
        if (progress.held >= hold) {
          progress.index++;
          progress.held = 0;
          setIndex(progress.index);
          if (progress.index === targets.length) exercise();
        }
        setHeld(progress.held);
      };
      loop();
      session.current = () => {
        cancelAnimationFrame(frame);
        stream.getTracks().forEach(track => track.stop());
        void context.close();
      };
      setIndex(0);
      setHeld(0);
      setStatus('');
      setRunning(true);
    } catch {
      setStatus('没有获得麦克风权限。可以在浏览器地址栏左侧的权限设置里允许麦克风后再试。');
    }
  }
  function stop() {
    session.current?.();
    session.current = null;
    setRunning(false);
    setReading(null);
  }
  const target = targets[index];
  const inTune = reading && Math.abs(reading.cents) <= tolerance;
  return (
    <div className="pitch-widget">
      <div className="jp-head">
        <div>
          <strong>{task.title}</strong>
          <span>
            {targets.length
              ? index < targets.length
                ? `目标 ${index + 1} / ${targets.length}：${showNote(target)}${task.anyOctave ? '（任意八度）' : ''}，保持 ${hold} 秒`
                : '全部完成！可以再来一遍，或换一个更舒服的音区。'
              : '对着麦克风唱或演奏一个清楚的长音。'}
          </span>
        </div>
        <div className="jp-actions">
          {target && (
            <button
              className="text-button"
              onClick={() => playNote(target, task.instrument ?? 'piano').catch(() => notify('暂时无法播放参考音。'))}
            >
              <Volume2 size={14} />
              参考音
            </button>
          )}
          {targets.length > 0 && index >= targets.length && (
            <button className="text-button" onClick={() => setIndex(0)}>
              <RotateCcw size={14} />
              再来一遍
            </button>
          )}
          <button className="button primary small" onClick={() => (running ? stop() : void start())}>
            {running ? <MicOff size={14} /> : <Mic size={14} />}
            {running ? '停止' : '开始听'}
          </button>
        </div>
      </div>
      {targets.length > 0 && (
        <div className="pitch-targets">
          {targets.map((note, i) => (
            <span key={`${note}-${i}`} className={i < index ? 'done' : i === index ? 'current' : ''}>
              {showNote(note)}
            </span>
          ))}
        </div>
      )}
      <div className={`pitch-display${running ? '' : ' idle'}`} role="status" aria-live="polite">
        <strong className={inTune ? 'in-tune' : ''}>{reading ? showNote(reading.note) : running ? '…' : '—'}</strong>
        <span>
          {reading
            ? Math.abs(reading.cents) <= 5
              ? '很准'
              : `${reading.cents > 0 ? '偏高' : '偏低'} ${Math.abs(reading.cents)} 音分`
            : running
              ? '正在听，请发出一个清楚的长音'
              : '点“开始听”并允许使用麦克风'}
        </span>
        <div className="pitch-gauge" aria-hidden="true">
          <i className="band" style={{ left: `${50 - tolerance}%`, width: `${tolerance * 2}%` }} />
          {reading && <b style={{ left: `${50 + reading.cents}%` }} />}
        </div>
        {target && running && (
          <div className="pitch-hold" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (held / hold) * 100)}%` }} />
          </div>
        )}
      </div>
      {status && (
        <p className="tool-feedback" role="status">
          {status}
        </p>
      )}
      {task.note && <p className="muted jp-note-text">{task.note}</p>}
      <p className="muted fineprint">
        声音只在本页面实时分析，不录音、不上传。适合一次一个清楚的长音；环境噪声、和弦或气声较多时读数会不稳定，仅供参考。
      </p>
    </div>
  );
}

/** Records takes in the page for immediate playback; nothing is uploaded or kept after leaving. */
export function RecordWidget({ task }: { task: RecordTask }) {
  const { exercise } = useLearning();
  const player = usePlayer();
  const limit = task.seconds ?? 60;
  const [takes, setTakes] = useState<{ url: string; seconds: number }[]>([]);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState('');
  const stopRef = useRef<(() => void) | null>(null);
  const urls = useRef<string[]>([]);
  useStudyClock(recording);
  useEffect(() => {
    const list = urls.current;
    return () => {
      stopRef.current?.();
      list.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);
  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatus('当前浏览器不支持录音，可以用手机自带的录音功能代替。');
      return;
    }
    try {
      player.halt();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      const began = performance.now();
      recorder.ondataavailable = event => chunks.push(event.data);
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        const url = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType }));
        urls.current.push(url);
        const seconds = Math.round((performance.now() - began) / 1000);
        setTakes(list => {
          if (!list.length) exercise();
          return [...list, { url, seconds }];
        });
      };
      recorder.start();
      const timer = setInterval(() => {
        const passed = (performance.now() - began) / 1000;
        setElapsed(passed);
        if (passed >= limit) stopRef.current?.();
      }, 200);
      stopRef.current = () => {
        clearInterval(timer);
        if (recorder.state !== 'inactive') recorder.stop();
        stopRef.current = null;
        setRecording(false);
      };
      setElapsed(0);
      setStatus('');
      setRecording(true);
    } catch {
      setStatus('没有获得麦克风权限。可以在浏览器地址栏左侧的权限设置里允许麦克风后再试。');
    }
  }
  return (
    <div className="record-widget">
      <div className="jp-head">
        <div>
          <strong>{task.title}</strong>
          <span>{task.prompt}</span>
        </div>
        <div className="jp-actions">
          {task.reference && (
            <button
              className="text-button"
              onClick={() =>
                player.playing === 'ref'
                  ? player.halt()
                  : player.start('ref', parseSequence(task.reference!.seq), task.reference!.tempo ?? 80, {
                      instrument: task.reference!.instrument,
                      click: task.reference!.click,
                    })
              }
            >
              {player.playing === 'ref' ? <Square size={14} /> : <Volume2 size={14} />}
              {task.reference.label}
            </button>
          )}
          <button
            className={`button small ${recording ? 'recording' : 'primary'}`}
            onClick={() => (recording ? stopRef.current?.() : void start())}
          >
            {recording ? <Square size={14} /> : <Circle size={14} />}
            {recording ? `停止（${Math.floor(elapsed)} / ${limit} 秒）` : '开始录音'}
          </button>
        </div>
      </div>
      {takes.length > 0 && (
        <ol className="record-takes">
          {takes.map((take, i) => (
            <li key={take.url}>
              <span>
                第 {i + 1} 遍 · {take.seconds} 秒
              </span>
              <audio controls src={take.url} />
              <button
                className="icon-button"
                aria-label={`删除第 ${i + 1} 遍录音`}
                onClick={() => {
                  URL.revokeObjectURL(take.url);
                  setTakes(list => list.filter(item => item.url !== take.url));
                }}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ol>
      )}
      {status && (
        <p className="tool-feedback" role="status">
          {status}
        </p>
      )}
      <p className="muted fineprint">
        录音只保存在当前页面，不会上传；刷新或离开本课后自动清除。多录几遍、对比着听，比只录一遍更有收获。
      </p>
    </div>
  );
}
