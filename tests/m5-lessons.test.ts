import test from 'node:test';
import assert from 'node:assert/strict';
import { Note } from 'tonal';
import { findCourse, findLesson } from '../src/data.ts';
import { voiceLessons } from '../src/voice-lessons.ts';
import { guzhengLessons } from '../src/guzheng-lessons.ts';
import { koudiLessons } from '../src/koudi-lessons.ts';
import { instrumentLessonOrder, lineLessons } from '../src/instrument-order.ts';
import { plannedSize, publishedLessons } from '../src/curriculum.ts';
import {
  barBeats,
  jianpuEvents,
  measureBeats,
  measures,
  parseJianpu,
  parseSequence,
  shiftOctaves,
} from '../src/jianpu.ts';
import { detectPitch, matchesTarget, nearestNote } from '../src/pitch.ts';

const tone = (frequency: number, harmonics: number[], sampleRate = 44100, length = 2048) =>
  Float32Array.from(
    { length },
    (_, i) =>
      0.3 *
      harmonics.reduce(
        (sum, amplitude, k) => sum + amplitude * Math.sin((2 * Math.PI * frequency * (k + 1) * i) / sampleRate),
        0,
      ),
  );

test('pitch detection finds single notes within a few cents and ignores silence and noise', () => {
  for (const [frequency, harmonics] of [
    [82.41, [1, 0.7, 0.5]],
    [146.83, [1, 0.8, 0.6, 0.4]],
    [196, [0.6, 1, 0.4]],
    [440, [1]],
    [587.33, [1, 0.3]],
    [1046.5, [1]],
  ] as [number, number[]][]) {
    const reading = detectPitch(tone(frequency, harmonics), 44100);
    assert.ok(reading, `${frequency} Hz`);
    assert.ok(Math.abs(1200 * Math.log2(reading.frequency / frequency)) < 3, `${frequency} Hz → ${reading.frequency}`);
    assert.ok(reading.clarity > 0.9);
  }
  assert.equal(detectPitch(new Float32Array(2048), 44100), null);
  let seed = 7;
  const noise = Float32Array.from(
    { length: 2048 },
    () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 0.6,
  );
  assert.equal(detectPitch(noise, 44100), null);
  assert.deepEqual(nearestNote(466.16), { note: 'A#4', midi: 70, cents: 0 });
  assert.equal(nearestNote(452).cents, 47);
  assert.ok(matchesTarget(nearestNote(261.63), 'C4'));
  assert.ok(!matchesTarget(nearestNote(130.81), 'C4'));
  assert.ok(matchesTarget(nearestNote(130.81), 'C4', 25, true));
  assert.ok(!matchesTarget(nearestNote(270), 'C4', 25));
});

const lines = [
  { id: 'voice' as const, lessons: voiceLessons, written: 30 },
  { id: 'guzheng' as const, lessons: guzhengLessons, written: 26 },
  { id: 'koudi' as const, lessons: koudiLessons, written: 27 },
];

test('voice, guzheng and koudi L0–L2 are written, ordered and checkable', () => {
  for (const line of lines) {
    assert.equal(line.lessons.length, line.written, line.id);
    const order = lineLessons(instrumentLessonOrder[line.id]);
    assert.deepEqual(
      findCourse(line.id)!.lessons.map(lesson => lesson.id),
      order,
      line.id,
    );
    for (const stage of [0, 1, 2] as const)
      assert.equal(publishedLessons(line.id, stage).length, plannedSize(line.id, stage), `${line.id} L${stage}`);
    for (const lesson of line.lessons) {
      assert.ok(findLesson(lesson.id), lesson.id);
      assert.ok(lesson.sections.length >= 3 && lesson.sections.every(section => section.body.length >= 30), lesson.id);
      const questions = [lesson.quiz, ...(lesson.more ?? [])];
      assert.equal(questions.length, 3, lesson.id);
      for (const item of questions) {
        assert.ok(item.answer >= 0 && item.answer < item.options.length, item.question);
        assert.equal(new Set(item.options).size, item.options.length, item.question);
        if (item.listen) parseSequence(item.listen);
      }
      if (lesson.widget === 'pitch') {
        assert.ok(lesson.pitch?.title, lesson.id);
        for (const target of lesson.pitch!.targets ?? []) assert.notEqual(Note.midi(target), null, target);
      }
      if (lesson.widget === 'record') assert.ok(lesson.record?.prompt, lesson.id);
      if (lesson.record?.reference) parseSequence(lesson.record.reference.seq);
      if (lesson.widget === 'discovery' || lesson.activity) assert.equal(lesson.activity?.steps.length, 3, lesson.id);
      if (lesson.widget === 'listen')
        for (const clip of lesson.listen!) assert.ok(parseSequence(clip.seq).length, clip.label);
      if (lesson.widget === 'jianpu')
        for (const example of lesson.jianpu!) {
          const score = parseJianpu(example.score);
          for (const beats of measures(score).map(measureBeats)) assert.equal(beats, barBeats(score), example.title);
        }
      if (lesson.widget === 'sight') assert.ok(lesson.sight, lesson.id);
    }
  }
});

test('performance checks play the melody of the lesson before them', () => {
  const notes = (seq: string) => parseSequence(seq).flatMap(event => event.notes);
  const melody = (lessonId: string, index = 0, octaves = 0) =>
    shiftOctaves(jianpuEvents(parseJianpu(findLesson(lessonId)!.jianpu![index].score)), octaves).flatMap(
      event => event.notes,
    );
  const same = (a: string[], b: string[]) =>
    assert.deepEqual(
      a.map(note => Note.midi(note)),
      b.map(note => Note.midi(note)),
    );
  same(notes(findLesson('voice-l1-10')!.record!.reference!.seq), melody('voice-l1-09'));
  same(notes(findLesson('guzheng-l1-07')!.record!.reference!.seq), melody('guzheng-l1-06'));
  same(notes(findLesson('koudi-l1-10')!.record!.reference!.seq), melody('koudi-l1-09', 1, 1));
});
