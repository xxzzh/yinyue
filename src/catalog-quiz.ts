import type { Lesson } from './data.ts';

export interface QuizSubject {
  id: string;
  name: string;
  family: string;
  aliases: readonly string[];
  english?: string;
}

/** Small stable string hash (FNV-1a) so generated quizzes vary per instrument but never between builds. */
export function stableHash(text: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Replaces an instrument's own names so an option cannot be matched by spotting the name. */
export function maskNames(text: string, subject: QuizSubject) {
  const names = [subject.name, subject.english ?? '', ...subject.aliases.filter(alias => alias.length >= 2)]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  return names.reduce((out, name) => out.split(name).join('这件乐器'), text);
}

/**
 * Builds a four-option question from catalog descriptions. Wrong options come from other playing families,
 * are picked per instrument (not the same three for a whole family), never mention the subject itself and
 * have their own names masked when `mask` is set. The explanation names what each wrong option described.
 */
export function catalogQuiz<T extends QuizSubject>(
  question: string,
  subject: T,
  pool: readonly T[],
  describe: (item: T) => string,
  salt: string,
  mask = true,
): Lesson['quiz'] {
  const show = (item: T) => (mask ? maskNames(describe(item), item) : describe(item));
  // Whether masking changed the text. Wrong options should match the correct one here, otherwise the
  // only option without (or with) “这件乐器” would give the answer away.
  const masked = (item: T) => mask && show(item) !== describe(item);
  const correct = show(subject);
  const candidates = pool
    .filter(other => other.id !== subject.id && other.family !== subject.family)
    .filter(other => !describe(other).includes(subject.name))
    .map(other => ({
      other,
      order: (masked(other) === masked(subject) ? 0 : 2 ** 32) + stableHash(`${salt}:${subject.id}:${other.id}`),
    }))
    .sort((a, b) => a.order - b.order);
  const picked: { name: string; text: string }[] = [];
  for (const { other } of candidates) {
    const text = show(other);
    if (text === correct || picked.some(item => item.text === text)) continue;
    picked.push({ name: other.name, text });
    if (picked.length === 3) break;
  }
  if (picked.length < 3) throw new Error(`Not enough distinct quiz options for ${subject.id}`);
  const answer = stableHash(`${salt}:${subject.id}`) % 4;
  const options = picked.map(item => item.text);
  options.splice(answer, 0, correct);
  return {
    question,
    options,
    answer,
    explanation: `${correct}${/[。！？]$/.test(correct) ? '' : '。'}其余选项依次对应：${picked.map(item => item.name).join('、')}。`,
  };
}
