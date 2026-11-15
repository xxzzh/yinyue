import { baseCourses, baseLessons } from './catalog-content.ts';
import { coreL0Lessons, coreL1Lessons, earCourseOrder, theoryCourseOrder } from './core-lessons.ts';
import { coreL2Lessons, earCourseOrderL2, theoryCourseOrderL2 } from './core-l2-lessons.ts';
import { coreL3Lessons, earCourseOrderL3, theoryCourseOrderL3 } from './core-l3-lessons.ts';
import { coreL4Lessons, earCourseOrderL4, theoryCourseOrderL4 } from './core-l4-lessons.ts';
import { coreL5Lessons, earCourseOrderL5, theoryCourseOrderL5 } from './core-l5-lessons.ts';
import type { WorldTrack } from './world-catalog.ts';
import { traditionalInstrument } from './traditional-catalog.ts';
import { pianoLessons } from './piano-lessons.ts';
import { guitarLessons } from './guitar-lessons.ts';
import { voiceLessons } from './voice-lessons.ts';
import { guzhengLessons } from './guzheng-lessons.ts';
import { koudiLessons } from './koudi-lessons.ts';
import { pianoL3Lessons } from './piano-l3-lessons.ts';
import { guitarL3Lessons } from './guitar-l3-lessons.ts';
import { voiceL3Lessons } from './voice-l3-lessons.ts';
import { guzhengL3Lessons } from './guzheng-l3-lessons.ts';
import { koudiL3Lessons } from './koudi-l3-lessons.ts';
import { pianoL4Lessons } from './piano-l4-lessons.ts';
import { guitarL4Lessons } from './guitar-l4-lessons.ts';
import { voiceL4Lessons } from './voice-l4-lessons.ts';
import { guzhengL4Lessons } from './guzheng-l4-lessons.ts';
import { koudiL4Lessons } from './koudi-l4-lessons.ts';
import { instrumentLessonOrder, lineLessons } from './instrument-order.ts';
import type { SightOptions } from './jianpu.ts';
import type { BeatCell } from './dictation.ts';
import type { Degree } from './harmony.ts';
import type { TraditionalTrack } from './traditional-catalog.ts';
import { courseFamilies, courseMatches } from './course-meta.ts';

export type Track =
  | 'theory'
  | 'ear'
  | 'piano'
  | 'guitar'
  | 'ukulele'
  | 'bass'
  | 'violin'
  | 'drums'
  | 'flute'
  | 'saxophone'
  | 'voice'
  | TraditionalTrack
  | WorldTrack;
export type Widget =
  | 'score'
  | 'scale'
  | 'interval'
  | 'rhythm'
  | 'piano'
  | 'guitar'
  | 'chord'
  | 'sing'
  | 'instrument'
  | 'drums'
  | 'discovery'
  | 'jianpu'
  | 'listen'
  | 'play'
  | 'sight'
  | 'tab'
  | 'pitch'
  | 'record'
  | 'dictation'
  | 'progression'
  | 'circle'
  | 'chorale';
