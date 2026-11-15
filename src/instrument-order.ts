// Published lessons of each instrument line, by stage, in path order. IDs only, so the first screen can
// use it: the graded path (curriculum.ts) reads it, and data.ts orders each instrument course the same way.
export type LessonOrder = Partial<Record<0 | 1 | 2 | 3 | 4 | 5, string[]>>;

export const instrumentLessonOrder: Record<'piano' | 'guitar' | 'voice' | 'guzheng' | 'koudi', LessonOrder> = {
  piano: {
    0: ['piano-1', 'piano-l0-02', 'piano-l0-03', 'piano-l0-04'],
    1: [
      'piano-2',
      'piano-l1-01',
      'piano-l1-02',
      'piano-3',
      'piano-l1-03',
      'piano-4',
      'piano-l1-04',
      'piano-l1-05',
      'piano-l1-06',
      'piano-l1-07',
    ],
    2: Array.from({ length: 16 }, (_, i) => `piano-l2-${String(i + 1).padStart(2, '0')}`),
    3: Array.from({ length: 20 }, (_, i) => `piano-l3-${String(i + 1).padStart(2, '0')}`),
    4: Array.from({ length: 20 }, (_, i) => `piano-l4-${String(i + 1).padStart(2, '0')}`),
    5: Array.from({ length: 15 }, (_, i) => `piano-l5-${String(i + 1).padStart(2, '0')}`),
  },
  guitar: {
    0: ['guitar-1', 'guitar-l0-02', 'guitar-l0-03', 'guitar-l0-04'],
    1: [
      'guitar-2',
      'guitar-l1-01',
      'guitar-l1-02',
      'guitar-l1-03',
      'guitar-3',
      'guitar-l1-04',
      'guitar-l1-05',
      'guitar-4',
      'guitar-l1-06',
      'guitar-l1-07',
    ],
    2: Array.from({ length: 16 }, (_, i) => `guitar-l2-${String(i + 1).padStart(2, '0')}`),
    3: Array.from({ length: 20 }, (_, i) => `guitar-l3-${String(i + 1).padStart(2, '0')}`),
    4: Array.from({ length: 20 }, (_, i) => `guitar-l4-${String(i + 1).padStart(2, '0')}`),
    5: Array.from({ length: 15 }, (_, i) => `guitar-l5-${String(i + 1).padStart(2, '0')}`),
  },
  voice: {
    0: Array.from({ length: 4 }, (_, i) => `voice-l0-${String(i + 1).padStart(2, '0')}`),
    1: Array.from({ length: 10 }, (_, i) => `voice-l1-${String(i + 1).padStart(2, '0')}`),
    2: Array.from({ length: 16 }, (_, i) => `voice-l2-${String(i + 1).padStart(2, '0')}`),
    3: Array.from({ length: 20 }, (_, i) => `voice-l3-${String(i + 1).padStart(2, '0')}`),
    4: Array.from({ length: 20 }, (_, i) => `voice-l4-${String(i + 1).padStart(2, '0')}`),
    5: Array.from({ length: 15 }, (_, i) => `voice-l5-${String(i + 1).padStart(2, '0')}`),
  },
  guzheng: {
    0: ['guzheng-1', 'guzheng-l0-02', 'guzheng-l0-03', 'guzheng-l0-04'],
    1: [
      'guzheng-2',
      'guzheng-l1-01',
      'guzheng-l1-02',
      'guzheng-3',
      'guzheng-l1-03',
      'guzheng-l1-04',
      'guzheng-l1-05',
      'guzheng-4',
      'guzheng-l1-06',
      'guzheng-l1-07',
    ],
    2: Array.from({ length: 16 }, (_, i) => `guzheng-l2-${String(i + 1).padStart(2, '0')}`),
    3: Array.from({ length: 20 }, (_, i) => `guzheng-l3-${String(i + 1).padStart(2, '0')}`),
    4: Array.from({ length: 20 }, (_, i) => `guzheng-l4-${String(i + 1).padStart(2, '0')}`),
    5: Array.from({ length: 15 }, (_, i) => `guzheng-l5-${String(i + 1).padStart(2, '0')}`),
  },
  koudi: {
    0: ['koudi-1', 'koudi-2', 'koudi-3', 'koudi-l0-04'],
    1: Array.from({ length: 10 }, (_, i) => `koudi-l1-${String(i + 1).padStart(2, '0')}`),
    2: Array.from({ length: 16 }, (_, i) => `koudi-l2-${String(i + 1).padStart(2, '0')}`),
    3: Array.from({ length: 20 }, (_, i) => `koudi-l3-${String(i + 1).padStart(2, '0')}`),
    4: Array.from({ length: 20 }, (_, i) => `koudi-l4-${String(i + 1).padStart(2, '0')}`),
    5: Array.from({ length: 15 }, (_, i) => `koudi-l5-${String(i + 1).padStart(2, '0')}`),
  },
};

/** All published lessons of a line in path order. */
export const lineLessons = (order: LessonOrder) => ([0, 1, 2, 3, 4, 5] as const).flatMap(stage => order[stage] ?? []);
