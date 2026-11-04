import { useCallback, useEffect, useRef, useState } from 'react';
import { Cable, Check, ChevronRight, Headphones, Music2, Play, RotateCcw, Square, Volume2 } from 'lucide-react';
import { Note } from 'tonal';
import {
  cMajor,
  chordVoicing,
  earQuestion,
  fretNote,
  guitarChords,
  guitarStrings,
  intervals,
  keyboardKeys,
  melody,
  noteNames,
  scaleXml,
  tapTempo,
  theoryChord,
} from './music';
import { metronome, playNote, playSequence } from './audio';
import { useLearning, useStudyClock } from './learning';
import { createMidiConnection } from './midi';

export function ScorePreview() {
  const element = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    let display: { clear(): void } | null = null;
    import('opensheetmusicdisplay')
      .then(async ({ OpenSheetMusicDisplay }) => {
        if (cancelled || !element.current) return;
        const osmd = new OpenSheetMusicDisplay(element.current, {
          autoResize: true,
          backend: 'svg',
          drawingParameters: 'compacttight',
          drawTitle: false,
          drawComposer: false,
        });
        display = osmd;
        await osmd.load(scaleXml);
        if (cancelled) return;
        osmd.render();
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      display?.clear();
    };
  }, []);
  return (
    <div className="score-preview">
      <div ref={element} aria-label="C 大调上行音阶五线谱" />
      {loading && <p className="muted">正在排版乐谱…</p>}
      {error && <p>乐谱暂时无法显示。音符顺序：C4 D4 E4 F4 G4 A4 B4 C5。</p>}
    </div>
  );
}

