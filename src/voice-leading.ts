// Four-part harmony checker (四部和声检查器): ranges, spacing, crossing, overlap, parallel / contrary / hidden
// fifths and octaves, and melodic leaps. Pure functions on note names, so lessons and tests share the rules.
import { Chord, Interval, Note } from 'tonal';

export interface VoiceSpec {
  name: string;
  low: string;
  high: string;
}
/** Common textbook ranges for soprano, alto, tenor and bass, from the highest voice down. */
export const satb: VoiceSpec[] = [
  { name: '女高音', low: 'C4', high: 'G5' },
  { name: '女中音', low: 'G3', high: 'D5' },
  { name: '男高音', low: 'C3', high: 'G4' },
  { name: '男低音', low: 'E2', high: 'D4' },
];
/** A string quartet uses the same rules with the instruments' ranges (kept to comfortable registers). */
export const stringQuartet: VoiceSpec[] = [
  { name: '第一小提琴', low: 'G3', high: 'E6' },
  { name: '第二小提琴', low: 'G3', high: 'C6' },
  { name: '中提琴', low: 'C3', high: 'G5' },
  { name: '大提琴', low: 'C2', high: 'G4' },
];

export type IssueKind =
  'invalid' | 'range' | 'crossing' | 'spacing' | 'parallel' | 'contrary' | 'hidden' | 'overlap' | 'leap' | 'augmented';
export interface ChoraleIssue {
  kind: IssueKind;
  severity: 'error' | 'warning';
  /** Chord index (0-based); for motion between chords, the first of the two. */
  at: number;
  voices: number[];
  message: string;
}

const perfectName = (semitones: number) => (semitones % 12 === 7 ? '五度' : semitones % 12 === 0 ? '八度' : '');
const sign = (value: number) => (value > 0 ? 1 : value < 0 ? -1 : 0);
const pretty = (note: string) => note.replace('#', '♯').replace(/(?<=[A-G])b/, '♭');

/**
 * Checks chords written as [highest voice, …, lowest voice] note names, e.g. [['E4','C4','G3','C3'], …].
 * Errors break the common-practice rules; warnings are things to avoid in strict style.
 */
