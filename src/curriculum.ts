// Graded learning path (docs/curriculum-outline.md). Units reference existing lessons by their stable
// `lesson.id`; titles that are planned but not yet written are kept as `plan` items so the route can show
// the whole ladder honestly. Lesson content itself stays in data.ts and the course modules.
import { findLesson } from './course-index.ts';
import { instrumentLessonOrder } from './instrument-order.ts';
import { portfolioItemIds } from './progress.ts';
import type { Progress } from './progress.ts';
import { pendingReviews, reviewLessonId } from './review.ts';

export type Stage = 0 | 1 | 2 | 3 | 4 | 5;
export type Skill = 'rh' | 'nt' | 'th' | 'ea' | 'pf' | 'cr' | 'ls';
export type LineId = 'core' | 'piano' | 'guitar' | 'voice' | 'guzheng' | 'koudi';
export type UnitItem = { lesson: string } | { plan: string };

export interface StageInfo {
  stage: Stage;
  name: string;
  title: string;
  goal: string;
  level: string;
  duration: string;
}
export interface Unit {
  id: string;
  line: LineId;
  stage: Stage;
  skill: Skill;
  title: string;
  items: UnitItem[];
  /** Planned lessons that do not have a working title yet (instrument lines). */
  extraPlanned?: number;
}
export interface LineInfo {
  id: LineId;
  name: string;
  english: string;
  description: string;
}
export interface InstrumentStagePlan {
  technique: string;
  repertoire: string;
}
export interface Question {
  id: string;
  skill: Skill;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}
export interface StageTest {
  id: string;
  line: LineId;
  stage: Stage;
  title: string;
  questions: Question[];
}

export const STAGES: Stage[] = [0, 1, 2, 3, 4, 5];
export const PASS_RATE = 0.8;

export const stages: StageInfo[] = [
  {
    stage: 0,
    name: '启蒙',
    title: '打开耳朵',
    goal: '跟着音乐稳定拍手；分辨高低、长短、强弱；跟唱 do re mi sol la；在键盘上找到音名。',
    level: '零基础',
    duration: '2–4 周',
  },
  {
    stage: 1,
    name: '入门',
    title: '读懂与发声',
    goal: '读简谱和高音谱表的简单旋律；理解 C、G、F 大调与 2/4、3/4、4/4；听辨大小三和弦；在所选乐器上弹或唱出一首短曲。',
    level: '考级前',
    duration: '2–3 个月',
  },
  {
    stage: 2,
    name: '初级',
    title: '稳定演奏',
    goal: '读大谱表；调号到两个升降号；理解小调、三和弦转位与 I–IV–V；做 2 小节节奏和旋律听写；给旋律配简单和弦。',
    level: '约音协 1–3 级 / ABRSM 1–2',
    duration: '6–12 个月',
  },
  {
    stage: 3,
    name: '中级',
    title: '理解和声',
    goal: '掌握全部调号与五度圈、七和弦、终止式、近关系转调；听辨和弦进行；4 小节旋律听写；用五声或布鲁斯音阶即兴。',
    level: '约音协 4–6 级 / ABRSM 3–5',
    duration: '1–2 年',
  },
  {
    stage: 4,
    name: '高级',
    title: '风格与表现',
    goal: '写四部和声；理解副属、借用、增六和弦与远关系转调；分析奏鸣曲式；按风格演奏；编配小乐队。',
    level: '约音协 7–10 级 / ABRSM 6–8',
    duration: '2–3 年',
  },
  {
    stage: 5,
    name: '专业',
    title: '个人语言',
    goal: '写对位与赋格；了解 20 世纪技法与配器；策划独奏会；完成并发布原创作品；能把会的教给别人。',
    level: '演奏文凭 / 音乐院校本科核心课程',
    duration: '长期',
  },
];

export const skillNames: Record<Skill, string> = {
  rh: '节奏',
  nt: '读谱',
  th: '乐理与和声',
  ea: '练耳与视唱',
  pf: '演奏',
  cr: '创作与即兴',
  ls: '赏析与文化',
};

