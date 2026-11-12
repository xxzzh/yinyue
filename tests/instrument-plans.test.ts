import test from 'node:test';
import assert from 'node:assert/strict';
import { findLesson } from '../src/data.ts';
import {
  instrumentLines,
  instrumentStageSize,
  plannedSize,
  publishedLessons,
  STAGES,
  unitsOf,
} from '../src/curriculum.ts';
import { instrumentLessonPlans } from '../src/instrument-lesson-plans.ts';

test('every instrument stage lists a working title for each lesson still to be written', () => {
  let total = 0;
  for (const line of instrumentLines) {
    const id = line.id as keyof typeof instrumentLessonPlans;
    const seen = new Set<string>();
    for (const stage of STAGES) {
      const published = publishedLessons(line.id, stage);
      const titles = instrumentLessonPlans[id][stage] ?? [];
      const missing = unitsOf(line.id, stage).reduce((sum, unit) => sum + (unit.extraPlanned ?? 0), 0);
      assert.equal(titles.length, missing, `${line.id} L${stage}: titles for the unwritten lessons`);
      assert.equal(published.length + titles.length, instrumentStageSize[stage], `${line.id} L${stage}`);
      assert.equal(plannedSize(line.id, stage), instrumentStageSize[stage]);
      const written = new Set(published.map(lessonId => findLesson(lessonId)!.title));
      for (const title of titles) {
        assert.ok(title.trim().length >= 4, `${line.id} L${stage}: ${title}`);
        assert.ok(!seen.has(title), `${line.id}: duplicate “${title}”`);
        assert.ok(!written.has(title), `${line.id}: “${title}” is already written`);
        seen.add(title);
      }
      // From L1 on, a stage ends with its performance check.
      const last = titles.length ? titles[titles.length - 1] : findLesson(published[published.length - 1])?.title;
      if (stage >= 1) assert.match(last ?? '', /^L\d (演奏|演唱)关卡/, `${line.id} L${stage} ends with a check`);
      total += titles.length;
    }
  }
  // L3–L5 of every line: piano, guitar and voice 55 each, guzheng 55, koudi 55.
  assert.equal(total, 275);
});