export function checkChorale(chords: string[][], voices: VoiceSpec[] = satb): ChoraleIssue[] {
  const issues: ChoraleIssue[] = [];
  const chordNo = (i: number) => `第 ${i + 1} 个和弦`;
  const midi = chords.map(chord => chord.map(note => Note.midi(note)));
  chords.forEach((chord, i) =>
    chord.forEach((note, v) => {
      if (midi[i][v] === null)
        issues.push({
          kind: 'invalid',
          severity: 'error',
          at: i,
          voices: [v],
          message: `${chordNo(i)}：${voices[v].name}“${note}”不是有效的音名（例如 C4、F#3、Bb4）`,
        });
    }),
  );
  if (issues.length) return issues;
  const pitch = midi as number[][];
  pitch.forEach((chord, i) => {
    chord.forEach((value, v) => {
      const { name, low, high } = voices[v];
      if (value < Note.midi(low)! || value > Note.midi(high)!)
        issues.push({
          kind: 'range',
          severity: 'error',
          at: i,
          voices: [v],
          message: `${chordNo(i)}：${name} ${pretty(chords[i][v])} 超出常用音域（${low}–${high}）`,
        });
      if (v < chord.length - 1 && value < chord[v + 1])
        issues.push({
          kind: 'crossing',
          severity: 'error',
          at: i,
          voices: [v, v + 1],
          message: `${chordNo(i)}：${name}低于${voices[v + 1].name}（声部交叉）`,
        });
      // Neighbouring upper voices stay within an octave; the lowest two may be further apart.
      if (v < chord.length - 2 && value - chord[v + 1] > 12)
        issues.push({
          kind: 'spacing',
          severity: 'error',
          at: i,
          voices: [v, v + 1],
          message: `${chordNo(i)}：${name}与${voices[v + 1].name}相距超过八度`,
        });
    });
  });
  for (let i = 0; i < pitch.length - 1; i++) {
    const [from, to] = [pitch[i], pitch[i + 1]];
    const span = `第 ${i + 1}→${i + 2} 个和弦`;
    for (let v = 0; v < from.length; v++) {
      const leap = to[v] - from[v];
      if (Math.abs(leap) > 12)
        issues.push({
          kind: 'leap',
          severity: 'error',
          at: i,
          voices: [v],
          message: `${span}：${voices[v].name}跳进超过八度`,
        });
      const interval = Interval.distance(chords[i][v], chords[i + 1][v]);
      if (/^-?[24]A$/.test(interval))
        issues.push({
          kind: 'augmented',
          severity: 'warning',
          at: i,
          voices: [v],
          message: `${span}：${voices[v].name}出现${interval.includes('2') ? '增二度' : '增四度'}进行`,
        });
      if (v < from.length - 1) {
        if (to[v + 1] > from[v] || to[v] < from[v + 1])
          issues.push({
            kind: 'overlap',
            severity: 'warning',
            at: i,
            voices: [v, v + 1],
            message: `${span}：${voices[v].name}与${voices[v + 1].name}声部超越`,
          });
      }
      for (let w = v + 1; w < from.length; w++) {
        const before = from[v] - from[w];
        const after = to[v] - to[w];
        const kind = perfectName(after);
        const upper = sign(to[v] - from[v]);
        const lower = sign(to[w] - from[w]);
        if (!kind || !upper || !lower) continue;
        const pair = `${voices[v].name}与${voices[w].name}`;
        if (perfectName(before) === kind && before % 12 === after % 12) {
          if (upper === lower)
            issues.push({
              kind: 'parallel',
              severity: 'error',
              at: i,
              voices: [v, w],
              message: `${span}：${pair}平行${kind}`,
            });
          else
            issues.push({
              kind: 'contrary',
              severity: 'warning',
              at: i,
              voices: [v, w],
              message: `${span}：${pair}反向${kind}`,
            });
        } else if (v === 0 && w === from.length - 1 && upper === lower && Math.abs(to[v] - from[v]) > 2) {
          issues.push({
            kind: 'hidden',
            severity: 'warning',
            at: i,
            voices: [v, w],
            message: `${span}：外声部同向进入${kind}、${voices[v].name}跳进（隐伏${kind}）`,
          });
        }
      }
    }
  }
  return issues;
}

const commonQualities = ['M', '', 'm', '7', 'maj7', 'm7', 'dim', 'aug', 'dim7', 'm7b5', 'o', 'o7', '6', 'm6', 'sus4'];
/** A chord name for a column (lowest voice last), e.g. C, Dm/F, G7; empty when no chord is recognised. */
export function chordName(chord: string[]) {
  const classes = [...chord].reverse().map(note => Note.pitchClass(note));
  const unique = classes.filter((name, i) => classes.indexOf(name) === i);
  // Four-part writing often leaves out the fifth; try again with it added above the bass.
  const names = Chord.detect(unique).length
    ? Chord.detect(unique)
    : Chord.detect([...unique, Note.pitchClass(Note.transpose(unique[0], '5P'))]);
  // Prefer everyday chord qualities (D♭/F rather than Fm♯5), then names without omitted notes.
  const quality = (name: string) => name.replace(/^[A-G][#b]*/, '').split('/')[0];
  const best =
    names.find(name => commonQualities.includes(quality(name))) ?? names.find(name => !name.includes('no')) ?? names[0];
  return best ? pretty(best.replace(/M(?=\/|$)/, '').replace('Major', '')) : '';
}

/** The chords as a listening sequence (format in jianpu.ts), two beats each. */
export const choraleSequence = (chords: string[][]) =>
  chords.map((chord, i) => `${[...chord].reverse().join('+')}:${i === chords.length - 1 ? 3 : 2}`).join(' ');
