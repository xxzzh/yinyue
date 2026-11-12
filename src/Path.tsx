import { useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Flag,
  Lock,
  PenLine,
  RotateCcw,
  Route,
  Trophy,
} from 'lucide-react';
import { findLesson } from './course-index';
import { Dialog } from './Dialog';
import { useLearning, useStudyClock } from './learning';
import { passStageTest, recordPlacement } from './progress';
import { stableHash } from './catalog-quiz';
import { findStageTest, instrumentPlans, passMark, stageTests } from './curriculum-content';
import {
  findLine,
  lines,
  nextStep,
  plannedSize,
  publishedLessons,
  STAGES,
  stageLabel,
  stages,
  stageStatus,
  testFor,
  unitsOf,
  unlockHint,
} from './curriculum';
import type { LineId, Question, Stage, StageStatus, StageTest } from './curriculum';

type Go = (path: string) => void;

const statusText: Record<StageStatus, string> = {
  passed: '已通过',
  placed: '定级通过',
  open: '学习中',
  locked: '未解锁',
};

export function PathPage({ go, route }: { go: Go; route: string }) {
  const { progress, update } = useLearning();
  const [, , section, detail] = route.split('/');
  const test = section === 'test' ? findStageTest(detail ?? '') : undefined;
  const placement = section === 'placement';
  const line: LineId = test?.line ?? (placement ? 'core' : (findLine(section ?? '')?.id ?? 'core'));
  const info = findLine(line)!;
  const step = nextStep(progress, line);
  const fresh = !progress.placement && !progress.passedTests.length;
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">FROM FIRST NOTE TO MASTERY</span>
          <h1>从第一个音，走到属于你的音乐。</h1>
          <p>一条音乐素养主线，加上一件你选的乐器。学完一个阶段、通过阶段测验，再往上走。</p>
        </div>
      </div>
      {fresh && (
        <div className="gentle-tip path-placement-tip">
          <CircleHelp size={20} />
          <div>
            <strong>已经学过一些音乐？</strong>
            <p>做一次定级测验，答对就跳过已经会的阶段；完全零基础可以直接从 L0 开始。</p>
          </div>
          <button className="text-button" onClick={() => go('/path/placement')}>
            做定级测验
            <ArrowRight size={15} />
          </button>
        </div>
      )}
      <div className="filter-bar">
        <div className="filter-tabs" role="tablist" aria-label="学习线">
          {lines.map(item => (
            <button
              key={item.id}
              role="tab"
              aria-selected={item.id === line}
              className={item.id === line ? 'active' : ''}
              onClick={() => go(`/path/${item.id}`)}
            >
              {item.id === 'core' ? '主线 · 音乐素养' : item.name}
              {progress.instrument === item.id && <span className="line-mine">我的乐器</span>}
            </button>
          ))}
        </div>
      </div>
      <section className="line-header">
        <div>
          <span className="eyebrow">{info.english}</span>
          <h2>{info.name}</h2>
          <p>{info.description}</p>
        </div>
        {line !== 'core' &&
          (progress.instrument === line ? (
            <span className="pill">
              <Check size={13} />
              我的乐器
            </span>
          ) : (
            <button className="button outline small" onClick={() => update(state => ({ ...state, instrument: line }))}>
              设为我的乐器
            </button>
          ))}
      </section>
      <div className="stage-list">
        {STAGES.map(stage => (
          <StageCard key={`${line}-${stage}`} line={line} stage={stage} current={step?.stage === stage} go={go} />
        ))}
      </div>
      <div className="gentle-tip">
        <Route size={20} />
        <div>
          <strong>路线会一节一节补齐</strong>
          <p>
            灰色的课程还在编写中。路线决定推荐顺序和阶段解锁；“探索课程”和各乐器目录里的现有课程仍可随时浏览。
            网站能判定乐理与听辨题，判定不了音色、姿势和表现，演奏请配合录音回放和老师的反馈。
          </p>
        </div>
      </div>
      {test && <StageTestDialog key={test.id} test={test} go={go} />}
      {placement && <PlacementDialog go={go} />}
    </>
  );
}

