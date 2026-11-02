import type * as ToneTypes from 'tone';
import type { DrumPattern, DrumVoice } from './instrument-profiles';
let tone: typeof ToneTypes | null = null;
let piano: ToneTypes.PolySynth | null = null;
let guitar: ToneTypes.PluckSynth | null = null;
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
  if (!piano) piano = new tone.PolySynth(tone.Synth, {
    oscillator: { type: 'triangle' }, envelope: { attack: 0.008, decay: 0.4, sustain: 0.12, release: 0.9 },
  }).toDestination();
  if (!guitar) guitar = new tone.PluckSynth({ attackNoise: 0.8, dampening: 3200, resonance: 0.88 }).toDestination();
  if (!click) click = new tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.035, sustain: 0, release: 0.02 }, volume: -7 }).toDestination();
  setVolume(masterVolume);
  return { tone, piano, guitar, click };
}
export async function playNote(note: string, instrument: 'piano' | 'guitar' = 'piano') {
  const e = await engine();
  if (instrument === 'guitar') e.guitar.triggerAttackRelease(note, '4n');
  else e.piano.triggerAttackRelease(note, '4n');
}
export async function playSequence(notes: string[], together = false, instrument: 'piano' | 'guitar' = 'piano', step = 0.46) {
  const e = await engine();
  const now = e.tone.now() + 0.035;
  if (together && instrument === 'piano') e.piano.triggerAttackRelease(notes, '2n', now);
  else notes.forEach((note, index) => {
    const time = now + index * (together ? 0.04 : step);
    (instrument === 'piano' ? e.piano : e.guitar).triggerAttackRelease(note, '4n', time);
  });
}
export async function metronome(bpm: number, onBeat: (beat: number) => void): Promise<() => void> {
  const e = await engine();
  let next = e.tone.now() + 0.08;
  let beat = 0;
  const scheduled = new Set<ReturnType<typeof setTimeout>>();
  const timer = setInterval(() => {
    const now = e.tone.now();
    if (next < now - 0.1) next = now + 0.03;
    while (next < now + 0.1) {
      const current = beat % 4;
      e.click.triggerAttackRelease(current === 0 ? 'C6' : 'G5', 0.025, next);
      const timeout = setTimeout(() => { scheduled.delete(timeout); onBeat(current); }, Math.max(0, (next - now) * 1000));
      scheduled.add(timeout);
      next += 60 / bpm; beat++;
    }
  }, 25);
  return () => { clearInterval(timer); scheduled.forEach(clearTimeout); e.click.triggerRelease(); };
}

async function drumEngine() {
  const e = await engine();
  if (!kick) kick = new e.tone.MembraneSynth({ pitchDecay: 0.025, octaves: 5, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 }, volume: -6 }).toDestination();
  if (!snare) snare = new e.tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.03 }, volume: -14 }).toDestination();
  if (!hat) hat = new e.tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.01 }, volume: -23 }).toDestination();
  return { tone: e.tone, kick, snare, hat };
}
function triggerDrum(e: Awaited<ReturnType<typeof drumEngine>>, voice: DrumVoice, time: number) {
  if (voice === 'kick') e.kick.triggerAttackRelease('C2', '16n', time);
  else e[voice].triggerAttackRelease('32n', time);
}
export async function playDrum(voice: DrumVoice) {
  const e = await drumEngine(); triggerDrum(e, voice, e.tone.now() + 0.01);
}
export async function drumLoop(pattern: DrumPattern, bpm: number, onStep: (step: number) => void): Promise<() => void> {
  const e = await drumEngine();
  let next = e.tone.now() + 0.08; let step = 0;
  const pending = new Set<ReturnType<typeof setTimeout>>();
  const timer = setInterval(() => {
    const now = e.tone.now();
    if (next < now - 0.1) next = now + 0.03;
    while (next < now + 0.1) {
      const current = step % 8;
      for (const voice of ['kick', 'snare', 'hat'] as const) if (pattern[voice][current]) triggerDrum(e, voice, next);
      const timeout = setTimeout(() => { pending.delete(timeout); onStep(current); }, Math.max(0, (next - now) * 1000));
      pending.add(timeout); next += 30 / bpm; step++;
    }
  }, 25);
  return () => { clearInterval(timer); pending.forEach(clearTimeout); e.snare.triggerRelease(); e.hat.triggerRelease(); };
}