export const lines: LineInfo[] = [
  {
    id: 'core',
    name: '音乐素养主线',
    english: 'CORE MUSICIANSHIP',
    description: '节奏、读谱、乐理、练耳视唱、创作与赏析。所有人共用的主线，决定你能走多远。',
  },
  {
    id: 'piano',
    name: '钢琴',
    english: 'PIANO',
    description: '从键盘地图到独奏会曲目。屏幕键盘和 MIDI 键盘可以核对音高。',
  },
  { id: 'guitar', name: '吉他', english: 'GUITAR', description: '从六根空弦、开放和弦到指弹编曲与即兴。' },
  {
    id: 'voice',
    name: '声乐',
    english: 'VOICE',
    description: '不需要买乐器。呼吸、发声、咬字，再到风格演唱。疼痛或嘶哑时立即停止。',
  },
  {
    id: 'guzheng',
    name: '古筝',
    english: 'GUZHENG',
    description: '从二十一弦与 D 调定弦，到摇指、按滑揉颤与各地流派。',
  },
  {
    id: 'koudi',
    name: '口笛',
    english: 'KOUDI',
    description: '小巧明亮的中国吹管乐器。先确定两孔或五孔形制，再练口风、吐音与装饰。',
  },
];
export const instrumentLines = lines.filter(line => line.id !== 'core');
export const findLine = (id: string) => lines.find(line => line.id === id);

/** Planned lessons per stage for every instrument line (template in the outline, section 5.1). */
export const instrumentStageSize: Record<Stage, number> = { 0: 4, 1: 10, 2: 16, 3: 20, 4: 20, 5: 15 };

const l = (lesson: string): UnitItem => ({ lesson });
const unit = (line: LineId, stage: Stage, skill: Skill, items: UnitItem[], title = skillNames[skill]): Unit => ({
  id: `${line}-l${stage}-${skill}`,
  line,
  stage,
  skill,
  title,
  items,
});

