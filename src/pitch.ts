// Single-note pitch detection for the microphone tools (YIN: de Cheveigné & Kawahara, 2002). Pure functions,
// tested with synthetic tones. It follows one clear note at a time; chords, strong noise and very breathy or
// rich tones can confuse it, so results are reference only.
import { Note } from 'tonal';

export interface PitchReading {
  frequency: number;
  /** 0–1: how periodic the sound is; low values mean noise or unclear pitch. */
  clarity: number;
}

export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  { min = 70, max = 1500, threshold = 0.15 } = {},
): PitchReading | null {
  let energy = 0;
  for (const value of buffer) energy += value * value;
  if (Math.sqrt(energy / buffer.length) < 0.01) return null;
  const half = Math.floor(buffer.length / 2);
  const minTau = Math.max(2, Math.floor(sampleRate / max));
  const maxTau = Math.min(half - 1, Math.ceil(sampleRate / min));
  if (maxTau <= minTau) return null;
  // Cumulative mean normalised difference.
  const yin = new Float32Array(maxTau + 1);
  yin[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < half; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    running += sum;
    yin[tau] = running ? (sum * tau) / running : 1;
  }
  let tau = -1;
  for (let t = minTau; t <= maxTau; t++)
    if (yin[t] < threshold) {
      while (t + 1 <= maxTau && yin[t + 1] < yin[t]) t++;
      tau = t;
      break;
    }
  if (tau < 0) return null;
  // Parabolic interpolation around the minimum for sub-sample accuracy.
  const before = yin[tau - 1] ?? yin[tau];
  const after = yin[tau + 1] ?? yin[tau];
  const shift = (after - before) / (2 * (2 * yin[tau] - before - after) || 1);
  const period = tau + (Number.isFinite(shift) && Math.abs(shift) < 1 ? shift : 0);
  return { frequency: sampleRate / period, clarity: Math.max(0, 1 - yin[tau]) };
}

export interface NoteReading {
  /** Nearest equal-tempered note, spelled with sharps (F#4). */
  note: string;
  midi: number;
  /** Deviation from that note in cents, −50 to +50. */
  cents: number;
}
export function nearestNote(frequency: number): NoteReading {
  const exact = 69 + 12 * Math.log2(frequency / 440);
  const midi = Math.round(exact);
  return { note: Note.fromMidiSharps(midi), midi, cents: Math.round((exact - midi) * 100) || 0 };
}

/** Whether a reading matches a target note within a tolerance; `anyOctave` accepts the same note name. */
export function matchesTarget(reading: NoteReading, target: string, tolerance = 25, anyOctave = false) {
  const midi = Note.midi(target);
  if (midi === null || Math.abs(reading.cents) > tolerance) return false;
  return anyOctave ? (reading.midi - midi) % 12 === 0 : reading.midi === midi;
}
