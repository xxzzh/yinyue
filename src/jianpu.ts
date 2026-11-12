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
/** The same melody as MusicXML for the staff view (treble clef, divisions of a 16th note). */
export function jianpuToMusicXml(score: Jianpu, title = ''): string {
  const keyAlter = (letter: string) => {
    const spelled = Scale.get(`${score.key} major`).notes.find(name => name[0] === letter)!;
    return Note.get(spelled).alt;
  };
  const bars: { notes: JianpuNote[]; left?: string; right?: string }[] = [{ notes: [] }];
  for (const token of score.tokens) {
    const current = bars[bars.length - 1];
    if (token.kind === 'bar') {
      if (token.style === 'repeat-start') {
        if (current.notes.length) bars.push({ notes: [], left: 'forward' });
        else current.left = 'forward';
        continue;
      }
      current.right = token.style === 'repeat-end' ? 'backward' : token.style === 'final' ? 'final' : undefined;
      bars.push({ notes: [] });
    } else if (token.kind !== 'dash') current.notes.push(token);
  }
  const filled = bars.filter(bar => bar.notes.length);
  const full = barBeats(score);
  let tieOpen = false;
  const xml = filled.map((bar, index) => {
    const pickup = index === 0 && measureBeats(bar.notes) < full;
    const attributes =
      index === 0
        ? `<attributes><divisions>4</divisions><key><fifths>${fifths[score.key]}</fifths></key><time><beats>${score.beats}</beats><beat-type>${score.beatType}</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`
        : '';
    const left = bar.left
      ? '<barline location="left"><bar-style>heavy-light</bar-style><repeat direction="forward"/></barline>'
      : '';
    const notes = bar.notes
      .map(note => {
        const duration = Math.round(note.beats * 4);
        const [type, dotted] =
          types[duration] ??
          (() => {
            throw new Error(`Duration ${note.beats} has no single note value`);
          })();
        const dot = dotted ? '<dot/>' : '';
        if (note.kind === 'rest')
          return `<note><rest/><duration>${duration}</duration><type>${type}</type>${dot}</note>`;
        const pitch = Note.get(jianpuPitch(score, note));
        const alter = pitch.alt;
        const accidental =
          alter !== keyAlter(pitch.letter) || note.accidental
            ? `<accidental>${alter > 0 ? 'sharp' : alter < 0 ? 'flat' : 'natural'}</accidental>`
            : '';
        const ties = `${tieOpen ? '<tie type="stop"/>' : ''}${note.tie ? '<tie type="start"/>' : ''}`;
        const tied = `${tieOpen ? '<tied type="stop"/>' : ''}${note.tie ? '<tied type="start"/>' : ''}`;
        tieOpen = note.tie;
        return `<note><pitch><step>${pitch.letter}</step>${alter ? `<alter>${alter}</alter>` : ''}<octave>${pitch.oct}</octave></pitch><duration>${duration}</duration>${ties}<type>${type}</type>${dot}${accidental}${tied ? `<notations>${tied}</notations>` : ''}</note>`;
      })
      .join('');
    const right =
      bar.right === 'backward'
        ? '<barline location="right"><bar-style>light-heavy</bar-style><repeat direction="backward"/></barline>'
        : bar.right === 'final'
          ? '<barline location="right"><bar-style>light-heavy</bar-style></barline>'
          : '';
    return `<measure number="${pickup ? 0 : index + (filled.length && measureBeats(filled[0].notes) < full ? 0 : 1)}"${pickup ? ' implicit="yes"' : ''}>${attributes}${left}${notes}${right}</measure>`;
  });
  return `<?xml version="1.0" encoding="utf-8"?><score-partwise version="4.0"><work><work-title>${title}</work-title></work><part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list><part id="P1">${xml.join('')}</part></score-partwise>`;
}

// Short sequences for listening examples, separated by spaces:
//   C4  C4:2  C4:0.5     note with length in beats (default 1)
//   C4+E4+G4:2           chord
//   r:1                  rest
//   pp p mp mf f ff      dynamic for the notes that follow
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
    const [pitch, length = '1'] = word.split(':');
    const beats = Number(length);
    if (!(beats > 0)) throw new Error(`Bad length in “${word}”`);
    const notes = pitch === 'r' ? [] : pitch.split('+');
    for (const note of notes) if (Note.midi(note) === null) throw new Error(`Unknown note “${note}”`);
    events.push({ notes, beats, velocity });
  }
  return events;
}
