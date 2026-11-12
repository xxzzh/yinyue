// Dictation questions (节奏听写、旋律听写). Pure and seeded, so a question number always gives the same
// question and tests can check every bar adds up.
import { jianpuEvents, parseJianpu, seeded, sightReading } from './jianpu.ts';
import type { JianpuNote } from './jianpu.ts';

/**
 * One beat of rhythm: quarter, two eighths, four sixteenths, dotted eighth + sixteenth, sixteenth–eighth–
 * sixteenth (小切分), eighth-note triplet, rest, or held over. `symbol` is 简谱 with combining underlines.
 */
export type BeatCell = 'q' | 'ee' | 'ssss' | 'es' | 'ses' | 'trip' | 'r' | 'hold';
export const beatCells: { id: BeatCell; label: string; jianpu: string; symbol: string }[] = [
  { id: 'q', label: '一拍', jianpu: '5', symbol: '5' },
  { id: 'ee', label: '两个半拍', jianpu: '5_ 5_', symbol: '5̲ 5̲' },
  { id: 'ssss', label: '四个四分之一拍', jianpu: '5__ 5__ 5__ 5__', symbol: '5̳5̳5̳5̳' },
  { id: 'es', label: '附点八分 + 十六分', jianpu: '5._ 5__', symbol: '5̲·5̳' },
  { id: 'ses', label: '十六 + 八 + 十六（小切分）', jianpu: '5__ 5_ 5__', symbol: '5̳5̲5̳' },
  { id: 'trip', label: '三连音', jianpu: '{5_ 5_ 5_}', symbol: '³5̲5̲5̲' },
  { id: 'r', label: '休止一拍', jianpu: '0', symbol: '0' },
  { id: 'hold', label: '延长上一个音', jianpu: '-', symbol: '—' },
];
const cellJianpu = Object.fromEntries(beatCells.map(cell => [cell.id, cell.jianpu])) as Record<BeatCell, string>;

/** Builds a 简谱 score on one pitch (sol) from beat cells, bar by bar. */
export function rhythmScore(cells: BeatCell[], meter: number) {
  const bars: string[] = [];
  for (let i = 0; i < cells.length; i += meter)
    bars.push(
      cells
        .slice(i, i + meter)
        .map(cell => cellJianpu[cell])
        .join(' '),
    );
  return `1=C ${meter}/4 | ${bars.join(' | ')} ||`;
}

export interface RhythmOptions {
  meter?: 2 | 3 | 4;
  bars?: number;
  cells?: BeatCell[];
}
/**
 * A rhythm to write down. A held beat only follows a quarter or another held beat in the same bar, so every
 * question can be written with 简谱 dashes; the last beat of the question is never a rest.
 */
export function rhythmQuestion(
  seed: number,
  { meter = 4, bars = 2, cells = ['q', 'ee', 'r', 'hold'] }: RhythmOptions = {},
) {
  const random = seeded(seed);
  const answer: BeatCell[] = [];
  for (let bar = 0; bar < bars; bar++)
    for (let beat = 0; beat < meter; beat++) {
      const previous = beat > 0 ? answer[answer.length - 1] : undefined;
      const allowed = cells.filter(cell => {
        if (cell === 'hold') return previous === 'q' || previous === 'hold';
        if (cell === 'r') return !(bar === bars - 1 && beat === meter - 1);
        return true;
      });
      answer.push(allowed[Math.floor(random() * allowed.length)]);
    }
  return { answer, score: rhythmScore(answer, meter), meter };
}

export interface MelodyOptions {
  meter?: 2 | 3 | 4;
  bars?: number;
  range?: [number, number];
  /** Allow leaps of a fourth and a fifth. */
  leaps?: boolean;
  eighths?: boolean;
  /** Alter up to two notes into leading notes that resolve by step (♯4→5, ♯1→2, ♭7→6, ♭6→5, ♭3→2). */
  chromatic?: boolean;
}
/** A short melody in C, starting on do, mi or sol and ending on do; the rhythm is given, pitches asked. */
export function melodyQuestion(
  seed: number,
  { meter = 4, bars = 2, range = [0, 4], leaps = false, eighths = false, chromatic = false }: MelodyOptions = {},
) {
  const plain = sightReading(seed, { key: 'C', meter, bars, range, leaps, eighths });
  const score = chromatic ? alterNotes(plain, seed) : plain;
  const parsed = parseJianpu(score);
  const notes = parsed.tokens.filter((token): token is JianpuNote => token.kind === 'note');
  return {
    score,
    /** Scale degrees as written in 简谱, with octave marks: 1, 5, 1' … */
    answer: notes.map(
      note =>
        `${note.accidental > 0 ? '#' : note.accidental < 0 ? 'b' : ''}${note.degree}${note.octave > 0 ? "'".repeat(note.octave) : ','.repeat(-note.octave)}`,
    ),
    events: jianpuEvents(parsed),
  };
}

// Leading notes: a degree that moves by step to its neighbour can be altered toward it.
const leadingNotes: { degree: number; next: number; mark: '#' | 'b' }[] = [
  { degree: 4, next: 5, mark: '#' },
  { degree: 1, next: 2, mark: '#' },
  { degree: 7, next: 6, mark: 'b' },
  { degree: 6, next: 5, mark: 'b' },
  { degree: 3, next: 2, mark: 'b' },
];
/** Alters up to two notes (never the first or last) into chromatic leading notes; bars keep their length. */
function alterNotes(score: string, seed: number) {
  const random = seeded(seed + 7919);
  const words = score.split(' ');
  const notes = words
    // Whole note tokens only, so the 1=C and 4/4 header words are never touched.
    .map((word, index) => ({ index, match: /^([1-7])([',]*)\.?_*\.?\^?$/.exec(word) }))
    .filter((item): item is { index: number; match: RegExpExecArray } => !!item.match)
    .map(({ index, match }) => ({ index, degree: Number(match[1]), octave: match[2] }));
  let altered = 0;
  for (let i = 1; i < notes.length - 1 && altered < 2; i++) {
    const [note, next] = [notes[i], notes[i + 1]];
    const rule = leadingNotes.find(item => item.degree === note.degree && item.next === next.degree);
    if (!rule || note.octave !== next.octave || random() < 0.4) continue;
    words[note.index] = rule.mark + words[note.index];
    altered++;
  }
  return words.join(' ');
}

/** Plays a count-in bar of clicks before the question. */
export const countIn = (meter: number) => `1=C ${meter}/4 | ${Array.from({ length: meter }, () => '0').join(' ')} |`;
