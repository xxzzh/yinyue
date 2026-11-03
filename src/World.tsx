import { TimbrePreview } from './TimbrePreview';
import { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronRight, Globe2, Search } from 'lucide-react';
import { courseFamilies, courses } from './data';
import { worldAreas, worldInstrument } from './world-catalog';
import { InstrumentImage } from './InstrumentImage';
import { CourseArt } from './Art';
import { CatalogPager } from './CatalogPager';
import { useLearning } from './learning';

export const worldDirectory = courses.filter(course => !course.traditional && course.family !== 'foundation');
export function filterWorldDirectory(query = '', family = 'all', area = '全部地域') {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return worldDirectory.filter(course => {
    const item = worldInstrument(course.id);
    const region = item?.area ?? '跨地区与现代';
    return (family === 'all' || family === course.family) && (area === '全部地域' || area === region)
      && words.every(word => `${course.tag} ${course.title} ${course.english} ${course.aliases?.join(' ') ?? ''} ${item?.tradition ?? ''} ${region}`.toLowerCase().includes(word));
  });
}

export function WorldPage({ go, query, setQuery }: { go: (path: string) => void; query: string; setQuery: (value: string) => void }) {
  const { progress } = useLearning();
  const [family, setFamily] = useState('all');
  const [area, setArea] = useState('全部地域');
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [query, family, area]);
  const matches = filterWorldDirectory(query, family, area);
  const pages = Math.max(1, Math.ceil(matches.length / 12));
  const current = Math.min(page, pages);
  function reset() { setQuery(''); setFamily('all'); setArea('全部地域'); }
  return <div className="world-page">
    <section className="world-hero"><div><span className="eyebrow">A WORLD OF INSTRUMENTS</span><h1>让世界的声音，<br />走近你。</h1><p>从交响乐队到街头合奏，从熟悉的键盘到远方的弦与鼓。<br />先认识一件乐器，再走进它的音乐。</p><div className="world-stats"><span><strong>{worldDirectory.length}</strong> 种乐器</span><span><strong>{worldDirectory.reduce((sum, course) => sum + course.lessons.length, 0)}</strong> 节基础与启蒙课</span></div></div><div className="world-orbit" aria-hidden="true"><Globe2 size={160} strokeWidth={.65} /><span>一件乐器，一段新的旅程。</span></div></section>
    <div className="heritage-scope"><Globe2 size={19} /><p>涵盖管弦乐、键盘、打击乐与世界各地代表乐器。地域标签用于导览，不表示唯一源头；同名乐器可能有不同形制。新路线提供结构、发声、启蒙任务与测验，部分乐器已提供真实录音节选；每件乐器均可在课程中阅读音色、特色与选学建议。中国乐器可从独立专区继续探索。</p></div>
    <section className="heritage-start"><span>从感兴趣的声音开始</span><div>{['cello', 'trumpet', 'accordion', 'kalimba', 'handpan', 'cajon'].map(id => <button key={id} onClick={() => go(`/courses/${id}`)}>{worldInstrument(id)!.name}<ChevronRight size={12} /></button>)}</div></section>
    <button className="atlas-choice-link" onClick={() => go('/choose')}>比较音色与练习条件，选适合的乐器<ArrowRight size={15}/></button>
    <section aria-labelledby="world-results"><div className="section-title"><div><span className="eyebrow">FIND YOUR NEXT INSTRUMENT</span><h2 id="world-results" tabIndex={-1}>世界乐器图鉴</h2><p>搜索中文、英文、别名或音乐传统。</p></div><label className="heritage-search"><Search size={17} /><input aria-label="搜索世界乐器" placeholder="试试：大提琴、黑管、Kalimba…" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
      <div className="filter-tabs world-family-tabs" role="group" aria-label="世界乐器类别">{courseFamilies.filter(item => item.id !== 'foundation').map(group => <button key={group.id} className={group.id === family ? 'active' : ''} aria-pressed={group.id === family} onClick={() => setFamily(group.id)}>{group.id === 'all' ? '全部乐器' : group.tag}<small>{worldDirectory.filter(course => group.id === 'all' || course.family === group.id).length}</small></button>)}</div>
      <div className="heritage-result-bar"><label>地域导览<select aria-label="世界乐器地域导览" value={area} onChange={event => setArea(event.target.value)}>{worldAreas.map(value => <option key={value}>{value}</option>)}</select></label><span aria-live="polite">找到 {matches.length} 种 · {matches.length ? `${(current - 1) * 12 + 1}–${Math.min(current * 12, matches.length)}` : 0} / {matches.length}</span>{(query || family !== 'all' || area !== '全部地域') && <button className="text-button" onClick={reset}>重置筛选</button>}</div>
      <div className="heritage-grid">{matches.slice((current - 1) * 12, current * 12).map(course => {
        const item = worldInstrument(course.id);
        const completed = course.lessons.filter(lesson => progress.completed.includes(lesson.id)).length;
        return <button className={`heritage-card ${course.color}`} key={course.id} onClick={() => go(`/courses/${course.id}`)}><div className="heritage-card-top"><span>{courseFamilies.find(group => group.id === course.family)?.tag}</span><span>{item?.area ?? '跨地区与现代'}</span></div>{item ? <InstrumentImage track={course.id} className="heritage-card-picture" /> : <div className="world-existing-art"><CourseArt track={course.id} /></div>}<div className="heritage-card-name"><h3>{course.tag}</h3><span>{item?.english ?? course.english}</span></div><p className="heritage-tradition">{item?.tradition ?? course.description}</p><p className="heritage-alias">{item?.aliases.length ? `别名 / 相关称呼：${item.aliases.join('、')}` : '从结构认识，到第一次练习'}</p><TimbrePreview track={course.id} /><div className="heritage-card-foot"><span>{course.lessons.length} 课 · {course.level ? '认识与启蒙' : '演奏入门'}</span><span>{completed ? <><Check size={12} />{completed}/{course.lessons.length}</> : <ArrowRight size={18} />}</span></div></button>;
      })}</div>
      {!matches.length && <div className="empty-state"><Search size={30} /><h3>这个组合暂时没有找到乐器</h3><p>试试英文、别名，或重置类别与地域。</p><button className="button outline" onClick={reset}>查看全部世界乐器</button></div>}
      <CatalogPager page={current} pages={pages} onChange={value => { setPage(value); document.getElementById('world-results')?.scrollIntoView({ block: 'start', behavior: 'instant' }); }} />
      <p className="image-directory-note">新增配图为原创外形示意，帮助辨认代表结构，不作为尺寸或指法依据。图片随离线包提供。<a href="./image-credits.html" target="_blank" rel="noreferrer">配图说明与授权 ↗</a></p>
    </section><section className="heritage-invitation"><div><span className="eyebrow">THE SOUNDS OF CHINA</span><h2>再回到丝竹与金石之间。</h2><p>中国传统、地方与现代民族乐器，在独立图鉴中继续探索。</p></div><button className="button dark" onClick={() => go('/traditional')}>中国乐器专区<ArrowRight size={16} /></button></section>
  </div>;
}
