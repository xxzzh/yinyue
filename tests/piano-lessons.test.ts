import test from 'node:test';
import assert from 'node:assert/strict';
import { findCourse, findLesson } from '../src/data.ts';
import { pianoLessons } from '../src/piano-lessons.ts';
import { instrumentLessonOrder, lineLessons } from '../src/instrument-order.ts';
import { plannedSize, publishedLessons } from '../src/curriculum.ts';
import {
  barBeats,
  jianpuEvents,
  jianpuToMusicXml,
  measureBeats,
  measures,
  mergeParts,
  parseJianpu,
  parseSequence,
  rhythmAccuracy,
  sightReading,
} from '../src/jianpu.ts';

const withHeader = (right: string, left: string) => {
  const score = parseJianpu(right);
  return /^1=/.test(left) ? left : `1=${score.key} ${score.beats}/${score.beatType} ${left}`;
};
const barsOk = (source: string, label: string) => {
  const score = parseJianpu(source);
  const lengths = measures(score).map(measureBeats);
  const full = barBeats(score);
  const pickup = lengths[0] < full;
  lengths.forEach((beats, index) => {
    const expected =
      pickup && index === 0 ? lengths[0] : pickup && index === lengths.length - 1 ? full - lengths[0] : full;
    assert.equal(beats, expected, `${label}, bar ${index + 1}`);
  });
  return score;
};

test('grand staff, two-hand playback and bass clef', () => {
  const right = parseJianpu('1=C 4/4 | 3 3 4 5 | 5 4 3 2 ||');
  const left = parseJianpu('1=C 4/4 | 1, - 5, - | 1, - - - ||');
  const xml = jianpuToMusicXml(right, '', { left });
  assert.match(xml, /<staves>2<\/staves>/);
  assert.equal(xml.match(/<backup>/g)?.length, 2);
  assert.match(xml, /<clef number="2"><sign>F<\/sign><line>4<\/line><\/clef>/);
  assert.match(xml, /<staff>2<\/staff>/);
  assert.throws(() => jianpuToMusicXml(right, '', { left: parseJianpu('1=C 4/4 | 1, - - - ||') }));
  assert.match(jianpuToMusicXml(left, '', { clef: 'bass' }), /<sign>F<\/sign>/);
  assert.deepEqual(
    mergeParts(jianpuEvents(right), jianpuEvents(left))
      .slice(0, 4)
      .map(event => `${event.part}@${event.start}:${event.notes[0]}`),
    ['right@0:E4', 'left@0:C3', 'right@1:E4', 'right@2:F4'],
  );
});

test('rhythm accuracy compares proportions, not tempo', () => {
  assert.equal(rhythmAccuracy([1, 1, 2, 1], [0, 500, 1000, 2000, 2500]), 100);
  assert.equal(rhythmAccuracy([1, 1, 2, 1], [0, 1000, 2000, 4000, 5000]), 100);
  assert.ok(rhythmAccuracy([1, 1, 2, 1], [0, 500, 1300, 1600, 2500])! < 70);
  assert.equal(rhythmAccuracy([1, 1], [0, 500, 1000]), null);
});

test('sight-reading melodies fill every bar, stay in range and end on do', () => {
  for (let seed = 1; seed <= 60; seed++)
    for (const options of [
      { range: [0, 4] as [number, number] },
      { meter: 3 as const, range: [-3, 7] as [number, number], eighths: true },
      { key: 'F' as const, meter: 2 as const, range: [-3, 7] as [number, number] },
    ]) {
      const source = sightReading(seed, options);
      assert.equal(sightReading(seed, options), source, 'same seed, same melody');
      const score = barsOk(source, source);
      const events = jianpuEvents(score);
      const tonic = jianpuEvents(parseJianpu(`1=${options.key ?? 'C'} 4/4 | 1 ||`))[0].notes[0];
      assert.equal(events[events.length - 1].notes[0], tonic, source);
      for (const token of score.tokens)
        if (token.kind === 'note') {
          const degree = token.degree - 1 + token.octave * 7;
          assert.ok(degree >= options.range[0] && degree <= options.range[1], source);
        }
    }
});

test('piano lessons cover L0–L2 in path order with checkable material', () => {
  assert.equal(pianoLessons.length, 26);
  const order = lineLessons(instrumentLessonOrder.piano);
  assert.equal(order.length, 70);
  assert.deepEqual(
    findCourse('piano')!.lessons.map(lesson => lesson.id),
    order,
  );
  for (const stage of [0, 1, 2, 3, 4] as const)
    assert.equal(publishedLessons('piano', stage).length, plannedSize('piano', stage), `piano L${stage}`);
  for (const lesson of pianoLessons) {
    assert.ok(findLesson(lesson.id), lesson.id);
    assert.ok(lesson.sections.length >= 3, lesson.id);
    const questions = [lesson.quiz, ...(lesson.more ?? [])];
    assert.equal(questions.length, 3, lesson.id);
    for (const item of questions) {
      assert.ok(item.answer >= 0 && item.answer < item.options.length, item.question);
      assert.equal(new Set(item.options).size, item.options.length, item.question);
      if (item.listen) parseSequence(item.listen);
    }
    for (const target of lesson.play ?? []) {
      const score = barsOk(target.score, `${lesson.id}: ${target.title}`);
      assert.ok(jianpuEvents(score).filter(event => event.notes.length).length >= 4, target.title);
    }
    for (const example of lesson.jianpu ?? []) {
      const score = barsOk(example.score, `${lesson.id}: ${example.title}`);
      const left = example.left ? barsOk(withHeader(example.score, example.left), `${lesson.id}: left`) : undefined;
      if (example.view !== 'jianpu')
        assert.match(jianpuToMusicXml(score, '', { clef: example.clef, left }), /<measure/);
    }
    for (const clip of lesson.listen ?? []) parseSequence(clip.seq);
    if (lesson.widget === 'play') assert.ok(lesson.play?.length, lesson.id);
    if (lesson.widget === 'sight') assert.ok(lesson.sight, lesson.id);
  }
  // The two famous pieces are written out correctly enough to check against.
  const ode = jianpuEvents(parseJianpu(findLesson('piano-l1-05')!.play![0].score)).map(event => event.notes[0]);
  assert.deepEqual(ode.slice(0, 8), ['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4']);
  const minuet = jianpuEvents(parseJianpu(findLesson('piano-l2-13')!.play![0].score)).map(event => event.notes[0]);
  assert.deepEqual(minuet.slice(0, 7), ['D5', 'G4', 'A4', 'B4', 'C5', 'D5', 'G4']);
  assert.ok(minuet.includes('F#5') && minuet.includes('F#4'));
});
