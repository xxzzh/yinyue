import test from 'node:test';
import assert from 'node:assert/strict';
import { allLessons, courses, filterCourses, findCourse } from '../src/data.ts';
import { filterTraditional, traditionalCatalog, traditionalInstrument, traditionalSources } from '../src/traditional-catalog.ts';
import { completeLesson, freshProgress, validateProgress } from '../src/progress.ts';

test('traditional directory covers every category and each entry opens a complete learning route', () => {
  assert.equal(traditionalCatalog.length, 88);
  assert.equal(new Set(traditionalCatalog.map(item => item.id)).size, 88);
  assert.equal(new Set(traditionalCatalog.map(item => item.name)).size, 88);
  assert.equal(new Set(courses.map(course => course.id)).size, courses.length);
  assert.equal(courses.filter(course => course.traditional).length, 88);
  assert.deepEqual([...new Set(traditionalCatalog.map(item => item.family))].sort(), ['bowed', 'other', 'percussion', 'plucked', 'wind']);
  for (const item of traditionalCatalog) {
    const course = findCourse(item.id)!;
    assert.ok(course, item.id);
    assert.equal(course.family, item.family);
    assert.ok(course.sources?.length, item.id);
    for (const ref of item.refs) assert.equal(new URL(traditionalSources[ref].url).protocol, 'https:');
    assert.ok(course.lessons.length >= 3);
    for (const lesson of course.lessons) {
      assert.ok(allLessons.includes(lesson));
      assert.ok(lesson.sections.every(section => section.body.length >= 15), lesson.id);
      assert.ok(lesson.quiz.explanation.length > 4, lesson.id);
      if (lesson.widget === 'discovery') {
        assert.equal(lesson.activity?.steps.length, 3, lesson.id);
        assert.ok(lesson.activity?.steps.every(step => step.hint.trim().length > 0), lesson.id);
      }
    }
  }
});

test('aliases resolve to existing entries and filters combine name, tradition, region and family', () => {
  for (const [query, id] of [['冬布拉', 'dombra'], ['热瓦甫', 'rawap'], ['筚篥', 'guanzi'], ['七弦琴', 'guqin'], ['琴箫', 'xiao'], ['二弦', 'erxian'], ['瑟', 'se'], ['竽', 'yu']]) {
    assert.ok(filterTraditional(query).some(item => item.id === id), query);
    assert.ok(filterCourses(query).some(course => course.id === id), query);
  }
  assert.deepEqual(filterTraditional('  DONG PIPA  ').map(item => item.id), ['dongpipa']);
  assert.deepEqual(filterTraditional('哈萨克', 'plucked', '西北').map(item => item.id), ['dombra']);
  assert.equal(filterTraditional('哈萨克', 'wind', '东北').length, 0);
  assert.equal(filterTraditional('不存在的乐器').length, 0);
  assert.equal(traditionalInstrument('not-an-instrument'), undefined);
});

test('catalog distinguishes ambiguous names and unconventional sound production', () => {
  assert.match(traditionalInstrument('niutuiqin')!.contrast, /同名.*弹拨/);
  assert.equal(traditionalInstrument('yangqin')!.family, 'plucked');
  assert.match(traditionalInstrument('yangqin')!.voice, /击弦/);
  assert.equal(traditionalInstrument('kouxian')!.family, 'other');
  assert.match(traditionalInstrument('kouxian')!.voice, /簧舌/);
  assert.match(traditionalInstrument('tonggu')!.contrast, /体鸣/);
  assert.match(traditionalInstrument('nagra')!.contrast, /蒙皮/);
  assert.notEqual(traditionalInstrument('changgu')!.id, traditionalInstrument('yaochanggu')!.id);
});

test('expansion preserves original guzheng and erhu lessons and backup progress', () => {
  for (const id of ['guzheng', 'erhu']) {
    assert.deepEqual(findCourse(id)!.lessons.map(lesson => lesson.id), [1, 2, 3, 4].map(index => `${id}-${index}`));
    assert.ok(findCourse(id)!.lessons.some(lesson => lesson.widget === 'instrument'));
  }
  const old = { ...freshProgress(), completed: ['theory-1', 'guzheng-2', 'erhu-1'], lastLesson: 'erhu-1' };
  const next = completeLesson(validateProgress(old), 'guqin-1', '2026-11-02');
  assert.deepEqual(next.completed, ['theory-1', 'guzheng-2', 'erhu-1', 'guqin-1']);
  assert.deepEqual(validateProgress(next).completed, next.completed);
});
