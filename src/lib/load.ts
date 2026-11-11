// Build-time loading of courses, quizzes, exercises and the glossary.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { getCollection } from 'astro:content';
import { buildCourses, type Course, type CourseManifest } from './model';

const CONTENT = path.resolve('content');

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}
export interface ExerciseSet {
  title: string;
  items: { key: string; text: string }[];
}
export interface GlossaryEntry {
  term: string;
  definition?: string;
  definitions?: Record<string, string>;
  courses: string[];
}

function readYaml<T>(file: string): T | undefined {
  const full = path.join(CONTENT, file);
  if (!fs.existsSync(full)) return undefined;
  return parse(fs.readFileSync(full, 'utf8')) as T;
}

function fail(file: string, message: string): never {
  throw new Error(`content/${file}: ${message}`);
}

let cached: Promise<Course[]> | undefined;
export function getCourses(): Promise<Course[]> {
  cached ??= (async () => {
    const manifests = fs
      .readdirSync(path.join(CONTENT, 'courses'))
      .filter((f) => f.endsWith('.yaml'))
      .sort()
      .map((f) => readYaml<CourseManifest>(`courses/${f}`)!);
    const entries = await getCollection('chapters');
    return buildCourses(
      manifests,
      entries.map((e) => ({ id: e.id, title: e.data.title, slug: e.data.slug, prerequisites: e.data.prerequisites })),
    );
  })();
  return cached;
}

export function getQuiz(chapter: string): QuizQuestion[] {
  const file = `chapters/${chapter}/quiz.yaml`;
  const quiz = readYaml<QuizQuestion[]>(file) ?? [];
  quiz.forEach((q, i) => {
    const where = `question ${i + 1}`;
    if (!q.question || !Array.isArray(q.options) || q.options.length < 2) fail(file, `${where} needs a question and at least two options.`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) fail(file, `${where} has an answer that is not one of its options.`);
    if (!q.explanation) fail(file, `${where} has no explanation.`);
  });
  return quiz;
}

export function getExercises(chapter: string): ExerciseSet[] {
  const file = `chapters/${chapter}/exercises.yaml`;
  const sets = readYaml<ExerciseSet[]>(file) ?? [];
  const keys = new Set<string>();
  for (const set of sets) {
    if (!set.title || !Array.isArray(set.items)) fail(file, 'each set needs a title and items.');
    for (const item of set.items) {
      if (!item.key || !item.text) fail(file, 'each item needs a key and text.');
      if (keys.has(item.key)) fail(file, `the key "${item.key}" is used twice.`);
      keys.add(item.key);
    }
  }
  return sets;
}

export function getGlossary(): GlossaryEntry[] {
  return readYaml<GlossaryEntry[]>('glossary.yaml') ?? [];
}

/** Works out which course and chapter a page address belongs to. */
export async function pageContext(url: URL): Promise<{ course?: Course; chapterId?: string }> {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const [courseId, slug] = url.pathname.slice(base.length).split('/').filter(Boolean);
  const course = (await getCourses()).find((c) => c.id === courseId);
  return { course, chapterId: course?.chapters.find((c) => c.slug === slug)?.id };
}

export function href(pathname: string): string {
  return import.meta.env.BASE_URL.replace(/\/$/, '') + pathname;
}

export function chapterHref(course: Course, slug: string): string {
  return href(`/${course.id}/${slug}/`);
}