export function PianoTool({ compact = false }: { compact?: boolean }) {
  const { exercise, notify } = useLearning();
  const [mode, setMode] = useState<'free' | 'find' | 'melody'>('free');
  const [active, setActive] = useState<string[]>([]);
  const [target, setTarget] = useState('C4');
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');
  const [midiStatus, setMidiStatus] = useState('');
  const [midiConnected, setMidiConnected] = useState(false);
  const [midiConnecting, setMidiConnecting] = useState(false);
  const toolRef = useRef<HTMLDivElement>(null);
  const midiConnection = useRef<ReturnType<typeof createMidiConnection> | null>(null);
  const highlightTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const [playing, setPlaying] = useState(false);
  useStudyClock(playing);
  useEffect(
    () => () => {
      highlightTimers.current.forEach(clearTimeout);
    },
    [],
  );
  const press = useCallback(
    (note: string) => {
      setPlaying(true);
      playNote(note).catch(() => notify('暂时无法发声，请检查浏览器的声音权限。'));
      setActive(previous => [...previous.filter(item => item !== note), note]);
      const timeout = setTimeout(() => {
        setActive(previous => previous.filter(item => item !== note));
        highlightTimers.current.delete(timeout);
      }, 260);
      highlightTimers.current.add(timeout);
      if (mode === 'find') {
        if (note === target) {
          exercise();
          setMessage(`找到了，${note}！`);
          const available = keyboardKeys.filter(key => !key.note.includes('#') && key.note !== target);
          setTarget(available[Math.floor(Math.random() * available.length)].note);
        } else setMessage(`这是 ${note}，再找找 ${target}。`);
      }
      if (mode === 'melody') {
        if (note === melody[step]) {
          if (step === melody.length - 1) {
            exercise();
            setMessage('完整弹完了一句！再来一次吧。');
            setStep(0);
          } else {
            setStep(previous => previous + 1);
            setMessage('很好，继续下一个音。');
          }
        } else setMessage(`再试一次，当前需要弹 ${melody[step]}。`);
      }
    },
    [mode, target, step, exercise, notify],
  );
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        (event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')
      )
        return;
      const modal = document.querySelector('dialog[open]');
      if (modal && toolRef.current && !modal.contains(toolRef.current)) return;
      const key = keyboardKeys.find(item => item.key === event.key.toLowerCase());
      if (key) {
        event.preventDefault();
        press(key.note);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);
  const latestPress = useRef(press);
  useEffect(() => {
    latestPress.current = press;
  }, [press]);
  useEffect(() => {
    const connection = createMidiConnection(
      () => navigator.requestMIDIAccess({ sysex: false }),
      note => latestPress.current(Note.fromMidi(note)),
      state => {
        setMidiConnected(state.phase === 'connected');
        setMidiConnecting(state.phase === 'connecting');
        setMidiStatus(
          state.phase === 'connecting'
            ? '正在等待 MIDI 访问权限…'
            : state.phase === 'denied'
              ? '未获得 MIDI 访问权限。仍可使用屏幕键盘。'
              : state.phase === 'disconnected'
                ? '键盘已断开'
                : state.inputCount
                  ? `已连接 ${state.inputCount} 个键盘，可直接弹奏`
                  : '尚未发现键盘，请插入 MIDI 设备',
        );
      },
    );
    midiConnection.current = connection;
    return () => {
      connection.dispose();
      midiConnection.current = null;
    };
  }, []);
  function connectMidi() {
    if (!navigator.requestMIDIAccess) {
      setMidiStatus('当前浏览器不支持 MIDI，请使用支持 Web MIDI 的浏览器。');
      return;
    }
    void midiConnection.current?.toggle();
  }
  const whiteKeys = keyboardKeys.filter(key => !key.note.includes('#'));
  return (
    <div className="piano-tool" ref={toolRef}>
      {!compact && (
        <div className="tool-heading">
          <div>
            <span className="eyebrow">YOUR FIRST MELODY</span>
            <h2>每一个音，都从指尖开始</h2>
          </div>
          <button className="button subtle small" onClick={connectMidi} disabled={midiConnecting}>
            <Cable size={15} />
            {midiConnecting ? '正在连接…' : midiConnected ? '断开 MIDI' : '连接 MIDI 键盘'}
          </button>
        </div>
      )}
      <div className="segmented" aria-label="钢琴练习模式">
        {(
          [
            ['free', '自由弹奏'],
            ['find', '找音练习'],
            ['melody', '旋律跟弹'],
          ] as const
        ).map(([id, title]) => (
          <button
            key={id}
            className={mode === id ? 'selected' : ''}
            onClick={() => {
              setMode(id);
              setMessage('');
              setStep(0);
              setPlaying(false);
            }}
          >
            {title}
          </button>
        ))}
      </div>
      <div className="piano-prompt">
        <Music2 size={18} />
        <span>
          {mode === 'free' ? (
            '点击琴键，或用电脑键盘 A–K 弹奏'
          ) : mode === 'find' ? (
            <>
              在键盘上找到 <strong>{target}</strong>
            </>
          ) : (
            <>
              下一音 <strong>{melody[step]}</strong>
              <small>只核对音高，按自己的节奏弹</small>
            </>
          )}
        </span>
        {mode === 'melody' && (
          <button
            className="text-button"
            onClick={() => playSequence(melody).catch(() => notify('无法播放示范，请重试。'))}
          >
            <Play size={14} />
            听示范
          </button>
        )}
      </div>
      {mode === 'melody' && (
        <div className="melody-steps">
          {melody.map((note, index) => (
            <span key={index} className={index === step ? 'current' : index < step ? 'done' : ''}>
              {note.slice(0, -1)}
            </span>
          ))}
        </div>
      )}
      <div className="keyboard" role="group" aria-label="从 C4 到 C5 的钢琴键盘">
        {whiteKeys.map(key => (
          <button
            key={key.note}
            className={`white-key ${active.includes(key.note) ? 'pressed' : ''}`}
            onPointerDown={event => {
              event.preventDefault();
              press(key.note);
            }}
            onClick={event => {
              if (event.detail === 0) press(key.note);
            }}
            aria-label={`弹奏 ${key.note}`}
          >
            <span>
              {key.note}
              <small>{key.key.toUpperCase()}</small>
            </span>
          </button>
        ))}
        {keyboardKeys
          .filter(key => key.note.includes('#'))
          .map(key => {
            const originalIndex = keyboardKeys.indexOf(key);
            const left = keyboardKeys.slice(0, originalIndex).filter(item => !item.note.includes('#')).length;
            return (
              <button
                key={key.note}
                style={{ left: `calc(${left * 12.5}% - 3.5%)` }}
                className={`black-key ${active.includes(key.note) ? 'pressed' : ''}`}
                onPointerDown={event => {
                  event.preventDefault();
                  press(key.note);
                }}
                onClick={event => {
                  if (event.detail === 0) press(key.note);
                }}
                aria-label={`弹奏 ${key.note}`}
              >
                <small>{key.key.toUpperCase()}</small>
              </button>
            );
          })}
      </div>
      <div className="tool-foot">
        <span>三角波合成参考音色 · 中央 C = C4</span>
        {playing && (
          <button className="text-button" onClick={() => setPlaying(false)}>
            结束本次练习
          </button>
        )}
      </div>
      {midiStatus && (
        <p className="tool-feedback" role="status">
          {midiStatus}
        </p>
      )}
      {message && (
        <p className="tool-feedback" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

export function GuitarTool({ compact = false }: { compact?: boolean }) {
  const { notify } = useLearning();
  const [chord, setChord] = useState('Am');
  const [active, setActive] = useState('');
  const [started, setStarted] = useState(false);
  useStudyClock(started);
  const shape = guitarChords[chord];
  function fret(string: number, position: number) {
    const note = fretNote(string, position);
    setActive(`${6 - string} 弦 · ${position === 0 ? '空弦' : `${position} 品`} · ${note}`);
    setStarted(true);
    playNote(note, 'guitar').catch(() => notify('暂时无法发声，请检查声音权限。'));
  }
  return (
    <div className="guitar-tool">
      {!compact && (
        <div className="tool-heading">
          <div>
            <span className="eyebrow">SIX STRINGS, ENDLESS STORIES</span>
            <h2>在六根弦上，找到自己的声音</h2>
          </div>
          <span className="pill">标准调弦</span>
        </div>
      )}
      <p className="muted">点击空弦或品位听参考音。指板从上到下是第 1 弦到第 6 弦。</p>
      <div className="fretboard-scroll">
        <div className="fretboard" role="group" aria-label="吉他前五品指板">
          <div className="fret-numbers">
            <span>空弦</span>
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n}>{n} 品</span>
            ))}
          </div>
          {[5, 4, 3, 2, 1, 0].map(index => (
            <div
              className="string-row"
              key={index}
              style={{ '--string-width': `${1 + (5 - index) * 0.45}px` } as React.CSSProperties}
            >
              {[0, 1, 2, 3, 4, 5].map(position => (
                <button
                  onClick={() => fret(index, position)}
                  key={position}
                  aria-label={`${6 - index} 弦 ${position} 品 ${fretNote(index, position)}`}
                  className={
                    active ===
                    `${6 - index} 弦 · ${position === 0 ? '空弦' : `${position} 品`} · ${fretNote(index, position)}`
                      ? 'active'
                      : ''
                  }
                >
                  <span>{position === 0 ? guitarStrings[index] : Note.pitchClass(fretNote(index, position))}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="chord-area">
        <div>
          <h3>从一个开放和弦开始</h3>
          <div className="chord-options">
            {Object.keys(guitarChords).map(name => (
              <button key={name} className={name === chord ? 'selected' : ''} onClick={() => setChord(name)}>
                {name}
              </button>
            ))}
          </div>
          <p className="muted">
            ○ 空弦可弹　× 不弹
            <br />
            图中从左到右：6 弦 → 1 弦
          </p>
          <button
            className="button primary small"
            onClick={() => {
              setStarted(true);
              playSequence(chordVoicing(chord), true, 'guitar').catch(() => notify('无法播放和弦，请重试。'));
            }}
          >
            <Volume2 size={16} />
            听听 {chord} 和弦
          </button>
        </div>
        <svg className="chord-diagram" viewBox="0 0 180 170" role="img" aria-label={`${chord} 和弦图`}>
          {Array.from({ length: 5 }, (_, i) => (
            <line
              key={i}
              x1="35"
              y1={35 + i * 29}
              x2="145"
              y2={35 + i * 29}
              stroke="#8f9b8d"
              strokeWidth={i === 0 ? 4 : 1}
            />
          ))}
          {shape.map((position, index) => (
            <g key={index}>
              <line x1={35 + index * 22} y1="35" x2={35 + index * 22} y2="151" stroke="#8f9b8d" />
              {position > 0 ? (
                <>
                  <circle cx={35 + index * 22} cy={35 + (position - 0.5) * 29} r="8" fill="#486253" />
                  <text
                    x={35 + index * 22}
                    y={39 + (position - 0.5) * 29}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                  >
                    {position}
                  </text>
                </>
              ) : (
                <text x={35 + index * 22} y="21" textAnchor="middle" fill="#486253" fontSize="15">
                  {position === 0 ? '○' : '×'}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <div className="tool-foot">
        <span role="status">{active || '每前进一品，音高升高一个半音。'}</span>
        {started && (
          <button className="text-button" onClick={() => setStarted(false)}>
            结束练习
          </button>
        )}
      </div>
    </div>
  );
}

export function EarTool({ compact = false }: { compact?: boolean }) {
  const { exercise, notify } = useLearning();
  const [question, setQuestion] = useState(() => earQuestion());
  const [heard, setHeard] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [started, setStarted] = useState(false);
  const playTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (playTimer.current) clearTimeout(playTimer.current);
    },
    [],
  );
  useStudyClock(started);
  async function listen() {
    setPlaying(true);
    setStarted(true);
    try {
      await playSequence(question.notes, false, 'piano', 0.7);
      setHeard(true);
      playTimer.current = setTimeout(() => setPlaying(false), 1400);
    } catch {
      setPlaying(false);
      notify('暂时无法播放题目，请检查声音权限。');
    }
  }
  const right = answer === question.interval.id;
  return (
    <div className="ear-tool">
      {!compact && (
        <div className="tool-heading">
          <div>
            <span className="eyebrow">LISTEN A LITTLE CLOSER</span>
            <h2>两个音之间，藏着多远的距离？</h2>
          </div>
          <span className="pill">入门 · 四种音程</span>
        </div>
      )}
      <div className="ear-stage">
        <span className="round-label">
          第 {round} 题 · 已答对 {correct} 题
        </span>
        <button
          className={`listen-button ${playing ? 'playing' : ''}`}
          onClick={listen}
          disabled={playing}
          aria-label={heard ? '再次播放题目' : '播放音程题目'}
        >
          <Headphones size={34} strokeWidth={1.4} />
        </button>
        <h3>{playing ? '专心听，感受两个音的距离…' : heard ? '这两个音是什么关系？' : '准备好了吗？先听两个音'}</h3>
        <p className="muted">{heard ? '可以重复听，慢慢建立自己的听觉记忆。' : '点击耳机播放，再选择你听到的音程。'}</p>
      </div>
      <div className="ear-options">
        {intervals.map(interval => (
          <button
            key={interval.id}
            disabled={!heard || !!answer || playing}
            className={
              answer
                ? interval.id === question.interval.id
                  ? 'correct'
                  : answer === interval.id
                    ? 'incorrect'
                    : ''
                : ''
            }
            onClick={() => {
              setAnswer(interval.id);
              if (interval.id === question.interval.id) {
                setCorrect(n => n + 1);
                exercise();
              }
            }}
          >
            {interval.title}
            {answer && interval.id === question.interval.id && <Check size={15} />}
          </button>
        ))}
      </div>
      {answer && (
        <div className={`answer-feedback ${right ? 'success' : 'retry'}`} role="status">
          <strong>{right ? '听对了，继续保持。' : `这次是${question.interval.title}，再听一次感受距离。`}</strong>
          <p>
            {question.notes.join(' → ')}，相距 {question.interval.semitones} 个半音。
          </p>
          <button
            className="text-button"
            onClick={() => {
              setQuestion(earQuestion());
              setHeard(false);
              setAnswer(null);
              setRound(n => n + 1);
            }}
          >
            下一题
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      {started && (
        <div className="tool-foot">
          <span>起始音会变化，练习的是距离。</span>
          <button className="text-button" onClick={() => setStarted(false)}>
            暂停计时
          </button>
        </div>
      )}
    </div>
  );
}

export function RhythmTool({ compact = false }: { compact?: boolean }) {
  const { notify, exercise } = useLearning();
  const [bpm, setBpm] = useState(72);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);
  const [taps, setTaps] = useState<number[]>([]);
  const [result, setResult] = useState<ReturnType<typeof tapTempo>>(null);
  const saved = useRef(false);
  useStudyClock(running);
  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let stop: (() => void) | undefined;
    metronome(bpm, beat => {
      if (!cancelled) setBeat(beat);
    })
      .then(dispose => {
        if (cancelled) dispose();
        else stop = dispose;
      })
      .catch(() => {
        if (cancelled) return;
        setBeat(-1);
        setRunning(false);
        notify('暂时无法启动节拍器，请重试。');
      });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [running, bpm, notify]);
  function tap() {
    const now = performance.now();
    const next = taps.length && now - taps[taps.length - 1] <= 5000 ? [...taps, now].slice(-12) : [now];
    setTaps(next);
    const calculation = tapTempo(next);
    setResult(calculation);
    if (calculation && !saved.current) {
      exercise();
      saved.current = true;
    }
  }
  return (
    <div className="rhythm-tool">
      {!compact && (
        <div className="tool-heading">
          <div>
            <span className="eyebrow">FIND YOUR STEADY BEAT</span>
            <h2>慢下来，让每一拍都稳稳落下</h2>
          </div>
          <span className="pill">4/4 拍</span>
        </div>
      )}
      <div className="metronome-body">
        <span className="eyebrow">TEMPO</span>
        <div className="bpm-number">
          {bpm}
          <span>BPM</span>
        </div>
        <label className="range-label">
          <span>40</span>
          <input
            aria-label="节拍器速度"
            type="range"
            min="40"
            max="180"
            value={bpm}
            onChange={event => setBpm(Number(event.target.value))}
          />
          <span>180</span>
        </label>
        <div className="beat-dots">
          {[0, 1, 2, 3].map(index => (
            <i key={index} className={beat === index ? 'active' : ''} />
          ))}
        </div>
        <button
          className="button primary"
          onClick={() => {
            setBeat(-1);
            setRunning(value => !value);
          }}
        >
          {running ? <Square size={15} /> : <Play size={15} />}
          {running ? '停止节拍器' : '开始节拍器'}
        </button>
      </div>
      <div className="tap-area">
        <div>
          <h3>你的节拍有多稳？</h3>
          <p className="muted">连续拍击至少五次，估算拍速与均匀程度。</p>
        </div>
        <button className="button outline" onClick={tap}>
          跟着拍 <span className="tap-count">{taps.length}</span>
        </button>
      </div>
      {result && (
        <div className="tap-result" role="status">
          <span>
            你的拍速 <strong>{result.bpm} BPM</strong>
          </span>
          <span>
            均匀程度 <strong>{result.consistency}%</strong>
          </span>
          <button
            className="icon-button"
            aria-label="重新拍击"
            onClick={() => {
              setTaps([]);
              setResult(null);
              saved.current = false;
            }}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export function TheoryPlayer({ type }: { type: 'scale' | 'chord' | 'sing' | 'score' }) {
  const { notify } = useLearning();
  const [chord, setChord] = useState('C');
  const [octave, setOctave] = useState(4);
  const notes = [...cMajor, 'C5'];
  const play = (sequence: string[], together = false) =>
    playSequence(sequence, together).catch(() => notify('播放失败，请检查声音权限后重试。'));
  return (
    <div className="theory-player">
      {(type === 'score' || type === 'scale') && <ScorePreview />}
      {type === 'chord' ? (
        <>
          <div className="segmented">
            {['C', 'Cm', 'F', 'G', 'Am'].map(name => (
              <button key={name} onClick={() => setChord(name)} className={chord === name ? 'selected' : ''}>
                {name}
              </button>
            ))}
          </div>
          <div className="chord-notes">
            {theoryChord(chord).map(note => (
              <span key={note}>{note.replace('4', '')}</span>
            ))}
          </div>
          <button className="button primary small" onClick={() => play(theoryChord(chord), true)}>
            <Volume2 size={16} />
            播放 {chord} 和弦
          </button>
        </>
      ) : (
        <>
          {type === 'sing' && (
            <div className="sing-intro">
              <Music2 size={24} />
              <p>先听参考音，再轻轻跟唱。选择适合自己的八度。</p>
              <select aria-label="参考音八度" value={octave} onChange={event => setOctave(Number(event.target.value))}>
                <option value={3}>低八度 C3</option>
                <option value={4}>中音区 C4</option>
              </select>
            </div>
          )}
          <div className="solfege">
            {notes.map((note, index) => (
              <button
                key={index}
                onClick={() => play([type === 'sing' ? `${note[0]}${index === 7 ? octave + 1 : octave}` : note])}
              >
                <span>{noteNames[note[0]]}</span>
                <small>{note.replace(/\d/, '')}</small>
              </button>
            ))}
          </div>
          <button
            className="button primary small"
            onClick={() =>
              play(type === 'sing' ? notes.map((note, i) => `${note[0]}${i === 7 ? octave + 1 : octave}`) : notes)
            }
          >
            <Play size={15} />
            播放上行音阶
          </button>
          {type === 'sing' && <p className="muted fineprint">本练习提供参考音，不录音、不自动评分。</p>}
        </>
      )}
    </div>
  );
}
