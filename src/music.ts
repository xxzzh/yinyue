import { Chord, Interval, Note, Scale } from 'tonal';

export const noteNames: Record<string, string> = { C: 'do', D: 're', E: 'mi', F: 'fa', G: 'sol', A: 'la', B: 'si' };
export const cMajor = Scale.get('C4 major').notes;
export const melody = ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4'];
export const keyboardKeys = [
  { note: 'C4', key: 'a' },
  { note: 'C#4', key: 'w' },
  { note: 'D4', key: 's' },
  { note: 'D#4', key: 'e' },
  { note: 'E4', key: 'd' },
  { note: 'F4', key: 'f' },
  { note: 'F#4', key: 't' },
  { note: 'G4', key: 'g' },
  { note: 'G#4', key: 'y' },
  { note: 'A4', key: 'h' },
  { note: 'A#4', key: 'u' },
  { note: 'B4', key: 'j' },
  { note: 'C5', key: 'k' },
];
export const guitarStrings = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
export const guitarChords: Record<string, number[]> = {
  C: [-1, 3, 2, 0, 1, 0],
  G: [3, 2, 0, 0, 0, 3],
  Am: [-1, 0, 2, 2, 1, 0],
  D: [-1, -1, 0, 2, 3, 2],
  Em: [0, 2, 2, 0, 0, 0],
};
export function fretNote(string: number, fret: number) {
  return Note.fromMidi((Note.midi(guitarStrings[string]) ?? 40) + fret);
}
export function chordVoicing(name: string) {
  return guitarChords[name].flatMap((fret, index) => (fret < 0 ? [] : [fretNote(index, fret)]));
}
export function theoryChord(name: string) {
  return Chord.get(name).notes.map(note => `${note}4`);
}
export const intervals = [
  { id: '2M', title: '大二度', semitones: 2 },
  { id: '3M', title: '大三度', semitones: 4 },
  { id: '5P', title: '纯五度', semitones: 7 },
  { id: '8P', title: '纯八度', semitones: 12 },
];
export interface EarQuestion {
  interval: (typeof intervals)[number];
  notes: string[];
}
export function earQuestion(random = Math.random): EarQuestion {
  const interval = intervals[Math.min(3, Math.floor(random() * intervals.length))];
  const root = ['C4', 'D4', 'F4', 'G4'][Math.min(3, Math.floor(random() * 4))];
  return { interval, notes: [root, Note.transpose(root, interval.id)] };
}
export function intervalDistance(question: EarQuestion) {
  return Interval.semitones(Interval.distance(question.notes[0], question.notes[1]));
}
export function tapTempo(taps: number[]) {
  if (taps.length < 5) return null;
  const gaps = taps.slice(1).map((tap, i) => tap - taps[i]);
  if (gaps.some(gap => gap <= 0 || gap > 5000)) return null;
  const mean = gaps.reduce((sum, value) => sum + value, 0) / gaps.length;
  const deviation = Math.sqrt(gaps.reduce((sum, value) => sum + (value - mean) ** 2, 0) / gaps.length);
  return { bpm: Math.round(60000 / mean), consistency: Math.max(0, Math.round(100 * (1 - deviation / mean))) };
}
export const scaleXml = `<?xml version="1.0" encoding="utf-8"?>
<score-partwise version="4.0"><work><work-title>C 大调</work-title></work><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">
<measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
${['C', 'D', 'E', 'F'].map(step => `<note><pitch><step>${step}</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>`).join('')}</measure>
<measure number="2">${['G', 'A', 'B', 'C'].map((step, i) => `<note><pitch><step>${step}</step><octave>${i === 3 ? 5 : 4}</octave></pitch><duration>1</duration><type>quarter</type></note>`).join('')}<barline location="right"><bar-style>light-heavy</bar-style></barline></measure></part></score-partwise>`;
