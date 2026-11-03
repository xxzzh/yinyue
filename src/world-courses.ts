import type { Course, Lesson } from './data.ts';
import { worldCatalog, worldSources } from './world-catalog.ts';

function quiz(question: string, correct: string, incorrect: string[], order: number): Lesson['quiz'] {
  const answer = order % 4;
  const options = incorrect.slice(0, 3);
  options.splice(answer, 0, correct);
  return { question, options, answer, explanation: correct };
}

export const worldCourses: Course[] = worldCatalog.map((item, order) => {
  const others = worldCatalog.filter(other => other.family !== item.family);
  return {
    id: item.id, family: item.family, title: `${item.name}：从认识到入门`, tag: item.name,
    english: item.english.toUpperCase(), description: `${item.tradition}。${item.shape}`,
    color: item.family === 'bowed' || item.family === 'keyboard' ? 'lavender' : item.family === 'wind' ? 'sage' : item.family === 'percussion' ? 'peach' : 'sand',
    level: '形制认识 · 基础启蒙', aliases: [...item.aliases, item.area, item.tradition],
    sources: [worldSources[item.ref]],
    lessons: [
      {
        id: `${item.id}-1`, title: `认识${item.name}的结构`, minutes: 6,
        intro: `从${item.name}的外形与音乐场景出发，没有实物也可以完成本课观察。`,
        sections: [{ title: '找出能看见的部件', body: item.shape }, { title: '分清相似名称与形制', body: item.contrast },
          { title: '它在什么音乐中出现', body: `以“${item.tradition}”为代表语境，地域导览归入“${item.area}”。标签帮助查找，不表示唯一源头或只属于一个地区。示意图概括外形，实物结构请结合所用型号观察。` }],
        takeaway: item.contrast, widget: 'discovery',
        activity: { title: '给乐器做一张观察卡', steps: [{ task: '指出两个主要部件', hint: item.shape }, { task: '说清与相似乐器的区别', hint: item.contrast }, { task: '记下它的代表音乐场景', hint: item.tradition }] },
        quiz: quiz(`哪项符合本课${item.name}的结构？`, item.shape, others.slice(0, 3).map(other => other.shape), order),
      },
      {
        id: `${item.id}-2`, title: `${item.name}的发声与第一步`, minutes: 8,
        intro: '把第一次练习缩小到一个可以观察、复述和检查的目标，先认识声音从哪里来。',
        sections: [{ title: '声音从哪里来', body: item.voice }, { title: '第一组观察与练习', body: item.step },
          { title: '把练习拆小', body: '每次只检查一个条件，例如起音、放松或声音结束的位置。没有实物时可看图、轻拍节奏并记录问题；实际持奏、定弦、气息及调音应与具体型号和教师示范配合。' }],
        takeaway: item.voice, widget: 'discovery',
        activity: { title: '先做一次，再检查', steps: [{ task: '解释主要振动体或声源', hint: item.voice }, { task: '完成本课的一小步', hint: item.step }, { task: '记录一项需要继续核对的地方', hint: item.contrast }] },
        quiz: quiz(`学习${item.name}，哪种起步方式更合适？`, item.step, ['不用看形制，所有型号都采用同一张指法表。', '第一次就用最大力度与最快速度。', '把另一件乐器的定弦与持奏直接搬过来。'], order + 1),
      },
      {
        id: `${item.id}-3`, title: `带着问题听${item.name}`, minutes: 7,
        intro: `从“${item.tradition}”找一段注明演奏者的示范，记录自己实际听到的声音。`,
        sections: [{ title: '带着发声线索去听', body: `${item.voice}听赏时用这一线索观察一次起音、一次延续和一次结束；必要时对照演奏画面。` },
          { title: '在合奏中找到它', body: '先找一段短乐句，判断这件乐器在演奏旋律、伴奏、持续音还是节奏；再听它怎样与其他声部接续。不要只凭“明亮”“低沉”等形容词判断乐器。' },
          { title: '查阅资料与下一步', body: `下方提供“${worldSources[item.ref].title}”作为延伸入口，部分内容为外语。本站本路线提供认识与启蒙任务，尚未内置该乐器的真实录音；资料及示范需要联网，离线时可先完成结构观察和测验。` }],
        takeaway: '记下乐器名称、演奏者、具体形制和一条实际观察，比只记音色形容词更有帮助。', widget: 'discovery',
        activity: { title: '做一张听赏记录', steps: [{ task: '记录曲名、演奏者与所用形制', hint: `先查阅课程资料，寻找${item.tradition}的演奏；暂时无法播放就标记“待听”。` }, { task: '描述一次起音或停顿', hint: item.voice }, { task: '选出下一次观察的小目标', hint: item.step }] },
        quiz: quiz(`本课把${item.name}放在哪种代表音乐场景中认识？`, item.tradition, [...new Set(others.map(other => other.tradition))].slice(0, 3), order + 2),
      },
    ],
  };
});
