import test from 'node:test';
import assert from 'node:assert/strict';
import { findCourse, findLesson } from '../src/data.ts';
import { coreL0Lessons, coreL1Lessons, coreLessonExtras } from '../src/core-lessons.ts';
import { publishedLessons } from '../src/curriculum.ts';
import {
  barBeats,
  jianpuEvents,
  jianpuPitch,
  jianpuToMusicXml,
  measureBeats,
  measures,
  parseJianpu,
  parseSequence,
} from '../src/jianpu.ts';
import type { JianpuNote } from '../src/jianpu.ts';
import { allIntervals, earQuestion, intervalSet } from '../src/music.ts';

const mainLine = [...publishedLessons('core', 0), ...publishedLessons('core', 1)].map(id => findLesson(id)!);

test('jianpu parses pitch, octave dots, lengths, ties and repeats', () => {
  const g = parseJianpu("1=G 4/4 | 1 2 3 4 | 5 6 7 1' ||");
  assert.deepEqual(
    jianpuEvents(g).map(event => event.notes[0]),
    ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'],
  );
  const f = parseJianpu('1=F 3/4 | 5, | 1 - 2 | 4. 3_ 2 | 1 - ||');
  assert.equal(jianpuPitch(f, f.tokens.find(token => token.kind === 'note') as JianpuNote), 'C4');
  assert.deepEqual(
    jianpuEvents(f).map(event => `${event.notes[0]}:${event.beats}`),
    ['C4:1', 'F4:2', 'G4:1', 'Bb4:1.5', 'A4:0.5', 'G4:1', 'F4:2'],
  );
  assert.deepEqual(measures(f).map(measureBeats), [1, 3, 3, 2]);
  const repeat = parseJianpu('1=C 2/4 |: 1 2 :| 3 5^ | 5 0 ||');
  assert.deepEqual(
    jianpuEvents(repeat).map(event => `${event.notes[0] ?? 'rest'}:${event.beats}`),
    ['C4:1', 'D4:1', 'C4:1', 'D4:1', 'E4:1', 'G4:2', 'rest:1'],
  );
  const accidentals = parseJianpu('1=C 4/4 | #4 b7 1__ 2__ 3_ 0 ||');
  assert.deepEqual(
    jianpuEvents(accidentals).map(event => event.notes[0] ?? 'rest'),
    ['F#4', 'Bb4', 'C4', 'D4', 'E4', 'rest'],
  );
  const xml = jianpuToMusicXml(parseJianpu('1=G 3/4 | 5, | 7 - 4^ | 4 #4 b7 ||'));
  assert.match(xml, /<fifths>1<\/fifths>/);
  assert.match(xml, /<measure number="0" implicit="yes">/);
  assert.match(xml, /<tie type="start"\/>/);
  assert.match(xml, /<step>C<\/step><octave>5<\/octave><\/pitch><duration>4<\/duration><tie type="stop"\/>/);
  assert.match(xml, /<accidental>natural<\/accidental>/);
  for (const bad of ['1=H 4/4', '8', '- 1', '1=C 4/4 | x ||']) assert.throws(() => parseJianpu(bad), bad);
});

test('listening sequences parse notes, chords, rests and dynamics', () => {
  assert.deepEqual(parseSequence('p C4 | f C4+E4+G4:2 r:0.5'), [
    { notes: ['C4'], beats: 1, velocity: 0.32 },
    { notes: ['C4', 'E4', 'G4'], beats: 2, velocity: 0.84 },
    { notes: [], beats: 0.5, velocity: 0.84 },
  ]);
  for (const bad of ['H4', 'C4:0', 'C4:x']) assert.throws(() => parseSequence(bad), bad);
});

test('interval sets add minor third and perfect fourth without changing the default four', () => {
  assert.deepEqual(
    intervalSet().map(item => item.id),
    ['2M', '3M', '5P', '8P'],
  );
  assert.equal(allIntervals.length, 6);
  const pool = intervalSet(['3m', '4P']);
  assert.deepEqual(
    [earQuestion(() => 0, pool).notes, earQuestion(() => 0.99, pool).interval.id],
    [['C4', 'Eb4'], '4P'],
  );
});

test('main-line L0 and L1 lessons are complete, checkable and playable', () => {
  assert.equal(coreL0Lessons.length + coreL1Lessons.length, 35);
  assert.equal(mainLine.length, 43);
  assert.equal(findCourse('ear')!.lessons.length + findCourse('theory')!.lessons.length, 43);
  const answerSlots = new Set<number>();
  for (const lesson of mainLine) {
    assert.ok(lesson, 'lesson exists');
    assert.ok(lesson.sections.length >= 2, lesson.id);
    assert.ok(
      lesson.sections.every(section => section.body.length >= 30),
      lesson.id,
    );
    const questions = [lesson.quiz, ...(lesson.more ?? [])];
    assert.ok(questions.length >= 3, `${lesson.id} has ${questions.length} questions`);
    for (const item of questions) {
      assert.ok(item.options.length >= 2 && item.options.length <= 4, item.question);
      assert.equal(new Set(item.options).size, item.options.length, item.question);
      assert.ok(item.answer >= 0 && item.answer < item.options.length, item.question);
      assert.ok(item.explanation.length > 8, item.question);
      if (item.listen) assert.ok(parseSequence(item.listen).length > 0, item.question);
      answerSlots.add(item.answer);
    }
    if (lesson.widget === 'listen') {
      assert.ok(lesson.listen?.length, lesson.id);
      for (const clip of lesson.listen!) assert.ok(parseSequence(clip.seq).length > 0, `${lesson.id}: ${clip.label}`);
    }
    if (lesson.widget === 'jianpu') {
      assert.ok(lesson.jianpu?.length, lesson.id);
      for (const example of lesson.jianpu!) {
        const score = parseJianpu(example.score);
        const lengths = measures(score).map(measureBeats);
        const full = barBeats(score);
        const pickup = lengths[0] < full;
        // Every bar is full, except a pickup and the last bar that completes it.
        lengths.forEach((beats, index) => {
          const last = index === lengths.length - 1;
          const expected = pickup && index === 0 ? lengths[0] : pickup && last ? full - lengths[0] : full;
          assert.equal(beats, expected, `${lesson.id}: ${example.title}, bar ${index + 1}`);
        });
        assert.ok(jianpuEvents(score).length > 0);
        if (example.view && example.view !== 'jianpu') assert.match(jianpuToMusicXml(score), /<measure/);
      }
    }
    if (lesson.widget === 'interval' && lesson.intervals) assert.ok(intervalSet(lesson.intervals).length >= 4);
  }
  assert.ok(answerSlots.size >= 3, 'answers are not always in the same position');
  for (const id of Object.keys(coreLessonExtras)) assert.ok((findLesson(id)!.more ?? []).length >= 2, id);
  assert.deepEqual(findLesson('ear-2')!.intervals, ['2M', '3m', '3M', '4P', '5P', '8P']);
});
