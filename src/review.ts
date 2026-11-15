import { stableHash } from './catalog-quiz.ts';
import type { QuizItem } from './data.ts';

export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const;

export interface ReviewEntry {
  step: number;
  /** A local calendar date. Null retains a finished entry for backup merging. */
  due: string | null;
  updatedAt: string;
}

export type ReviewQueue = Record<string, ReviewEntry>;

export function reviewQuestionId(lessonId: string, question: QuizItem) {
  const identity = JSON.stringify([question.question, question.options[question.answer], question.listen]);
  return `${lessonId}:${stableHash(identity).toString(36)}`;
}

export const reviewLessonId = (questionId: string) => questionId.split(':', 1)[0];

function dateAfter(day: string, interval: number) {
  // Add days to the calendar date so daylight-saving changes cannot shift a due date.
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + interval);
  return date.toISOString().slice(0, 10);
}

function isDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    dateAfter(value, 0) === value
  );
}

export function validateReviewQueue(value: unknown): ReviewQueue {
  const queue: ReviewQueue = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return queue;
  for (const [id, entry] of Object.entries(value)) {
    if (!/^[a-z0-9-]{1,60}:[a-z0-9]{1,7}$/.test(id) || !entry || typeof entry !== 'object') continue;
    const { step, due, updatedAt } = entry as Record<string, unknown>;
    if (
      typeof step !== 'number' ||
      !Number.isInteger(step) ||
      step < 0 ||
      step > REVIEW_INTERVALS.length ||
      (step === REVIEW_INTERVALS.length ? due !== null : !isDate(due)) ||
      typeof updatedAt !== 'string' ||
      !Number.isFinite(Date.parse(updatedAt)) ||
      new Date(updatedAt).toISOString() !== updatedAt
    )
      continue;
    queue[id] = { step, due: due as string | null, updatedAt };
  }
  return queue;
}

export function pendingReviews(queue: ReviewQueue) {
  return Object.entries(queue)
    .flatMap(([id, entry]) => (entry.due ? [{ id, due: entry.due }] : []))
    .sort((a, b) => a.due.localeCompare(b.due) || a.id.localeCompare(b.id));
}

export function recordMistake(queue: ReviewQueue, id: string, today: string, updatedAt: string): ReviewQueue {
  const due = dateAfter(today, REVIEW_INTERVALS[0]);
  const previous = queue[id];
  if (previous?.step === 0 && previous.due === due) return queue;
  return { ...queue, [id]: { step: 0, due, updatedAt } };
}

export function answerReview(
  queue: ReviewQueue,
  id: string,
  result: 'correct' | 'incorrect' | 'unavailable',
  today: string,
  updatedAt: string,
): ReviewQueue {
  const entry = queue[id];
  if (!entry?.due || entry.due > today) return queue;
  const step = result === 'unavailable' ? REVIEW_INTERVALS.length : result === 'correct' ? entry.step + 1 : 0;
  const interval = REVIEW_INTERVALS[step];
  return { ...queue, [id]: { step, due: interval ? dateAfter(today, interval) : null, updatedAt } };
}
