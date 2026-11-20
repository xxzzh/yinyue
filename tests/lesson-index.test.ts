import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { courses, filterCourses as fullFilter } from '../src/data.ts';
import { traditionalInstrument } from '../src/traditional-catalog.ts';
import { toCourseMeta } from '../src/course-meta.ts';
import { courseIndex } from '../src/lesson-index.ts';
import {
  allLessons,
  filterCourses,
  findLesson,
  lessonChunk,
  lessonCourse,
  loadLesson,
  loadSources,
} from '../src/course-index.ts';
import { allLessons as fullLessons } from '../src/data.ts';

test('the generated lesson index matches the lesson content', () => {
  assert.deepEqual(
    courseIndex,
    courses.map(course => toCourseMeta(course, traditionalInstrument(course.id)?.tradition)),
    'The lesson index is out of date: run `npm run index` and commit src/lesson-index.ts',
  );
  assert.equal(allLessons.length, 1534);
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
  for (const file of [
    'App.tsx',
    'curriculum.ts',
    'Path.tsx',
    'Art.tsx',
    'InstrumentImage.tsx',
    'Traditional.tsx',
    'World.tsx',
  ]) {
    const source = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(
      source,
      /^import \{[^}]*\} from '\.\/data(\.ts)?';/m,
      `${file} should not import lesson content`,
    );
    if (!['Traditional.tsx', 'World.tsx'].includes(file))
      assert.doesNotMatch(source, /from '\.\/(traditional|world)-catalog(\.ts)?'/, file);
    assert.doesNotMatch(source, /from '\.\/instrument-credits'/, file);
  }
});

test('each lesson loads from its own chunk with the same content as the full data', async () => {
  const counts: Record<string, number> = {};
  for (const lesson of fullLessons) {
    const loaded = await loadLesson(lesson.id);
    assert.deepEqual(loaded, lesson, lesson.id);
    counts[lessonChunk(lesson.id)] = (counts[lessonChunk(lesson.id)] ?? 0) + 1;
  }
  assert.deepEqual(counts, {
    catalog: 618,
    core: 150,
    'core-l5': 30,
    piano: 66,
    guitar: 66,
    voice: 70,
    guzheng: 66,
    koudi: 67,
    'piano-l5': 15,
    'guitar-l5': 15,
    'voice-l5': 15,
    'guzheng-l5': 15,
    'koudi-l5': 15,
    ukulele: 81,
    kalimba: 82,
    recorder: 82,
    drums: 81,
  });
  assert.equal(lessonChunk('rh2-01'), 'core');
  assert.equal(lessonChunk('piano-l3-05'), 'piano');
  assert.equal(lessonChunk('piano-l5-05'), 'piano-l5');
  assert.equal(lessonChunk('piano-1'), 'catalog');
  await assert.rejects(loadLesson('piano-l9-99'));
  // Reading links come from a small generated module that matches the courses.
  const { courseSources } = await loadSources();
  assert.deepEqual(
    courseSources,
    Object.fromEntries(courses.filter(course => course.sources?.length).map(course => [course.id, course.sources])),
    'Course sources are out of date: run `npm run index` and commit src/course-sources.ts',
  );
});

test('the catalog chunk does not pull in the main line or the instrument lines', () => {
  for (const file of ['catalog-content.ts', 'core-extras.ts', 'InstrumentChooser.tsx']) {
    const source = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(
      source,
      /from '\.\/(core-l\d-lessons|core-lessons|(piano|guitar|voice|guzheng|koudi)(-l3)?-lessons)(\.ts)?'/,
      file,
    );
    assert.doesNotMatch(source, /^import \{[^}]*\} from '\.\/data(\.ts)?';/m, file);
  }
});

test('no app module loads the full lesson data at runtime (only tests and the index script do)', () => {
  const dir = new URL('../src/', import.meta.url);
  for (const file of readdirSync(dir).filter(name => /\.tsx?$/.test(name) && name !== 'data.ts')) {
    const source = readFileSync(new URL(file, dir), 'utf8');
    assert.doesNotMatch(source, /^import \{[^}]*\} from '\.\/data(\.ts)?';/m, `${file} imports ./data at runtime`);
  }
});
