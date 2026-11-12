// Small helpers for writing lessons: a quiz item and a lesson with [title, body] sections whose first question
// becomes the main quiz. Used by the lesson files written from M4 on.
import type { Lesson, QuizItem } from './data.ts';

export const q = (
  question: string,
  options: string[],
  answer: number,
  explanation: string,
  listen?: string,
): QuizItem => ({
  question,
  options,
  answer,
  explanation,
  ...(listen ? { listen } : {}),
});

/**
 * Rotates the options so the correct one sits at `slot` (mod the option count). The cyclic order of the options
 * is kept, and authors can write the correct option anywhere; answers then vary in position across a lesson.
 */
export function placeAnswer(item: QuizItem, slot: number): QuizItem {
  const count = item.options.length;
  const target = slot % count;
  const shift = (target - item.answer + count) % count;
  if (!shift) return item;
  return {
    ...item,
    options: item.options.map((_, i) => item.options[(i - shift + count) % count]),
    answer: target,
  };
}
const seedOf = (text: string) => [...text].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 9973, 7);

export type LessonSpec = Omit<Lesson, 'sections' | 'quiz' | 'more'> & {
  sections: [string, string][];
  questions: QuizItem[];
};
export function lesson({ sections, questions, ...rest }: LessonSpec): Lesson {
  const seed = seedOf(rest.id);
  const placed = questions.map((item, i) => placeAnswer(item, seed + i));
  return {
    ...rest,
    sections: sections.map(([title, body]) => ({ title, body })),
    quiz: placed[0],
    more: placed.slice(1),
  };
}
