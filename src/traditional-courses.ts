import { additionalChineseSources } from './additional-chinese-catalog.ts';
import type { Course, Lesson } from './data.ts';
import { traditionalCatalog, traditionalFamilies, traditionalSources } from './traditional-catalog.ts';
import type { TraditionalInstrument } from './traditional-catalog.ts';

function check(question: string, correct: string, others: string[], offset: number): Lesson['quiz'] {
  const answer = offset % 4;
  const options = others.slice(0, 3);
  options.splice(answer, 0, correct);
  return { question, options, answer, explanation: correct };
}

function buildCourse(item: TraditionalInstrument, order: number): Course {
  const others = traditionalCatalog.filter(other => other.family !== item.family).slice(0, 3);
  const firstSentence = (value: string) => `${value.split('。')[0]}。`;
  const family = traditionalFamilies.find(family => family.id === item.family)!.title;
  const mode = '形制认识 · 基础启蒙';
  return {
    id: item.id as Course['id'], family: item.family, traditional: true,
    title: `${item.name}：从认识到入门`, english: item.pinyin.toUpperCase(),
    description: `${item.tradition}。${firstSentence(item.shape)}`, tag: item.name,
    color: item.family === 'plucked' ? 'sand' : item.family === 'bowed' ? 'lavender' : item.family === 'wind' ? 'sage' : item.family === 'other' ? 'sage' : 'peach',
    level: mode, aliases: [...item.aliases],
    sources: additionalChineseSources[item.id] ?? item.refs.map(ref => traditionalSources[ref]),
    lessons: [
      {
        id: `${item.id}-1`, title: `认识${item.name}的形制`, minutes: 6,
        intro: `从看得见的结构出发，建立${item.name}的第一张观察卡。本课重点是认识，不要求已经拥有实物。`,
        sections: [
          { title: '先看结构，再记名字', body: item.shape },
          { title: '最容易混淆的地方', body: item.contrast },
          { title: '把观察说清楚', body: `本目录将它放在“${family}”一组，便于按演奏方式浏览。请用自己的话描述一处结构，再写出它与一件相似乐器的区别。类别是浏览入口，不替代发声原理和地方形制的具体说明。` },
        ], takeaway: item.contrast, widget: 'discovery',
        activity: { title: `${item.name} · 形制观察`, steps: [
          { task: '找出一处可以直接看到的结构', hint: item.shape },
          { task: '复述它与相似乐器的区别', hint: item.contrast },
          { task: '说出这次认识的具体名称或形制', hint: `本课：${item.name}；代表传统：${item.tradition}。有别名时，别名不自动代表另一件乐器。` },
        ] },
        quiz: check(`下面哪项符合本课介绍的${item.name}？`, firstSentence(item.shape), others.map(other => firstSentence(other.shape)), order),
      },
      {
        id: `${item.id}-2`, title: `${item.name}怎样发声与起步`, minutes: 8,
        intro: '先理解动作为什么能产生声音，再把练习缩小到一个可检查的小目标。没有实物，也可以先完成观察和桌面模拟。',
        sections: [
          { title: '发声与双手分工', body: item.voice },
          { title: '今天的第一组练习', body: item.step },
          { title: '一次只改变一个条件', body: '将一组练习控制在短而轻松的范围内。先做一次，停下检查是否放松、起止是否清楚，再重复三次。实体乐器的指法、定弦与持奏请匹配具体形制；本页的模拟动作不代替教师对实际发声的反馈。' },
        ], takeaway: firstSentence(item.voice), widget: 'discovery',
        activity: { title: `${item.name} · 慢练分解`, steps: [
          { task: '先解释声音由什么动作产生', hint: item.voice },
          { task: '完成一组观察或起步练习', hint: item.step },
          { task: '暂停，再检查一次', hint: '记录一项清楚的观察：动作是否放松、起音是否清楚，或发现了什么形制区别。有实物时再检查对应教材与型号。' },
        ] },
        quiz: check(`初次接触${item.name}，哪项做法更合适？`, firstSentence(item.step), ['不看具体形制，所有乐器都使用同一张指法表。', '先把速度提到最快，再回头辨认结构。', '只看名称，直接套用另一件乐器的持奏与定弦。'], order + 1),
      },
      {
        id: `${item.id}-3`, title: `走进${item.name}的音乐世界`, minutes: 7,
        intro: `带着问题认识“${item.tradition}”。听赏不是只记一个音色形容词，还要观察乐句、伴奏和使用场景。`,
        sections: [
          { title: '这一遍，带着任务听', body: item.listen },
          { title: '保留音乐的来处', body: `本课以“${item.tradition}”为代表语境，地域导览归入“${item.area}”。这是帮助查找的标签，不表示乐器只属于一个地区，也不据此断言唯一源头。查阅下方资料时，记录曲名、演奏者、地区与所用形制。` },
          { title: '把兴趣变成下一次练习', body: `第一天重看形制；第二天复述发声；第三天完成本课听赏任务；随后重复${item.name}的起步练习，每次只选一个目标。对需要实物、教师或传承语境的内容，先完成观察记录，再安排对应学习。参考网页需要联网，本站的文字、任务与测验可随发布包离线使用。` },
        ], takeaway: `听${item.name}时，把结构、声音与“${item.tradition}”的场景联系起来。`, widget: 'discovery',
        activity: { title: `${item.name} · 听赏记录`, steps: [
          { task: '读完本次听赏任务', hint: item.listen },
          { task: '选一段有清楚标签的示范，或先查阅资料', hint: `查找“${item.name} ${item.tradition}”。下方延伸阅读是外部资料；若暂时无法播放，可先记下形制与场景问题，下次有示范时补听。本站不把合成音当作真实乐器示范。` },
          { task: '用一句具体描述收尾', hint: '记录一个起音、一次停顿或一处声部配合；如果尚未听到示范，明确写“待听”，不要把想象当成听到的事实。' },
        ] },
        quiz: check(`本课把${item.name}放在哪个代表传统中认识？`, item.tradition,
          traditionalCatalog.filter(other => other.tradition !== item.tradition && other.family !== item.family).slice(-3).map(other => other.tradition), order + 2),
      },
    ],
  };
}

// Existing IDs and lessons remain untouched, preserving saved progress and deep links.
export const traditionalCourses: Course[] = traditionalCatalog
  .filter(item => item.id !== 'guzheng' && item.id !== 'erhu')
  .map(buildCourse);
