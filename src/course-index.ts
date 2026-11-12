// First-screen access to courses and lessons. Lists, search, the overview and the graded path use this light
// index; the lesson reader loads the full content of one lesson on demand with `loadLesson`, which imports only
// the chunk that holds it (the main line, one instrument line, or the catalog).
import { courseIndex } from './lesson-index.ts';
import { courseFamilies, courseMatches } from './course-meta.ts';
import type { Lesson } from './data.ts';

export { courseFamilies };
export const courses = courseIndex;
export const allLessons = courses.flatMap(course => course.lessons);
export const findCourse = (id: string) => courses.find(course => course.id === id);
export const findLesson = (id: string) => allLessons.find(lesson => lesson.id === id);
export const lessonCourse = (id: string) => courses.find(course => course.lessons.some(lesson => lesson.id === id));
export const filterCourses = (query: string, family = 'all') =>
  courses.filter(course => courseMatches(course, query, family, course.tradition));

/** Which content chunk holds a lesson; IDs follow the conventions of the lesson files. */
export type LessonChunk = 'core' | 'piano' | 'guitar' | 'voice' | 'guzheng' | 'koudi' | 'catalog';
export function lessonChunk(id: string): LessonChunk {
  if (/^(rh|nt|th|ea|cr|ls|pf)\d-\d\d$/.test(id)) return 'core';
  const line = /^(piano|guitar|voice|guzheng|koudi)-l\d-\d\d$/.exec(id);
  return line ? (line[1] as LessonChunk) : 'catalog';
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
  piano: () =>
    Promise.all([import('./piano-lessons.ts'), import('./piano-l3-lessons.ts')]).then(([a, b]) => [
      ...a.pianoLessons,
      ...b.pianoL3Lessons,
    ]),
  guitar: () =>
    Promise.all([import('./guitar-lessons.ts'), import('./guitar-l3-lessons.ts')]).then(([a, b]) => [
      ...a.guitarLessons,
      ...b.guitarL3Lessons,
    ]),
  voice: () =>
    Promise.all([import('./voice-lessons.ts'), import('./voice-l3-lessons.ts')]).then(([a, b]) => [
      ...a.voiceLessons,
      ...b.voiceL3Lessons,
    ]),
  guzheng: () =>
    Promise.all([import('./guzheng-lessons.ts'), import('./guzheng-l3-lessons.ts')]).then(([a, b]) => [
      ...a.guzhengLessons,
      ...b.guzhengL3Lessons,
    ]),
  koudi: () =>
    Promise.all([import('./koudi-lessons.ts'), import('./koudi-l3-lessons.ts')]).then(([a, b]) => [
      ...a.koudiLessons,
      ...b.koudiL3Lessons,
    ]),
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
