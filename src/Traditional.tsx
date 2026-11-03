import { TimbrePreview } from './TimbrePreview';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Compass, Search } from 'lucide-react';
import { courses, findCourse } from './data';
import type { Lesson } from './data';
import { filterTraditional, traditionalAreas, traditionalCatalog, traditionalFamilies } from './traditional-catalog';
import { InstrumentImage } from './InstrumentImage';
import { useLearning } from './learning';

export function CatalogPager({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  if (pages < 2) return null;
  return <nav className="catalog-pager" aria-label="课程分页"><button className="button outline small" disabled={page === 1} onClick={() => onChange(page - 1)}><ArrowLeft size={14} />上一页</button><span aria-live="polite">第 {page} / {pages} 页</span><button className="button outline small" disabled={page === pages} onClick={() => onChange(page + 1)}>下一页<ArrowRight size={14} /></button></nav>;
}

const popular = ['guqin', 'pipa', 'guzheng', 'erhu', 'dizi', 'xiao', 'suona', 'hulusi'];
export function TraditionalPage({ go, query, setQuery }: { go: (path: string) => void; query: string; setQuery: (query: string) => void }) {
  const { progress } = useLearning();
  const [family, setFamily] = useState('all');
  const [area, setArea] = useState('全部地域');
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [query, family, area]);
  const matches = filterTraditional(query, family, area);
  const pages = Math.max(1, Math.ceil(matches.length / 12));
  const current = Math.min(page, pages);
  const visible = matches.slice((current - 1) * 12, current * 12);
  const lessonCount = courses.filter(course => course.traditional).reduce((sum, course) => sum + course.lessons.length, 0);
  function changePage(value: number) {
    setPage(value);
    document.getElementById('traditional-results')?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  return <div className="traditional-page">
    <section className="heritage-hero">
      <div className="heritage-copy"><span className="eyebrow">THE SOUNDS OF CHINA</span><div className="heritage-heading"><span className="heritage-seal">国乐</span><h1>听见山河，<br />遇见中国乐器。</h1></div><p>从琴弦的余韵，到竹管里的气息。<br />把好奇交给一种声音，慢慢认识它的来处。</p><div className="heritage-actions"><button className="button dark" onClick={() => go('/courses/guqin')}>从古琴开始<BookOpen size={16} /></button><a className="text-button" href="#/traditional" onClick={event => { event.preventDefault(); document.getElementById('traditional-results')?.scrollIntoView({ behavior: 'smooth' }); }}>浏览乐器图鉴<ArrowRight size={16} /></a></div></div>
      <div className="heritage-poem" aria-hidden="true"><span className="poem-rule" /><span>丝竹相和</span><span>金石有声</span><i>一器一世界</i><div className="heritage-disc"><span>樂</span></div></div>
      <div className="heritage-stats"><span><strong>{traditionalCatalog.length}</strong> 种代表乐器</span><span><strong>{lessonCount}</strong> 节认识与入门课</span><span><strong>免费</strong> 阅读 · 练习 · 测验</span></div>
    </section>
    <div className="heritage-scope"><Compass size={19} /><p>先建立一张宽广的国乐地图。本版覆盖常见及部分地方、民族、历史乐器，并非所有地域变体的穷尽名录。新路线提供形制、发声、启蒙任务与听赏指引；古筝、二胡保留已有演奏入门课。新课程暂未内置真实录音，延伸资料与部分示范需联网查阅。</p></div>
    <section className="heritage-start" aria-label="推荐入门乐器"><span>不知从哪开始？</span><div>{popular.map(id => { const item = traditionalCatalog.find(item => item.id === id)!; return <button key={id} onClick={() => go(`/courses/${id}`)}>{item.name}<ChevronRight size={12} /></button>; })}</div></section>
    <button className="atlas-choice-link" onClick={() => go('/choose')}>比较音色与练习条件，选适合的乐器<ArrowRight size={15}/></button>
    <section className="traditional-directory" aria-labelledby="traditional-results">
      <div className="section-title"><div><span className="eyebrow">AN INSTRUMENT, A NEW DISCOVERY</span><h2 id="traditional-results" tabIndex={-1}>中国传统乐器图鉴</h2><p>按演奏方式寻找，也可搜索民族传统、拼音和常见别名。</p></div><label className="heritage-search"><Search size={17} /><input aria-label="搜索中国传统乐器" placeholder="试试：筚篥、冬布拉、侗族…" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
      <div className="heritage-families" role="group" aria-label="传统乐器类别">{traditionalFamilies.map(group => <button key={group.id} aria-pressed={family === group.id} className={family === group.id ? 'selected' : ''} onClick={() => setFamily(group.id)}><strong>{group.title}<small>{group.id === 'all' ? traditionalCatalog.length : traditionalCatalog.filter(item => item.family === group.id).length}</small></strong><span>{group.caption}</span></button>)}</div>
      <div className="heritage-result-bar"><label>地域导览<select aria-label="传统乐器地域导览" value={area} onChange={event => setArea(event.target.value)}>{traditionalAreas.map(value => <option key={value}>{value}</option>)}</select></label><span aria-live="polite">找到 {matches.length} 种 · {matches.length ? `${(current - 1) * 12 + 1}–${Math.min(current * 12, matches.length)}` : 0} / {matches.length}</span>{(query || family !== 'all' || area !== '全部地域') && <button className="text-button" onClick={() => { setQuery(''); setFamily('all'); setArea('全部地域'); }}>重置筛选</button>}</div>
      <div className="heritage-grid">{visible.map(item => {
        const course = findCourse(item.id)!;
        const completed = course.lessons.filter(lesson => progress.completed.includes(lesson.id)).length;
        return <button className={`heritage-card ${course.color}`} key={item.id} onClick={() => go(`/courses/${item.id}`)}>
          <div className="heritage-card-top"><span className="heritage-number">{String(traditionalCatalog.indexOf(item as typeof traditionalCatalog[number]) + 1).padStart(2, '0')}</span><span>{traditionalFamilies.find(group => group.id === item.family)?.title}</span></div>
          <InstrumentImage track={item.id} className="heritage-card-picture" /><div className="heritage-card-name"><h3>{item.name}</h3><span>{item.pinyin}</span></div><p className="heritage-tradition">{item.tradition}</p><p className="heritage-alias">{item.aliases.length ? `别名 / 相关形制：${item.aliases.join('、')}` : `${item.area} · 从结构与声音认识`}</p><TimbrePreview track={item.id} /><div className="heritage-card-foot"><span>{course.lessons.length} 课 · {course.level ? '认识与启蒙' : '演奏入门'}</span><span>{completed ? <><Check size={12} />{completed}/{course.lessons.length}</> : <ArrowRight size={18} />}</span></div>
        </button>;
      })}</div>
      {!matches.length && <div className="empty-state"><Search size={30} /><h3>这个组合暂时没有找到乐器</h3><p>试试别名、拼音，或重置地域与类别。</p><button className="button outline" onClick={() => { setQuery(''); setFamily('all'); setArea('全部地域'); }}>查看全部传统乐器</button></div>}
      <CatalogPager page={current} pages={pages} onChange={changePage} /><p className="image-directory-note">图片展示代表性形制；少数条目使用历史图像或外形示意，均已标注。点击乐器可放大观察。<a href="./image-credits.html" target="_blank" rel="noreferrer">图片来源与授权 ↗</a></p>
    </section>
    <details className="eight-tones"><summary>再认识一种分类：古人的“八音”<span>金 · 石 · 土 · 革 · 丝 · 木 · 匏 · 竹</span></summary><p>八音主要依据制器材料分类，与上面的演奏方式分类角度不同。现代乐器常使用多种材料，不能只看外壳来判断真正的发声体。</p><div>{[['金', '钟'], ['石', '磬'], ['土', '埙'], ['革', '鼓'], ['丝', '琴瑟'], ['木', '柷敔'], ['匏', '笙竽'], ['竹', '箫笛']].map(([name, example]) => <span key={name}><strong>{name}</strong><small>{example}</small></span>)}</div></details>
  </div>;
}

export function DiscoveryActivity({ lesson }: { lesson: Lesson }) {
  const [done, setDone] = useState<number[]>([]);
  const [recorded, setRecorded] = useState(false);
  const { exercise, notify } = useLearning();
  if (!lesson.activity) return null;
  return <div className="discovery-activity"><h3>{lesson.activity.title}</h3><p>每完成一个任务就勾选。没有实物时，先完成图文观察或桌面模拟；有真实示范时再补充听赏。</p><div>{lesson.activity.steps.map((step, index) => <label className={done.includes(index) ? 'done' : ''} key={step.task}><input type="checkbox" checked={done.includes(index)} disabled={recorded} onChange={() => setDone(previous => previous.includes(index) ? previous.filter(value => value !== index) : [...previous, index])} /><span><strong>{step.task}</strong><small>{step.hint}</small></span></label>)}</div><button className="button primary small" disabled={done.length !== lesson.activity.steps.length || recorded} onClick={() => { exercise(); setRecorded(true); notify('这组观察练习已计入学习记录。'); }}>{recorded ? <><Check size={14} />已记录本次练习</> : '记为一次观察练习'}</button><small className="discovery-note">这是自主观察记录，不是演奏能力评分；完成本课还需通过下方测验。</small></div>;
}
