import assert from 'node:assert/strict';
import test from 'node:test';
import { findCourse, findLesson } from '../src/data.ts';
import { lessonPlace, nextStep, publishedLessons, stagePassed, stageUnlocked, STAGES } from '../src/curriculum.ts';
import { parseDrumScore } from '../src/drum-notation.ts';
import { parseSequence } from '../src/jianpu.ts';
import { freshProgress, mergeProgress } from '../src/progress.ts';
import { secondBatchLines } from '../src/second-batch-order.ts';

test('the second batch has full graded courses, retains old lesson IDs, and uses the existing unlock rules', () => {
  for (const line of secondBatchLines) {
    const course = findCourse(line)!;
    const path = STAGES.flatMap(stage => publishedLessons(line, stage));
    assert.deepEqual(
      course.lessons.map(lesson => lesson.id),
      path,
    );
    assert.equal(path.length, 85);
    assert.equal(new Set(course.lessons.map(lesson => lesson.title)).size, 85, line);
    const original = path.filter(id => /-\d$/u.test(id));
    assert.equal(original.length, line === 'drums' || line === 'ukulele' ? 4 : 3);
    const imported = { ...freshProgress(), completed: original, lastLesson: original[0], instrument: line };
    const merged = mergeProgress(freshProgress(), imported, id => !!findLesson(id));
    assert.deepEqual(merged.completed, original);
    assert.equal(merged.instrument, line);
    assert.equal(nextStep(merged, line)?.kind, 'lesson');
    assert.equal(path[0], `${line}-l0-01`);
    const finishedL0 = { ...merged, completed: [path[0], ...original] };
    assert.equal(stagePassed(finishedL0, line, 0), true);
    assert.equal(stageUnlocked(finishedL0, line, 1), false);
    assert.equal(stageUnlocked({ ...finishedL0, passedTests: ['core-l0'] }, line, 1), true);
    for (const stage of STAGES.slice(1)) {
      const id = publishedLessons(line, stage).at(-1)!;
      assert.deepEqual(lessonPlace(id), { line, stage });
      assert.equal(findLesson(id)?.widget, 'record');
      assert.equal(findLesson(id)?.activity?.required, true);
    }
    const final = path.at(-1)!;
    const lastStage = { ...merged, completed: path.slice(0, -1), placement: { stage: 5, date: '2026-11-20' } };
    assert.deepEqual(nextStep(lastStage, line), { kind: 'lesson', line, stage: 5, lesson: final });
    assert.equal(nextStep({ ...lastStage, completed: path }, line), undefined);
  }
});

test('second-batch examples resolve to complete bars and playable notes or drum cells', () => {
  for (const line of secondBatchLines) {
    const course = findCourse(line)!;
    for (const lesson of course.lessons.filter(item => /-l[0-5]-/u.test(item.id))) {
      assert.ok(lesson.listen?.length || lesson.record?.reference || lesson.drum, lesson.id);
      for (const clip of [...(lesson.listen ?? []), ...(lesson.record?.reference ? [lesson.record.reference] : [])]) {
        const bars = clip.seq.split('|').map(bar => parseSequence(bar));
        const lengths = bars.map(bar => bar.reduce((total, event) => total + event.beats, 0));
        assert.ok(
          lengths.every(length => [3, 4].includes(length) && length === lengths[0]),
          `${lesson.id}: ${lengths}`,
        );
        const polyphony = Math.max(...bars.flat().map(event => event.notes.length));
        assert.ok(polyphony <= (line === 'recorder' ? 1 : line === 'kalimba' ? 2 : 4), lesson.id);
      }
      if (lesson.drum) {
        const bars = parseDrumScore(lesson.drum.score);
        for (const bar of bars) {
          assert.ok(bar.length >= 2 && bar.length <= 5, lesson.id);
          for (const beat of bar) {
            assert.ok(beat.length <= 4, lesson.id);
            assert.equal(
              beat.reduce((total, step) => total + step.beats, 0),
              1,
              lesson.id,
            );
          }
        }
      }
    }
  }
  const [[straight, triplet, rest]] = parseDrumScore('KH SH! / H - H / -');
  assert.deepEqual(straight[0].hits, ['kick', 'hat']);
  assert.equal(straight[1].accent, true);
  assert.equal(triplet[0].beats, 1 / 3);
  assert.deepEqual(rest[0].hits, []);
  assert.throws(() => parseDrumScore('X / K'));
  assert.throws(() => parseDrumScore('HH / K'));
});
