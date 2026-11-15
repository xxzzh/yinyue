import test from 'node:test';
import assert from 'node:assert/strict';
import { Note } from 'tonal';
import { findCourse, findLesson } from '../src/data.ts';
import type { Lesson } from '../src/data.ts';
import { plannedSize, publishedLessons } from '../src/curriculum.ts';
import { instrumentLessonOrder } from '../src/instrument-order.ts';
import {
  barBeats,
  jianpuEvents,
  jianpuToMusicXml,
  measureBeats,
  measures,
  parseJianpu,
  parseSequence,
} from '../src/jianpu.ts';
import { parseTab, tabBars, tabEvents } from '../src/tab.ts';
import { placeAnswer, q } from '../src/lesson-kit.ts';
import { pianoL3Lessons } from '../src/piano-l3-lessons.ts';
import { guitarL3Lessons } from '../src/guitar-l3-lessons.ts';
import { voiceL3Lessons } from '../src/voice-l3-lessons.ts';
import { guzhengL3Lessons } from '../src/guzheng-l3-lessons.ts';
import { koudiL3Lessons } from '../src/koudi-l3-lessons.ts';
import { pianoL4Lessons } from '../src/piano-l4-lessons.ts';
import { guitarL4Lessons } from '../src/guitar-l4-lessons.ts';
import { voiceL4Lessons } from '../src/voice-l4-lessons.ts';
import { guzhengL4Lessons } from '../src/guzheng-l4-lessons.ts';
import { koudiL4Lessons } from '../src/koudi-l4-lessons.ts';
import { pianoL5Lessons } from '../src/piano-l5-lessons.ts';
import { guitarL5Lessons } from '../src/guitar-l5-lessons.ts';
import { voiceL5Lessons } from '../src/voice-l5-lessons.ts';
import { guzhengL5Lessons } from '../src/guzheng-l5-lessons.ts';
import { koudiL5Lessons } from '../src/koudi-l5-lessons.ts';

const lines = [
  { id: 'piano', stage: 3, lessons: pianoL3Lessons },
  { id: 'guitar', stage: 3, lessons: guitarL3Lessons },
  { id: 'voice', stage: 3, lessons: voiceL3Lessons },
  { id: 'guzheng', stage: 3, lessons: guzhengL3Lessons },
  { id: 'koudi', stage: 3, lessons: koudiL3Lessons },
  { id: 'piano', stage: 4, lessons: pianoL4Lessons },
  { id: 'guitar', stage: 4, lessons: guitarL4Lessons },
  { id: 'voice', stage: 4, lessons: voiceL4Lessons },
  { id: 'guzheng', stage: 4, lessons: guzhengL4Lessons },
  { id: 'koudi', stage: 4, lessons: koudiL4Lessons },
  { id: 'piano', stage: 5, lessons: pianoL5Lessons },
  { id: 'guitar', stage: 5, lessons: guitarL5Lessons },
  { id: 'voice', stage: 5, lessons: voiceL5Lessons },
  { id: 'guzheng', stage: 5, lessons: guzhengL5Lessons },
  { id: 'koudi', stage: 5, lessons: koudiL5Lessons },
] as const;

const fullBars = (source: string, label: string) => {
  const score = parseJianpu(source);
  for (const [index, beats] of measures(score).map(measureBeats).entries())
    assert.equal(beats, barBeats(score), `${label}, bar ${index + 1}`);
  return score;
};

function checkMaterial(lesson: Lesson) {
  const label = lesson.id;
  for (const example of lesson.jianpu ?? []) {
    const score = fullBars(example.score, `${label}: ${example.title}`);
    assert.ok(jianpuEvents(score).length > 0);
    const left = example.left
      ? fullBars(
          `1=${score.key} ${score.beats}/${score.beatType} ${example.left}`,
          `${label}: ${example.title} (lower part)`,
        )
      : undefined;
    if (left) assert.equal(measures(left).length, measures(score).length, `${label}: parts line up`);
    if (example.view && example.view !== 'jianpu')
      assert.match(jianpuToMusicXml(score, '', { clef: example.clef, left }), /<measure/);
  }
  for (const target of lesson.play ?? []) {
    const score = fullBars(target.score, `${label}: ${target.title}`);
    assert.ok(jianpuEvents(score).filter(event => event.notes.length).length >= 4, target.title);
  }
  for (const example of lesson.tab ?? []) {
    const tab = parseTab(example.score);
    for (const beats of tabBars(tab)) assert.equal(beats, (tab.beats * 4) / tab.beatType, `${label}: ${example.title}`);
    assert.ok(tabEvents(tab).length >= 4, example.title);
  }
  for (const clip of lesson.listen ?? []) assert.ok(parseSequence(clip.seq).length, `${label}: ${clip.label}`);
  if (lesson.record?.reference) assert.ok(parseSequence(lesson.record.reference.seq).length, label);
  for (const target of lesson.pitch?.targets ?? []) assert.notEqual(Note.midi(target), null, target);
}