function StageCard({ line, stage, current, go }: { line: LineId; stage: Stage; current: boolean; go: Go }) {
  const { progress } = useLearning();
  const info = stages[stage];
  const status = stageStatus(progress, line, stage);
  const published = publishedLessons(line, stage);
  const done = published.filter(id => progress.completed.includes(id)).length;
  const indexed = testFor(line, stage);
  const test = indexed && findStageTest(indexed.id);
  const plan = line === 'core' ? undefined : instrumentPlans[line][stage];
  let number = 0;
  return (
    <details className={`stage-card ${status}${current ? ' current' : ''}`} open={current}>
      <summary>
        <span className="stage-badge">L{stage}</span>
        <span className="stage-heading">
          <strong>
            {info.name} · {info.title}
          </strong>
          <small>{plan ? plan.technique : info.goal}</small>
        </span>
        <span className={`stage-status ${status}`}>
          {status === 'locked' ? <Lock size={11} /> : status === 'open' ? null : <Check size={11} />}
          {current && status === 'open' ? '当前阶段' : statusText[status]}
        </span>
        <ChevronRight className="stage-chevron" size={16} />
      </summary>
      <div className="stage-body">
        <div className="stage-meta">
          <span>
            已上线 {published.length} / 规划 {plannedSize(line, stage)} 节
          </span>
          <span>已完成 {done} 节</span>
          <span>参考水平：{info.level}</span>
          <span>建议：{info.duration}</span>
        </div>
        {status === 'locked' && (
          <p className="stage-lock">
            <Lock size={13} />
            {unlockHint(line, stage)}
          </p>
        )}
        {plan && plan.repertoire !== '—' && <p className="stage-repertoire">曲目方向：{plan.repertoire}</p>}
        {unitsOf(line, stage).map(unit => (
          <div className="stage-unit" key={unit.id}>
            {line === 'core' && <h3>{unit.title}</h3>}
            <div className="lesson-list stage-lessons">
              {unit.items.map(item => {
                number++;
                const label = String(number).padStart(2, '0');
                if ('plan' in item)
                  return (
                    <div className="planned-row" key={item.plan}>
                      <span className="lesson-number">{label}</span>
                      <span className="lesson-title">
                        <strong>{item.plan}</strong>
                      </span>
                      <span className="planned-tag">
                        <PenLine size={11} />
                        编写中
                      </span>
                    </div>
                  );
                const lesson = findLesson(item.lesson)!;
                const complete = progress.completed.includes(lesson.id);
                return (
                  <button key={lesson.id} disabled={status === 'locked'} onClick={() => go(`/lesson/${lesson.id}`)}>
                    <span className={`lesson-number ${complete ? 'complete' : ''}`}>
                      {complete ? <Check size={18} /> : label}
                    </span>
                    <span className="lesson-title">
                      <strong>{lesson.title}</strong>
                      <small>{lesson.intro}</small>
                    </span>
                    {status === 'locked' ? <Lock size={16} /> : <ChevronRight size={18} />}
                  </button>
                );
              })}
              {unit.extraPlanned ? (
                <div className="planned-row">
                  <span className="lesson-number">+</span>
                  <span className="lesson-title">
                    <strong>另有 {unit.extraPlanned} 节课程规划中</strong>
                  </span>
                  <span className="planned-tag">
                    <PenLine size={11} />
                    编写中
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {test ? (
          <div className="stage-test-row">
            <Flag size={18} />
            <span>
              <strong>{progress.passedTests.includes(test.id) ? '已通过阶段测验' : '阶段测验'}</strong>
              <small>
                共 {test.questions.length} 题，答对 {passMark(test)} 题通过。可以随时参加，通过后解锁下一阶段。
              </small>
            </span>
            <button
              className="button dark small"
              disabled={status === 'locked'}
              onClick={() => go(`/path/test/${test.id}`)}
            >
              {progress.passedTests.includes(test.id) ? '重新测验' : '开始测验'}
            </button>
          </div>
        ) : (
          <p className="stage-note">
            {line === 'core'
              ? '本阶段的课程和阶段测验会一起上线。'
              : '演奏关卡会随乐器课程上线；在那之前，学完本阶段已上线的课程即算通过。'}
          </p>
        )}
      </div>
    </details>
  );
}

/** Shows one question at a time with immediate feedback; option order changes on every attempt. */
function QuizRunner({
  questions,
  attempt,
  onDone,
}: {
  questions: Question[];
  attempt: number;
  onDone: (wrong: Question[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [wrong, setWrong] = useState<Question[]>([]);
  const question = questions[index];
  const order = question.options
    .map((_, i) => i)
    .sort((a, b) => stableHash(`${attempt}:${question.id}:${a}`) - stableHash(`${attempt}:${question.id}:${b}`));
  const answered = chosen !== null;
  const correct = chosen === question.answer;
  function choose(option: number) {
    if (answered) return;
    setChosen(option);
    if (option !== question.answer) setWrong(list => [...list, question]);
  }
  function next() {
    if (index === questions.length - 1) {
      onDone(wrong);
      return;
    }
    setIndex(index + 1);
    setChosen(null);
  }
  return (
    <div className="quiz-runner">
      <div className="quiz-progress" aria-hidden="true">
        <span style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>
      <span className="eyebrow">
        第 {index + 1} / {questions.length} 题
      </span>
      <h3>{question.prompt}</h3>
      <div className="quiz-options">
        {order.map((option, i) => (
          <button
            key={option}
            className={
              answered && option === question.answer ? 'correct' : answered && option === chosen ? 'incorrect' : ''
            }
            disabled={answered}
            onClick={() => choose(option)}
          >
            <span>{String.fromCharCode(65 + i)}</span>
            {question.options[option]}
            {answered && option === question.answer && <Check size={16} />}
          </button>
        ))}
      </div>
      {answered && (
        <div className={`quiz-feedback ${correct ? 'success' : 'retry'}`} role="status">
          <strong>{correct ? '答对了！' : '这题答错了，看看为什么：'}</strong>
          <p>{question.explanation}</p>
        </div>
      )}
      <div className="quiz-runner-actions">
        <button className="button primary" disabled={!answered} onClick={next}>
          {index === questions.length - 1 ? '查看结果' : '下一题'}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function WrongList({ wrong }: { wrong: Question[] }) {
  if (!wrong.length) return null;
  return (
    <div className="quiz-review">
      <h3>需要再看看的题</h3>
      {wrong.map(item => (
        <div key={item.id}>
          <strong>{item.prompt}</strong>
          <p>
            正确答案：{item.options[item.answer]}。{item.explanation}
          </p>
        </div>
      ))}
    </div>
  );
}

function StageTestDialog({ test, go }: { test: StageTest; go: Go }) {
  const { progress, update } = useLearning();
  const [attempt, setAttempt] = useState(0);
  const [wrong, setWrong] = useState<Question[] | null>(null);
  const back = () => go(`/path/${test.line}`);
  const status = stageStatus(progress, test.line, test.stage);
  useStudyClock(status !== 'locked' && wrong === null);
  const score = wrong ? test.questions.length - wrong.length : 0;
  const passed = wrong !== null && score >= passMark(test);
  const following = (test.stage + 1) as Stage;
  return (
    <Dialog title={test.title} onClose={back} className="quiz-dialog">
      <span className="eyebrow">STAGE CHECK</span>
      <h2>{test.title}</h2>
      {status === 'locked' ? (
        <>
          <p className="muted">这个阶段还没有解锁。{unlockHint(test.line, test.stage)}</p>
          <button className="button primary" onClick={back}>
            返回学习路线
          </button>
        </>
      ) : wrong === null ? (
        <>
          <p className="muted">
            共 {test.questions.length} 题，答对 {passMark(test)} 题通过。每题答完会立即看到解析。
          </p>
          <QuizRunner
            key={attempt}
            questions={test.questions}
            attempt={attempt}
            onDone={list => {
              setWrong(list);
              if (test.questions.length - list.length >= passMark(test)) update(state => passStageTest(state, test.id));
            }}
          />
        </>
      ) : (
        <div className="quiz-result">
          <div className={`quiz-score ${passed ? 'pass' : 'retry'}`}>
            {passed ? <Trophy size={26} /> : <RotateCcw size={26} />}
            <strong>
              {score} / {test.questions.length}
            </strong>
            <span>
              {passed ? `通过！${stageLabel(test.stage)} 已完成` : `还差 ${passMark(test) - score} 题，复习后再试`}
            </span>
          </div>
          <WrongList wrong={wrong} />
          <div className="quiz-runner-actions">
            <button
              className="text-button"
              onClick={() => {
                setWrong(null);
                setAttempt(value => value + 1);
              }}
            >
              <RotateCcw size={14} />
              再测一次
            </button>
            <button
              className="button primary"
              onClick={passed && following <= 5 ? () => go(`/path/${test.line}`) : back}
            >
              {passed && following <= 5 ? `去 ${stageLabel(following)}` : '返回学习路线'}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

const placementTests = stageTests.filter(test => test.line === 'core').sort((a, b) => a.stage - b.stage);

function PlacementDialog({ go }: { go: Go }) {
  const { update } = useLearning();
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<{ placed: number; wrong: Question[] } | null>(null);
  useStudyClock(started && result === null);
  const back = () => go('/path/core');
  const test = placementTests[round];
  function finishRound(wrong: Question[]) {
    const passed = test.questions.length - wrong.length >= passMark(test);
    if (passed && round < placementTests.length - 1) {
      setRound(round + 1);
      return;
    }
    const placed = passed ? round + 1 : round;
    setResult({ placed, wrong });
    update(state => recordPlacement(state, Math.max(placed, state.placement?.stage ?? 0)));
  }
  return (
    <Dialog title="定级测验" onClose={back} className="quiz-dialog">
      <span className="eyebrow">PLACEMENT</span>
      <h2>定级测验</h2>
      {!started ? (
        <>
          <p className="muted">
            从 L0 开始出题，每个阶段答对 80% 才进入下一阶段的题目；某一阶段没通过就停在那里。目前最高可定级到 L
            {placementTests.length}，更高阶段的定级题会随课程上线补充。
          </p>
          <p className="muted">定级只跳过已经会的阶段，不会把课程标记为“已学完”。可以随时重新定级。</p>
          <button className="button primary" onClick={() => setStarted(true)}>
            开始定级
            <ArrowRight size={16} />
          </button>
        </>
      ) : result === null ? (
        <>
          <p className="muted">
            正在测：{stageLabel(test.stage)}（{round + 1} / {placementTests.length} 组）
          </p>
          <QuizRunner key={test.id} questions={test.questions} attempt={0} onDone={finishRound} />
        </>
      ) : (
        <div className="quiz-result">
          <div className="quiz-score pass">
            <Flag size={26} />
            <strong>从 {stageLabel(Math.min(result.placed, 5) as Stage)} 开始</strong>
            <span>
              {result.placed === 0
                ? '建议从启蒙阶段学起，基础打牢后会走得更快。'
                : `已跳过 L0${result.placed > 1 ? `–L${result.placed - 1}` : ''}。之前的定级结果如果更高，会保留较高的那个。`}
            </span>
          </div>
          <WrongList wrong={result.wrong} />
          <div className="quiz-runner-actions">
            <span />
            <button className="button primary" onClick={back}>
              去学习路线
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
