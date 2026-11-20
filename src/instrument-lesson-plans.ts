// Working titles for unwritten instrument lessons, in path order. Published IDs live in instrument-order.ts.
import type { Stage } from './curriculum.ts';
import type { InstrumentLine } from './instrument-order.ts';

export const instrumentLessonPlans: Partial<Record<InstrumentLine, Partial<Record<Stage, string[]>>>> = {};