const coreUnits: Unit[] = [
  // L0 启蒙 · 13
  unit('core', 0, 'rh', [l('rh0-01'), l('rh0-02'), l('ear-3'), l('rh0-04')]),
  unit('core', 0, 'nt', [l('theory-1')]),
  unit('core', 0, 'ea', [l('ear-1'), l('ea0-07'), l('ea0-08'), l('ear-4'), l('ea0-10')]),
  unit('core', 0, 'ls', [l('ls0-11'), l('ls0-12')]),
  unit('core', 0, 'pf', [l('pf0-13')], '练习方法'),
  // L1 入门 · 30
  unit('core', 1, 'rh', [l('theory-2'), l('rh1-02'), l('rh1-03'), l('rh1-04'), l('rh1-05'), l('rh1-06')]),
  unit('core', 1, 'nt', [
    l('nt1-07'),
    l('nt1-08'),
    l('nt1-09'),
    l('nt1-10'),
    l('nt1-11'),
    l('nt1-12'),
    l('nt1-13'),
    l('nt1-14'),
    l('nt1-15'),
  ]),
  unit('core', 1, 'th', [
    l('th1-16'),
    l('theory-3'),
    l('th1-18'),
    l('th1-19'),
    l('th1-20'),
    l('theory-4'),
    l('th1-22'),
    l('th1-23'),
  ]),
  unit('core', 1, 'ea', [l('ear-2'), l('ea1-25'), l('ea1-26'), l('ea1-27'), l('ea1-28')]),
  unit('core', 1, 'cr', [l('cr1-29')]),
  unit('core', 1, 'ls', [l('ls1-30')]),
  // L2 初级 · 40
  unit('core', 2, 'rh', [l('rh2-01'), l('rh2-02'), l('rh2-03'), l('rh2-04'), l('rh2-05'), l('rh2-06')]),
  unit('core', 2, 'nt', [l('nt2-07'), l('nt2-08'), l('nt2-09'), l('nt2-10'), l('nt2-11'), l('nt2-12')]),
  unit('core', 2, 'th', [
    l('th2-13'),
    l('th2-14'),
    l('th2-15'),
    l('th2-16'),
    l('th2-17'),
    l('th2-18'),
    l('th2-19'),
    l('th2-20'),
    l('th2-21'),
    l('th2-22'),
    l('th2-23'),
    l('th2-24'),
  ]),
  unit('core', 2, 'ea', [
    l('ea2-25'),
    l('ea2-26'),
    l('ea2-27'),
    l('ea2-28'),
    l('ea2-29'),
    l('ea2-30'),
    l('ea2-31'),
    l('ea2-32'),
    l('ea2-33'),
    l('ea2-34'),
  ]),
  unit('core', 2, 'cr', [l('cr2-35'), l('cr2-36'), l('cr2-37'), l('cr2-38')]),
  unit('core', 2, 'ls', [l('ls2-39'), l('ls2-40')]),
  // L3 中级 · 40
  unit('core', 3, 'rh', [l('rh3-01'), l('rh3-02'), l('rh3-03'), l('rh3-04'), l('rh3-05'), l('rh3-06')]),
  unit('core', 3, 'nt', [l('nt3-07'), l('nt3-08'), l('nt3-09'), l('nt3-10'), l('nt3-11')]),
  unit('core', 3, 'th', [
    l('th3-12'),
    l('th3-13'),
    l('th3-14'),
    l('th3-15'),
    l('th3-16'),
    l('th3-17'),
    l('th3-18'),
    l('th3-19'),
    l('th3-20'),
    l('th3-21'),
    l('th3-22'),
    l('th3-23'),
  ]),
  unit('core', 3, 'ea', [
    l('ea3-24'),
    l('ea3-25'),
    l('ea3-26'),
    l('ea3-27'),
    l('ea3-28'),
    l('ea3-29'),
    l('ea3-30'),
    l('ea3-31'),
    l('ea3-32'),
  ]),
  unit('core', 3, 'cr', [l('cr3-33'), l('cr3-34'), l('cr3-35'), l('cr3-36'), l('cr3-37')]),
  unit('core', 3, 'ls', [l('ls3-38'), l('ls3-39'), l('ls3-40')]),
  // L4 高级 · 35
  unit('core', 4, 'rh', [l('rh4-01'), l('rh4-02')]),
  unit('core', 4, 'nt', [l('nt4-03'), l('nt4-04')]),
  unit('core', 4, 'th', [
    l('th4-05'),
    l('th4-06'),
    l('th4-07'),
    l('th4-08'),
    l('th4-09'),
    l('th4-10'),
    l('th4-11'),
    l('th4-12'),
    l('th4-13'),
    l('th4-14'),
    l('th4-15'),
    l('th4-16'),
  ]),
  unit('core', 4, 'ea', [l('ea4-17'), l('ea4-18'), l('ea4-19'), l('ea4-20'), l('ea4-21'), l('ea4-22'), l('ea4-23')]),
  unit('core', 4, 'cr', [l('cr4-24'), l('cr4-25'), l('cr4-26'), l('cr4-27'), l('cr4-28'), l('cr4-29')]),
  unit('core', 4, 'ls', [l('ls4-30'), l('ls4-31'), l('ls4-32'), l('ls4-33'), l('ls4-34'), l('ls4-35')]),
  // L5 专业 · 30
  unit('core', 5, 'th', [
    l('th5-01'),
    l('th5-02'),
    l('th5-03'),
    l('th5-04'),
    l('th5-05'),
    l('th5-06'),
    l('th5-07'),
    l('th5-08'),
    l('th5-09'),
    l('th5-10'),
  ]),
  unit('core', 5, 'ea', [l('ea5-11'), l('ea5-12'), l('ea5-13'), l('ea5-14'), l('ea5-15')]),
  unit('core', 5, 'cr', [l('cr5-16'), l('cr5-17'), l('cr5-18'), l('cr5-19'), l('cr5-20'), l('cr5-21'), l('cr5-22')]),
  unit(
    'core',
    5,
    'pf',
    [l('pf5-23'), l('pf5-24'), l('pf5-25'), l('pf5-26'), l('pf5-27'), l('pf5-28'), l('pf5-29'), l('pf5-30')],
    '演奏、教学与研究',
  ),
];

const instrumentPublished = instrumentLessonOrder;

const instrumentUnits: Unit[] = instrumentLines.flatMap(line =>
  STAGES.map(stage => {
    const id = line.id as Exclude<LineId, 'core'>;
    const published = instrumentPublished[id][stage] ?? [];
    return {
      ...unit(id, stage, 'pf', published.map(l), `${line.name} ${stageLabel(stage)}`),
      extraPlanned: instrumentStageSize[stage] - published.length,
    };
  }),
);

export const units: Unit[] = [...coreUnits, ...instrumentUnits];

export function stageLabel(stage: Stage) {
  return `L${stage} ${stages[stage].name}`;
}
export const unitsOf = (line: LineId, stage: Stage) => units.filter(item => item.line === line && item.stage === stage);
export const publishedLessons = (line: LineId, stage: Stage) =>
  unitsOf(line, stage).flatMap(item => item.items.flatMap(entry => ('lesson' in entry ? [entry.lesson] : [])));
export function plannedSize(line: LineId, stage: Stage) {
  return unitsOf(line, stage).reduce((sum, item) => sum + item.items.length + (item.extraPlanned ?? 0), 0);
}
/** Where a lesson sits on the graded path, if it is part of it. */
export function lessonPlace(lessonId: string): { line: LineId; stage: Stage } | undefined {
  const found = units.find(item => item.items.some(entry => 'lesson' in entry && entry.lesson === lessonId));
  return found && { line: found.line, stage: found.stage };
}

