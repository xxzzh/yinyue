import test from 'node:test';
import assert from 'node:assert/strict';
import { findCourse, findLesson } from '../src/data.ts';
import { guitarLessons } from '../src/guitar-lessons.ts';
import { instrumentLessonOrder, lineLessons } from '../src/instrument-order.ts';
import { plannedSize, publishedLessons } from '../src/curriculum.ts';
import { chordBarres, chordVoicing, guitarChords } from '../src/music.ts';
import {
  barBeats,
  jianpuEvents,
  measureBeats,
  measures,
  parseJianpu,
  parseSequence,
  shiftOctaves,
} from '../src/jianpu.ts';
import { parseTab, tabBars, tabEvents } from '../src/tab.ts';

test('tablature parses strings, frets, chords, strums and rests', () => {
  const tab = parseTab('4/4 | 2/1 1/3:0.5 1/5:0.5 6/0+5/2+4/2:2 | ^3/0+2/0+1/0:0.5 r:3.5 ||');
  assert.deepEqual(tabBars(tab), [4, 4]);
  assert.deepEqual(
    tabEvents(tab).map(event => `${event.up ? '^' : ''}${event.notes.join('+')}:${event.beats}`),
    ['C4:1', 'G4:0.5', 'A4:0.5', 'E2+B2+E3:2', '^G3+B3+E4:0.5', ':3.5'],
  );
  for (const bad of ['7/0', '1/25', '1/x', '2/1:0']) assert.throws(() => parseTab(bad), bad);
  assert.equal(parseTab('3/4 | 6/3 ||').beats, 3);
});

test('guitar chord shapes sound the chords they are named after', () => {
  const pitchClasses = (name: string) => [...new Set(chordVoicing(name).map(note => note.replace(/\d/, '')))].sort();
  const expect: Record<string, string[]> = {
    E: ['Ab', 'B', 'E'],
    A: ['A', 'Db', 'E'],
    Dm: ['A', 'D', 'F'],
    G7: ['B', 'D', 'F', 'G'],
    C7: ['Bb', 'C', 'E'],
    D7: ['A', 'C', 'D', 'Gb'],
    E7: ['Ab', 'B', 'D', 'E'],
    A7: ['A', 'Db', 'E', 'G'],
    F: ['A', 'C', 'F'],
    'F-barre': ['A', 'C', 'F'],
    Bm: ['B', 'D', 'Gb'],
  };
  for (const [name, notes] of Object.entries(expect)) assert.deepEqual(pitchClasses(name), notes.sort(), name);
  for (const [name, barre] of Object.entries(chordBarres))
    for (let string = barre.from; string <= barre.to; string++)
      assert.ok(guitarChords[name][string] >= barre.fret, `${name}: barre covers string index ${string}`);
  // The chord diagram shows four frets.
  for (const [name, shape] of Object.entries(guitarChords)) assert.ok(Math.max(...shape) <= 4, name);
});

test('guitar lessons cover L0–L2 in path order with valid tablature and sounds', () => {
  assert.equal(guitarLessons.length, 26);
  const order = lineLessons(instrumentLessonOrder.guitar);
  assert.equal(order.length, 50);
  assert.deepEqual(
    findCourse('guitar')!.lessons.map(lesson => lesson.id),
    order,
  );
  for (const stage of [0, 1, 2, 3] as const)
    assert.equal(publishedLessons('guitar', stage).length, plannedSize('guitar', stage), `guitar L${stage}`);
  for (const lesson of guitarLessons) {
    assert.ok(findLesson(lesson.id), lesson.id);
    assert.ok(lesson.sections.length >= 3, lesson.id);
    const questions = [lesson.quiz, ...(lesson.more ?? [])];
    assert.equal(questions.length, 3, lesson.id);
    for (const item of questions) {
      assert.ok(item.answer >= 0 && item.answer < item.options.length, item.question);
      assert.equal(new Set(item.options).size, item.options.length, item.question);
      if (item.listen) assert.ok(parseSequence(item.listen).length, item.question);
    }
    for (const example of lesson.tab ?? []) {
      const tab = parseTab(example.score);
      const bars = tabBars(tab);
      const full = (tab.beats * 4) / tab.beatType;
      bars.forEach((beats, index) => assert.equal(beats, full, `${lesson.id}: ${example.title}, bar ${index + 1}`));
      assert.ok(tabEvents(tab).length >= 4, example.title);
    }
    for (const example of lesson.jianpu ?? []) {
      const score = parseJianpu(example.score);
      for (const beats of measures(score).map(measureBeats)) assert.equal(beats, barBeats(score), example.title);
    }
    for (const clip of lesson.listen ?? []) {
      const events = parseSequence(clip.seq);
      assert.ok(events.length, clip.label);
      // Up-strums list their notes low to high; playback reverses them.
      for (const event of events.filter(item => item.up))
        assert.deepEqual(
          event.notes,
          [...event.notes].sort((a, b) => noteOrder(a) - noteOrder(b)),
          clip.label,
        );
    }
    for (const chord of lesson.chords ?? []) assert.ok(guitarChords[chord], `${lesson.id}: ${chord}`);
    if (lesson.widget === 'tab') assert.ok(lesson.tab?.length, lesson.id);
    if (lesson.widget === 'sight') assert.equal(lesson.sight?.playOctave, -1, lesson.id);
  }
  // Guitar music is written an octave above its sound.
  const staff = findLesson('guitar-l2-11')!.jianpu![0];
  const sounding = shiftOctaves(jianpuEvents(parseJianpu(staff.score)), staff.playOctave);
  assert.equal(sounding[0].notes[0], 'C3');
  // Twinkle, Twinkle on strings 1 and 2.
  const twinkle = tabEvents(parseTab(findLesson('guitar-l1-03')!.tab![0].score)).map(event => event.notes[0]);
  assert.deepEqual(twinkle.slice(0, 7), ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4']);
});

function noteOrder(note: string) {
  const letters = 'C D E F G A B'.split(' ');
  const match = /^([A-G])([#b]?)(\d)$/.exec(note)!;
  return (
    Number(match[3]) * 12 +
    [0, 2, 4, 5, 7, 9, 11][letters.indexOf(match[1])] +
    (match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0)
  );
}
