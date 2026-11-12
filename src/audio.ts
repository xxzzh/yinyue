import type * as ToneTypes from 'tone';
import type { DrumPattern, DrumVoice } from './instrument-profiles';
import type { MusicEvent } from './jianpu';
let tone: typeof ToneTypes | null = null;
let piano: ToneTypes.PolySynth | null = null;
export type Voice = 'piano' | 'guitar' | 'wind';
let wind: ToneTypes.PolySynth | null = null;
let guitarVoices: ToneTypes.PluckSynth[] = [];
let nextVoice = 0;
let click: ToneTypes.Synth | null = null;
let masterVolume = 0.6;
let kick: ToneTypes.MembraneSynth | null = null;
let snare: ToneTypes.NoiseSynth | null = null;
let hat: ToneTypes.NoiseSynth | null = null;

export function setVolume(value: number) {
  masterVolume = value;
  if (tone) tone.getDestination().volume.value = value === 0 ? -Infinity : 20 * Math.log10(value) - 10;
}
async function engine() {
  if (!tone) tone = await import('tone');
  await tone.start();
  if (!piano)
    piano = new tone.PolySynth(tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.008, decay: 0.4, sustain: 0.12, release: 0.9 },
    }).toDestination();
  // A pluck voice rings until retriggered, so six voices let chords and strums ring like six strings.
  const library = tone;
  if (!guitarVoices.length)
    guitarVoices = Array.from({ length: 6 }, () =>
      new library.PluckSynth({ attackNoise: 0.8, dampening: 3200, resonance: 0.9 }).toDestination(),
    );
  const guitar = {
    triggerAttackRelease(note: string, duration: ToneTypes.Unit.Time, time?: number) {
      guitarVoices[nextVoice++ % guitarVoices.length].triggerAttackRelease(note, duration, time);
    },
  };
  // A soft, breathy-free sine for wind examples (koudi); a reference tone, not an imitation of the instrument.
  if (!wind)
    wind = new tone.PolySynth(tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.06, decay: 0.1, sustain: 0.85, release: 0.25 },
    }).toDestination();
  if (!click)
    click = new tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.035, sustain: 0, release: 0.02 },
      volume: -7,
    }).toDestination();
  setVolume(masterVolume);
  return { tone, piano, guitar, click, wind };
}
export async function playNote(note: string, instrument: Voice = 'piano') {
  const e = await engine();
  if (instrument === 'wind') e.wind.triggerAttackRelease(note, '2n');
  else if (instrument === 'guitar') e.guitar.triggerAttackRelease(note, '4n');
  else e.piano.triggerAttackRelease(note, '4n');
}
export async function playSequence(
  notes: string[],
  together = false,
  instrument: 'piano' | 'guitar' = 'piano',
  step = 0.46,
) {
  const e = await engine();
  const now = e.tone.now() + 0.035;
  if (together && instrument === 'piano') e.piano.triggerAttackRelease(notes, '2n', now);
  else
    notes.forEach((note, index) => {
      const time = now + index * (together ? 0.04 : step);
      (instrument === 'piano' ? e.piano : e.guitar).triggerAttackRelease(note, '4n', time);
    });
}
export async function metronome(bpm: number, onBeat: (beat: number) => void, beatsPerBar = 4): Promise<() => void> {
  const e = await engine();
  let next = e.tone.now() + 0.08;
  let beat = 0;
  const scheduled = new Set<ReturnType<typeof setTimeout>>();
  const timer = setInterval(() => {
    const now = e.tone.now();
    if (next < now - 0.1) next = now + 0.03;
    while (next < now + 0.1) {
      const current = beat % beatsPerBar;
      e.click.triggerAttackRelease(current === 0 ? 'C6' : 'G5', 0.025, next);
      const timeout = setTimeout(
        () => {
          scheduled.delete(timeout);
          onBeat(current);
        },
        Math.max(0, (next - now) * 1000),
      );
      scheduled.add(timeout);
      next += 60 / bpm;
      beat++;
    }
  }, 25);
  return () => {
    clearInterval(timer);
    scheduled.forEach(clearTimeout);
    e.click.triggerRelease();
  };
}

/**
 * Plays timed events (melodies, chords, rests) with a short look-ahead, so the returned stop function can
 * cut playback cleanly. `onStep` receives the event index as it sounds, and -1 when playback ends.
 */
