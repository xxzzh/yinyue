// Guitar tablature (六线谱): a small text format, a parser and playback events. Pure functions.
//
// Tokens separated by spaces:
//   4/4 3/4              time signature, first word only (default 4/4)
//   3/0                  string 3 (G), open; strings are numbered 1 (high E) to 6 (low E)
//   1/3:2                string 1, fret 3, two beats (default one beat; 0.5 = eighth; 2/3 for swing)
//   6/0+5/2+4/2          notes played together (a chord or a strum)
//   ^3/0+2/1+1/0         up-strum: high strings first
//   r  r:2               rest
//   |  ||                barline, final barline
import { fretNote } from './music.ts';
import type { MusicEvent } from './jianpu.ts';

export interface TabNote {
  string: number;
  fret: number;
}
export type TabToken =
  | { kind: 'note'; notes: TabNote[]; beats: number; up?: boolean }
  | { kind: 'rest'; beats: number }
  | { kind: 'bar'; final: boolean };
export interface Tab {
  beats: number;
  beatType: number;
  tokens: TabToken[];
}

export function parseTab(source: string): Tab {
  const tab: Tab = { beats: 4, beatType: 4, tokens: [] };
  source
    .trim()
    .split(/\s+/)
    .forEach((word, position) => parseWord(word, position === 0));
  return tab;

  function parseWord(word: string, first: boolean) {
    const meter = /^(\d)\/(\d)$/.exec(word);
    // A time signature is only read as the first word; otherwise 3/4 means string 3, fret 4.
    if (meter && first && Number(meter[1]) > 1 && ['2', '4', '8'].includes(meter[2])) {
      tab.beats = Number(meter[1]);
      tab.beatType = Number(meter[2]);
      return;
    }
    if (word === '|' || word === '||') {
      tab.tokens.push({ kind: 'bar', final: word === '||' });
      return;
    }
    const up = word.startsWith('^');
    const [body, length = '1'] = (up ? word.slice(1) : word).split(':');
    const [top, bottom = '1'] = length.split('/');
    const beats = Number(top) / Number(bottom);
    if (!(beats > 0) || !Number.isFinite(beats)) throw new Error(`Bad length in “${word}”`);
    if (body === 'r') {
      tab.tokens.push({ kind: 'rest', beats });
      return;
    }
    const notes = body.split('+').map(part => {
      const match = /^([1-6])\/(\d{1,2})$/.exec(part);
      if (!match || Number(match[2]) > 24) throw new Error(`Unknown tab note “${part}”`);
      return { string: Number(match[1]), fret: Number(match[2]) };
    });
    // Low strings first, as they are struck in a down-strum.
    notes.sort((a, b) => b.string - a.string);
    tab.tokens.push({ kind: 'note', notes, beats, ...(up ? { up } : {}) });
  }
}

/** Sounding pitch of a string and fret in standard tuning. */
export const tabPitch = (note: TabNote) => fretNote(6 - note.string, note.fret);

export function tabEvents(tab: Tab): MusicEvent[] {
  const events: MusicEvent[] = [];
  tab.tokens.forEach((token, index) => {
    if (token.kind === 'bar') return;
    events.push({
      notes: token.kind === 'note' ? token.notes.map(tabPitch) : [],
      beats: token.beats,
      velocity: 0.7,
      token: index,
      ...(token.kind === 'note' && token.up ? { up: true } : {}),
    });
  });
  return events;
}

/** Beats in each bar, for checking that examples add up. */
export function tabBars(tab: Tab): number[] {
  const bars = [0];
  for (const token of tab.tokens) {
    if (token.kind === 'bar') bars.push(0);
    else bars[bars.length - 1] += token.beats;
  }
  return bars.filter(beats => beats > 0).map(beats => Math.round(beats * 1e6) / 1e6);
}
