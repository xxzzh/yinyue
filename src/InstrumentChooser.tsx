import { useEffect, useState } from 'react';
import { ArrowRight, Check, Headphones, Music2, Scale, X } from 'lucide-react';
import { courses, courseFamilies } from './data';
import type { Course } from './data';
import { CourseArt } from './Art';
import { CatalogPager } from './Traditional';
import { filterInstrumentChoices, instrumentChoices, selectionLabels, selectionProfiles, timbreTags } from './instrument-selection';
import { audioSamples } from './audio-samples';
import { useLearning } from './learning';

function RealSound({ course }: { course: Course }) {
  const sample=audioSamples[course.id];
  const { progress }=useLearning();
  return <div className="real-sound"><div className="character-label"><Headphones size={16}/><strong>{sample ? '听一段真实录音' : '带着音色线索去听'}</strong></div>{sample ? <>
    <p>{sample.label} · {sample.seconds.toFixed(1)} 秒 · 实物采样录音节选</p>
    <audio controls preload="none" aria-label={`${course.tag}真实录音`} src={`./audio/${sample.file}`} onPlay={event=>{ const playing=event.currentTarget; playing.volume=progress.volume; document.querySelectorAll('audio').forEach(other=>{if(other!==playing)other.pause();}); }}/>
    <small>单个录音不代表全部音区与奏法；不同示例的音高、力度、独奏或合奏人数可能不同。<a href={sample.source} target="_blank" rel="noreferrer">原录音与文件信息 ↗</a> · <a href="./audio-credits.html" target="_blank" rel="noreferrer">来源与授权</a></small>
  </> : <><p>这件乐器暂未内置真实录音。先记下典型音色，再从课程资料寻找注明形制、演奏者与奏法的示范。</p><div className="sound-links">{course.sources?.slice(0,2).map(source=><a href={source.url} key={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}{course.traditional&&<a href="https://ccmusic-database.github.io/database/ctis.html" target="_blank" rel="noreferrer">中国乐器音响资料库 ↗</a>}</div><small>外部资料需联网；资料介绍页不保证包含这件乐器的直接播放按钮。</small></>}</div>;
}

export function InstrumentCharacter({ course }: { course: Course }) {
  const profile=selectionProfiles[course.id];
  if(!profile)return null;
  return <section className="instrument-character" aria-label={`${course.tag}特色与选学建议`}>
    <div className="section-title"><div><span className="eyebrow">GET TO KNOW ITS CHARACTER</span><h2>这个声音，适合你吗？</h2><p>先喜欢它的声音，再看看日常练习是否合适。</p></div><div className="tone-tags">{profile.tags.map(tag=><span key={tag}>{tag}</span>)}</div></div>
    <div className="character-grid"><div><h3>典型音色</h3><p>{profile.timbre}</p></div><div><h3>为什么是这种声音</h3><p>{profile.reason}</p></div><div><h3>它擅长表达什么</h3><p>{profile.strength}</p></div><div><h3>入门先过哪一关</h3><p>{profile.challenge}</p></div></div>
    <div className="character-setup"><h3>练习前，准备这些</h3><p>{profile.setup}</p><div className="condition-tags"><span>{selectionLabels.portability[profile.portability]}</span><span>{selectionLabels.practice[profile.practice]}</span><span>{selectionLabels.start[profile.start]}</span><span>{selectionLabels.access[profile.access]}</span></div></div>
    <RealSound course={course}/><p className="character-note">音色随形制、音区、力度、奏法与录音环境变化；这些描述与选学条件是编辑参考。起步发声直接不等于容易精通，原声乐器的弱奏也不代表适合所有夜间环境。</p>
  </section>;
}

export function InstrumentChooser({ go, query, setQuery }: { go:(path:string)=>void; query:string; setQuery:(value:string)=>void }) {
  const [family,setFamily]=useState('all'),[origin,setOrigin]=useState('all'),[practice,setPractice]=useState('all'),[portability,setPortability]=useState('all'),[start,setStart]=useState('all'),[tone,setTone]=useState('all');
  const [page,setPage]=useState(1),[comparison,setComparison]=useState<string[]>([]);
  useEffect(()=>{setPage(1);},[query,family,origin,practice,portability,start,tone]);
  const matches=filterInstrumentChoices(query,{family,origin,practice,portability,start,tone});
  const pages=Math.max(1,Math.ceil(matches.length/12)),current=Math.min(page,pages);
  const compared=comparison.map(id=>courses.find(course=>course.id===id)!);
  function reset(){setQuery('');setFamily('all');setOrigin('all');setPractice('all');setPortability('all');setStart('all');setTone('all');}
  function toggle(id:string){setComparison(previous=>previous.includes(id)?previous.filter(value=>value!==id):previous.length<3?[...previous,id]:previous);}
  return <div className="chooser-page"><section className="chooser-hero"><span className="eyebrow">FIND THE SOUND THAT FEELS LIKE YOU</span><h1>先听见喜欢，<br/>再找到适合。</h1><p>{instrumentChoices.length} 种乐器，逐件了解音色、发声原因、表现特色与练习条件。可以选最多三件放在一起比较。</p><div className="chooser-stats"><span><Music2 size={17}/>每种都有特色说明</span><span><Headphones size={17}/>{Object.keys(audioSamples).length} 种内置真实录音</span><span><Scale size={17}/>按实际条件比较</span></div></section>
    <details className="sound-explainer" open><summary>同样一个音，为什么乐器听起来不一样？</summary><div><article><strong>01 · 什么在振动</strong><p>弦、簧片、鼓皮、金属片或电子声源的振动方式不同。即使主音高接近，泛音与噪声成分也可能很不一样。</p></article><article><strong>02 · 怎样开始、怎样结束</strong><p>拨弦和槌击常有明确起音并逐渐衰减；运弓与持续吹气可以延续声音。手指、弓速、气流与止音都能改变音色。</p></article><article><strong>03 · 什么在共鸣</strong><p>琴箱、面板、管腔、琴桥及放大系统会筛选和强化不同频率。材料只是因素之一，尺寸、结构、奏法同样重要。</p></article></div><p>“柔和”“明亮”等是听赏线索，不是好坏排名。历史复原乐器也不存在一份能代表所有时代的唯一标准原声。</p></details>
    <section className="chooser-directory" aria-labelledby="chooser-results"><div className="section-title"><div><span className="eyebrow">YOUR PREFERENCES, YOUR NEXT STEP</span><h2 id="chooser-results" tabIndex={-1}>按声音与生活条件来选</h2><p>原声条件和电子替代方案分开说明，请结合详情与实际试奏。</p></div><label className="heritage-search"><input aria-label="搜索乐器特色" placeholder="名称、温暖、独奏、节奏…" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
      <div className="chooser-filters"><label>类别<select aria-label="选学乐器类别" value={family} onChange={e=>setFamily(e.target.value)}>{courseFamilies.filter(item=>item.id!=='foundation').map(item=><option key={item.id} value={item.id}>{item.id==='all'?'全部乐器':item.tag}</option>)}</select></label><label>图鉴<select aria-label="选学乐器图鉴" value={origin} onChange={e=>setOrigin(e.target.value)}><option value="all">全部图鉴</option><option value="china">中国乐器</option><option value="world">世界乐器</option></select></label>
      <label>练习声音<select aria-label="练习声音条件" value={practice} onChange={e=>setPractice(e.target.value)}><option value="all">不限声音条件</option>{Object.entries(selectionLabels.practice).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label>携带与空间<select aria-label="携带与空间" value={portability} onChange={e=>setPortability(e.target.value)}><option value="all">不限空间条件</option>{Object.entries(selectionLabels.portability).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label>入门方式<select aria-label="入门方式" value={start} onChange={e=>setStart(e.target.value)}><option value="all">不限入门方式</option>{Object.entries(selectionLabels.start).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label></div>
      <div className="tone-filter" role="group" aria-label="偏好音色">{['all',...timbreTags].map(tag=><button key={tag} aria-pressed={tone===tag} className={tone===tag?'selected':''} onClick={()=>setTone(tag)}>{tag==='all'?'全部音色':tag}</button>)}</div><div className="heritage-result-bar"><span aria-live="polite">找到 {matches.length} 种 · 已选 {comparison.length}/3 件比较</span><button className="text-button" onClick={reset}>重置条件</button></div>
      {compared.length>0&&<section className="instrument-comparison" aria-label="乐器对比"><div className="section-title"><h2>放在一起，比一比</h2><button className="text-button" onClick={()=>setComparison([])}>清空比较<X size={14}/></button></div><div className="comparison-scroll" tabIndex={0} role="region" aria-label="可横向滚动的乐器对比表"><table><thead><tr><th scope="col">你关心的事</th>{compared.map(course=><th scope="col" key={course.id}><button onClick={()=>go(`/courses/${course.id}`)}>{course.tag}<ArrowRight size={12}/></button><button className="remove-comparison" aria-label={`移除${course.tag}比较`} onClick={()=>toggle(course.id)}><X size={13}/></button></th>)}</tr></thead><tbody>{(['timbre','reason','strength','challenge','setup'] as const).map((field,i)=><tr key={field}><th scope="row">{['典型音色','发声原因','表现特色','入门难点','练习准备'][i]}</th>{compared.map(course=><td key={course.id}>{selectionProfiles[course.id][field]}</td>)}</tr>)}</tbody></table></div></section>}
      <div className="chooser-grid">{matches.slice((current-1)*12,current*12).map(course=>{const profile=selectionProfiles[course.id],chosen=comparison.includes(course.id);return <article className="chooser-card" key={course.id}><button className={`chooser-card-top ${course.color}`} onClick={()=>go(`/courses/${course.id}`)}><CourseArt track={course.id}/><h3>{course.tag}</h3><span>{course.traditional?'中国乐器':'世界乐器'}</span></button><div className="chooser-card-copy"><div className="tone-tags">{profile.tags.map(tag=><span key={tag}>{tag}</span>)}</div><p>{profile.timbre}</p><small>{selectionLabels.portability[profile.portability]} · {selectionLabels.practice[profile.practice]}</small><div className="chooser-card-actions"><button className="text-button" onClick={()=>go(`/courses/${course.id}`)}>特色与课程<ArrowRight size={13}/></button><button className={`compare-toggle ${chosen?'selected':''}`} aria-pressed={chosen} disabled={!chosen&&comparison.length===3} onClick={()=>toggle(course.id)}>{chosen?<><Check size={12}/>已加入</>:'加入比较'}</button></div></div></article>;})}</div>
      {!matches.length&&<div className="empty-state"><h3>暂时没有符合所有条件的乐器</h3><p>可以先放宽一个条件，再试听或阅读详情。</p><button className="button outline" onClick={reset}>查看全部乐器</button></div>}<CatalogPager page={current} pages={pages} onChange={value=>{setPage(value);document.getElementById('chooser-results')?.scrollIntoView({block:'start',behavior:'instant'});}}/>
    </section><p className="character-note">获取渠道和入门方式是一般选学参考，不代表实时库存、价格或能力评级。目录覆盖常见与部分地方、历史、现代乐器，尚未穷尽所有地域变体。建议先试听、试奏或体验一节课。</p></div>;
}
