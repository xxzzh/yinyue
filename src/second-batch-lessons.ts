import type { Lesson, ListenClip } from './data.ts';
import { parseDrumScore } from './drum-notation.ts';
import type { DrumExample } from './drum-notation.ts';
import { instrumentProfiles, stringNote } from './instrument-profiles.ts';
import { parseSequence } from './jianpu.ts';
import { lesson, q } from './lesson-kit.ts';
import { secondBatchOrder } from './second-batch-order.ts';
import type { SecondBatchLine } from './second-batch-order.ts';

export type Study = [title: string, score: string, method: string, evidence: string, tempo?: number];
type Chapter = { studies: Study[]; projects?: Study[]; finale: Study };
type Course = { setup: string; first: Study; chapters: [Chapter, Chapter, Chapter, Chapter, Chapter] };
type Medium = { score: string; reference?: ListenClip; drum?: DrumExample };

const uke = instrumentProfiles.find(profile => profile.track === 'ukulele')!;
// Shapes are ordered from string 4 to 1, for re-entrant gCEA tuning.
const shapes: Record<string, number[]> = {
  ...uke.chords,
  G: [0, 2, 3, 2],
  Dm: [2, 2, 1, 0],
  Dm7: [2, 2, 1, 3],
  A7: [0, 1, 0, 0],
  D7: [2, 2, 2, 3],
  Cmaj7: [0, 0, 0, 2],
  Fmaj7: [2, 4, 1, 3],
  Bb: [3, 2, 1, 1],
  Am7: [0, 0, 0, 0],
  Fm: [1, 0, 1, 3],
  C高: [5, 4, 3, 3],
  G高: [4, 2, 3, 2],
};
const kalimbaKeys = 'D6 B5 G5 E5 C5 A4 F4 D4 C4 E4 G4 B4 D5 F5 A5 C6 E6'.split(' ');
// Sounding octaves, with 0 for the back hole and ½ for a partly open back hole.
const recorderHoles: Record<string, string> = {
  C5: '01234567',
  D5: '0123456',
  E5: '012345',
  F5: '0123467',
  'F#5': '012356',
  G5: '0123',
  A5: '012',
  Bb5: '0134',
  B5: '01',
  C6: '02',
  D6: '2',
  E6: '½12345',
  F6: '½12346',
  G6: '½123',
};
const dynamics = new Set(['pp', 'p', 'mp', 'mf', 'f', 'ff']);

function ukuleleMedium(raw: string, tempo: number): Medium {
  const named = new Set<string>();
  const seq = raw
    .split(/\s+/u)
    .map(token => {
      if (token === '|' || dynamics.has(token)) return token;
      const up = token.startsWith('^');
      const [symbol, length] = (up ? token.slice(1) : token).split(':');
      const single = /^(\d)\/(\d+)$/u.exec(symbol);
      let notes = symbol;
      if (single) notes = stringNote(uke.notes[4 - Number(single[1])].note, Number(single[2]));
      else if (symbol !== 'r') {
        named.add(symbol);
        notes = shapes[symbol].map((fret, i) => stringNote(uke.notes[i].note, fret)).join('+');
      }
      return `${up ? '^' : ''}${notes}${length ? `:${length}` : ''}`;
    })
    .join(' ');
  const fingerings = [...named].map(name => `${name} ${shapes[name].join('–')}`).join('，');
  return {
    score: `${raw.replaceAll('^', '↑')}。弦/品如 1/3 是第 1 弦第 3 品，↑ 是上扫，其余和弦下扫。${
      fingerings ? `本段和弦品位（第 4 弦到第 1 弦）：${fingerings}。` : ''
    }`,
    reference: { label: '听尤克里里节奏与音高示范', seq, tempo, instrument: 'guitar' },
  };
}

function mediumFor(line: SecondBatchLine, score: string, tempo: number): Medium {
  if (line === 'ukulele') return ukuleleMedium(score, tempo);
  if (line === 'drums') {
    return {
      score: `${score}。K 底鼓、S 军鼓、H 踩镲，同格一起敲，- 留白，! 重击。斜线分拍，竖线分小节。`,
      drum: { score, tempo },
    };
  }
  const notes = [...new Set(parseSequence(score).flatMap(event => event.notes))];
  const recorder = line === 'recorder';
  const positions = notes.map(note => {
    if (recorder) {
      const holes = recorderHoles[note];
      if (!holes) throw new Error(`Missing recorder fingering: ${note}`);
      return `${note}=${holes}`;
    }
    const key = kalimbaKeys.indexOf(note);
    if (key < 0) throw new Error(`Note outside the 17-key kalimba: ${note}`);
    const offset = key - 8;
    return `${note}=${offset === 0 ? '中央' : `${offset < 0 ? '左' : '右'}${Math.abs(offset)}`}`;
  });
  return {
    score: `${score}。${recorder ? '指法数字表示盖住的孔，0 是背孔，½ 是背孔留窄缝' : '从中央 C4 偏离几片簧片'}：${positions.join('、')}。`,
    reference: { label: '听参考音', seq: score, tempo, instrument: recorder ? 'wind' : 'piano' },
  };
}

