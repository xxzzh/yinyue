import test from 'node:test';
import assert from 'node:assert/strict';
import { publishedLessons, reviewSchedule } from '../src/curriculum.ts';
import { findLesson } from '../src/data.ts';
import { placeAnswer } from '../src/lesson-kit.ts';
import { freshProgress, mergeProgress, validateProgress } from '../src/progress.ts';
import { answerReview, pendingReviews, recordMistake, reviewQuestionId } from '../src/review.ts';

const id = reviewQuestionId('theory-1', findLesson('theory-1')!.quiz);
const at = (day: string, hour = '10') => `${day}T${hour}:00:00.000Z`;

test('a mistake has one entry and later success schedules from the actual review date', () => {
  let queue = recordMistake({}, id, '2028-02-28', at('2028-02-28'));
  assert.deepEqual(pendingReviews(queue), [{ id, due: '2028-02-29' }]);
  assert.equal(recordMistake(queue, id, '2028-02-28', at('2028-02-28', '11')), queue);
  assert.equal(answerReview(queue, id, 'correct', '2028-02-28', at('2028-02-28')), queue);

  for (const [attempted, due] of [
    ['2028-03-02', '2028-03-05'],
    ['2028-03-05', '2028-03-12'],
    ['2028-03-12', '2028-03-26'],
    ['2028-03-26', '2028-04-25'],
    ['2028-04-25', null],
  ] as const) {
    queue = answerReview(queue, id, 'correct', attempted, at(attempted));
    assert.equal(queue[id].due, due);
    assert.equal(answerReview(queue, id, 'correct', attempted, at(attempted, '11')), queue);
  }
  assert.deepEqual(pendingReviews(queue), []);
  queue = recordMistake(queue, id, '2028-04-26', at('2028-04-26'));
  assert.deepEqual(pendingReviews(queue), [{ id, due: '2028-04-27' }]);
});

test('a failed review returns to a one-day interval and old questions can be dismissed', () => {
  let queue = recordMistake({}, id, '2026-12-29', at('2026-12-29'));
  queue = answerReview(queue, id, 'correct', '2026-12-30', at('2026-12-30'));
  assert.equal(queue[id].due, '2027-01-02');
  queue = answerReview(queue, id, 'incorrect', '2027-01-02', at('2027-01-02'));
  assert.equal(queue[id].step, 0);
  assert.equal(queue[id].due, '2027-01-03');
  assert.equal(answerReview(queue, id, 'unavailable', '2027-01-02', at('2027-01-02')), queue);
  queue = answerReview(queue, id, 'unavailable', '2027-01-03', at('2027-01-03'));
  assert.deepEqual(pendingReviews(queue), []);
});

test('review identities survive option rotation and are unique across the pilot quiz set', () => {
  const ids = ([0, 1, 2] as const).flatMap(stage =>
    publishedLessons('core', stage).flatMap(lessonId => {
      const lesson = findLesson(lessonId)!;
      return [lesson.quiz, ...(lesson.more ?? [])].map(item => {
        const original = reviewQuestionId(lessonId, item);
        assert.equal(reviewQuestionId(lessonId, placeAnswer(item, item.answer + 1)), original);
        return original;
      });
    }),
  );
  assert.equal(ids.length, new Set(ids).size);

  const outside = reviewQuestionId('rh3-01', findLesson('rh3-01')!.quiz);
  const review = recordMistake(
    recordMistake({}, id, '2026-12-29', at('2026-12-29')),
    outside,
    '2026-12-29',
    at('2026-12-29'),
  );
  assert.deepEqual(reviewSchedule({ ...freshProgress(), review }), [{ id, due: '2026-12-30' }]);
});

test('backups preserve newer scheduling, including finished entries', () => {
  const { review: empty, ...legacy } = freshProgress();
  assert.deepEqual(validateProgress(legacy).review, empty);
  assert.deepEqual(validateProgress({ ...legacy, version: 1 }).review, empty);
  const old = recordMistake({}, id, '2026-12-29', at('2026-12-29'));
  const newer = answerReview(old, id, 'unavailable', '2026-12-30', at('2026-12-30'));
  const current = { ...legacy, review: newer };
  const imported = validateProgress({
    ...legacy,
    review: {
      ...old,
      'theory-1:bad': { step: 1, due: '2026-02-31', updatedAt: at('2026-01-01') },
      'theory-1:older': { step: 0, due: '2026-02-01', updatedAt: 'not a timestamp' },
      'theory-1:wrong': { step: 5, due: '2026-02-01', updatedAt: at('2026-01-01') },
    },
  });
  assert.deepEqual(imported.review, old);
  assert.deepEqual(validateProgress(JSON.parse(JSON.stringify(current))).review, newer);
  const known = (lessonId: string) => !!findLesson(lessonId);
  assert.deepEqual(mergeProgress(current, imported, known).review, newer);
  assert.deepEqual(mergeProgress(imported, current, known).review, newer);
});
