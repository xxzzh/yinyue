import test from 'node:test';
import assert from 'node:assert/strict';
import { findCourse, findLesson } from '../src/data.ts';
import { coreL0Lessons, coreL1Lessons, coreLessonExtras } from '../src/core-lessons.ts';
import { coreL2Lessons } from '../src/core-l2-lessons.ts';
import { coreL3Lessons } from '../src/core-l3-lessons.ts';
import { coreL4Lessons } from '../src/core-l4-lessons.ts';
import { coreL5Lessons } from '../src/core-l5-lessons.ts';
import { checkChorale, chordName, choraleSequence, satb, stringQuartet } from '../src/voice-leading.ts';
import { circleOfFifths, degreeChords, majorScaleSequence, progressionQuestion } from '../src/harmony.ts';
import { parseTab, tabEvents } from '../src/tab.ts';
import { beatCells, melodyQuestion, rhythmQuestion, rhythmScore } from '../src/dictation.ts';
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
import { Note } from 'tonal';

const mainLine = ([0, 1, 2, 3, 4, 5] as const)
  .flatMap(stage => publishedLessons('core', stage))
  .map(id => findLesson(id)!);

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
  assert.equal(allIntervals.length, 12);
  const pool = intervalSet(['3m', '4P']);
  assert.deepEqual(
    [earQuestion(() => 0, pool).notes, earQuestion(() => 0.99, pool).interval.id],
    [['C4', 'Eb4'], '4P'],
  );
});

test('main-line L0–L5 lessons are complete, checkable and playable', () => {
  assert.equal(coreL0Lessons.length + coreL1Lessons.length, 35);
  assert.equal(coreL2Lessons.length, 40);
  assert.equal(coreL3Lessons.length, 40);
  assert.equal(coreL4Lessons.length, 35);
  assert.deepEqual(
    coreL5Lessons.map(item => item.id),
    publishedLessons('core', 5),
  );
  assert.equal(mainLine.length, 188);
  assert.equal(findCourse('ear')!.lessons.length + findCourse('theory')!.lessons.length, 188);
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
    if (lesson.widget === 'dictation') assert.ok(lesson.dictation, lesson.id);
    if (lesson.widget === 'chorale') assert.ok(lesson.chorale?.solution, lesson.id);
    for (const example of lesson.jianpu ?? [])
      for (const mark of example.marks ?? [])
        assert.ok(
          mark.bar >= 1 && mark.bar <= measures(parseJianpu(example.score)).length,
          `${lesson.id}: ${mark.label}`,
        );
    if (lesson.widget === 'progression') assert.ok(lesson.progression?.pool?.includes('V'), lesson.id);
    if (lesson.widget === 'tab') {
      assert.ok(lesson.tab?.length, lesson.id);
      for (const example of lesson.tab!) assert.ok(tabEvents(parseTab(example.score)).length > 0, example.title);
    }
    if (lesson.widget === 'sight') assert.ok(lesson.sight, lesson.id);
    if (lesson.widget === 'discovery') assert.ok(lesson.activity?.steps.length, lesson.id);
  }
  assert.ok(answerSlots.size >= 3, 'answers are not always in the same position');
  for (const id of Object.keys(coreLessonExtras)) assert.ok((findLesson(id)!.more ?? []).length >= 2, id);
  assert.deepEqual(findLesson('ear-2')!.intervals, ['2M', '3m', '3M', '4P', '5P', '8P']);
});

test('L2–L5 lessons sit in the right course and the ear course covers dictation and all intervals', () => {
  const ear = findCourse('ear')!.lessons.map(lesson => lesson.id);
  const theory = findCourse('theory')!.lessons.map(lesson => lesson.id);
  for (const id of ([2, 3, 4, 5] as const).flatMap(stage => publishedLessons('core', stage))) {
    const listening = id.startsWith('rh') || id.startsWith('ea');
    assert.ok((listening ? ear : theory).includes(id), id);
  }
  assert.deepEqual(
    intervalSet(findLesson('ea2-25')!.intervals).map(item => item.id),
    allIntervals.map(item => item.id),
  );
  assert.equal(findLesson('ea2-25')!.intervalsMixed, true);
  assert.equal(findLesson('ea2-29')!.dictation!.kind, 'rhythm');
  assert.equal(findLesson('ea2-30')!.dictation!.kind, 'melody');
});

