import test from 'node:test';
import assert from 'node:assert/strict';
import { allLessons, courses, filterCourses, findCourse } from '../src/data.ts';
import { filterWorld, worldCatalog, worldInstrument, worldSources } from '../src/world-catalog.ts';

test('world expansion has distinct complete routes, image metadata and meaningful quizzes', () => {
  assert.equal(worldCatalog.length, 92);
  assert.equal(new Set(worldCatalog.map(item => item.id)).size, 92);
  assert.equal(new Set(courses.map(course => course.id)).size, courses.length);
  assert.equal(new Set(allLessons.map(lesson => lesson.id)).size, allLessons.length);
  assert.equal(courses.length, 202);
  assert.equal(allLessons.length, 618);
  for (const item of worldCatalog) {
    const course = findCourse(item.id)!;
    assert.ok(course, item.id);
    assert.equal(course.traditional, undefined, item.id);
    assert.equal(course.family, item.family);
    assert.equal(course.lessons.length, 3);
    assert.ok(course.sources?.some(source => source.url === worldSources[item.ref].url));
    assert.ok(item.shape.length > 15 && item.voice.length > 15 && item.step.length > 15 && item.contrast.length > 15, item.id);
    for (const lesson of course.lessons) {
      assert.equal(lesson.widget, 'discovery');
      assert.equal(lesson.activity?.steps.length, 3);
      assert.equal(lesson.quiz.options.length, 4);
      assert.equal(new Set(lesson.quiz.options).size, 4, lesson.id);
      assert.ok(lesson.quiz.answer >= 0 && lesson.quiz.answer < 4, lesson.id);
      assert.equal(lesson.quiz.options[lesson.quiz.answer], lesson.quiz.explanation);
      assert.ok(lesson.sections.every(section => section.body.length >= 15), lesson.id);
    }
  }
});

test('world discovery combines names, English, aliases, region and playing family', () => {
  for (const [query,id] of [['黑管','clarinet'],['巴松','bassoon'],['拇指琴','kalimba'],['Siku','andeanpanpipe'],['Bağlama','baglama'],['钢鼓','steelpan']]) {
    assert.ok(filterWorld(query).some(item => item.id === id), query);
    assert.ok(filterCourses(query).some(course => course.id === id), query);
  }
  assert.deepEqual(filterWorld('  CELLO  ', 'bowed').map(item => item.id), ['cello']);
  assert.deepEqual(filterWorld('印度尼西亚','percussion','东南亚').map(item => item.id), ['angklung']);
  assert.equal(filterWorld('cello','wind').length, 0);
  assert.equal(filterWorld('不存在的乐器').length, 0);
  assert.equal(worldInstrument('not-an-instrument'), undefined);
});

test('added Chinese names stay distinct from historical homophones and current routes', () => {
  assert.equal(findCourse('chuzhu')?.tag, '柷');
  assert.equal(findCourse('zhu')?.tag, '筑');
  assert.equal(findCourse('yuscraper')?.tag, '敔');
  assert.equal(findCourse('yu')?.tag, '竽');
  assert.deepEqual(findCourse('piano')!.lessons.map(lesson => lesson.id), ['piano-1','piano-2','piano-3','piano-4']);
});
