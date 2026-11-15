import { use, useEffect, useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { stableHash } from './catalog-quiz';
import { findLesson, loadLesson } from './course-index';
import { reviewSchedule } from './curriculum';
import { placeAnswer } from './lesson-kit';
import { useLearning, useStudyClock } from './learning';
import { QuestionSound } from './LessonWidgets';
import { addActivity, localDate } from './progress';
import { answerReview, reviewLessonId, reviewQuestionId } from './review';

export function ReviewPage({ go }: { go: (path: string) => void }) {
  const { progress, update } = useLearning();
  const today = localDate();
  const schedule = reviewSchedule(progress);
  const due = schedule.filter(entry => entry.due <= today);
  const [answered, setAnswered] = useState<{ id: string; choice: number }>();
  const currentId = answered?.id ?? due[0]?.id;
  useStudyClock(Boolean(currentId));

  function submit(id: string, result: 'correct' | 'incorrect' | 'unavailable', choice?: number) {
    const now = new Date();
    const date = localDate(now);
    if (choice !== undefined) setAnswered({ id, choice });
    update(current => {
      const review = answerReview(current.review, id, result, date, now.toISOString());
      if (review === current.review) return current;
      const next = { ...current, review };
      return result === 'unavailable' ? next : addActivity(next, { exercises: 1 }, date);
    });
  }

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>错题复习</h1>
          <p>主线 L0–L2 的课内错题会在第二天进入复习，答对后逐步拉长间隔。</p>
        </div>
      </div>
      <section className="section-block review-session">
        {currentId ? (
          <ReviewQuestion
            key={currentId}
            id={currentId}
            date={today}
            choice={answered?.choice}
            remaining={due.length}
            nextDate={progress.review[currentId]?.due}
            onAnswer={(choice, correct) => submit(currentId, correct ? 'correct' : 'incorrect', choice)}
            onNext={() => setAnswered(undefined)}
            onDiscard={() => submit(currentId, 'unavailable')}
            go={go}
          />
        ) : (
          <>
            <h2>今天没有到期错题</h2>
            <p className="muted">
              {schedule[0] ? `下次复习日期为 ${schedule[0].due}。` : '做主线 L0–L2 的课内题时，答错的题会自动加入。'}
            </p>
            <button className="button outline" onClick={() => go('/overview')}>
              返回学习概览
            </button>
          </>
        )}
      </section>
    </>
  );
}

function ReviewQuestion({
  id,
  date,
  choice,
  remaining,
  nextDate,
  onAnswer,
  onNext,
  onDiscard,
  go,
}: {
  id: string;
  date: string;
  choice: number | undefined;
  remaining: number;
  nextDate: string | null | undefined;
  onAnswer: (choice: number, correct: boolean) => void;
  onNext: () => void;
  onDiscard: () => void;
  go: (path: string) => void;
}) {
  const lessonId = reviewLessonId(id);
  const lesson = findLesson(lessonId) ? use(loadLesson(lessonId)) : undefined;
  const item =
    lesson && [lesson.quiz, ...(lesson.more ?? [])].find(question => reviewQuestionId(lessonId, question) === id);
  const heading = useRef<HTMLHeadingElement>(null);
  const [orderSeed] = useState(() => stableHash(`${id}:${date}`));
  useEffect(() => heading.current?.focus(), []);

  if (!lesson || !item)
    return (
      <>
        <h2 ref={heading} tabIndex={-1}>
          这道题已更新
        </h2>
        <p className="muted">旧题与当前课程内容无法对应，可以将它从复习队列中移除。</p>
        <button className="button outline" onClick={onDiscard}>
          移除并继续
        </button>
      </>
    );

  const question = placeAnswer(item, orderSeed % item.options.length);
  const correct = choice === question.answer;
  return (
    <>
      <div className="section-title">
        <div>
          <button className="text-button" onClick={() => go(`/lesson/${lessonId}`)}>
            原课 · {lesson.title}
          </button>
          <h2 ref={heading} tabIndex={-1}>
            {question.question}
          </h2>
        </div>
        <span className="pill">待复习 {remaining} 题</span>
      </div>
      {question.listen && <QuestionSound seq={question.listen} />}
      <div className="quiz-options">
        {question.options.map((option, index) => (
          <button
            key={option}
            type="button"
            disabled={choice !== undefined}
            className={
              choice === undefined ? '' : index === question.answer ? 'correct' : choice === index ? 'incorrect' : ''
            }
            onClick={() => onAnswer(index, index === question.answer)}
          >
            <span>{String.fromCharCode(65 + index)}</span>
            {option}
            {choice !== undefined && index === question.answer && <Check size={16} />}
          </button>
        ))}
      </div>
      {choice !== undefined && (
        <>
          <div className={`quiz-feedback ${correct ? 'success' : 'retry'}`} role="status">
            <strong>{correct ? '答对了' : '这次答错了'}</strong>
            <p>{question.explanation}</p>
            <p>{nextDate ? `下次复习日期为 ${nextDate}。` : '这道题已完成全部复习。'}</p>
          </div>
          <button className="button primary" onClick={onNext}>
            {remaining > 0 ? '下一题' : '查看复习安排'}
            <ArrowRight size={16} />
          </button>
        </>
      )}
    </>
  );
}