function readScore(line: SecondBatchLine, medium: Medium) {
  return `${medium.score}${line === 'drums' ? '' : ' 冒号后标持续拍数，省略时为一拍，r 是休止，+ 是同时发声。p、mf、f 依次表示弱、中强、强。'}`;
}

function scoreQuestion(medium: Medium) {
  if (medium.drum) {
    const firstBar = parseDrumScore(medium.drum.score)[0];
    const positions = firstBar.flat().length;
    return q(
      '对照节奏示范，第一个小节共有几个敲击或留白的位置？同一格的多件鼓只算一个位置。',
      [positions, positions + 1, positions - 1, positions + 2].map(String),
      0,
      `把第一个小节的分拍或留白位置都数上，就是 ${positions} 个。`,
    );
  }
  const firstBar = parseSequence(medium.reference!.seq.split('|')[0]);
  const beats = Number(firstBar.reduce((total, event) => total + event.beats, 0).toFixed(3));
  return q(
    '对照示范数拍，练习材料的第一小节一共占几拍？',
    [beats, beats + 1, beats - 1, beats + 2].map(n => `${n} 拍`),
    0,
    `把第一小节的所有音符与休止时值相加，得到 ${beats} 拍。`,
  );
}

const checkQuestion = (title: string, evidence: string) =>
  q(
    `回听「${title}」练习时，哪项最能说明这一课的目标已达成？`,
    [
      evidence,
      '录音能从头到尾播放，细节留到下次才听',
      '最后几拍比开头快，说明动作已经熟练',
      '录音比上一次更响，其他条件可以略过',
    ],
    0,
    `优先按本课目标回听：${evidence}`,
  );

function makeOrientation(line: SecondBatchLine, id: string, setup: string, study: Study) {
  const [title, score, method, evidence, tempo = 56] = study;
  const medium = mediumFor(line, score, tempo);
  const pitch =
    line === 'recorder'
      ? {
          title: '对照 G5，试着吹稳约半秒',
          targets: ['G5'],
          tolerance: 40,
          hold: 0.6,
          instrument: 'wind' as const,
          note: '用麦克风看单音是否稳定。浏览器需要麦克风权限，你也可以只听参考音和自己的录音。',
        }
      : undefined;
  return lesson({
    id,
    title,
    minutes: 10,
    intro: '用十分钟完成一次可回听的小成果。先听一遍，试奏一遍，再用本课的标准听自己的结果。',
    sections: [
      ['开始前', setup],
      ['试奏材料', readScore(line, medium)],
      ['第一轮怎么练', method],
    ],
    takeaway: evidence,
    widget: medium.drum ? 'drums' : 'listen',
    drum: medium.drum,
    listen: medium.reference ? [medium.reference] : undefined,
    pitch,
    activity: {
      title: '完成第一次试奏',
      intro: '做完一步就勾选一步。最后用自己的录音或同伴的反馈确认结果。',
      steps: [
        { task: '播放示范，边听边数拍。', hint: `先用 ${tempo} BPM，数清开始和结束。` },
        { task: method, hint: '把要练的动作做短一些，就能多试几次。' },
        { task: '用手机录一遍并回听，或者请同伴听。', hint: evidence },
      ],
    },
    questions: [checkQuestion(title, evidence)],
  });
}

