import test from 'node:test';
import assert from 'node:assert/strict';
import { courses, findLesson } from '../src/data.ts';
import {
  instrumentLines,
  instrumentStageSize,
  lessonPlace,
  nextStep,
  plannedSize,
  publishedLessons,
  STAGES,
  stageStatus,
  stageTestIndex,
  stageUnlocked,
  units,
} from '../src/curriculum.ts';
import { passMark, stageTests } from '../src/curriculum-content.ts';
import {
  completeLesson,
  freshProgress,
  mergeProgress,
  passStageTest,
  recordPlacement,
  validateProgress,
} from '../src/progress.ts';
import type { Progress } from '../src/progress.ts';

const finish = (progress: Progress, ids: string[]) => ids.reduce((state, id) => completeLesson(state, id), progress);

test('the graded path matches the outline and references every mapped lesson once', () => {
  assert.deepEqual(
    STAGES.map(stage => plannedSize('core', stage)),
    [13, 30, 40, 40, 35, 30],
  );
  for (const line of instrumentLines)
    assert.deepEqual(
      STAGES.map(stage => plannedSize(line.id, stage)),
      STAGES.map(stage => instrumentStageSize[stage]),
      line.id,
    );
  const mapped = units.flatMap(unit => unit.items.flatMap(item => ('lesson' in item ? [item.lesson] : [])));
  assert.equal(new Set(mapped).size, mapped.length);
  for (const id of mapped) assert.ok(findLesson(id), id);
  for (const course of ['theory', 'ear', 'piano', 'guitar', 'guzheng'])
    for (const lesson of courses.find(item => item.id === course)!.lessons)
      assert.ok(lessonPlace(lesson.id), lesson.id);
  assert.deepEqual(publishedLessons('koudi', 0), ['koudi-1', 'koudi-2', 'koudi-3', 'koudi-l0-04']);
  assert.deepEqual(publishedLessons('core', 0), [
    'rh0-01',
    'rh0-02',
    'ear-3',
    'rh0-04',
    'theory-1',
    'ear-1',
    'ea0-07',
    'ea0-08',
    'ear-4',
    'ea0-10',
    'ls0-11',
    'ls0-12',
    'pf0-13',
  ]);
  // L0–L3 are fully written; later stages are still planned.
  for (const stage of [0, 1, 2, 3] as const)
    assert.equal(publishedLessons('core', stage).length, plannedSize('core', stage));
  assert.equal(publishedLessons('core', 2).length, 40);
  assert.equal(publishedLessons('core', 3).length, 40);
  assert.equal(publishedLessons('core', 4).length, 0);
  assert.equal(lessonPlace('guqin-1'), undefined);
});

test('stage tests are well formed', () => {
  assert.deepEqual(
    stageTests.map(item => ({ id: item.id, line: item.line, stage: item.stage })),
    stageTestIndex,
  );
  assert.deepEqual(
    stageTests.map(item => item.id),
    ['core-l0', 'core-l1', 'core-l2', 'core-l3'],
  );
  for (const stageTest of stageTests) {
    assert.ok(stageTest.questions.length >= 10, stageTest.id);
    assert.equal(passMark(stageTest), Math.ceil(stageTest.questions.length * 0.8));
    assert.equal(new Set(stageTest.questions.map(item => item.id)).size, stageTest.questions.length);
    for (const item of stageTest.questions) {
      assert.equal(item.options.length, 4, item.id);
      assert.equal(new Set(item.options).size, 4, item.id);
      assert.ok(item.answer >= 0 && item.answer < 4, item.id);
      assert.ok(item.explanation.length > 10, item.id);
    }
  }
});

test('stages unlock by test, placement or finished instrument lessons', () => {
  let progress = freshProgress();
  assert.equal(stageStatus(progress, 'core', 0), 'open');
  assert.equal(stageStatus(progress, 'core', 1), 'locked');
  assert.deepEqual(nextStep(progress, 'core'), { kind: 'lesson', line: 'core', stage: 0, lesson: 'rh0-01' });

  progress = finish(progress, publishedLessons('core', 0));
  assert.deepEqual(nextStep(progress, 'core'), { kind: 'test', line: 'core', stage: 0, test: 'core-l0' });
  progress = passStageTest(progress, 'core-l0', '2026-11-12');
  assert.equal(stageStatus(progress, 'core', 0), 'passed');
  assert.equal(stageStatus(progress, 'core', 1), 'open');
  assert.equal(progress.days['2026-11-12'].exercises, 1);
  assert.deepEqual(nextStep(progress, 'core'), { kind: 'lesson', line: 'core', stage: 1, lesson: 'theory-2' });

  // An instrument's stage 1 needs both its own stage 0 and the main line's stage 0.
  assert.equal(stageUnlocked(progress, 'piano', 1), false);
  progress = finish(progress, publishedLessons('piano', 0));
  assert.equal(stageUnlocked(progress, 'piano', 1), true);
  assert.equal(stageUnlocked(finish(freshProgress(), publishedLessons('piano', 0)), 'piano', 1), false);
  assert.deepEqual(nextStep(freshProgress(), 'voice'), {
    kind: 'lesson',
    line: 'voice',
    stage: 0,
    lesson: 'voice-l0-01',
  });

  const placed = recordPlacement(freshProgress(), 2, '2026-11-12');
  assert.equal(stageStatus(placed, 'core', 0), 'placed');
  assert.equal(stageStatus(placed, 'core', 1), 'placed');
  assert.equal(stageStatus(placed, 'core', 2), 'open');
  assert.deepEqual(nextStep(placed, 'core'), { kind: 'lesson', line: 'core', stage: 2, lesson: 'rh2-01' });
  // A stage that is still being written waits instead of pointing at a lesson.
  assert.deepEqual(nextStep(recordPlacement(freshProgress(), 4, '2026-11-12'), 'core'), {
    kind: 'waiting',
    line: 'core',
    stage: 4,
  });
  // Placement never marks lessons as completed.
  assert.deepEqual(placed.completed, []);
});

