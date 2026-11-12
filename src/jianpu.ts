// Numbered musical notation (简谱): a small text format, a parser, playback events and MusicXML for the
// same melody on a staff. Pure functions, so lessons can be checked by tests.
//
// Format, tokens separated by spaces:
//   1=C 1=G 1=bB 1=F#   key (where do sits)        4/4 3/4 2/4 6/8   time signature
//   1–7                  scale degree, 0 = rest     #4 b7             accidentals before the digit
//   1' 1''  5, 5,,       octave dots above / below  5_ 5__            one / two underlines (eighth, 16th)
//   3. 3._               dot after the note         5^                tie to the next note
//   -                    one more beat (增时线)      | || |: :|         barlines and repeats
import { Note, Scale } from 'tonal';

export interface JianpuNote {
  kind: 'note' | 'rest';
  degree: number;
  accidental: -1 | 0 | 1;
  octave: number;
  lines: number;
  dot: boolean;
  tie: boolean;
  /** Length in quarter-note beats, including any following dashes. */
  beats: number;
}
export type JianpuToken =
  JianpuNote | { kind: 'dash' } | { kind: 'bar'; style: 'single' | 'final' | 'repeat-start' | 'repeat-end' };
export interface Jianpu {
  key: string;
  beats: number;
  beatType: number;
  tokens: JianpuToken[];
}
export interface MusicEvent {
  notes: string[];
  beats: number;
  velocity: number;
  /** Index into `tokens` for highlighting while playing. */
  token?: number;
  /** Start in beats from the beginning; when absent, events follow one another. */
  start?: number;
  part?: 'right' | 'left';
  /** Strum a guitar chord upward (high strings first). */
  up?: boolean;
}

