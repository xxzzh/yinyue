import { courses } from './data.ts';
import { chineseSelectionProfiles } from './chinese-selection-profiles.ts';
import { worldSelectionProfiles } from './world-selection-profiles.ts';
import { additionalWorldSelectionProfiles } from './additional-world-catalog.ts';
import { additionalChineseSelectionProfiles } from './additional-chinese-selection-profiles.ts';
import type { InstrumentSelection } from './instrument-selection-types.ts';

export const selectionProfiles: Record<string, InstrumentSelection> = {
  ...chineseSelectionProfiles, ...worldSelectionProfiles, ...additionalWorldSelectionProfiles, ...additionalChineseSelectionProfiles,
};
export const selectionLabels = {
  access: { common:'常见渠道可找', specialist:'先找专门琴行或教师', institution:'先联系院校、乐团或馆藏机构' },
  portability: { pocket:'小件随身', carry:'可装盒携带', large:'需要固定空间或较大搬运' },
  practice: { headphones:'支持耳机方案', soft:'通常较轻柔', audible:'有明显原声', loud:'需安排较响的练习场地' },
  start: { approachable:'基础发声较直接', guided:'建议教师带入门', specialist:'需专门教学资源', research:'先听赏与形制研究' },
} as const;
export const timbreTags = ['清亮','温暖','浑厚','明亮','柔和','颗粒感','持续音','节奏感','可变音色'];
export const instrumentChoices = courses.filter(course => course.family !== 'foundation');
export interface SelectionFilters { family?: string; origin?: string; practice?: string; portability?: string; start?: string; tone?: string; }
export function filterInstrumentChoices(query='', filters: SelectionFilters={}) {
  const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return instrumentChoices.filter(course => {
    const profile=selectionProfiles[course.id];
    return profile && (!filters.family||filters.family==='all'||course.family===filters.family)
      && (!filters.origin||filters.origin==='all'||(filters.origin==='china')===Boolean(course.traditional))
      && (['practice','portability','start'] as const).every(key=>!filters[key]||filters[key]==='all'||profile[key]===filters[key])
      && (!filters.tone||filters.tone==='all'||profile.tags.includes(filters.tone))
      && words.every(word=>`${course.tag} ${course.english} ${course.aliases?.join(' ')??''} ${profile.timbre} ${profile.strength} ${profile.tags.join(' ')}`.toLowerCase().includes(word));
  });
}
