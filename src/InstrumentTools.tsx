import { useEffect, useState } from 'react';
import { Play, Square, Volume2 } from 'lucide-react';
import { basicDrumPattern, drumVoices, emptyDrumPattern, instrumentProfiles, stringNote } from './instrument-profiles';
import type { DrumPattern, DrumVoice } from './instrument-profiles';
import type { Track } from './data';
import { drumLoop, playDrum, playSequence } from './audio';
import { useLearning, useStudyClock } from './learning';

export function InstrumentTool({ track }: { track: Track }) {
  const profile = instrumentProfiles.find(item => item.track === track);
  const { notify, exercise } = useLearning();
  const [active, setActive] = useState(false);
  const [chord, setChord] = useState('C');
  const [lastNote, setLastNote] = useState('');
  useStudyClock(active);
  if (!profile) return null;
  const selectedChord = profile.chords?.[chord];
  async function sound(notes: string[], together = false) {
    try {
      await playSequence(notes, together, profile!.sound, 0.5);
      if (!active) exercise();
      setActive(true); setLastNote(notes.join(' → ').replaceAll('#', '♯').replaceAll('b', '♭'));
    } catch { notify('暂时无法播放参考音，请检查浏览器声音设置后重试。'); }
  }
  return <div className="instrument-tool">
    <div className="instrument-heading"><h3>{profile.title}</h3><p>{profile.guide}</p></div>
    <div className={`reference-notes ${track === 'guzheng' ? 'zheng-notes' : ''}`}>{profile.notes.map((item, index) => <button key={`${item.label}-${index}`} className={lastNote === item.note.replace('#', '♯').replace('b', '♭') ? 'selected' : ''} onClick={() => sound([item.note])}><Volume2 size={13} /><span>{item.label}</span></button>)}</div>
    {profile.frets && <div className="bass-fretboard" role="group" aria-label="贝斯前五品参考音">{profile.notes.map(item => <div className="bass-string" key={item.note}><span>{item.note}</span>{Array.from({ length: 6 }, (_, fret) => <button key={fret} aria-label={`${item.note} 弦第 ${fret} 品 ${stringNote(item.note, fret)}`} onClick={() => sound([stringNote(item.note, fret)])}><small>{fret === 0 ? '空弦' : `${fret} 品`}</small>{stringNote(item.note, fret)}</button>)}</div>)}</div>}
    {profile.chords && selectedChord && <div className="ukulele-chords"><div className="chord-options" role="group" aria-label="尤克里里和弦">{Object.keys(profile.chords).map(name => <button className={name === chord ? 'active' : ''} key={name} onClick={() => setChord(name)}>{name}</button>)}</div><p>第 4 → 第 1 弦的品位：<strong>{selectedChord.join(' · ')}</strong></p><button className="button outline small" onClick={() => sound(selectedChord.map((fret, index) => stringNote(profile.notes[index].note, fret)), true)}><Play size={13} />听 {chord} 和弦</button></div>}
    <div className="instrument-exercise"><p>{profile.exercise}</p><button className="button primary small" onClick={() => sound(profile.phrase)}><Play size={14} />听本课短句</button></div>
    <p className="reference-caption">合成参考音用于辨认音高，不模拟该乐器的真实音色或演奏评分。</p>
    {lastNote && <p className="tool-feedback" role="status">最近播放：{lastNote}</p>}
    {active && <button className="text-button" onClick={() => setActive(false)}>结束参考音练习</button>}
  </div>;
}

export function InstrumentPractice() {
  const [track, setTrack] = useState<Track>('ukulele');
  return <><label className="instrument-picker">选择乐器<select aria-label="选择乐器" value={track} onChange={event => setTrack(event.target.value as Track)}>{instrumentProfiles.map(item => <option key={item.track} value={item.track}>{item.title}</option>)}</select></label><InstrumentTool track={track} key={track} /></>;
}

export function DrumTool() {
  const [pattern, setPattern] = useState<DrumPattern>(basicDrumPattern);
  const [bpm, setBpm] = useState(72);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const { notify, exercise } = useLearning();
  useStudyClock(running);
  useEffect(() => {
    if (!running) { setStep(-1); return; }
    let cancelled = false; let stop: (() => void) | undefined;
    drumLoop(pattern, bpm, setStep).then(dispose => { if (cancelled) dispose(); else stop = dispose; }).catch(() => { setRunning(false); notify('鼓机暂时无法播放，请重试。'); });
    return () => { cancelled = true; stop?.(); };
  }, [running, pattern, bpm, notify]);
  function toggle(voice: DrumVoice, index: number) { setPattern(current => ({ ...current, [voice]: current[voice].map((on, i) => i === index ? !on : on) })); }
  return <div className="drum-tool"><div className="instrument-heading"><h3>八步鼓机 · 你的第一条律动</h3><p>每格半拍，一圈是 4/4 的一小节。点亮格子编节奏，点击鼓垫单独听声音。</p></div>
    <div className="drum-controls"><label>速度 <input aria-label="鼓机速度" type="range" min="40" max="140" value={bpm} onChange={event => setBpm(Number(event.target.value))} /><strong>{bpm} BPM</strong></label><button className="button primary small" onClick={() => { if (!running) exercise(); setRunning(value => !value); }}>{running ? <Square size={14} /> : <Play size={14} />}{running ? '停止鼓机' : '播放节奏'}</button></div>
    <div className="drum-grid" role="group" aria-label="八步节奏编辑器"><div className="drum-count"><span>拍子</span>{['1', '和', '2', '和', '3', '和', '4', '和'].map((label, index) => <span className={step === index ? 'current-step' : ''} key={index}>{label}</span>)}</div>{drumVoices.map(voice => <div className="drum-row" key={voice.id}><button className="drum-pad" aria-label={`试听${voice.title}`} onClick={() => playDrum(voice.id).catch(() => notify('暂时无法播放鼓声，请重试。'))}>{voice.title}</button>{pattern[voice.id].map((on, index) => <button className={`${on ? 'on' : ''} ${step === index ? 'current-step' : ''}`} aria-label={`${voice.title} 第 ${index + 1} 格`} aria-pressed={on} key={index} onClick={() => toggle(voice.id, index)}><span className="sr-only">{on ? '已开启' : '已关闭'}</span></button>)}</div>)}</div>
    <div className="drum-presets"><button className="button outline small" onClick={() => setPattern(basicDrumPattern())}>基础四拍</button><button className="text-button" onClick={() => setPattern(emptyDrumPattern())}>清空节奏</button><span>合成鼓声示范 · {running ? '播放中' : '已停止'}</span></div>
  </div>;
}