export type CourseFamily = 'foundation' | 'keyboard' | 'plucked' | 'bowed' | 'wind' | 'percussion' | 'other';
export interface QuizItem {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  /** A sound to play before answering (sequence format in jianpu.ts), for listening questions. */
  listen?: string;
}
/** A melody in numbered notation (format in jianpu.ts), shown as 简谱, staff or both, with playback. */
export interface JianpuExample {
  title: string;
  score: string;
  /** Left-hand part for a grand staff; bars must line up with `score`. */
  left?: string;
  /** Labels of the two parts when `left` is given (default 右手, 左手), e.g. 高声部, 低声部. */
  parts?: [string, string];
  /** Section labels above bars (1-based), e.g. A, B, A′ for form; highlighted during playback. */
  marks?: { bar: number; label: string }[];
  clef?: 'treble' | 'bass' | 'alto';
  /** Play octaves away from the written pitch: guitar music sounds an octave lower (-1). */
  playOctave?: number;
  instrument?: 'piano' | 'guitar' | 'wind';
  view?: 'jianpu' | 'staff' | 'both';
  tempo?: number;
  note?: string;
}
/** A melody to play along on the keyboard; pitches are checked note by note. */
export interface PlayTarget {
  title: string;
  score: string;
  tempo?: number;
  note?: string;
}
/** Live pitch from the microphone; with targets, each note must be held in tune to move on. */
export interface PitchTask {
  title: string;
  targets?: string[];
  /** Accept the target in any octave (singing). */
  anyOctave?: boolean;
  /** Allowed deviation in cents (default 25). */
  tolerance?: number;
  /** Seconds to hold each target (default 1). */
  hold?: number;
  instrument?: 'piano' | 'guitar' | 'wind';
  note?: string;
}
/** A rhythm or melody dictation exercise (questions generated in dictation.ts). */
export interface DictationTask {
  kind: 'rhythm' | 'melody';
  meter?: 2 | 3 | 4;
  bars?: number;
  /** Beat patterns offered for rhythm dictation. */
  cells?: BeatCell[];
  /** Scale-degree range for melody dictation (do = 0). */
  range?: [number, number];
  tempo?: number;
  /** Melody dictation: allow leaps of a fourth and a fifth, and eighth notes. */
  leaps?: boolean;
  eighths?: boolean;
  /** Melody dictation: add altered notes that lead by step (♯4→5, ♭7→6 …). */
  chromatic?: boolean;
}
/** Four-part writing checked by voice-leading.ts. */
export interface ChoraleTask {
  title: string;
  /** Rows from the highest voice down, one column per chord; '' marks a note for the learner to write. */
  given: string[][];
  /** Chord symbols, Roman numerals or figures shown above the columns. */
  labels?: string[];
  /** A model answer in the same shape as `given`. */
  solution?: string[][];
  /** Starting values for the learner's cells (same shape), e.g. a draft with mistakes to correct. */
  draft?: string[][];
  voices?: 'satb' | 'quartet';
  tempo?: number;
  note?: string;
}
/** Chord-progression listening (questions generated in harmony.ts). */
export interface ProgressionTask {
  pool?: Degree[];
  length?: number;
  tempo?: number;
}
/** Record a take and play it back; nothing leaves the page. */
export interface RecordTask {
  title: string;
  prompt: string;
  seconds?: number;
  reference?: ListenClip;
}
/** Guitar tablature (format in tab.ts) with playback. */
export interface TabExample {
  title: string;
  score: string;
  tempo?: number;
  note?: string;
}
/** A labelled sound example (sequence format in jianpu.ts). */
export interface ListenClip {
  label: string;
  seq: string;
  tempo?: number;
  click?: boolean;
  instrument?: 'piano' | 'guitar' | 'wind';
  note?: string;
}
export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  intro: string;
  sections: { title: string; body: string }[];
  takeaway: string;
  widget: Widget;
  activity?: { title: string; intro?: string; steps: { task: string; hint: string }[] };
  quiz: QuizItem;
  /** Further questions; the lesson is complete when every question is answered correctly. */
  more?: QuizItem[];
  jianpu?: JianpuExample[];
  listen?: ListenClip[];
  /** Beats per bar for the metronome widget. */
  meter?: number;
  /** Interval ids (music.ts) offered by the interval widget. */
  intervals?: string[];
  /** Play about half the interval questions downward. */
  intervalsMixed?: boolean;
  play?: PlayTarget[];
  sight?: SightOptions;
  tab?: TabExample[];
  pitch?: PitchTask;
  record?: RecordTask;
  dictation?: DictationTask;
  progression?: ProgressionTask;
  chorale?: ChoraleTask;
  /** Chord names (music.ts) shown by the guitar widget. */
  chords?: string[];
}
export interface Course {
  id: Track;
  family: CourseFamily;
  title: string;
  english: string;
  description: string;
  tag: string;
  color: string;
  lessons: Lesson[];
  traditional?: boolean;
  level?: string;
  aliases?: string[];
  sources?: { title: string; url: string }[];
}

// The theory, ear and instrument courses list their graded lessons in path order.
const lineLessonsById = new Map(
  [
    ...coreL0Lessons,
    ...coreL1Lessons,
    ...coreL2Lessons,
    ...coreL3Lessons,
    ...coreL4Lessons,
    ...coreL5Lessons,
    ...pianoLessons,
    ...pianoL3Lessons,
    ...pianoL4Lessons,
    ...guitarLessons,
    ...guitarL3Lessons,
    ...guitarL4Lessons,
    ...voiceLessons,
    ...voiceL3Lessons,
    ...voiceL4Lessons,
    ...guzhengLessons,
    ...guzhengL3Lessons,
    ...guzhengL4Lessons,
    ...koudiLessons,
    ...koudiL3Lessons,
    ...koudiL4Lessons,
    ...baseLessons,
  ].map(lesson => [lesson.id, lesson]),
);
const courseOrder: Partial<Record<Track, string[]>> = {
  theory: [
    ...theoryCourseOrder,
    ...theoryCourseOrderL2,
    ...theoryCourseOrderL3,
    ...theoryCourseOrderL4,
    ...theoryCourseOrderL5,
  ],
  ear: [...earCourseOrder, ...earCourseOrderL2, ...earCourseOrderL3, ...earCourseOrderL4, ...earCourseOrderL5],
  piano: lineLessons(instrumentLessonOrder.piano),
  guitar: lineLessons(instrumentLessonOrder.guitar),
  voice: lineLessons(instrumentLessonOrder.voice),
  guzheng: lineLessons(instrumentLessonOrder.guzheng),
  koudi: lineLessons(instrumentLessonOrder.koudi),
};
export const courses: Course[] = baseCourses.map(course => {
  const order = courseOrder[course.id];
  return order ? { ...course, lessons: order.map(lessonId => lineLessonsById.get(lessonId)!) } : course;
});

export { courseFamilies };
export function filterCourses(query: string, family = 'all') {
  return courses.filter(course => courseMatches(course, query, family, traditionalInstrument(course.id)?.tradition));
}

export const allLessons = courses.flatMap(course => course.lessons);
export const findCourse = (id: string) => courses.find(course => course.id === id);
export const findLesson = (id: string) => allLessons.find(lesson => lesson.id === id);
export const lessonCourse = (id: string) => courses.find(course => course.lessons.some(lesson => lesson.id === id));
