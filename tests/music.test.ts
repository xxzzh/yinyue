import test from 'node:test';
import assert from 'node:assert/strict';
import { Note } from 'tonal';
import { courses, allLessons } from '../src/data.ts';
import { cMajor, chordVoicing, earQuestion, fretNote, guitarStrings, intervalDistance, tapTempo } from '../src/music.ts';
import { addActivity, completeLesson, freshProgress, localDate, streak, validateProgress } from '../src/progress.ts';

test('C major and guitar positions preserve musical pitch', () => {
  assert.deepEqual(cMajor, ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']);
  assert.equal(fretNote(0, 1), 'F2');
  assert.equal(fretNote(0, 5), guitarStrings[1]);
  assert.deepEqual(chordVoicing('C').map(note => Note.midi(note)), [48, 52, 55, 60, 64]);
  assert.equal(chordVoicing('Am').length, 5);
});
test('every generated listening question matches its stated interval across all roots', () => {
  for (const a of [0, 0.26, 0.51, 0.99]) for (const b of [0, 0.26, 0.51, 0.99]) {
    let calls = 0;
    const question = earQuestion(() => calls++ === 0 ? a : b);
    assert.equal(intervalDistance(question), question.interval.semitones);
  }
});
test('tap tempo needs enough evidence and rejects invalid intervals', () => {
  assert.equal(tapTempo([0, 500, 1000, 1500]), null);
  assert.deepEqual(tapTempo([0, 1000, 2000, 3000, 4000]), { bpm: 60, consistency: 100 });
  assert.deepEqual(tapTempo([0, 500, 1000, 1500, 2000]), { bpm: 120, consistency: 100 });
  assert.equal(tapTempo([0, 0, 1000, 2000, 3000]), null);
  assert.equal(tapTempo([0, 6000, 7000, 8000, 9000]), null);
});
test('all four routes contain original lessons with valid quiz answers', () => {
  assert.equal(courses.length, 4);
  assert.equal(allLessons.length, 16);
  assert.equal(new Set(allLessons.map(lesson => lesson.id)).size, allLessons.length);
  for (const lesson of allLessons) {
    assert.ok(lesson.sections.length >= 2);
    assert.ok(lesson.quiz.answer >= 0 && lesson.quiz.answer < lesson.quiz.options.length);
    assert.equal(new Set(lesson.quiz.options).size, lesson.quiz.options.length);
  }
});
test('reviewing a completed lesson does not inflate completion statistics', () => {
  const first = completeLesson(freshProgress(), 'theory-1', '2026-11-02');
  const second = completeLesson(first, 'theory-1', '2026-11-02');
  assert.deepEqual(second.completed, ['theory-1']);
  assert.equal(second.days['2026-11-02'].lessons, 1);
  assert.equal(first.days['2026-11-02'].seconds, 0);
});
test('activity preserves history without mutating prior state or inventing time', () => {
  const initial = freshProgress();
  const first = addActivity(initial, { seconds: 12.5 }, '2026-11-01');
  const second = addActivity(first, { exercises: 1 }, '2026-11-02');
  assert.deepEqual(initial.days, {});
  assert.equal(second.days['2026-11-01'].seconds, 12.5);
  assert.equal(second.days['2026-11-02'].seconds, 0);
  assert.equal(second.days['2026-11-02'].exercises, 1);
});
test('streak handles yesterday, broken days and month boundaries', () => {
  let p = freshProgress();
  p = addActivity(p, { exercises: 1 }, '2026-10-31');
  p = addActivity(p, { seconds: 5 }, '2026-11-01');
  assert.equal(streak(p, new Date(2026, 10, 2, 12)), 2);
  assert.equal(streak(p, new Date(2026, 10, 3, 12)), 0);
  assert.equal(localDate(new Date(2026, 0, 2, 1)), '2026-01-02');
});
test('backup import rejects malformed, unsupported and non-finite data', () => {
  for (const value of [null, {}, { ...freshProgress(), version: 2 }, { ...freshProgress(), days: { invalid: { seconds: 0, lessons: 0, exercises: 0 } } }, { ...freshProgress(), days: { '2026-11-02': { seconds: Infinity, lessons: 0, exercises: 0 } } }, { ...freshProgress(), days: [] }]) assert.throws(() => validateProgress(value));
  const clean = validateProgress({ ...freshProgress(), completed: ['theory-1', 'theory-1'], volume: 9 });
  assert.deepEqual(clean.completed, ['theory-1']);
  assert.equal(clean.volume, 1);
});
