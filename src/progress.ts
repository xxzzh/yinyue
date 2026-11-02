export interface DayLog { seconds: number; lessons: number; exercises: number }
export interface Progress {
  version: 1;
  completed: string[];
  dailyGoal: number;
  volume: number;
  days: Record<string, DayLog>;
  lastLesson: string | null;
}
export const STORAGE_KEY = 'yinxu.progress.v1';
export const freshProgress = (): Progress => ({ version: 1, completed: [], dailyGoal: 15, volume: 0.6, days: {}, lastLesson: null });
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function validateProgress(value: unknown): Progress {
  if (!value || typeof value !== 'object') throw new Error('这不是有效的音序学习记录。');
  const p = value as Partial<Progress>;
  if (p.version !== 1 || !Array.isArray(p.completed) || !p.completed.every(id => typeof id === 'string' && id.length < 80)
    || !p.days || typeof p.days !== 'object' || Array.isArray(p.days)) throw new Error('学习记录格式不正确，或版本暂不支持。');
  for (const [key, day] of Object.entries(p.days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !day || ![day.seconds, day.lessons, day.exercises].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0)) {
      throw new Error('学习记录包含无效的日期或数值。');
    }
  }
  return {
    version: 1, completed: [...new Set(p.completed)], days: { ...p.days },
    dailyGoal: typeof p.dailyGoal === 'number' && [10, 15, 20, 30].includes(p.dailyGoal) ? p.dailyGoal : 15,
    volume: typeof p.volume === 'number' && Number.isFinite(p.volume) ? Math.min(1, Math.max(0, p.volume)) : 0.6,
    lastLesson: typeof p.lastLesson === 'string' ? p.lastLesson : null,
  };
}
export function readProgress(): { progress: Progress; warning?: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return { progress: raw ? validateProgress(JSON.parse(raw)) : freshProgress() };
  } catch {
    return { progress: freshProgress(), warning: '本地记录暂时无法读取，原记录未删除。你可以在学习记录中导入备份。' };
  }
}
export function addActivity(progress: Progress, change: Partial<DayLog>, date = localDate()): Progress {
  const previous = progress.days[date] ?? { seconds: 0, lessons: 0, exercises: 0 };
  return { ...progress, days: { ...progress.days, [date]: {
    seconds: previous.seconds + Math.max(0, change.seconds ?? 0),
    lessons: previous.lessons + Math.max(0, change.lessons ?? 0),
    exercises: previous.exercises + Math.max(0, change.exercises ?? 0),
  } } };
}
export function completeLesson(progress: Progress, lessonId: string, date = localDate()): Progress {
  if (progress.completed.includes(lessonId)) return { ...progress, lastLesson: lessonId };
  return addActivity({ ...progress, completed: [...progress.completed, lessonId], lastLesson: lessonId }, { lessons: 1 }, date);
}
export function streak(progress: Progress, now = new Date()): number {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const active = (key: string) => { const item = progress.days[key]; return item && (item.seconds > 0 || item.lessons > 0 || item.exercises > 0); };
  if (!active(localDate(day))) day.setDate(day.getDate() - 1);
  let count = 0;
  while (active(localDate(day)) && count < 3660) { count++; day.setDate(day.getDate() - 1); }
  return count;
}
