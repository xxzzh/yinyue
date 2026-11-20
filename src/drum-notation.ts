import type { DrumVoice } from './instrument-profiles.ts';

const voices = { K: 'kick', S: 'snare', H: 'hat' } as const;

export interface DrumStep {
  hits: DrumVoice[];
  beats: number;
  accent?: boolean;
}

export interface DrumExample {
  score: string;
  tempo: number;
}

/** Bars are separated by |, beats by /, and subdivisions by spaces. '-' is a rest and '!' is an accent. */
export function parseDrumScore(score: string) {
  return score.split('|').map(bar =>
    bar.split('/').map(beat => {
      const cells = beat.trim().split(/\s+/);
      return cells.map(token => {
        if (!/^(?:[KSH]+!?|-)$/u.test(token)) throw new Error(`Invalid drum cell: ${token}`);
        const hits = [...token.replace(/[-!]/gu, '')].map(voice => voices[voice as keyof typeof voices]);
        if (new Set(hits).size !== hits.length) throw new Error(`Repeated voice in drum cell: ${token}`);
        return { token, hits, beats: 1 / cells.length, accent: token.endsWith('!') };
      });
    }),
  );
}
