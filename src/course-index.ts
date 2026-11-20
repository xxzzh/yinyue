// First-screen access to courses and lessons. Lists, search, the overview and the graded path use this light
// index; the lesson reader loads the full content of one lesson on demand with `loadLesson`, which imports only
// the chunk that holds it (the main line, one instrument line, or the catalog).
import { courseIndex } from './lesson-index.ts';
import { courseFamilies, courseMatches } from './course-meta.ts';
import type { Lesson } from './data.ts';
import { isSecondBatchLine } from './second-batch-order.ts';
import type { SecondBatchLine } from './second-batch-order.ts';
import type { InstrumentLine } from './instrument-order.ts';

export { courseFamilies };
export const courses = courseIndex;
export const allLessons = courses.flatMap(course => course.lessons);
export const findCourse = (id: string) => courses.find(course => course.id === id);
export const findLesson = (id: string) => allLessons.find(lesson => lesson.id === id);
export const lessonCourse = (id: string) => courses.find(course => course.lessons.some(lesson => lesson.id === id));
export const filterCourses = (query: string, family = 'all') =>
  courses.filter(course => courseMatches(course, query, family, course.tradition));

/** Which content chunk holds a lesson; IDs follow the conventions of the lesson files. */
type FirstBatchLine = Exclude<InstrumentLine, SecondBatchLine>;
export type LessonChunk = InstrumentLine | `${FirstBatchLine}-l5` | 'core' | 'core-l5' | 'catalog';
export function lessonChunk(id: string): LessonChunk {
  if (/^(rh|nt|th|ea|cr|ls|pf)\d-\d\d$/.test(id)) return id[2] === '5' ? 'core-l5' : 'core';
  const match = /^(piano|guitar|voice|guzheng|koudi|ukulele|kalimba|recorder|drums)-l(\d)-\d\d$/.exec(id);
  if (!match) return 'catalog';
  if (isSecondBatchLine(match[1])) return match[1];
  const line = match[1] as FirstBatchLine;
  return match[2] === '5' ? `${line}-l5` : line;
}
const chunkLoaders: Record<LessonChunk, () => Promise<Lesson[]>> = {
  core: () =>
    Promise.all([
      import('./core-lessons.ts'),
      import('./core-l2-lessons.ts'),
      import('./core-l3-lessons.ts'),
      import('./core-l4-lessons.ts'),
    ]).then(([l01, l2, l3, l4]) => [
      ...l01.coreL0Lessons,
      ...l01.coreL1Lessons,
      ...l2.coreL2Lessons,
      ...l3.coreL3Lessons,
      ...l4.coreL4Lessons,
    ]),
  'core-l5': () => import('./core-l5-lessons.ts').then(module => module.coreL5Lessons),
  piano: () =>
    Promise.all([import('./piano-lessons.ts'), import('./piano-l3-lessons.ts'), import('./piano-l4-lessons.ts')]).then(
      ([a, b, c]) => [...a.pianoLessons, ...b.pianoL3Lessons, ...c.pianoL4Lessons],
    ),
  guitar: () =>
    Promise.all([
      import('./guitar-lessons.ts'),
      import('./guitar-l3-lessons.ts'),
      import('./guitar-l4-lessons.ts'),
    ]).then(([a, b, c]) => [...a.guitarLessons, ...b.guitarL3Lessons, ...c.guitarL4Lessons]),
  voice: () =>
    Promise.all([import('./voice-lessons.ts'), import('./voice-l3-lessons.ts'), import('./voice-l4-lessons.ts')]).then(
      ([a, b, c]) => [...a.voiceLessons, ...b.voiceL3Lessons, ...c.voiceL4Lessons],
    ),
  guzheng: () =>
    Promise.all([
      import('./guzheng-lessons.ts'),
      import('./guzheng-l3-lessons.ts'),
      import('./guzheng-l4-lessons.ts'),
    ]).then(([a, b, c]) => [...a.guzhengLessons, ...b.guzhengL3Lessons, ...c.guzhengL4Lessons]),
  koudi: () =>
    Promise.all([import('./koudi-lessons.ts'), import('./koudi-l3-lessons.ts'), import('./koudi-l4-lessons.ts')]).then(
      ([a, b, c]) => [...a.koudiLessons, ...b.koudiL3Lessons, ...c.koudiL4Lessons],
    ),
  'piano-l5': () => import('./piano-l5-lessons.ts').then(module => module.pianoL5Lessons),
  'guitar-l5': () => import('./guitar-l5-lessons.ts').then(module => module.guitarL5Lessons),
  'voice-l5': () => import('./voice-l5-lessons.ts').then(module => module.voiceL5Lessons),
  'guzheng-l5': () => import('./guzheng-l5-lessons.ts').then(module => module.guzhengL5Lessons),
  'koudi-l5': () => import('./koudi-l5-lessons.ts').then(module => module.koudiL5Lessons),
  ukulele: () => import('./ukulele-lessons.ts').then(module => module.ukuleleLessons),
  kalimba: () => import('./kalimba-lessons.ts').then(module => module.kalimbaLessons),
  recorder: () => import('./recorder-lessons.ts').then(module => module.recorderLessons),
  drums: () => import('./drums-lessons.ts').then(module => module.drumsLessons),
  catalog: () => import('./catalog-content.ts').then(module => module.baseLessons),
};
const chunks = new Map<LessonChunk, Promise<Map<string, Lesson>>>();
const lessons = new Map<string, Promise<Lesson>>();
/** Loads the chunk once; a failed load (offline) is forgotten so the next call retries. */
function loadChunk(chunk: LessonChunk) {
  let pending = chunks.get(chunk);
  if (!pending) {
    pending = chunkLoaders[chunk]().then(list => new Map(list.map(lesson => [lesson.id, lesson])));
    pending.catch(() => chunks.delete(chunk));
    chunks.set(chunk, pending);
  }
  return pending;
}
/** The full content of one lesson. The promise is cached per lesson, so React's `use` can wait on it. */
export function loadLesson(id: string): Promise<Lesson> {
  let pending = lessons.get(id);
  if (!pending) {
    pending = loadChunk(lessonChunk(id)).then(found => {
      const lesson = found.get(id);
      if (!lesson) throw new Error(`Lesson ${id} is not in the ${lessonChunk(id)} chunk`);
      return lesson;
    });
    pending.catch(() => lessons.delete(id));
    lessons.set(id, pending);
  }
  return pending;
}
let sources: Promise<typeof import('./course-sources.ts')> | undefined;
/** Reading links of every course (a small generated module). */
export function loadSources() {
  sources ??= import('./course-sources.ts').catch(error => {
    sources = undefined;
    throw error;
  });
  return sources;
}
/** Warms up the chunk of a lesson the learner is likely to open next. */
export const preloadLesson = (id: string) => loadChunk(lessonChunk(id)).catch(() => undefined);
