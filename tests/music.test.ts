import test from 'node:test';
import assert from 'node:assert/strict';
import { Note } from 'tonal';
import { courses, allLessons, filterCourses } from '../src/data.ts';
import { basicDrumPattern, emptyDrumPattern, instrumentProfiles, stringNote } from '../src/instrument-profiles.ts';
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
test('all twelve routes contain complete lessons with valid quiz answers', () => {
  assert.equal(courses.length, 12);
  assert.equal(allLessons.length, 48);
  assert.equal(new Set(allLessons.map(lesson => lesson.id)).size, allLessons.length);
  for (const lesson of allLessons) {
    assert.ok(lesson.sections.length >= 2);
    assert.ok(lesson.quiz.answer >= 0 && lesson.quiz.answer < lesson.quiz.options.length);
    assert.equal(new Set(lesson.quiz.options).size, lesson.quiz.options.length);
    if (lesson.widget === 'instrument') assert.ok(instrumentProfiles.some(profile => courses.find(course => course.lessons.includes(lesson))?.id === profile.track));
  }
});
test('instrument references preserve standard tunings, ukulele chord tones and saxophone transposition', () => {
  const profile = (track: string) => instrumentProfiles.find(item => item.track === track)!;
  assert.deepEqual(profile('ukulele').notes.map(item => Note.midi(item.note)), [67, 60, 64, 69]);
  assert.deepEqual(profile('bass').notes.map(item => Note.midi(item.note)), [28, 33, 38, 43]);
  assert.deepEqual(profile('violin').notes.slice(0, 4).map(item => Note.midi(item.note)), [55, 62, 69, 76]);
  assert.deepEqual(profile('erhu').notes.slice(0, 2).map(item => Note.midi(item.note)), [62, 69]);
  assert.equal(stringNote('A1', 3), 'C2');
  assert.equal(stringNote('E1', 5), 'A1');
  const chordTones: Record<string, number[]> = { C: [0, 4, 7], Am: [0, 4, 9], F: [0, 5, 9], G7: [2, 5, 7, 11] };
  for (const [name, frets] of Object.entries(profile('ukulele').chords!)) {
    const actual = [...new Set(frets.map((fret, index) => Note.chroma(stringNote(profile('ukulele').notes[index].note, fret))))].sort((a, b) => a! - b!);
    assert.deepEqual(actual, chordTones[name], name);
  }
  for (const item of profile('saxophone').notes) {
    const written = item.label.match(/谱 ([A-G]\d)/)![1];
    assert.equal(Note.midi(written)! - Note.midi(item.note)!, 9, item.label);
  }
  const zheng = profile('guzheng').notes.map(item => Note.midi(item.note)!);
  assert.equal(zheng.length, 21);
  assert.equal(zheng[0], 38);
  assert.equal(zheng.at(-1), 86);
  assert.deepEqual([...new Set(zheng.map(midi => midi % 12))].sort((a, b) => a - b), [2, 4, 6, 9, 11]);
  for (const item of instrumentProfiles) for (const note of [...item.notes.map(item => item.note), ...item.phrase]) assert.ok(Note.midi(note) !== null, note);
});
test('instrument families and lesson searches find new courses without losing original routes', () => {
  assert.deepEqual(filterCourses('', 'wind').map(course => course.id), ['flute', 'saxophone']);
  assert.deepEqual(filterCourses('二胡').map(course => course.id), ['erhu']);
  assert.deepEqual(filterCourses(' ALTO SAX ').map(course => course.id), ['saxophone']);
  assert.deepEqual(filterCourses('制音', 'plucked').map(course => course.id), ['bass']);
  for (const track of ['theory', 'ear', 'piano', 'guitar']) for (let i = 1; i <= 4; i++) assert.ok(allLessons.some(lesson => lesson.id === `${track}-${i}`));
  const old = { ...freshProgress(), completed: ['theory-1', 'guitar-2'], lastLesson: 'guitar-2' };
  const expanded = completeLesson(validateProgress(old), 'guzheng-1', '2026-11-02');
  assert.deepEqual(expanded.completed, ['theory-1', 'guitar-2', 'guzheng-1']);
});
test('eight-step drum patterns preserve beat positions and edits do not leak between presets', () => {
  const pattern = basicDrumPattern();
  assert.deepEqual(pattern.kick.flatMap((on, index) => on ? [index] : []), [0, 4]);
  assert.deepEqual(pattern.snare.flatMap((on, index) => on ? [index] : []), [2, 6]);
  assert.equal(pattern.hat.filter(Boolean).length, 8);
  pattern.kick[0] = false;
  assert.equal(basicDrumPattern().kick[0], true);
  assert.ok(Object.values(emptyDrumPattern()).every(row => row.length === 8 && row.every(on => !on)));
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
