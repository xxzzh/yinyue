// Working titles for unwritten instrument lessons, in path order. Published IDs live in instrument-order.ts.
import type { Stage } from './curriculum.ts';

type Line = 'piano' | 'guitar' | 'voice' | 'guzheng' | 'koudi';

export const instrumentLessonPlans: Partial<Record<Line, Partial<Record<Stage, string[]>>>> = {};