test('mixed interval questions sometimes play downward', () => {
  let calls = 0;
  const random = () => [0, 0, 0.9, 0.2][calls++ % 4];
  const up = earQuestion(random, intervalSet(['5P']), true);
  const down = earQuestion(random, intervalSet(['5P']), true);
  assert.deepEqual(
    [up.notes, down.notes],
    [
      ['C4', 'G4'],
      ['G4', 'C4'],
    ],
  );
});

test('rhythm dictation questions fill every bar and can be written in 简谱', () => {
  const all = beatCells.map(cell => cell.id);
  for (let seed = 1; seed <= 200; seed++)
    for (const meter of [2, 3, 4] as const) {
      const { answer, score } = rhythmQuestion(seed, { meter, bars: 2, cells: all });
      assert.equal(answer.length, meter * 2);
      assert.notEqual(answer[answer.length - 1], 'r', `seed ${seed}`);
      answer.forEach((cell, i) => {
        if (cell === 'hold') {
          assert.ok(i % meter !== 0, `seed ${seed}: hold at a bar start`);
          assert.ok(['q', 'hold'].includes(answer[i - 1]), `seed ${seed}: hold after ${answer[i - 1]}`);
        }
      });
      const parsed = parseJianpu(score);
      assert.deepEqual(measures(parsed).map(measureBeats), [meter, meter], `seed ${seed}: ${score}`);
    }
  assert.equal(rhythmScore(['es', 'q', 'hold', 'r'], 4), '1=C 4/4 | 5._ 5__ 5 - 0 ||');
  assert.deepEqual(rhythmQuestion(7), rhythmQuestion(7));
});

test('melody dictation questions start on do, mi or sol, end on do and match their notes', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const { answer, score, events } = melodyQuestion(seed, { range: [0, 4] });
    assert.ok(['1', '3', '5'].includes(answer[0]), `seed ${seed}: starts on ${answer[0]}`);
    assert.equal(answer[answer.length - 1], '1', `seed ${seed}`);
    assert.equal(events.filter(event => event.notes.length).length, answer.length);
    assert.ok(
      answer.every(degree => /^[1-5]$/.test(degree)),
      `seed ${seed}: ${answer.join(' ')}`,
    );
    assert.deepEqual(measures(parseJianpu(score)).map(measureBeats), [4, 4]);
  }
  const wide = melodyQuestion(3, { range: [-3, 5] });
  assert.ok(
    wide.answer.every(degree => /^[1-7][',]?$/.test(degree)),
    wide.answer.join(' '),
  );
});

test('triplets in 简谱 take two thirds of their length and get tuplet marks on the staff', () => {
  const score = parseJianpu('1=C 2/4 | {1_ 2_ 3_} 5 | {5 3_} 1 | {1__ 2__ 3__} {4__ 5__ 6__} 5 ||');
  assert.deepEqual(measures(score).map(measureBeats), [2, 2, 2]);
  const notes = score.tokens.filter((token): token is JianpuNote => token.kind === 'note');
  assert.deepEqual(
    notes.slice(0, 3).map(note => note.tuplet),
    ['start', 'middle', 'stop'],
  );
  const xml = jianpuToMusicXml(score);
  assert.match(xml, /<divisions>12<\/divisions>/);
  assert.match(xml, /<duration>4<\/duration><type>eighth<\/type><time-modification>/);
  assert.match(xml, /<duration>8<\/duration><type>quarter<\/type><time-modification>/);
  assert.equal(xml.match(/<tuplet type="start" bracket="yes"\/>/g)?.length, 4);
  // Scores without triplets keep sixteenth-note divisions.
  assert.match(jianpuToMusicXml(parseJianpu('1=C 4/4 | 1 2 3 4 ||')), /<divisions>4<\/divisions>/);
  assert.match(
    jianpuToMusicXml(parseJianpu('1=C 4/4 | 1 2 3 4 ||'), '', { clef: 'alto' }),
    /<sign>C<\/sign><line>3<\/line>/,
  );
  for (const bad of ['1=C 2/4 | {1_ 2_', '1=C 2/4 | 1_ 2_}', '{1_ {2_ 3_}', '{1 - 2}', '{x_ 1_ 2_}'])
    assert.throws(() => parseJianpu(bad), bad);
  assert.deepEqual(
    parseSequence('C4:1/3 D4:2/3').map(event => event.beats),
    [1 / 3, 2 / 3],
  );
  assert.throws(() => parseSequence('C4:1/0'));
});