test('version 1 records upgrade in place and backups merge the new fields', () => {
  const v1 = {
    version: 1,
    completed: ['theory-1'],
    dailyGoal: 20,
    volume: 0.4,
    days: { '2026-11-01': { seconds: 60, lessons: 1, exercises: 0 } },
    lastLesson: 'theory-1',
  };
  const upgraded = validateProgress(v1);
  assert.equal(upgraded.version, 2);
  assert.deepEqual(upgraded.passedTests, []);
  assert.equal(upgraded.placement, null);
  assert.equal(upgraded.instrument, null);
  assert.equal(upgraded.dailyGoal, 20);
  assert.deepEqual(validateProgress(JSON.parse(JSON.stringify(upgraded))), upgraded);

  assert.throws(() => validateProgress({ ...v1, version: 3 }));
  const tidy = validateProgress({
    ...v1,
    version: 2,
    passedTests: ['core-l0', 'core-l0', 7],
    placement: { stage: 99, date: '2026-11-12' },
    instrument: 'piano',
  });
  assert.deepEqual(tidy.passedTests, ['core-l0']);
  assert.equal(tidy.placement, null);
  assert.equal(tidy.instrument, 'piano');

  const current: Progress = { ...upgraded, instrument: 'guitar', passedTests: ['core-l0'] };
  const imported: Progress = {
    ...freshProgress(),
    completed: ['ear-1', 'gone-1'],
    passedTests: ['core-l1'],
    instrument: 'piano',
    placement: { stage: 1, date: '2026-11-10' },
  };
  const merged = mergeProgress(current, imported, id => !!findLesson(id));
  assert.deepEqual(merged.completed, ['theory-1', 'ear-1']);
  assert.deepEqual(merged.passedTests, ['core-l0', 'core-l1']);
  assert.deepEqual(merged.placement, { stage: 1, date: '2026-11-10' });
  assert.equal(merged.instrument, 'guitar');
});

test('generated catalog quizzes vary per instrument and do not reveal the subject by name', () => {
  // Only the generated Chinese and world catalog routes (they carry a `level`).
  const generated = courses
    .filter(course => course.level)
    .flatMap(course =>
      course.lessons
        .filter(lesson => lesson.widget === 'discovery' && /^[a-z]+-[123]$/.test(lesson.id))
        .map(lesson => ({ course, lesson })),
    );
  assert.ok(generated.length > 500);
  const positions = [0, 0, 0, 0];
  const distractorSets = new Set<string>();
  let uneven = 0;
  for (const { course, lesson } of generated) {
    const { options, answer, explanation } = lesson.quiz;
    positions[answer]++;
    assert.equal(new Set(options).size, 4, lesson.id);
    assert.ok(explanation.startsWith(options[answer]), lesson.id);
    assert.ok(explanation.length > options[answer].length + 8, lesson.id);
    // Structure and sound questions mask the instrument's own name in every option.
    if (!lesson.id.endsWith('-3'))
      for (const option of options) assert.ok(!option.includes(course.tag), `${lesson.id}: ${option}`);
    if (lesson.id.endsWith('-1')) distractorSets.add(options.filter((_, i) => i !== answer).join('|'));
    const flags = options.map(option => option.includes('这件乐器'));
    if (flags.some(flag => flag !== flags[0])) uneven++;
  }
  // Answers spread over A–D, and wrong options are no longer shared by a whole playing family.
  for (const count of positions) assert.ok(count > generated.length * 0.18, `${positions}`);
  assert.ok(distractorSets.size > generated.length / 3 - 10, `${distractorSets.size}`);
  assert.ok(uneven < 10, `${uneven}`);
});
