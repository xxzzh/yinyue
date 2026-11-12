import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { courses, filterCourses as fullFilter } from '../src/data.ts';
import { traditionalInstrument } from '../src/traditional-catalog.ts';
import { toCourseMeta } from '../src/course-meta.ts';
import { courseIndex } from '../src/lesson-index.ts';
import { allLessons, filterCourses, findLesson, lessonCourse } from '../src/course-index.ts';

test('the generated lesson index matches the lesson content', () => {
  assert.deepEqual(
    courseIndex,
    courses.map(course => toCourseMeta(course, traditionalInstrument(course.id)?.tradition)),
    'The lesson index is out of date: run `npm run index` and commit src/lesson-index.ts',
  );
  assert.equal(allLessons.length, 788);
  assert.equal(findLesson('rh1-05')?.title, '附点二分音符与延音线');
  assert.equal(lessonCourse('rh1-05')?.id, 'ear');
  // The index keeps what lists need and leaves lesson bodies to the full content.
  const sample = courseIndex.find(course => course.id === 'ear')!.lessons[0] as Record<string, unknown>;
  assert.deepEqual(Object.keys(sample).sort(), ['id', 'intro', 'minutes', 'title', 'widget']);
});

test('search over the index finds the same courses as search over the full content', () => {
  for (const [query, family] of [
    ['钢琴', 'all'],
    ['七弦琴', 'all'],
    ['维吾尔', 'all'],
    ['简谱', 'all'],
    ['Siku', 'all'],
    ['', 'plucked'],
    ['鼓', 'percussion'],
  ])
    assert.deepEqual(
      filterCourses(query, family).map(course => course.id),
      fullFilter(query, family).map(course => course.id),
      `${query} / ${family}`,
    );
});

test('first-screen modules use the light index, not the full lesson content', () => {
  for (const file of ['App.tsx', 'curriculum.ts', 'Path.tsx', 'Art.tsx', 'InstrumentImage.tsx']) {
    const source = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(
      source,
      /^import \{[^}]*\} from '\.\/data(\.ts)?';/m,
      `${file} should not import lesson content`,
    );
    assert.doesNotMatch(source, /from '\.\/(traditional|world)-catalog(\.ts)?'/, file);
    assert.doesNotMatch(source, /from '\.\/instrument-credits'/, file);
  }
});