function makeStudy(
  line: SecondBatchLine,
  id: string,
  study: Study,
  phase: '听读' | '跟练' | '回听' | '作品',
  bpm: number,
): Lesson {
  const [title, score, method, evidence, tempo = bpm] = study;
  const medium = mediumFor(line, score, tempo);
  const recording = phase === '回听' || phase === '作品';
  const listening = phase === '听读';
  const sections: [string, string][] = [
    ['练习材料', readScore(line, medium)],
    ['动作要领', method],
  ];
  if (listening)
    sections.push([
      '听之前先数',
      '先用手轻打均匀的拍子。播放一次，定位每小节第一拍和最密的地方。停止播放，再把练习材料用音名或鼓点念一遍。',
    ]);
  else if (recording)
    sections.push([
      '保留两个版本',
      `先以 ${tempo} BPM 录一遍。标记最早发生偏差的位置，只调整那里的一个动作。保持相同速度录第二遍，用下方标准比较。`,
    ]);
  else
    sections.push([
      '从局部接回整句',
      `先把最难的一拍慢做三遍，再带上前后各一拍。回到 ${tempo} BPM 连奏两轮，第二轮不中断数拍。`,
    ]);
  return lesson({
    id,
    title: phase === '作品' ? title : `${title} · ${phase}`,
    minutes: listening ? 8 : recording ? 16 : 12,
    intro: listening
      ? `听清「${title}」的音和时值，再读一次练习材料。`
      : `用一段短练习解决「${title}」里的一个演奏问题。`,
    sections,
    takeaway: evidence,
    widget: recording ? 'record' : medium.drum ? 'drums' : 'listen',
    drum: medium.drum,
    listen: !recording && medium.reference ? [{ ...medium.reference, click: !listening }] : undefined,
    record: recording
      ? { title: '录下两次试奏', prompt: evidence, seconds: 90, reference: medium.reference }
      : undefined,
    activity: listening
      ? undefined
      : {
          title: recording ? '回听对照' : '慢练检查',
          intro: recording ? '回听两次试奏，在笔记里写下变化。' : '按顺序慢练，再用下方两项检查节拍和动作。',
          steps: [
            { task: recording ? '写下第一次出现偏差的位置。' : '先试最难的一拍，再接上相邻两拍。', hint: method },
            { task: recording ? '对照两次录音，标出一个听得见的变化。' : '保持相同速度连续演奏两轮。', hint: evidence },
          ],
        },
    questions: [listening ? scoreQuestion(medium) : checkQuestion(title, evidence)],
  });
}

function makeFinale(line: SecondBatchLine, id: string, stage: number, study: Study, bpm: number) {
  const [title, score, method, evidence, tempo = bpm] = study;
  const medium = mediumFor(line, score, tempo);
  return lesson({
    id,
    title: `L${stage} 演奏关卡 · ${title}`,
    minutes: stage === 5 ? 40 : 24,
    intro:
      stage === 5
        ? '整理出可独立复演的一套作品，留下演奏记录和下一轮排练计划。'
        : '把本阶段学过的动作串起来，完成一次不中断的试奏。',
    sections: [
      ['关卡要求', method],
      ['试奏起点', readScore(line, medium)],
      ['提交前回听', `${evidence} 手机录音也可以。长作品可以在网页里分段录，或用外部录音设备录全程。`],
    ],
    takeaway: evidence,
    widget: 'record',
    drum: medium.drum,
    record: { title: '演奏录音与自评', prompt: method, seconds: 120, reference: medium.reference },
    activity: {
      title: '关卡自评',
      intro: '录音可用上方工具或手机完成。回听后勾选清单，留下便于下次练习的记录。',
      required: true,
      steps: [
        { task: '按关卡要求录下一次完整演奏。', hint: method },
        { task: '回听录音并按指定标准检查。', hint: evidence },
        { task: '记下一个已做到的地方和一个要改练的位置。', hint: '写上小节号或时间点，方便下次从同一处开始。' },
      ],
    },
    questions: [scoreQuestion(medium), checkQuestion(title, evidence)],
  });
}

export function writeSecondBatchLine(line: SecondBatchLine, course: Course): Lesson[] {
  const order = secondBatchOrder(line);
  const lessons = [makeOrientation(line, order[0][0], course.setup, course.first)];
  const stages = [1, 2, 3, 4, 5] as const;
  for (const [index, chapter] of course.chapters.entries()) {
    const stage = stages[index];
    const tempo = [60, 66, 72, 76, 80][index];
    const ids = order[stage].filter(id => id.startsWith(`${line}-l`));
    const last = ids.pop()!;
    const batch = chapter.studies.flatMap((study, i) => {
      const phases = ['听读', '跟练', '回听'] as const;
      // The fourth original lesson already demonstrates the first study's basic counting.
      const hasIntro = stage === 1 && order[stage][0] === `${line}-4` && i === 0;
      return (hasIntro ? phases.slice(1) : phases).map(phase => makeStudy(line, ids.shift()!, study, phase, tempo));
    });
    for (const project of chapter.projects ?? []) batch.push(makeStudy(line, ids.shift()!, project, '作品', tempo));
    if (ids.length || batch.some(item => !item.id)) throw new Error(`Wrong number of lesson plans: ${line} L${stage}`);
    lessons.push(...batch, makeFinale(line, last, stage, chapter.finale, tempo));
  }
  return lessons;
}
