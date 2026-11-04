import { Component, lazy, Suspense, useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpFromLine,
  AudioLines,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flame,
  Globe2,
  Compass,
  Guitar,
  Headphones,
  LayoutDashboard,
  Menu,
  Music2,
  Piano,
  Play,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Volume2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { allLessons, courseFamilies, courses, filterCourses, findCourse, findLesson, lessonCourse } from './data';
import type { Course, Lesson, Track } from './data';
import { localDate, streak, validateProgress } from './progress';
import type { Progress } from './progress';
import { BrandMark, CourseArt } from './Art';
import { LearningProvider } from './state';
import { CatalogPager } from './CatalogPager';
import { useCatalogPage } from './useCatalogPage';
import { traditionalCatalog } from './traditional-catalog';
import { InstrumentFigure } from './InstrumentImage';
import { instrumentImages } from './instrument-images';
import { useLearning, useStudyClock } from './learning';

// Pages and interactive tools load on demand so the first screen only ships the shell and course data.
const PianoTool = lazy(() => import('./Tools').then(m => ({ default: m.PianoTool })));
const GuitarTool = lazy(() => import('./Tools').then(m => ({ default: m.GuitarTool })));
const EarTool = lazy(() => import('./Tools').then(m => ({ default: m.EarTool })));
const RhythmTool = lazy(() => import('./Tools').then(m => ({ default: m.RhythmTool })));
const TheoryPlayer = lazy(() => import('./Tools').then(m => ({ default: m.TheoryPlayer })));
const DrumTool = lazy(() => import('./InstrumentTools').then(m => ({ default: m.DrumTool })));
const InstrumentPractice = lazy(() => import('./InstrumentTools').then(m => ({ default: m.InstrumentPractice })));
const InstrumentTool = lazy(() => import('./InstrumentTools').then(m => ({ default: m.InstrumentTool })));
const DiscoveryActivity = lazy(() => import('./Traditional').then(m => ({ default: m.DiscoveryActivity })));
const TraditionalPage = lazy(() => import('./Traditional').then(m => ({ default: m.TraditionalPage })));
const WorldPage = lazy(() => import('./World').then(m => ({ default: m.WorldPage })));
const InstrumentChooser = lazy(() => import('./InstrumentChooser').then(m => ({ default: m.InstrumentChooser })));
const InstrumentCharacter = lazy(() => import('./InstrumentChooser').then(m => ({ default: m.InstrumentCharacter })));
const loading = (
  <div className="lazy-loading" role="status">
    正在加载…
  </div>
);

// Shows a retry message instead of a blank app when an on-demand page file cannot be loaded
// (offline, or a file removed by a newer deploy that the one-time reload in main.tsx could not fix).
class LoadBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(previous: { resetKey: string }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    if (!this.state.failed) return <Suspense fallback={loading}>{this.props.children}</Suspense>;
    return (
      <div className="lazy-loading" role="alert">
        <p>这部分内容没有加载成功，可能是网络中断或网站刚更新。</p>
        <button className="button outline small" onClick={() => window.location.reload()}>
          刷新页面
        </button>
      </div>
    );
  }
}

const trackIcons: Partial<Record<Track, LucideIcon>> = {
  theory: BookOpen,
  ear: Headphones,
  piano: Piano,
  guitar: Guitar,
  ukulele: Guitar,
  bass: Guitar,
  violin: Music2,
  drums: AudioLines,
  flute: Music2,
  saxophone: Music2,
  guzheng: AudioLines,
  erhu: Music2,
};
const navItems = [
  { id: 'overview', title: '学习概览', icon: LayoutDashboard },
  { id: 'courses', title: '探索课程', icon: BookOpen },
  { id: 'traditional', title: '中国传统乐器', icon: Music2 },
  { id: 'world', title: '世界乐器', icon: Globe2 },
  { id: 'choose', title: '选适合的乐器', icon: Compass },
  { id: 'practice', title: '我的练习室', icon: Piano },
  { id: 'progress', title: '学习记录', icon: TrendingUp },
];
function useRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/overview');
  useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash.slice(1) || '/overview');
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  function go(path: string) {
    window.location.hash = path;
  }
  return { route, go };
}
type Go = (path: string) => void;