const majorSteps = [0, 2, 4, 5, 7, 9, 11];
const fifths: Record<string, number> = {
  C: 0,
  G: 1,
  D: 2,
  A: 3,
  E: 4,
  B: 5,
  'F#': 6,
  F: -1,
  Bb: -2,
  Eb: -3,
  Ab: -4,
  Db: -5,
};
const noteToken = /^([#b]?)([0-7])([',]*)(\.?)(_*)(\.?)(\^?)$/;

export function parseJianpu(source: string): Jianpu {
  const result: Jianpu = { key: 'C', beats: 4, beatType: 4, tokens: [] };
  let last: JianpuNote | undefined;
  for (const word of source.trim().split(/\s+/)) {
    const key = /^1=([#b]?)([A-G])([#b]?)$/.exec(word);
    const meter = /^(\d+)\/(\d+)$/.exec(word);
    const note = noteToken.exec(word);
    if (key) {
      result.key = key[2] + (key[1] || key[3]);
      if (!(result.key in fifths)) throw new Error(`Unsupported key ${word}`);
    } else if (meter) {
      result.beats = Number(meter[1]);
      result.beatType = Number(meter[2]);
    } else if (word === '|') result.tokens.push({ kind: 'bar', style: 'single' });
    else if (word === '||') result.tokens.push({ kind: 'bar', style: 'final' });
    else if (word === '|:') result.tokens.push({ kind: 'bar', style: 'repeat-start' });
    else if (word === ':|' || word === ':||') result.tokens.push({ kind: 'bar', style: 'repeat-end' });
    else if (word === '-') {
      if (!last) throw new Error('A dash needs a note before it');
      last.beats += 1;
      result.tokens.push({ kind: 'dash' });
    } else if (note) {
      const [, accidental, digit, marks, dotBefore, lines, dotAfter, tie] = note;
      const degree = Number(digit);
      const dot = !!(dotBefore || dotAfter);
      last = {
        kind: degree === 0 ? 'rest' : 'note',
        degree,
        accidental: accidental === '#' ? 1 : accidental === 'b' ? -1 : 0,
        octave: [...marks].reduce((sum, mark) => sum + (mark === "'" ? 1 : -1), 0),
        lines: lines.length,
        dot,
        tie: !!tie,
        beats: (1 / 2 ** lines.length) * (dot ? 1.5 : 1),
      };
      result.tokens.push(last);
    } else throw new Error(`Unknown jianpu token “${word}”`);
  }
  return result;
}

const tonicMidi = (key: string) => {
  const midi = Note.midi(`${key}4`)!;
  return midi > 67 ? midi - 12 : midi;
};
/** Scientific pitch name, spelled in the key (F♯ in G major, B♭ in F major). */
export function jianpuPitch(score: Jianpu, note: JianpuNote): string {
  const scale = Scale.get(`${score.key} major`).notes;
  const name = Note.get(scale[note.degree - 1]);
  const alter = name.alt + note.accidental;
  const midi = tonicMidi(score.key) + majorSteps[note.degree - 1] + note.accidental + 12 * note.octave;
  const octave = Math.floor((midi - alter) / 12) - 1;
  return `${name.letter}${alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter)}${octave}`;
}

export const measures = (score: Jianpu) => {
  const list: JianpuNote[][] = [[]];
  for (const token of score.tokens) {
    if (token.kind === 'bar') list.push([]);
    else if (token.kind !== 'dash') list[list.length - 1].push(token);
  }
  return list.filter(measure => measure.length);
};
export const measureBeats = (measure: JianpuNote[]) => measure.reduce((sum, note) => sum + note.beats, 0);
/** Beats per bar in quarter notes: 3/4 → 3, 6/8 → 3. */
export const barBeats = (score: Jianpu) => (score.beats * 4) / score.beatType;

/** Playback order with repeats expanded and tied notes merged. */
export function jianpuEvents(score: Jianpu): MusicEvent[] {
  const order: number[] = [];
  let repeatFrom = 0;
  let repeated = false;
  score.tokens.forEach((token, index) => {
    if (token.kind === 'bar' && token.style === 'repeat-start') repeatFrom = order.length;
    if (token.kind === 'note' || token.kind === 'rest') order.push(index);
    if (token.kind === 'bar' && token.style === 'repeat-end' && !repeated) {
      order.push(...order.slice(repeatFrom));
      repeated = true;
    }
  });
  const events: MusicEvent[] = [];
  let tied: MusicEvent | undefined;
  for (const index of order) {
    const note = score.tokens[index] as JianpuNote;
    if (tied && note.kind === 'note') {
      tied.beats += note.beats;
      tied = note.tie ? tied : undefined;
      continue;
    }
    const event: MusicEvent = {
      notes: note.kind === 'rest' ? [] : [jianpuPitch(score, note)],
      beats: note.beats,
      velocity: 0.7,
      token: index,
    };
    events.push(event);
    tied = note.kind === 'note' && note.tie ? event : undefined;
  }
  return events;
}

const types: Record<number, [string, boolean]> = {
  16: ['whole', false],
  12: ['half', true],
  8: ['half', false],
  6: ['quarter', true],
  4: ['quarter', false],
  3: ['eighth', true],
  2: ['eighth', false],
  1: ['16th', false],
};
interface Bar {
  notes: JianpuNote[];
  left?: string;
  right?: string;
}
function bars(score: Jianpu): Bar[] {
  const list: Bar[] = [{ notes: [] }];
  for (const token of score.tokens) {
    const current = list[list.length - 1];
    if (token.kind === 'bar') {
      if (token.style === 'repeat-start') {
        if (current.notes.length) list.push({ notes: [], left: 'forward' });
        else current.left = 'forward';
        continue;
      }
      current.right = token.style === 'repeat-end' ? 'backward' : token.style === 'final' ? 'final' : undefined;
      list.push({ notes: [] });
    } else if (token.kind !== 'dash') current.notes.push(token);
  }
  return list.filter(bar => bar.notes.length);
}
function notesXml(score: Jianpu, notes: JianpuNote[], tie: { open: boolean }, staff?: number) {
  const keyAlter = (letter: string) => {
    const spelled = Scale.get(`${score.key} major`).notes.find(name => name[0] === letter)!;
    return Note.get(spelled).alt;
  };
  const voice = staff ? `<voice>${staff === 1 ? 1 : 5}</voice>` : '';
  const staffTag = staff ? `<staff>${staff}</staff>` : '';
  return notes
    .map(note => {
      const duration = Math.round(note.beats * 4);
      const value = types[duration];
      if (!value) throw new Error(`Duration ${note.beats} has no single note value`);
      const [type, dotted] = value;
      const dot = dotted ? '<dot/>' : '';
      if (note.kind === 'rest')
        return `<note><rest/><duration>${duration}</duration>${voice}<type>${type}</type>${dot}${staffTag}</note>`;
      const pitch = Note.get(jianpuPitch(score, note));
      const alter = pitch.alt;
      const accidental =
        alter !== keyAlter(pitch.letter) || note.accidental
          ? `<accidental>${alter > 0 ? 'sharp' : alter < 0 ? 'flat' : 'natural'}</accidental>`
          : '';
      const ties = `${tie.open ? '<tie type="stop"/>' : ''}${note.tie ? '<tie type="start"/>' : ''}`;
      const tied = `${tie.open ? '<tied type="stop"/>' : ''}${note.tie ? '<tied type="start"/>' : ''}`;
      tie.open = note.tie;
      return `<note><pitch><step>${pitch.letter}</step>${alter ? `<alter>${alter}</alter>` : ''}<octave>${pitch.oct}</octave></pitch><duration>${duration}</duration>${ties}${voice}<type>${type}</type>${dot}${accidental}${staffTag}${tied ? `<notations>${tied}</notations>` : ''}</note>`;
    })
    .join('');
}
const clefXml = (clef: 'treble' | 'bass', number?: number) =>
  `<clef${number ? ` number="${number}"` : ''}>${clef === 'bass' ? '<sign>F</sign><line>4</line>' : '<sign>G</sign><line>2</line>'}</clef>`;

/**
 * The same melody as MusicXML for the staff view (divisions of a 16th note). With `left`, the two parts form
 * a grand staff: right hand on the treble staff, left hand on the bass staff; both need the same bars.
 */
export function jianpuToMusicXml(
  score: Jianpu,
  title = '',
  options: { clef?: 'treble' | 'bass'; left?: Jianpu } = {},
): string {
  const upper = bars(score);
  const lower = options.left ? bars(options.left) : undefined;
  if (lower && lower.length !== upper.length) throw new Error('Both hands need the same number of bars');
  const full = barBeats(score);
  const pickup = measureBeats(upper[0].notes) < full;
  const tieUpper = { open: false };
  const tieLower = { open: false };
  const xml = upper.map((bar, index) => {
    const clefs = lower
      ? `<staves>2</staves>${clefXml('treble', 1)}${clefXml('bass', 2)}`
      : clefXml(options.clef ?? 'treble');
    const attributes =
      index === 0
        ? `<attributes><divisions>4</divisions><key><fifths>${fifths[score.key]}</fifths></key><time><beats>${score.beats}</beats><beat-type>${score.beatType}</beat-type></time>${clefs}</attributes>`
        : '';
    const left = bar.left
      ? '<barline location="left"><bar-style>heavy-light</bar-style><repeat direction="forward"/></barline>'
      : '';
    let notes = notesXml(score, bar.notes, tieUpper, lower ? 1 : undefined);
    if (lower)
      notes += `<backup><duration>${Math.round(measureBeats(bar.notes) * 4)}</duration></backup>${notesXml(options.left!, lower[index].notes, tieLower, 2)}`;
    const right =
      bar.right === 'backward'
        ? '<barline location="right"><bar-style>light-heavy</bar-style><repeat direction="backward"/></barline>'
        : bar.right === 'final'
          ? '<barline location="right"><bar-style>light-heavy</bar-style></barline>'
          : '';
    const number = pickup ? index : index + 1;
    return `<measure number="${number}"${pickup && index === 0 ? ' implicit="yes"' : ''}>${attributes}${left}${notes}${right}</measure>`;
  });
  return `<?xml version="1.0" encoding="utf-8"?><score-partwise version="4.0"><work><work-title>${title}</work-title></work><part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list><part id="P1">${xml.join('')}</part></score-partwise>`;
}

/** Plays two hands together: each part keeps its own timing, events are ordered by start. */
export function mergeParts(right: MusicEvent[], left: MusicEvent[]): MusicEvent[] {
  const timed = (events: MusicEvent[], part: 'right' | 'left') => {
    let at = 0;
    return events.map(event => {
      const item = { ...event, start: at, part };
      at += event.beats;
      return item;
    });
  };
  return [...timed(right, 'right'), ...timed(left, 'left')].sort(
    (a, b) => a.start - b.start || (a.part === 'right' ? -1 : 1),
  );
}

/**
 * How closely played timing follows the written rhythm, from 0 to 100. Only the proportions between notes
 * count, so any steady tempo scores well. `beats` are the written lengths of all notes but the last;
 * `times` are the key-press times in milliseconds.
 */
export function rhythmAccuracy(beats: number[], times: number[]): number | null {
  if (beats.length < 3 || times.length !== beats.length + 1) return null;
  const gaps = times.slice(1).map((time, i) => time - times[i]);
  if (gaps.some(gap => gap <= 0)) return null;
  const beat = gaps.reduce((sum, gap) => sum + gap, 0) / beats.reduce((sum, value) => sum + value, 0);
  const error = gaps.reduce((sum, gap, i) => sum + Math.abs(gap / (beat * beats[i]) - 1), 0) / gaps.length;
  return Math.max(0, Math.round(100 * (1 - error)));
}

export interface SightOptions {
  key?: 'C' | 'G' | 'F' | 'D';
  meter?: 2 | 3 | 4;
  bars?: number;
  /** Lowest and highest scale degree, counted from do = 0 (so -3 is low sol, 7 is high do). */
  range?: [number, number];
  eighths?: boolean;
  /** Playback only: octaves away from the written pitch, and the voice (guitar sounds an octave lower). */
  playOctave?: number;
  instrument?: 'piano' | 'guitar' | 'wind';
}

/** Moves every note of the events by whole octaves (for instruments written an octave from their sound). */
export function shiftOctaves(events: MusicEvent[], octaves = 0): MusicEvent[] {
  if (!octaves) return events;
  return events.map(event => ({
    ...event,
    notes: event.notes.map(note => Note.fromMidi(Note.midi(note)! + 12 * octaves)),
  }));
}
/** A seeded random number generator (mulberry32), so each exercise number always gives the same melody. */
export function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rhythmPool: Record<number, { plain: number[][]; eighths: number[][]; last: number[][] }> = {
  2: {
    plain: [[1, 1], [2]],
    eighths: [
      [0.5, 0.5, 1],
      [1, 0.5, 0.5],
    ],
    last: [[2]],
  },
  3: {
    plain: [
      [1, 1, 1],
      [2, 1],
      [1, 2],
    ],
    eighths: [
      [0.5, 0.5, 1, 1],
      [1, 0.5, 0.5, 1],
    ],
    last: [[3], [1, 2]],
  },
  4: {
    plain: [
      [1, 1, 1, 1],
      [2, 1, 1],
      [1, 1, 2],
      [2, 2],
    ],
    eighths: [
      [0.5, 0.5, 1, 1, 1],
      [1, 1, 0.5, 0.5, 1],
      [0.5, 0.5, 0.5, 0.5, 2],
    ],
    last: [[1, 1, 2], [4], [2, 2]],
  },
};
const lengthMark = (beats: number) =>
  beats === 0.5 ? '_' : beats === 1 ? '' : ` ${Array.from({ length: beats - 1 }, () => '-').join(' ')}`;
const degreeToken = (degree: number) => {
  const octave = Math.floor(degree / 7);
  const number = ((degree % 7) + 7) % 7;
  return `${number + 1}${octave > 0 ? "'".repeat(octave) : ','.repeat(-octave)}`;
};
/**
 * A short sight-reading melody in 简谱 format: mostly steps, a few thirds, starting on do, mi or sol and
 * ending on do with a long note. Stays inside `range`.
 */
export function sightReading(seed: number, options: SightOptions = {}): string {
  const { key = 'C', meter = 4, bars: count = 4, range = [0, 4], eighths = false } = options;
  const random = seeded(seed);
  const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)];
  const [low, high] = range;
  const tonic = low <= 0 && high >= 0 ? 0 : low <= 7 && high >= 7 ? 7 : low;
  let degree = pick([tonic, tonic + 2, tonic + 4].filter(value => value >= low && value <= high));
  const pool = rhythmPool[meter];
  const parts: string[] = [];
  for (let bar = 0; bar < count; bar++) {
    const last = bar === count - 1;
    const rhythm = last ? pick(pool.last) : pick(eighths && random() < 0.5 ? pool.eighths : pool.plain);
    const tokens = rhythm.map((beats, i) => {
      if (!(bar === 0 && i === 0)) {
        if (last && i === rhythm.length - 1) degree = tonic;
        else if (last && i === rhythm.length - 2) {
          // Approach the final do from the nearest of re, ti or mi.
          const options = [tonic + 1, tonic - 1, tonic + 2].filter(value => value >= low && value <= high);
          const nearest = Math.min(...options.map(value => Math.abs(value - degree)));
          degree = pick(options.filter(value => Math.abs(value - degree) === nearest));
        } else {
          const move = pick([-1, -1, 1, 1, -2, 2, 0]);
          // Turn back at the edge of the range instead of repeating the edge note.
          degree = degree + move > high || degree + move < low ? degree - move : degree + move;
        }
      }
      return `${degreeToken(degree)}${lengthMark(beats)}`;
    });
    parts.push(tokens.join(' '));
  }
  return `1=${key} ${meter}/4 | ${parts.join(' | ')} ||`;
}

// Short sequences for listening examples, separated by spaces:
//   C4  C4:2  C4:0.5     note with length in beats (default 1)
//   C4+E4+G4:2           chord
//   r:1                  rest
//   pp p mp mf f ff      dynamic for the notes that follow
//   ^E3+G3+B3            up-strum on the guitar (high strings first)
//   |                    ignored, for readability
const dynamics: Record<string, number> = { pp: 0.18, p: 0.32, mp: 0.48, mf: 0.64, f: 0.84, ff: 1 };
export function parseSequence(source: string): MusicEvent[] {
  let velocity = 0.64;
  const events: MusicEvent[] = [];
  for (const word of source.trim().split(/\s+/)) {
    if (word === '|') continue;
    if (word in dynamics) {
      velocity = dynamics[word];
      continue;
    }
    const up = word.startsWith('^');
    const [pitch, length = '1'] = (up ? word.slice(1) : word).split(':');
    const beats = Number(length);
    if (!(beats > 0)) throw new Error(`Bad length in “${word}”`);
    const notes = pitch === 'r' ? [] : pitch.split('+');
    for (const note of notes) if (Note.midi(note) === null) throw new Error(`Unknown note “${note}”`);
    events.push({ notes, beats, velocity, ...(up ? { up } : {}) });
  }
  return events;
}