export async function playEvents(
  events: MusicEvent[],
  bpm: number,
  options: { click?: boolean; instrument?: Voice; onStep?: (index: number) => void } = {},
): Promise<() => void> {
  const e = await engine();
  const beat = 60 / bpm;
  const start = e.tone.now() + 0.1;
  // Events follow one another unless they carry their own start (two hands playing together).
  const times: number[] = [];
  let cursor = 0;
  let total = 0;
  for (const event of events) {
    const at = event.start ?? cursor;
    times.push(start + at * beat);
    cursor = at + event.beats;
    total = Math.max(total, cursor);
  }
  const pending = new Set<ReturnType<typeof setTimeout>>();
  const later = (seconds: number, run: () => void) => {
    const timeout = setTimeout(
      () => {
        pending.delete(timeout);
        run();
      },
      Math.max(0, seconds * 1000),
    );
    pending.add(timeout);
  };
  let next = 0;
  let nextClick = 0;
  const timer = setInterval(() => {
    const now = e.tone.now();
    while (next < events.length && times[next] < now + 0.12) {
      const event = events[next];
      const index = next;
      if (event.notes.length) {
        const length = Math.max(0.08, event.beats * beat * 0.92);
        // Chords on the guitar are strummed: low to high, or high to low for an up-strum.
        if (options.instrument === 'wind')
          e.wind.triggerAttackRelease(event.notes, length, times[index], event.velocity);
        else if (options.instrument === 'guitar')
          (event.up ? [...event.notes].reverse() : event.notes).forEach((note, i) =>
            e.guitar.triggerAttackRelease(note, length, times[index] + i * 0.016),
          );
        else e.piano.triggerAttackRelease(event.notes, length, times[index], event.velocity);
      }
      later(times[index] - now, () => options.onStep?.(index));
      next++;
    }
    while (options.click && nextClick < Math.ceil(total) && start + nextClick * beat < now + 0.12) {
      e.click.triggerAttackRelease(nextClick === 0 ? 'C6' : 'G5', 0.025, start + nextClick * beat);
      nextClick++;
    }
    if (next >= events.length && (!options.click || nextClick >= Math.ceil(total))) {
      clearInterval(timer);
      later(start + total * beat - now, () => options.onStep?.(-1));
    }
  }, 25);
  return () => {
    clearInterval(timer);
    pending.forEach(clearTimeout);
    e.piano.releaseAll();
    options.onStep?.(-1);
  };
}

async function drumEngine() {
  const e = await engine();
  if (!kick)
    kick = new e.tone.MembraneSynth({
      pitchDecay: 0.025,
      octaves: 5,
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
      volume: -6,
    }).toDestination();
  if (!snare)
    snare = new e.tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.03 },
      volume: -14,
    }).toDestination();
  if (!hat)
    hat = new e.tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.01 },
      volume: -23,
    }).toDestination();
  return { tone: e.tone, kick, snare, hat };
}
function triggerDrum(e: Awaited<ReturnType<typeof drumEngine>>, voice: DrumVoice, time: number) {
  if (voice === 'kick') e.kick.triggerAttackRelease('C2', '16n', time);
  else e[voice].triggerAttackRelease('32n', time);
}
export async function playDrum(voice: DrumVoice) {
  const e = await drumEngine();
  triggerDrum(e, voice, e.tone.now() + 0.01);
}
export async function drumLoop(pattern: DrumPattern, bpm: number, onStep: (step: number) => void): Promise<() => void> {
  const e = await drumEngine();
  let next = e.tone.now() + 0.08;
  let step = 0;
  const pending = new Set<ReturnType<typeof setTimeout>>();
  const timer = setInterval(() => {
    const now = e.tone.now();
    if (next < now - 0.1) next = now + 0.03;
    while (next < now + 0.1) {
      const current = step % 8;
      for (const voice of ['kick', 'snare', 'hat'] as const) if (pattern[voice][current]) triggerDrum(e, voice, next);
      const timeout = setTimeout(
        () => {
          pending.delete(timeout);
          onStep(current);
        },
        Math.max(0, (next - now) * 1000),
      );
      pending.add(timeout);
      next += 30 / bpm;
      step++;
    }
  }, 25);
  return () => {
    clearInterval(timer);
    pending.forEach(clearTimeout);
    e.snare.triggerRelease();
    e.hat.triggerRelease();
  };
}