export function reviewSchedule(progress: Progress) {
  return pendingReviews(progress.review).filter(({ id }) => {
    const place = lessonPlace(reviewLessonId(id));
    return place?.line === 'core' && place.stage <= 2;
  });
}

/** Which stages have a test. The questions live in curriculum-content.ts, loaded with the path page. */
export const stageTestIndex: { id: string; line: LineId; stage: Stage }[] = [
  { id: 'core-l0', line: 'core', stage: 0 },
  { id: 'core-l1', line: 'core', stage: 1 },
  { id: 'core-l2', line: 'core', stage: 2 },
  { id: 'core-l3', line: 'core', stage: 3 },
  { id: 'core-l4', line: 'core', stage: 4 },
];
export const testFor = (line: LineId, stage: Stage) =>
  stageTestIndex.find(test => test.line === line && test.stage === stage);

export type StageStatus = 'passed' | 'placed' | 'open' | 'locked';

export const corePortfolioPath = '/path/portfolio';
export const isPortfolioStage = (line: LineId, stage: Stage) => line === 'core' && stage === 5;

/** The main line uses tests or placement through L4, and course completion plus portfolio at L5.
 * Instrument stages count their performance check as the final lesson. */
export function stagePassed(progress: Progress, line: LineId, stage: Stage): boolean {
  if (isPortfolioStage(line, stage))
    return (
      stageUnlocked(progress, line, stage) &&
      publishedLessons(line, stage).every(id => progress.completed.includes(id)) &&
      portfolioItemIds.every(id => progress.portfolio.includes(id))
    );
  if (stage === 5 && !stageUnlocked(progress, line, stage)) return false;
  if (stage < 5 && progress.passedTests.includes(`${line}-l${stage}`)) return true;
  if (line === 'core') return (progress.placement?.stage ?? 0) > stage;
  const published = publishedLessons(line, stage);
  return published.length > 0 && published.every(id => progress.completed.includes(id));
}
export function stageStatus(progress: Progress, line: LineId, stage: Stage): StageStatus {
  if (
    line === 'core' &&
    stage < 5 &&
    !progress.passedTests.includes(`core-l${stage}`) &&
    (progress.placement?.stage ?? 0) > stage
  )
    return 'placed';
  if (stagePassed(progress, line, stage)) return 'passed';
  return stageUnlocked(progress, line, stage) ? 'open' : 'locked';
}
export function stageUnlocked(progress: Progress, line: LineId, stage: Stage): boolean {
  if (stage === 0) return true;
  const previous = (stage - 1) as Stage;
  if (line === 'core') return stagePassed(progress, 'core', previous);
  return stagePassed(progress, line, previous) && stagePassed(progress, 'core', previous);
}
/** Explains what is still needed to open a stage. */
export function unlockHint(line: LineId, stage: Stage) {
  if (stage === 0) return '';
  const previous = stageLabel((stage - 1) as Stage);
  if (line === 'core') return `通过 ${previous} 阶段测验或定级测验后解锁。`;
  return `学完${findLine(line)!.name} ${previous}，并通过主线 ${previous} 后解锁。`;
}

export type NextStep =
  | { kind: 'lesson'; line: LineId; stage: Stage; lesson: string }
  | { kind: 'test'; line: LineId; stage: Stage; test: string }
  | { kind: 'portfolio'; line: 'core'; stage: 5 }
  | { kind: 'waiting'; line: LineId; stage: Stage };

/** The next thing to do on a line: first unfinished lesson, then the stage assessment. */
export function nextStep(progress: Progress, line: LineId): NextStep | undefined {
  for (const stage of STAGES) {
    if (stagePassed(progress, line, stage)) continue;
    if (!stageUnlocked(progress, line, stage)) return undefined;
    const lesson = publishedLessons(line, stage).find(id => !progress.completed.includes(id) && findLesson(id));
    if (lesson) return { kind: 'lesson', line, stage, lesson };
    const test = testFor(line, stage);
    if (test) return { kind: 'test', line, stage, test: test.id };
    if (line === 'core' && stage === 5) return { kind: 'portfolio', line, stage };
    return { kind: 'waiting', line, stage };
  }
  return undefined;
}
export function stepPath(step: NextStep) {
  if (step.kind === 'lesson') return `/lesson/${step.lesson}`;
  if (step.kind === 'test') return `/path/test/${step.test}`;
  if (step.kind === 'portfolio') return corePortfolioPath;
  return `/path/${step.line}`;
}