test('chord-progression questions start on I, never repeat a chord and stay in the pool', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const { answer, seq } = progressionQuestion(seed, { pool: ['I', 'ii', 'IV', 'V', 'vi'] });
    assert.equal(answer[0], 'I');
    assert.equal(answer.length, 4);
    answer.forEach((degree, i) => {
      assert.ok(['I', 'ii', 'IV', 'V', 'vi'].includes(degree), degree);
      if (i) assert.notEqual(degree, answer[i - 1], `seed ${seed}`);
    });
    assert.equal(parseSequence(seq).length, 4);
  }
  assert.deepEqual(progressionQuestion(9), progressionQuestion(9));
  // Voicings hold the right chord tones.
  assert.deepEqual(
    degreeChords.vi.notes.map(note => note.slice(0, -1)),
    ['A', 'C', 'E', 'A'],
  );
});

test('the circle of fifths lists every key signature with its relative minor', () => {
  assert.equal(circleOfFifths.length, 12);
  const key = (major: string) => circleOfFifths.find(item => item.major === major)!;
  assert.deepEqual([key('A').minor, key('A').count, key('A').accidentals], ['f#', 3, ['F#', 'C#', 'G#']]);
  assert.deepEqual([key('Eb').minor, key('Eb').count, key('Eb').accidentals], ['c', -3, ['Bb', 'Eb', 'Ab']]);
  assert.deepEqual(key('F#').enharmonic, {
    major: 'Gb',
    minor: 'eb',
    count: -6,
    accidentals: ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'],
  });
  // Each step clockwise is a perfect fifth up.
  circleOfFifths.forEach((item, i) => {
    const next = circleOfFifths[(i + 1) % 12];
    assert.equal((Note.chroma(next.major)! - Note.chroma(item.major)! + 12) % 12, 7, `${item.major} → ${next.major}`);
  });
  assert.equal(majorScaleSequence('D'), 'D4 E4 F#4 G4 A4 B4 C#5 D5:2');
  for (const item of circleOfFifths) assert.equal(parseSequence(majorScaleSequence(item.major)).length, 8);
});

test('rhythm dictation can ask triplets and syncopation; melody dictation can leap', () => {
  const cells = ['q', 'ee', 'es', 'ses', 'trip', 'r', 'hold'] as const;
  let triplets = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const { answer, score } = rhythmQuestion(seed, { meter: 4, bars: 2, cells: [...cells] });
    triplets += answer.filter(cell => cell === 'trip').length;
    assert.deepEqual(measures(parseJianpu(score)).map(measureBeats), [4, 4], score);
  }
  assert.ok(triplets > 0);
  let leaps = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const { answer, score } = melodyQuestion(seed, { bars: 4, range: [-3, 7], leaps: true });
    const pitches = jianpuEvents(parseJianpu(score)).map(event => Note.midi(event.notes[0])!);
    pitches.forEach((pitch, i) => {
      if (i && Math.abs(pitch - pitches[i - 1]) >= 5) leaps++;
      assert.ok(pitch >= Note.midi('G3')! && pitch <= Note.midi('C5')!, `seed ${seed}: ${score}`);
    });
    assert.equal(answer[answer.length - 1], '1');
  }
  assert.ok(leaps > 50, `${leaps} leaps`);
  // Without leaps the melody is unchanged from before (seeded sight-reading stays stable).
  assert.equal(melodyQuestion(5).score, melodyQuestion(5, { leaps: false }).score);
});

const columns = (rows: string[][]) => rows[0].map((_, c) => rows.map(row => row[c]));

