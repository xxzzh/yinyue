import { Note } from 'tonal';
import type { Track } from './data.ts';

export type DrumVoice = 'kick' | 'snare' | 'hat';
export type DrumPattern = Record<DrumVoice, boolean[]>;
export const drumVoices: { id: DrumVoice; title: string }[] = [{ id: 'kick', title: '底鼓' }, { id: 'snare', title: '军鼓' }, { id: 'hat', title: '踩镲' }];
export function basicDrumPattern(): DrumPattern {
  return { kick: [true, false, false, false, true, false, false, false], snare: [false, false, true, false, false, false, true, false], hat: Array(8).fill(true) };
}
export function emptyDrumPattern(): DrumPattern { return { kick: Array(8).fill(false), snare: Array(8).fill(false), hat: Array(8).fill(false) }; }
export function stringNote(open: string, fret: number) { return Note.fromMidi((Note.midi(open) ?? 60) + fret); }

export interface InstrumentProfile {
  track: Track;
  title: string;
  guide: string;
  notes: { label: string; note: string }[];
  phrase: string[];
  exercise: string;
  sound: 'piano' | 'guitar';
  frets?: boolean;
  chords?: Record<string, number[]>;
}
const strings = (notes: string[]) => notes.map((note, index) => ({ label: `第 ${notes.length - index} 弦 · ${note}`, note }));
const pitches = (notes: string[]) => notes.map(note => ({ label: note.replace('b', '♭').replace('#', '♯'), note }));

export const instrumentProfiles: InstrumentProfile[] = [
  { track: 'ukulele', title: '尤克里里 · 高 G 调弦', guide: '按第 4 到第 1 弦排列；高 G 不是最低音。和弦数字也是按这个弦序。',
    notes: strings(['G4', 'C4', 'E4', 'A4']), phrase: ['C4', 'E4', 'G4', 'A4', 'G4', 'E4', 'C4'],
    exercise: '比较 C、Am、F 三个和弦，先逐弦听，再对照品位在实体琴上按弦。', sound: 'guitar',
    chords: { C: [0, 0, 0, 3], Am: [2, 0, 0, 0], F: [2, 0, 1, 0], G7: [0, 2, 1, 2] } },
  { track: 'bass', title: '四弦贝斯 · E A D G', guide: '按第 4 到第 1 弦、由低到高排列。点击空弦或前五品，比较相同音的位置。',
    notes: strings(['E1', 'A1', 'D2', 'G2']), phrase: ['C2', 'C2', 'G2', 'G2', 'C2', 'G2', 'C2'],
    exercise: '在 A 弦第 3 品找到 C2，再听 G2 空弦，试着用两拍一个音的速度交替演奏。', sound: 'guitar', frets: true },
  { track: 'violin', title: '小提琴 · 空弦与 D 大调', guide: '前四个音是由低到高的空弦；后面是 D 弦第一把位的认音参照。',
    notes: [...pitches(['G3', 'D4', 'A4', 'E5']), { label: 'D 弦 1 指 · E4', note: 'E4' }, { label: 'D 弦 2 指 · F♯4', note: 'F#4' }, { label: 'D 弦 3 指 · G4', note: 'G4' }],
    phrase: ['D4', 'E4', 'F#4', 'E4', 'D4'], exercise: '先听 D、E、F♯、E、D，再用实体琴慢弓逐音回答。', sound: 'piano' },
  { track: 'flute', title: 'C 调长笛 · 认音与短句', guide: '普通 C 调音乐会长笛的谱面音与实音相同。这里是音高参考，完整指法请配合课程资料。',
    notes: pitches(['G4', 'A4', 'B4', 'C5', 'D5', 'E5']), phrase: ['G4', 'A4', 'B4', 'A4', 'G4'],
    exercise: '先辨认三个相邻音，再在实体长笛上用短句练习，句与句之间自然换气。', sound: 'piano' },
  { track: 'saxophone', title: '降 E 调中音萨克斯 · 谱音与实音', guide: '按钮前半是谱面音，后半是实音；播放实音。中音萨克斯实音比谱面低大六度。',
    notes: [{ label: '谱 G4 → 实 B♭3', note: 'Bb3' }, { label: '谱 A4 → 实 C4', note: 'C4' }, { label: '谱 B4 → 实 D4', note: 'D4' }, { label: '谱 C5 → 实 E♭4', note: 'Eb4' }, { label: '谱 D5 → 实 F4', note: 'F4' }, { label: '谱 E5 → 实 G4', note: 'G4' }],
    phrase: ['Bb3', 'C4', 'D4', 'C4', 'Bb3'], exercise: '听谱面 G、A、B、A、G 对应的实音，留意它们与钢琴实际音高的关系。', sound: 'piano' },
  { track: 'guzheng', title: '二十一弦古筝 · D 调五声音阶', guide: '由第 21 弦到第 1 弦、由低到高排列。D E F♯ A B 对应本课的 1 2 3 5 6。',
    notes: Array.from({ length: 21 }, (_, index) => {
      const names = ['D', 'E', 'F#', 'A', 'B']; const note = `${names[index % 5]}${2 + Math.floor(index / 5)}`;
      return { label: `${21 - index} 弦 · ${note.replace('#', '♯')}`, note };
    }), phrase: ['D4', 'E4', 'F#4', 'A4', 'B4', 'D5', 'B4', 'A4', 'F#4', 'E4', 'D4'],
    exercise: '先在中音区找到 11 至 7 弦，听 D4、E4、F♯4、A4、B4，再接到高八度 D5。', sound: 'guitar' },
  { track: 'erhu', title: '二胡 · D A 定弦与 D 调认音', guide: '内弦 D4、外弦 A4；本课以 D 为 do，其他按钮是 D 调第一组音高参考。',
    notes: [{ label: '内弦 · D4 / 1', note: 'D4' }, { label: '外弦 · A4 / 5', note: 'A4' }, { label: 'E4 / 2', note: 'E4' }, { label: 'F♯4 / 3', note: 'F#4' }, { label: 'G4 / 4', note: 'G4' }],
    phrase: ['D4', 'A4', 'D4', 'E4', 'F#4', 'E4', 'D4'], exercise: '先听两根空弦的纯五度，再听短句；在实体琴上把运弓与按指分开慢练。', sound: 'piano' },
];
