import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { instrumentChoices, selectionProfiles, filterInstrumentChoices, timbreTags, selectionLabels } from '../src/instrument-selection.ts';
import { audioSamples } from '../src/audio-samples.ts';

test('every instrument has an individual complete selection profile and foundations are excluded',()=>{
  assert.equal(instrumentChoices.length,200);
  assert.deepEqual(Object.keys(selectionProfiles).sort(),instrumentChoices.map(course=>course.id).sort());
  for(const course of instrumentChoices){
    const p=selectionProfiles[course.id];
    for(const key of ['timbre','reason','strength','challenge','setup'] as const)assert.ok(p[key].trim().length>=10,`${course.id}.${key}`);
    assert.ok(p.tags.length>=2&&p.tags.every(tag=>timbreTags.includes(tag)),course.id);
    assert.equal(new Set(p.tags).size,p.tags.length,course.id);
    for(const key of ['access','portability','practice','start'] as const)assert.ok(p[key] in selectionLabels[key],`${course.id}.${key}`);
  }
  assert.equal(selectionProfiles.theory,undefined);
  assert.equal(selectionProfiles.ear,undefined);
  assert.notEqual(selectionProfiles.violin.reason,selectionProfiles.erhu.reason);
  assert.notEqual(selectionProfiles.piano.reason,selectionProfiles.celesta.reason);
});

test('selection filters intersect actual conditions and preserve sound/name searches',()=>{
  assert.ok(filterInstrumentChoices('温暖').length>0);
  assert.ok(filterInstrumentChoices('黑管').some(course=>course.id==='clarinet'));
  assert.ok(filterInstrumentChoices('',{practice:'headphones'}).some(course=>course.id==='electricguitar'));
  assert.ok(!filterInstrumentChoices('',{practice:'headphones'}).some(course=>course.id==='piano'));
  assert.ok(filterInstrumentChoices('',{origin:'china',family:'wind',portability:'pocket'}).length>0);
  for(const course of filterInstrumentChoices('',{origin:'china',family:'wind',portability:'pocket'})){
    assert.ok(course.traditional);assert.equal(course.family,'wind');assert.equal(selectionProfiles[course.id].portability,'pocket');
  }
  assert.equal(filterInstrumentChoices('不存在的名字',{tone:'温暖'}).length,0);
  assert.equal(filterInstrumentChoices('',{origin:'china'}).length,100);
  assert.equal(filterInstrumentChoices('',{origin:'world'}).length,100);
});

test('real sound excerpts retain valid PCM data, attribution, duration and integrity',()=>{
  const ledger=JSON.parse(readFileSync(new URL('../public/audio/credits.json',import.meta.url),'utf8'));
  assert.deepEqual(audioSamples,ledger);
  assert.equal(Object.keys(ledger).length,16);
  const credits=readFileSync(new URL('../public/audio-credits.html',import.meta.url),'utf8');
  for(const item of Object.values(audioSamples)){
    assert.ok(instrumentChoices.some(course=>course.id===item.track),item.track);
    assert.match(item.file,/^[a-z]+\.wav$/);
    const path=new URL(`../public/audio/${item.file}`,import.meta.url),bytes=readFileSync(path);
    assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');
    assert.equal(bytes.readUInt16LE(20),1);assert.equal(bytes.readUInt16LE(22),1);assert.equal(bytes.readUInt16LE(34),16);
    assert.equal(bytes.readUInt32LE(24),item.sampleRate);
    assert.ok(item.seconds>.1&&item.seconds<=5.01,item.track);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256,item.track);
    let peak=0;for(let i=44;i<bytes.length;i+=2)peak=Math.max(peak,Math.abs(bytes.readInt16LE(i)));
    assert.ok(peak>50,`${item.track} must not be silence`);
    assert.equal(item.license,'CC0-1.0');assert.equal(new URL(item.source).protocol,'https:');
    assert.ok(credits.includes(item.label)&&credits.includes(item.file),item.track);
  }
  assert.ok(statSync(new URL('../public/audio/LICENSE-VSCO-CC0.txt',import.meta.url)).size>1000);
});
