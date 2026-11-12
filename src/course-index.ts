// First-screen access to courses and lessons. Lists, search, the overview and the graded path use this light
// index; the lesson reader loads the full content (data.ts) on demand with `loadContent`.
import { courseIndex } from './lesson-index.ts';
import { courseFamilies, courseMatches } from './course-meta.ts';

export { courseFamilies };
export const courses = courseIndex;
export const allLessons = courses.flatMap(course => course.lessons);
export const findCourse = (id: string) => courses.find(course => course.id === id);
export const findLesson = (id: string) => allLessons.find(lesson => lesson.id === id);
export const lessonCourse = (id: string) => courses.find(course => course.lessons.some(lesson => lesson.id === id));
export const filterCourses = (query: string, family = 'all') =>
  courses.filter(course => courseMatches(course, query, family, course.tradition));

let content: Promise<typeof import('./data.ts')> | undefined;
/** Loads the full lesson content once; a failed load (offline) is retried on the next call. */
export function loadContent() {
  content ??= import('./data.ts').catch(error => {
    content = undefined;
    throw error;
  });
  return content;
}