test('instrument lines L3–L5 are written, ordered and end with a performance check', () => {
  for (const line of lines) {
    const label = `${line.id} L${line.stage}`;
    const order = instrumentLessonOrder[line.id][line.stage]!;
    const size = line.stage === 5 ? 15 : 20;
    assert.equal(line.lessons.length, size, label);
    assert.deepEqual(
      line.lessons.map(lesson => lesson.id),
      order,
      label,
    );
    assert.equal(publishedLessons(line.id, line.stage).length, plannedSize(line.id, line.stage), label);
    const course = findCourse(line.id)!.lessons.map(lesson => lesson.id);
    const start = course.indexOf(order[0]);
    assert.deepEqual(course.slice(start, start + size), order, `${label}: course order`);
    assert.match(line.lessons[size - 1].title, new RegExp(`^L${line.stage} (演奏|演唱)关卡`), label);
    assert.equal(new Set(line.lessons.map(lesson => lesson.title)).size, size, `${label}: titles are unique`);
    if (line.stage === 5) {
      const check = line.lessons[size - 1];
      assert.equal(check.activity?.required, true, label);
      assert.equal(check.activity.steps.length, 3, label);
      assert.equal(check.widget, 'record', label);
      assert.equal(line.lessons.filter(lesson => lesson.activity?.required).length, 1, label);
    }
  }
});

test('instrument L3–L5 lessons are complete, checkable and playable', () => {
  for (const line of lines)
    for (const lesson of line.lessons) {
      assert.equal(findLesson(lesson.id), lesson, lesson.id);
      assert.equal(lesson.sections.length, line.stage === 5 ? 2 : 3, lesson.id);
      assert.ok(
        lesson.sections.every(section => section.body.length >= 30),
        lesson.id,
      );
      const questions = [lesson.quiz, ...(lesson.more ?? [])];
      assert.equal(questions.length, 3, lesson.id);
      for (const item of questions) {
        assert.ok(item.options.length >= 2 && item.options.length <= 4, item.question);
        assert.equal(new Set(item.options).size, item.options.length, item.question);
        assert.ok(item.answer >= 0 && item.answer < item.options.length, item.question);
        assert.ok(item.explanation.length > 8, item.question);
        if (item.listen) assert.ok(parseSequence(item.listen).length, item.question);
      }
      if (line.stage === 5) assert.ok((lesson.activity?.steps.length ?? 0) >= 2, lesson.id);
      else if (lesson.widget === 'discovery' || lesson.activity)
        assert.equal(lesson.activity?.steps.length, 3, lesson.id);
      if (lesson.widget === 'jianpu') assert.ok(lesson.jianpu?.length, lesson.id);
      if (lesson.widget === 'play') assert.ok(lesson.play?.length, lesson.id);
      if (lesson.widget === 'tab') assert.ok(lesson.tab?.length, lesson.id);
      if (lesson.widget === 'listen') assert.ok(lesson.listen?.length, lesson.id);
      if (lesson.widget === 'record') assert.ok(lesson.record?.prompt, lesson.id);
      if (lesson.widget === 'pitch') assert.ok(lesson.pitch?.title, lesson.id);
      if (lesson.widget === 'sight') assert.ok(lesson.sight, lesson.id);
      if (line.id === 'guitar' && lesson.widget === 'sight') assert.equal(lesson.sight?.playOctave, -1, lesson.id);
      checkMaterial(lesson);
    }
});

test('the lesson kit places correct answers in varying positions', () => {
  const item = q('?', ['a', 'b', 'c', 'd'], 0, 'a is right');
  for (let slot = 0; slot < 8; slot++) {
    const placed = placeAnswer(item, slot);
    assert.equal(placed.answer, slot % 4);
    assert.equal(placed.options[placed.answer], 'a');
    // Rotation keeps the cyclic order of the options.
    assert.equal(placed.options.join('').repeat(2).includes('abcd'), true);
  }
  assert.deepEqual(placeAnswer(q('?', ['x', 'y'], 1, 'y is right'), 2), {
    question: '?',
    options: ['y', 'x'],
    answer: 0,
    explanation: 'y is right',
  });
  const positions = [0, 0, 0, 0];
  for (const line of lines)
    for (const lesson of line.lessons)
      for (const item of [lesson.quiz, ...(lesson.more ?? [])]) positions[item.answer]++;
  const total = positions.reduce((sum, count) => sum + count, 0);
  for (const count of positions)
    assert.ok(count / total >= 0.2 && count / total <= 0.3, `answer positions ${positions.join(' ')}`);
});