test('the voice-leading checker finds the classic errors and passes a correct chorale', () => {
  const kinds = (rows: string[][], voices = satb) => checkChorale(columns(rows), voices).map(issue => issue.kind);
  const good = [
    ['E4', 'F4', 'D4', 'C4'],
    ['C4', 'C4', 'B3', 'C4'],
    ['G3', 'A3', 'G3', 'E3'],
    ['C3', 'F2', 'G2', 'C3'],
  ];
  assert.deepEqual(kinds(good), []);
  // Parallel fifths and octaves in a block-chord step.
  assert.deepEqual(
    kinds([
      ['G4', 'A4'],
      ['E4', 'F4'],
      ['C4', 'D4'],
      ['C3', 'D3'],
    ]).filter(kind => kind === 'parallel').length,
    3,
  );
  // Contrary octaves are a warning, not an error.
  const contrary = checkChorale(
    columns([
      ['C5', 'D5'],
      ['E4', 'F4'],
      ['G3', 'A3'],
      ['C3', 'D2'],
    ]),
  );
  assert.ok(contrary.some(issue => issue.kind === 'contrary' && issue.severity === 'warning'));
  // Crossing, spacing, range and leaps.
  assert.deepEqual(kinds([['C4'], ['E4'], ['G3'], ['C3']]), ['crossing']);
  assert.deepEqual(kinds([['G5'], ['E4'], ['C4'], ['C3']]), ['spacing']);
  assert.deepEqual(kinds([['A5'], ['E5'], ['C5'], ['C3']]), ['range', 'range', 'range']);
  assert.ok(
    kinds([
      ['C4', 'D5'],
      ['G3', 'B4'],
      ['E3', 'G4'],
      ['C3', 'G2'],
    ]).includes('leap'),
  );
  // Hidden octave: outer voices in similar motion into an octave, soprano leaping.
  assert.ok(
    kinds([
      ['E4', 'G4'],
      ['C4', 'D4'],
      ['G3', 'B3'],
      ['C3', 'G3'],
    ]).includes('hidden'),
  );
  assert.equal(checkChorale([['X4', 'C4', 'G3', 'C3']])[0].kind, 'invalid');
  // Chord names, including inversions, fifth-less chords and common names first.
  assert.deepEqual(
    [
      ['C4', 'C4', 'E3', 'C3'],
      ['G4', 'D4', 'B3', 'F2'],
      ['C4', 'G3', 'E3', 'E2'],
      ['Db4', 'F3', 'Ab3', 'F2'],
    ].map(chordName),
    ['C', 'G7/F', 'C/E', 'D♭/F'],
  );
  assert.equal(parseSequence(choraleSequence(columns(good))).length, 4);
});

test('every four-part exercise has a model answer that passes the checker', () => {
  const chorales = coreL4Lessons.filter(lesson => lesson.chorale);
  assert.ok(chorales.length >= 5);
  for (const { id, chorale } of chorales) {
    const task = chorale!;
    const voices = task.voices === 'quartet' ? stringQuartet : satb;
    const width = task.given[0].length;
    assert.equal(task.given.length, 4, id);
    assert.ok(
      task.given.every(row => row.length === width),
      id,
    );
    if (task.labels) assert.equal(task.labels.length, width, id);
    const errors = checkChorale(columns(task.solution!), voices).filter(issue => issue.severity === 'error');
    assert.deepEqual(errors, [], id);
    // Given notes are part of the model answer, and the learner has something to write.
    task.given.forEach((row, r) => row.forEach((note, c) => note && assert.equal(note, task.solution![r][c], id)));
    assert.ok(
      task.given.flat().some(note => !note),
      id,
    );
    if (task.draft) {
      const draft = task.given.map((row, r) => row.map((note, c) => note || task.draft![r][c]));
      assert.ok(
        checkChorale(columns(draft), voices).some(issue => issue.severity === 'error'),
        `${id}: the draft has mistakes to find`,
      );
    }
  }
});

test('form labels reach the staff as rehearsal marks', () => {
  const xml = jianpuToMusicXml(parseJianpu('1=C 2/4 | 1 2 | 3 4 | 5 - ||'), '', {
    marks: [
      { bar: 1, label: 'A' },
      { bar: 3, label: 'B' },
    ],
  });
  assert.deepEqual(xml.match(/<rehearsal>\w<\/rehearsal>/g), ['<rehearsal>A</rehearsal>', '<rehearsal>B</rehearsal>']);
});

test('chromatic melody dictation adds leading notes that resolve by step', () => {
  let altered = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const { answer, score } = melodyQuestion(seed, { bars: 8, range: [-3, 7], eighths: true, chromatic: true });
    assert.deepEqual(new Set(measures(parseJianpu(score)).map(measureBeats)), new Set([4]), score);
    answer.forEach((note, i) => {
      if (!/^[#b]/.test(note)) return;
      altered++;
      assert.ok(i > 0 && i < answer.length - 1, `seed ${seed}: altered note at an end`);
      const step = Number(answer[i + 1].replace(/[#b',]/g, '')) - Number(note.replace(/[#b',]/g, ''));
      assert.equal(step, note.startsWith('#') ? 1 : -1, `seed ${seed}: ${note} → ${answer[i + 1]}`);
    });
    assert.ok(answer.filter(note => /^[#b]/.test(note)).length <= 2, `seed ${seed}`);
  }
  assert.ok(altered > 150, `${altered} altered notes`);
  // Without the option nothing is altered, so existing questions stay the same.
  assert.equal(melodyQuestion(5, { bars: 4 }).score, melodyQuestion(5, { bars: 4, chromatic: false }).score);
});