function Dialog({
  children,
  title,
  onClose,
  className = '',
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = ref.current;
    const focused = document.activeElement as HTMLElement | null;
    element?.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = oldOverflow;
      focused?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-labelledby={titleId}
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
      onClick={event => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <h2 id={titleId} className="sr-only">
        {title}
      </h2>
      <button className="dialog-close icon-button" aria-label="关闭窗口" onClick={onClose}>
        <X size={20} />
      </button>
      {children}
    </dialog>
  );
}

function GoalRing({ percent, small = false }: { percent: number; small?: boolean }) {
  const value = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={`goal-ring ${small ? 'small-ring' : ''}`}
      style={{ background: `conic-gradient(#54745e ${value * 3.6}deg, #e9ede5 0deg)` }}
    >
      <div>
        {small ? (
          <Target size={20} />
        ) : (
          <>
            <span>
              {Math.round(value)}
              <small>%</small>
            </span>
            <em>今日目标</em>
          </>
        )}
      </div>
    </div>
  );
}
function CourseCard({ course, onOpen }: { course: Course; onOpen: () => void }) {
  const { progress } = useLearning();
  const count = course.lessons.filter(lesson => progress.completed.includes(lesson.id)).length;
  const Icon = trackIcons[course.id] ?? Music2;
  return (
    <button className={`course-card ${course.color}`} onClick={onOpen}>
      <div className="course-cover">
        <span className="cover-label">{course.english}</span>
        <CourseArt track={course.id} />
        <span className="cover-corner">{String(courses.indexOf(course) + 1).padStart(2, '0')}</span>
      </div>
      <div className="course-info">
        <span className={`course-category ${course.color}`}>
          <Icon size={13} />
          {course.tag}
        </span>
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <div className="course-meta">
          <span>
            {course.lessons.length} 节课<span className="dot-separator">·</span>
            {course.level ? '认识与启蒙' : '零基础友好'}
          </span>
          <span className="card-arrow">
            <ArrowRight size={16} />
          </span>
        </div>
        <div className="course-progress">
          <span style={{ width: `${Math.round((count / course.lessons.length) * 100)}%` }} />
        </div>
        <div className="course-progress-caption">
          <span>{count ? `已完成 ${count} 节` : '从这里开始'}</span>
          <span>{Math.round((count / course.lessons.length) * 100)}%</span>
        </div>
      </div>
    </button>
  );
}

