// Harmony helpers for the L3 tools: chord-progression questions (和弦进行听辨) and the circle of fifths
// (五度圈). Pure and seeded like dictation.ts, so tests can check every question.
import { Note } from 'tonal';
import { seeded } from './jianpu.ts';

/** Roman numerals in a major key. */
export type Degree = 'I' | 'ii' | 'iii' | 'IV' | 'V' | 'vi';
/** C major voicings with smooth voice leading around middle C: bass plus three upper notes. */
export const degreeChords: Record<Degree, { name: string; notes: string[] }> = {
  I: { name: 'C', notes: ['C3', 'C4', 'E4', 'G4'] },
  ii: { name: 'Dm', notes: ['D3', 'D4', 'F4', 'A4'] },
  iii: { name: 'Em', notes: ['E3', 'B3', 'E4', 'G4'] },
  IV: { name: 'F', notes: ['F2', 'C4', 'F4', 'A4'] },
  V: { name: 'G', notes: ['G2', 'B3', 'D4', 'G4'] },
  vi: { name: 'Am', notes: ['A2', 'C4', 'E4', 'A4'] },
};
export const degreeOrder: Degree[] = ['I', 'ii', 'iii', 'IV', 'V', 'vi'];

/** Chords as a listening sequence (format in jianpu.ts), two beats each, the last one held longer. */
export const progressionSequence = (chords: Degree[]) =>
  chords.map((degree, i) => `${degreeChords[degree].notes.join('+')}:${i === chords.length - 1 ? 3 : 2}`).join(' ');

export interface ProgressionOptions {
  pool?: Degree[];
  length?: number;
}
/** A progression starting on I; neighbouring chords always differ. Chords other than I come from `pool`. */
export function progressionQuestion(
  seed: number,
  { pool = ['I', 'IV', 'V', 'vi'], length = 4 }: ProgressionOptions = {},
) {
  const random = seeded(seed);
  const answer: Degree[] = ['I'];
  while (answer.length < length) {
    const choices = pool.filter(degree => degree !== answer[answer.length - 1]);
    answer.push(choices[Math.floor(random() * choices.length)]);
  }
  return { answer, seq: progressionSequence(answer) };
}

const sharpOrder = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const flatOrder = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
export interface CircleKey {
  /** Major key name and its relative minor, e.g. G and e. */
  major: string;
  minor: string;
  /** Sharps (positive) or flats (negative) in the key signature. */
  count: number;
  /** The accidentals in the order they are written. */
  accidentals: string[];
  /** The same position spelled the other way (F♯ = G♭), if any. */
  enharmonic?: { major: string; minor: string; count: number; accidentals: string[] };
}
const minorOf = (major: string) => Note.pitchClass(Note.transpose(major, '-3m'));
const signature = (count: number) =>
  count >= 0
    ? sharpOrder.slice(0, count).map(letter => `${letter}#`)
    : flatOrder.slice(0, -count).map(letter => `${letter}b`);
/** The twelve major keys clockwise from C, each a fifth above the last; F♯ and G♭ share a position. */
export const circleOfFifths: CircleKey[] = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'].map(
  (major, i) => {
    const count = i <= 6 ? i : i - 12;
    return {
      major,
      minor: minorOf(major).toLowerCase(),
      count,
      accidentals: signature(count),
      ...(major === 'F#' ? { enharmonic: { major: 'Gb', minor: 'eb', count: -6, accidentals: signature(-6) } } : {}),
    };
  },
);
/** One octave of the major scale from the tonic, as a listening sequence. */
export function majorScaleSequence(major: string) {
  const start = Note.midi(`${major}4`)! > 67 ? `${major}3` : `${major}4`;
  return ['1P', '2M', '3M', '4P', '5P', '6M', '7M', '8P']
    .map((interval, i) => `${Note.transpose(start, interval)}${i === 7 ? ':2' : ''}`)
    .join(' ');
}
/** Shows ♯ and ♭ in place of # and b in a note or key name. */
export const prettyAccidentals = (name: string) => name.replace(/#/g, '♯').replace(/(?<=[A-Ga-g])b/g, '♭');
