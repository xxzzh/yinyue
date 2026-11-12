// Light course and lesson descriptions for the first screen (lists, search, the graded path). Full lesson
// content stays in data.ts and loads when a lesson opens; scripts/build-lesson-index.mjs derives the
// generated index (lesson-index.ts) from it with `toCourseMeta`.
import type { Course, Lesson } from './data.ts';

export type LessonMeta = Pick<Lesson, 'id' | 'title' | 'minutes' | 'intro' | 'widget'>;
export type CourseMeta = Omit<Course, 'lessons' | 'sources'> & {
  /** Representative tradition of a Chinese instrument, used by search. */
  tradition?: string;
  lessons: LessonMeta[];
};

export function toCourseMeta(course: Course, tradition?: string): CourseMeta {
  const { lessons, sources: _sources, ...rest } = course;
  return {
    ...rest,
    ...(tradition ? { tradition } : {}),
    lessons: lessons.map(({ id, title, minutes, intro, widget }) => ({ id, title, minutes, intro, widget })),
  };
}

export const courseFamilies = [
  { id: 'all', tag: '全部课程' },
  { id: 'foundation', tag: '乐理与听觉' },
  { id: 'keyboard', tag: '键盘' },
  { id: 'plucked', tag: '弹拨' },
  { id: 'bowed', tag: '弓弦' },
  { id: 'wind', tag: '管乐' },
  { id: 'percussion', tag: '打击乐' },
  { id: 'other', tag: '其他与电子' },
];

/** Shared search rule for the full data and the light index. */
export function courseMatches(
  course: Pick<CourseMeta, 'title' | 'tag' | 'description' | 'english' | 'aliases' | 'family'> & {
    lessons: { title: string }[];
  },
  query: string,
  family = 'all',
  tradition = '',
) {
  const normalized = query.trim().toLowerCase();
  return (
    (family === 'all' || course.family === family) &&
    (!normalized ||
      `${course.title} ${course.tag} ${course.description} ${course.english} ${course.aliases?.join(' ') ?? ''} ${tradition} ${course.lessons.map(lesson => lesson.title).join(' ')}`
        .toLowerCase()
        .includes(normalized))
  );
}