function Overview({ go, onSettings }: { go: Go; onSettings: () => void }) {
  const { progress } = useLearning();
  const today = progress.days[localDate()] ?? { seconds: 0, lessons: 0, exercises: 0 };
  const next = allLessons.find(lesson => !progress.completed.includes(lesson.id)) ?? allLessons[0];
  const nextCourse = lessonCourse(next.id)!;
  const totalSeconds = Object.values(progress.days).reduce((sum, day) => sum + day.seconds, 0);
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
  const tasks = [
    {
      title: progress.completed.includes('theory-1') ? '继续探索乐理基础' : '认识你的第一组音符',
      detail: '乐理基础 · 从 C D E 开始',
      done: progress.completed.includes('theory-1'),
      path: '/lesson/theory-1',
    },
    { title: '听一听，两个音有多远', detail: '听觉训练 · 音程听辨', done: today.exercises > 0, path: '/practice/ear' },
    {
      title: '在键盘上弹出一点快乐',
      detail: '钢琴练习 · 自由探索',
      done: progress.completed.includes('piano-1'),
      path: '/practice/piano',
    },
  ];
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="greeting">
            <span className="sun-mark">✳</span>
            {greeting}，爱音乐的你
          </div>
          <h1>
            让音乐，成为日常<span className="heading-dot">。</span>
          </h1>
          <p>不必急于抵达，每一个小小的练习，都在让你更靠近音乐。</p>
        </div>
        <span className="intro-note">
          <Music2 size={16} />
          今天也为自己留一点音乐时间
        </span>
      </div>
      <div className="hero-grid">
        <section className="hero-card">
          <div className="hero-copy">
            <span className="hero-kicker">
              <span />
              YOUR MUSICAL JOURNEY
            </span>
            <h2>
              从第一颗音符，
              <br />
              听见更多可能。
            </h2>
            <p>
              把好奇交给耳朵，把旋律交给指尖。
              <br />
              你的音乐旅程，就从这一刻开始。
            </p>
            <button className="button dark" onClick={() => go(`/lesson/${next.id}`)}>
              <Play size={14} fill="currentColor" />
              {progress.completed.length ? '继续我的学习' : '开始第一节课'}
              <ArrowRight size={16} />
            </button>
            <div className="hero-caption">
              <span className="tiny-badge">
                <Music2 size={10} />
              </span>
              {nextCourse.tag} · {next.title}
            </div>
          </div>
          <div className="hero-visual">
            <span className="hero-orbit orbit-one" />
            <span className="hero-orbit orbit-two" />
            <CourseArt track="piano" hero />
            <span className="floating-note note-one">♪</span>
            <span className="floating-note note-two">♫</span>
            <span className="hero-visual-label">ONE NOTE AT A TIME</span>
          </div>
        </section>
        <section className="daily-card">
          <div className="section-top">
            <h3>今天的小目标</h3>
            <button className="icon-button" aria-label="调整每日学习目标" onClick={onSettings}>
              <Settings2 size={16} />
            </button>
          </div>
          <div className="daily-ring-row">
            <GoalRing percent={(today.seconds / (progress.dailyGoal * 60)) * 100} />
            <div>
              <strong>
                {Math.floor(today.seconds / 60)}
                <span> / {progress.dailyGoal} 分钟</span>
              </strong>
              <p>{today.seconds ? '一点一滴，都会被记住。' : '给音乐一点时间。'}</p>
            </div>
          </div>
          <div className="daily-tasks">
            {tasks.map(task => (
              <button key={task.path} onClick={() => go(task.path)}>
                <span className={`task-check ${task.done ? 'checked' : ''}`}>{task.done && <Check size={11} />}</span>
                <span>
                  <strong>{task.title}</strong>
                  <small>{task.detail}</small>
                </span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </section>
      </div>
      <section className="heritage-invitation">
        <div>
          <span className="eyebrow">THE SOUNDS OF CHINA</span>
          <h2>你感兴趣的国乐，在这里。</h2>
          <p>{traditionalCatalog.length} 种代表乐器，从古琴、琵琶到各地民族乐器，慢慢听，慢慢认识。</p>
        </div>
        <button className="button dark" onClick={() => go('/traditional')}>
          走进中国传统乐器
          <ArrowRight size={16} />
        </button>
      </section>
      <section className="world-invitation">
        <Globe2 size={28} strokeWidth={1.2} />
        <div>
          <h2>先找到喜欢的声音，再选一件适合的乐器。</h2>
          <p>比较音色、发声原因、练习条件与入门方式。</p>
        </div>
        <button className="text-button" onClick={() => go('/choose')}>
          选适合的乐器
          <ArrowRight size={16} />
        </button>
      </section>
      <section className="section-block">
        <div className="section-title">
          <div>
            <h2>探索你的音乐世界</h2>
            <p>从感兴趣的地方开始，找到适合自己的学习节奏。</p>
          </div>
          <button className="text-button" onClick={() => go('/courses')}>
            全部课程
            <ArrowRight size={15} />
          </button>
        </div>
        <div className="course-grid">
          {courses.slice(0, 4).map(course => (
            <CourseCard key={course.id} course={course} onOpen={() => go(`/courses/${course.id}`)} />
          ))}
        </div>
      </section>
      <section className="section-block">
        <div className="section-title">
          <div>
            <h2>让练习，轻一点</h2>
            <p>不用准备好一切，打开就能练。</p>
          </div>
          <button className="text-button" onClick={() => go('/practice')}>
            进入练习室
            <ArrowRight size={15} />
          </button>
        </div>
        <div className="quick-tools">
          {[
            {
              id: 'ear',
              title: '听音小练习',
              desc: '用耳朵，发现音符之间的关系',
              icon: Headphones,
              color: 'peach',
              tag: '专注听一听',
            },
            {
              id: 'piano',
              title: '指尖上的钢琴',
              desc: '随时弹奏，让灵感有声音',
              icon: Piano,
              color: 'lavender',
              tag: '随心弹一弹',
            },
            {
              id: 'rhythm',
              title: '找到你的节拍',
              desc: '慢慢来，让每一拍都稳稳落下',
              icon: AudioLines,
              color: 'sage',
              tag: '跟着拍一拍',
            },
          ].map(tool => (
            <button key={tool.id} className="quick-tool" onClick={() => go(`/practice/${tool.id}`)}>
              <span className={`tool-icon ${tool.color}`}>
                <tool.icon size={24} strokeWidth={1.5} />
              </span>
              <span className="quick-tool-copy">
                <strong>{tool.title}</strong>
                <small>{tool.desc}</small>
                <em>
                  {tool.tag}
                  <ArrowRight size={12} />
                </em>
              </span>
            </button>
          ))}
        </div>
      </section>
      <div className="bottom-grid">
        <section className="daily-note">
          <div className="note-heading">
            <Sparkles size={16} />
            <span>每天懂一点音乐</span>
          </div>
          <h3>为什么 E 和 F 之间没有黑键？</h3>
          <p>因为它们已经相隔一个半音——键盘上最小的相邻距离。B 和 C 也是如此。</p>
          <button className="text-button" onClick={() => go('/lesson/theory-3')}>
            听听看，理解音阶的秘密
            <ArrowRight size={14} />
          </button>
          <span className="note-decoration">♮</span>
        </section>
        <section className="journey-note">
          <div className="note-heading">
            <TrendingUp size={16} />
            <span>每一步，都算数</span>
          </div>
          <div className="mini-stats">
            <div>
              <strong>
                {progress.completed.length}
                <small>节</small>
              </strong>
              <span>已完成课程</span>
            </div>
            <div>
              <strong>
                {Math.floor(totalSeconds / 60)}
                <small>分钟</small>
              </strong>
              <span>累计练习</span>
            </div>
            <div>
              <strong>
                {streak(progress)}
                <small>天</small>
              </strong>
              <span>连续学习</span>
            </div>
          </div>
          <button className="text-button" onClick={() => go('/progress')}>
            看看我的音乐足迹
            <ArrowRight size={14} />
          </button>
        </section>
      </div>
      <footer className="page-footer">
        <span>音序 YINXU</span>
        <span>每一段旋律，都值得一个开始。</span>
        <span>MADE FOR YOUR MUSICAL EVERYDAY</span>
      </footer>
    </>
  );
}

function CoursesPage({
  go,
  query,
  setQuery,
  course,
}: {
  go: Go;
  query: string;
  setQuery: (value: string) => void;
  course?: Course;
}) {
  const { progress } = useLearning();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useCatalogPage([query, filter]);
  if (course) {
    const completed = course.lessons.filter(lesson => progress.completed.includes(lesson.id)).length;
    const next = course.lessons.find(lesson => !progress.completed.includes(lesson.id)) ?? course.lessons[0];
    return (
      <>
        <button
          className="text-button back-button"
          onClick={() =>
            go(course.traditional ? '/traditional' : course.family !== 'foundation' ? '/world' : '/courses')
          }
        >
          <ArrowLeft size={15} />
          {course.traditional ? '返回中国传统乐器' : course.family !== 'foundation' ? '返回世界乐器' : '返回全部课程'}
        </button>
        <div className={`course-banner ${course.color}`}>
          <div>
            <span className="eyebrow">{course.english}</span>
            <h1>{course.title}</h1>
            <p>{course.description}</p>
            <div className="banner-meta">
              <span>
                <BookOpen size={15} />
                {course.lessons.length} 节{course.level ? '认识与启蒙课' : '入门课'}
              </span>
              <span>
                <Clock3 size={15} />约 {course.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)} 分钟
              </span>
              <span>
                <Check size={15} />
                已完成 {completed} 节
              </span>
            </div>
            <button className="button dark" onClick={() => go(`/lesson/${next.id}`)}>
              <Play size={15} />
              {completed ? '继续学习' : '开始这条路线'}
            </button>
          </div>
          {instrumentImages[course.id] ? <InstrumentFigure track={course.id} /> : <CourseArt track={course.id} />}
        </div>
        <InstrumentCharacter course={course} />
        {course.level && (
          <div className="gentle-tip">
            <BookOpen size={20} />
            <div>
              <strong>{course.level}</strong>
              <p>先学结构与发声，再做观察、慢练和听赏任务。实物指法、定弦与高级技法需结合具体形制继续学习。</p>
            </div>
          </div>
        )}
        <section className="section-block">
          <div className="section-title">
            <div>
              <h2>一步一步，慢慢来</h2>
              <p>建议按顺序学习，也可以选择你感兴趣的一课。</p>
            </div>
            <span className="pill">
              {completed} / {course.lessons.length} 已完成
            </span>
          </div>
          <div className="lesson-list">
            {course.lessons.map((lesson, index) => (
              <button key={lesson.id} onClick={() => go(`/lesson/${lesson.id}`)}>
                <span className={`lesson-number ${progress.completed.includes(lesson.id) ? 'complete' : ''}`}>
                  {progress.completed.includes(lesson.id) ? <Check size={18} /> : String(index + 1).padStart(2, '0')}
                </span>
                <span className="lesson-title">
                  <strong>{lesson.title}</strong>
                  <small>{lesson.intro}</small>
                </span>
                <span className="lesson-duration">
                  <Clock3 size={13} />
                  {lesson.minutes} 分钟
                </span>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        </section>
      </>
    );
  }
  const matches = filterCourses(query, filter);
  const pages = Math.max(1, Math.ceil(matches.length / 12));
  const current = Math.min(page, pages);
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">A WORLD WAITING TO BE HEARD</span>
          <h1>从好奇，走向热爱。</h1>
          <p>
            {courses.length} 条学习路线 · {allLessons.length} 节基础与启蒙课，选一种你想靠近的声音。
          </p>
        </div>
      </div>
      <div className="filter-bar">
        <div className="filter-tabs">
          {courseFamilies.map(item => (
            <button key={item.id} className={filter === item.id ? 'active' : ''} onClick={() => setFilter(item.id)}>
              {item.tag}
            </button>
          ))}
        </div>
        {query && (
          <button className="text-button" onClick={() => setQuery('')}>
            清除搜索
            <X size={13} />
          </button>
        )}
      </div>
      {query && (
        <p className="muted search-summary">
          “{query}” 的搜索结果 · {matches.length} 条学习路线
        </p>
      )}
      <div className="course-grid course-page-grid">
        {matches.slice((current - 1) * 12, current * 12).map(item => (
          <CourseCard key={item.id} course={item} onOpen={() => go(`/courses/${item.id}`)} />
        ))}
      </div>
      <CatalogPager
        page={current}
        pages={pages}
        onChange={value => {
          setPage(value);
          window.scrollTo({ top: 0, behavior: 'instant' });
        }}
      />
      {!matches.length && (
        <div className="empty-state">
          <Search size={32} />
          <h3>还没有找到相关课程</h3>
          <p>试试“钢琴”“节奏”“和弦”或清除搜索。</p>
          <button
            className="button outline"
            onClick={() => {
              setQuery('');
              setFilter('all');
            }}
          >
            查看全部课程
          </button>
        </div>
      )}
      <div className="gentle-tip">
        <CircleHelp size={20} />
        <div>
          <strong>不知道从哪里开始？</strong>
          <p>先从“读懂音乐的语言”开始，再搭配一门你喜欢的乐器。每次学一点，再亲手试一试。</p>
        </div>
        <button className="text-button" onClick={() => go('/lesson/theory-1')}>
          开始乐理基础
          <ArrowRight size={15} />
        </button>
      </div>
    </>
  );
}

const practiceTabs = [
  { id: 'piano', title: '虚拟钢琴', icon: Piano },
  { id: 'guitar', title: '吉他指板', icon: Guitar },
  { id: 'ear', title: '音程听辨', icon: Headphones },
  { id: 'rhythm', title: '节拍器', icon: AudioLines },
  { id: 'sing', title: '跟唱音阶', icon: Music2 },
  { id: 'instruments', title: '乐器参考音', icon: Music2 },
  { id: 'drums', title: '八步鼓机', icon: AudioLines },
];
function PracticePage({ go, tool }: { go: Go; tool: string }) {
  const selected = practiceTabs.some(tab => tab.id === tool) ? tool : 'piano';
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">A LITTLE PRACTICE, EVERY DAY</span>
          <h1>这里，只有你和音乐。</h1>
          <p>不赶进度，不怕出错。在声音里，找到自己的节奏。</p>
        </div>
        <span className="pill">
          <span className="status-dot" />
          随时开始
        </span>
      </div>
      <div className="practice-tabs">
        {practiceTabs.map(tab => (
          <button
            key={tab.id}
            className={tab.id === selected ? 'active' : ''}
            onClick={() => go(`/practice/${tab.id}`)}
          >
            <tab.icon size={18} />
            {tab.title}
          </button>
        ))}
      </div>
      <section className="practice-panel" key={selected}>
        {selected === 'piano' ? (
          <PianoTool />
        ) : selected === 'guitar' ? (
          <GuitarTool />
        ) : selected === 'ear' ? (
          <EarTool />
        ) : selected === 'rhythm' ? (
          <RhythmTool />
        ) : selected === 'instruments' ? (
          <InstrumentPractice />
        ) : selected === 'drums' ? (
          <DrumTool />
        ) : (
          <>
            <div className="tool-heading">
              <div>
                <span className="eyebrow">LET YOUR VOICE FIND THE NOTES</span>
                <h2>先听一个音，再轻轻唱出来</h2>
              </div>
            </div>
            <TheoryPlayer type="sing" />
          </>
        )}
      </section>
      <div className="practice-bottom">
        <Volume2 size={18} />
        <p>声音只会在你点击后播放。建议从较小音量开始，用舒服的节奏练习。</p>
      </div>
    </>
  );
}

function ProgressPage({ go }: { go: Go }) {
  const { progress, update, notify } = useLearning();
  const fileInput = useRef<HTMLInputElement>(null);
  const total = Object.values(progress.days).reduce(
    (sum, day) => ({ seconds: sum.seconds + day.seconds, exercises: sum.exercises + day.exercises }),
    { seconds: 0, exercises: 0 },
  );
  const dates = Array.from({ length: 35 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - 34 + index);
    return localDate(date);
  });
  const active = dates.filter(date => {
    const day = progress.days[date];
    return day && (day.seconds > 0 || day.lessons > 0 || day.exercises > 0);
  }).length;
  function exportProgress() {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `音序学习记录-${localDate()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('学习记录已导出。换设备时可以在这里导入。');
  }
  async function importProgress(file?: File) {
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('请选择小于 1 MB 的学习记录文件。');
      const imported = validateProgress(JSON.parse(await file.text()));
      update(current => {
        const merged: Progress = {
          ...current,
          completed: [...new Set([...current.completed, ...imported.completed])].filter(id => !!findLesson(id)),
          days: { ...current.days },
        };
        for (const [date, day] of Object.entries(imported.days)) {
          const old = current.days[date] ?? { seconds: 0, lessons: 0, exercises: 0 };
          merged.days[date] = {
            seconds: Math.max(day.seconds, old.seconds),
            lessons: Math.max(day.lessons, old.lessons),
            exercises: Math.max(day.exercises, old.exercises),
          };
        }
        return merged;
      });
      notify('备份已合并，现有记录已保留。');
    } catch (error) {
      notify(error instanceof Error ? error.message : '无法读取这份记录，请选择音序导出的 JSON 文件。');
    }
    if (fileInput.current) fileInput.current.value = '';
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">EVERY LITTLE STEP COUNTS</span>
          <h1>音乐，记得你的每一步。</h1>
          <p>进步不必很大，只要比昨天更靠近一点。</p>
        </div>
        <div className="export-actions">
          <button className="button subtle small" onClick={() => fileInput.current?.click()}>
            <ArrowUpFromLine size={15} />
            导入备份
          </button>
          <button className="button outline small" onClick={exportProgress}>
            <ArrowDownToLine size={15} />
            导出记录
          </button>
          <input
            className="sr-only"
            ref={fileInput}
            aria-label="导入学习记录文件"
            type="file"
            accept="application/json,.json"
            onChange={event => importProgress(event.target.files?.[0])}
          />
        </div>
      </div>
      <div className="stats-grid">
        {[
          {
            title: '已完成课程',
            value: `${progress.completed.filter(id => !!findLesson(id)).length}`,
            unit: `/ ${allLessons.length} 节`,
            icon: BookOpen,
          },
          { title: '累计学习时间', value: (total.seconds / 60).toFixed(1), unit: '分钟', icon: Clock3 },
          { title: '已完成练习', value: `${total.exercises}`, unit: '次', icon: Target },
          { title: '连续学习', value: `${streak(progress)}`, unit: '天', icon: Flame },
        ].map(item => (
          <section className="stat-card" key={item.title}>
            <span>
              <item.icon size={18} />
              {item.title}
            </span>
            <strong>
              {item.value}
              <small>{item.unit}</small>
            </strong>
          </section>
        ))}
      </div>
      <section className="progress-section">
        <div className="section-title">
          <div>
            <h2>把热爱，留在日常里</h2>
            <p>最近 35 天，你有 {active} 天与音乐相伴。</p>
          </div>
          <span className="pill">学习足迹</span>
        </div>
        <div className="heatmap">
          {dates.map(date => {
            const log = progress.days[date];
            const amount = log ? log.seconds + (log.lessons + log.exercises) * 15 : 0;
            return (
              <div
                key={date}
                className={`heat-day level-${amount === 0 ? 0 : amount < 120 ? 1 : amount < 600 ? 2 : 3}`}
                title={`${date}：${((log?.seconds ?? 0) / 60).toFixed(1)} 分钟，${log?.lessons ?? 0} 节课，${log?.exercises ?? 0} 次练习`}
              >
                <span>{Number(date.slice(-2))}</span>
              </div>
            );
          })}
        </div>
        <div className="heatmap-labels">
          <span>
            {dates[0]} — {dates[34]}
          </span>
          <span>
            少<i className="level-0" />
            <i className="level-1" />
            <i className="level-2" />
            <i className="level-3" />多
          </span>
        </div>
      </section>
      <section className="section-block">
        <div className="section-title">
          <div>
            <h2>你的学习路线</h2>
            <p>每完成一课，都为下一段旋律铺好路。</p>
          </div>
        </div>
        <div className="route-progress-list">
          {courses.map(course => {
            const count = course.lessons.filter(lesson => progress.completed.includes(lesson.id)).length;
            const Icon = trackIcons[course.id] ?? Music2;
            return (
              <button key={course.id} onClick={() => go(`/courses/${course.id}`)}>
                <span className={`tool-icon ${course.color}`}>
                  <Icon size={22} />
                </span>
                <span className="route-progress-copy">
                  <strong>{course.title}</strong>
                  <span className="course-progress">
                    <span style={{ width: `${Math.round((count / course.lessons.length) * 100)}%` }} />
                  </span>
                </span>
                <span>
                  {count} / {course.lessons.length} 节
                </span>
                <ChevronRight size={18} />
              </button>
            );
          })}
        </div>
      </section>
      <div className="gentle-tip">
        <ArrowDownToLine size={21} />
        <div>
          <strong>让学习记录，跟着你走</strong>
          <p>当前进度保存在这个浏览器中。清理浏览器数据或换设备之前，记得导出备份；导入会合并现有记录。</p>
        </div>
      </div>
    </>
  );
}

function LessonReader({ lesson, go }: { lesson: Lesson; go: Go }) {
  const { progress, complete, notify } = useLearning();
  const [answer, setAnswer] = useState<number | null>(null);
  const course = lessonCourse(lesson.id)!;
  const index = course.lessons.indexOf(lesson);
  const correct = answer === lesson.quiz.answer;
  useStudyClock(true);
  function finish() {
    complete(lesson.id);
    notify('这一小步，已经记在你的音乐旅程里。');
    const next = course.lessons[index + 1];
    go(next ? `/lesson/${next.id}` : `/courses/${course.id}`);
  }
  return (
    <Dialog title={lesson.title} onClose={() => go(`/courses/${course.id}`)} className="lesson-dialog">
      <aside className={`reader-sidebar ${course.color}`}>
        <span className="eyebrow">{course.english}</span>
        <h3>{course.title}</h3>
        <CourseArt track={course.id} />
        <div className="reader-lesson-nav">
          {course.lessons.map((item, i) => (
            <button
              key={item.id}
              className={item.id === lesson.id ? 'current' : ''}
              onClick={() => go(`/lesson/${item.id}`)}
            >
              <span>{progress.completed.includes(item.id) ? <Check size={14} /> : `0${i + 1}`}</span>
              {item.title}
            </button>
          ))}
        </div>
        <span className="reader-sidebar-foot">一步一步，就会听见不同。</span>
      </aside>
      <article className="lesson-article">
        <LoadBoundary resetKey={lesson.id}>
          <div className="reader-breadcrumb">
            {course.tag}
            <ChevronRight size={12} />第 {index + 1} / {course.lessons.length} 课
          </div>
          <h1>{lesson.title}</h1>
          <div className="article-meta">
            <span>
              <Clock3 size={14} />
              建议 {lesson.minutes} 分钟
            </span>
            <span>{progress.completed.includes(lesson.id) ? '已完成 · 复习中' : '零基础入门'}</span>
          </div>
          <p className="lesson-intro">{lesson.intro}</p>
          {instrumentImages[course.id] && <InstrumentFigure track={course.id} />}
          {lesson.sections.map(section => (
            <section className="article-section" key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
          <section className="lesson-interactive">
            <div className="interactive-label">
              <Volume2 size={15} />
              现在，亲手试一试
            </div>
            {lesson.widget === 'discovery' ? (
              <DiscoveryActivity lesson={lesson} />
            ) : lesson.widget === 'piano' ? (
              <PianoTool compact />
            ) : lesson.widget === 'guitar' ? (
              <GuitarTool compact />
            ) : lesson.widget === 'interval' ? (
              <EarTool compact />
            ) : lesson.widget === 'rhythm' ? (
              <RhythmTool compact />
            ) : lesson.widget === 'drums' ? (
              <DrumTool />
            ) : lesson.widget === 'instrument' ? (
              <InstrumentTool track={course.id} />
            ) : (
              <TheoryPlayer type={lesson.widget} />
            )}
          </section>
          <div className="takeaway">
            <Sparkles size={18} />
            <div>
              <strong>带走这一个小知识</strong>
              <p>{lesson.takeaway}</p>
            </div>
          </div>
          <section className="lesson-sources" aria-label="延伸阅读">
            {course.sources?.map(source => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                <BookOpen size={12} />
                {source.title}
                <span aria-hidden="true"> ↗</span>
              </a>
            ))}
          </section>
          <section className="lesson-quiz">
            <span className="eyebrow">A LITTLE CHECK-IN</span>
            <h2>理解了吗？试着回答一下</h2>
            <p>{lesson.quiz.question}</p>
            <div className="quiz-options">
              {lesson.quiz.options.map((option, i) => (
                <button
                  className={answer === i ? (correct ? 'correct' : 'incorrect') : ''}
                  key={option}
                  onClick={() => setAnswer(i)}
                  disabled={correct}
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {option}
                  {answer === i && correct && <Check size={16} />}
                </button>
              ))}
            </div>
            {answer !== null && (
              <div className={`quiz-feedback ${correct ? 'success' : 'retry'}`} role="status">
                <strong>{correct ? '答对了！' : '再想一想，可以重新选择。'}</strong>
                <p>{lesson.quiz.explanation}</p>
              </div>
            )}
          </section>
          <div className="lesson-actions">
            <button
              className="text-button"
              onClick={() => go(index > 0 ? `/lesson/${course.lessons[index - 1].id}` : `/courses/${course.id}`)}
            >
              <ArrowLeft size={15} />
              {index > 0 ? '上一课' : '课程目录'}
            </button>
            <button className="button primary" disabled={!correct} onClick={finish}>
              {index < course.lessons.length - 1 ? '完成本课，继续下一课' : '完成这条入门路线'}
              <ArrowRight size={16} />
            </button>
          </div>
          {!correct && <p className="quiz-hint">答对上方小问题后，就可以完成这一课。</p>}
        </LoadBoundary>
      </article>
    </Dialog>
  );
}

function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { progress, update } = useLearning();
  return (
    <Dialog title="你的学习节奏" onClose={onClose} className="settings-dialog">
      <div className="settings-symbol">
        <SlidersHorizontal size={27} />
      </div>
      <span className="eyebrow">MAKE IT YOUR OWN</span>
      <h2>找到舒服的学习节奏</h2>
      <p className="muted">少一点压力，多一点每天都想打开的期待。</p>
      <section>
        <h3>每天，留给音乐多久？</h3>
        <div className="goal-options">
          {[10, 15, 20, 30].map(value => (
            <button
              className={progress.dailyGoal === value ? 'selected' : ''}
              key={value}
              onClick={() => update(state => ({ ...state, dailyGoal: value }))}
            >
              {value}
              <small>分钟</small>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3>参考音量</h3>
        <label className="volume-range">
          <Volume2 size={18} />
          <input
            aria-label="参考音量"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={progress.volume}
            onChange={event => update(state => ({ ...state, volume: Number(event.target.value) }))}
          />
          <span>{Math.round(progress.volume * 100)}%</span>
        </label>
      </section>
      <div className="settings-note">目标和音量会保存在这个浏览器中，可随时调整。</div>
      <button className="button primary" onClick={onClose}>
        就按这个节奏来
        <Check size={16} />
      </button>
    </Dialog>
  );
}

function Shell() {
  const { route, go: navigate } = useRoute();
  const { progress } = useLearning();
  const [query, setQuery] = useState('');
  const [settings, setSettings] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const lesson = route.startsWith('/lesson/') ? findLesson(route.split('/')[2]) : undefined;
  const course = route.startsWith('/courses/')
    ? findCourse(route.split('/')[2])
    : lesson
      ? lessonCourse(lesson.id)
      : undefined;
  const base =
    lesson || course
      ? course?.traditional
        ? 'traditional'
        : course?.family !== 'foundation'
          ? 'world'
          : 'courses'
      : route.split('/')[1];
  const activePage = navItems.some(item => item.id === base) ? base : 'overview';
  const todaySeconds = progress.days[localDate()]?.seconds ?? 0;
  useEffect(() => {
    document.title = `${lesson?.title ?? navItems.find(item => item.id === activePage)?.title ?? '音序'} · 音序音乐学习`;
  }, [activePage, lesson]);
  useEffect(() => {
    const closeMenu = () => setMobileMenu(false);
    window.addEventListener('hashchange', closeMenu);
    return () => window.removeEventListener('hashchange', closeMenu);
  }, []);
  function go(path: string) {
    setMobileMenu(false);
    navigate(path);
  }
  const date = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  return (
    <div className="app-layout">
      <a
        className="skip-link"
        href="#main-content"
        onClick={event => {
          event.preventDefault();
          const main = document.getElementById('main-content');
          main?.focus();
          main?.scrollIntoView({ block: 'start', behavior: 'instant' });
        }}
      >
        跳到主要内容
      </a>
      {mobileMenu && <button className="mobile-backdrop" aria-label="关闭导航" onClick={() => setMobileMenu(false)} />}
      <aside className={`sidebar ${mobileMenu ? 'mobile-open' : ''}`}>
        <button className="brand" aria-label="音序首页" onClick={() => go('/overview')}>
          <span className="brand-icon">
            <BrandMark />
          </span>
          <span>
            音序<small>YINXU MUSIC</small>
          </span>
        </button>
        <div className="sidebar-label">你的音乐空间</div>
        <nav aria-label="主导航">
          {navItems.map(item => (
            <button
              key={item.id}
              className={activePage === item.id ? 'active' : ''}
              aria-current={activePage === item.id ? 'page' : undefined}
              onClick={() => go(`/${item.id}`)}
            >
              <item.icon size={19} strokeWidth={1.7} />
              {item.title}
              {activePage === item.id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-label sidebar-route-label">
          <span>常用路线</span>
          <button onClick={() => go('/courses')} aria-label="查看全部乐器课程">
            全部
            <ChevronRight size={11} />
          </button>
        </div>
        <nav className="track-nav" aria-label="学习路线">
          {courses.slice(0, 4).map(item => {
            const Icon = trackIcons[item.id] ?? Music2;
            return (
              <button key={item.id} onClick={() => go(`/courses/${item.id}`)}>
                <span className={`track-dot ${item.color}`} />
                <Icon size={15} />
                {item.tag}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-quote">
            <span>“</span>
            <p>
              音乐不必赶路，
              <br />
              每一拍都有进步。
            </p>
            <Music2 size={27} strokeWidth={1} />
          </div>
          <button className="sidebar-goal" onClick={() => setSettings(true)}>
            <GoalRing small percent={(todaySeconds / (progress.dailyGoal * 60)) * 100} />
            <span>
              <strong>每天一点音乐</strong>
              <small>
                今日 {Math.floor(todaySeconds / 60)} / {progress.dailyGoal} 分钟
              </small>
            </span>
            <ChevronRight size={14} />
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu-button"
              aria-label="展开导航"
              onClick={() => setMobileMenu(value => !value)}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb-root">我的音乐空间</span>
            <ChevronRight size={12} />
            <strong>{navItems.find(item => item.id === activePage)?.title}</strong>
          </div>
          <div className="topbar-right">
            <form
              className="search-box"
              role="search"
              onSubmit={event => {
                event.preventDefault();
                go(
                  activePage === 'traditional'
                    ? '/traditional'
                    : activePage === 'world'
                      ? '/world'
                      : activePage === 'choose'
                        ? '/choose'
                        : '/courses',
                );
              }}
            >
              <button aria-label="搜索课程" type="submit">
                <Search size={16} />
              </button>
              <input
                ref={search}
                aria-label="搜索课程"
                placeholder="搜索课程，发现新声音…"
                value={query}
                onChange={event => setQuery(event.target.value)}
              />
              <kbd onClick={() => search.current?.focus()}>↵</kbd>
            </form>
            <button className="icon-button settings-button" aria-label="学习设置" onClick={() => setSettings(true)}>
              <Settings2 size={19} />
            </button>
            <span className="topbar-divider" />
            <button className="avatar" onClick={() => setSettings(true)} aria-label="打开个人学习设置">
              乐
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <LoadBoundary resetKey={route}>
            <div className="date-line">
              <span className="status-dot" />
              属于你的音乐时间<span>{date}</span>
            </div>
            {activePage === 'overview' ? (
              <Overview go={go} onSettings={() => setSettings(true)} />
            ) : activePage === 'courses' ? (
              <CoursesPage go={go} query={query} setQuery={setQuery} course={course} />
            ) : activePage === 'traditional' ? (
              course ? (
                <CoursesPage go={go} query={query} setQuery={setQuery} course={course} />
              ) : (
                <TraditionalPage go={go} query={query} setQuery={setQuery} />
              )
            ) : activePage === 'world' ? (
              course ? (
                <CoursesPage go={go} query={query} setQuery={setQuery} course={course} />
              ) : (
                <WorldPage go={go} query={query} setQuery={setQuery} />
              )
            ) : activePage === 'choose' ? (
              <InstrumentChooser go={go} query={query} setQuery={setQuery} />
            ) : activePage === 'practice' ? (
              <PracticePage go={go} tool={route.split('/')[2] ?? 'piano'} />
            ) : (
              <ProgressPage go={go} />
            )}
          </LoadBoundary>
        </main>
      </div>
      {settings && <SettingsDialog onClose={() => setSettings(false)} />}
      {lesson && <LessonReader key={lesson.id} lesson={lesson} go={go} />}
    </div>
  );
}

export default function App() {
  return (
    <LearningProvider>
      <Shell />
    </LearningProvider>
  );
}
