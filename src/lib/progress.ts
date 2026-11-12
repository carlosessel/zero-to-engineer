// Learner progress: pure logic, no DOM. Stored in the browser as one JSON record.

export const STORAGE_KEY = 'zte-progress';
export const VERSION = 3;

export interface ReviewItem {
  /** Leitner box, 1 to 5. A higher box means a longer wait before the question returns. */
  box: number;
  /** The day it is next due, as YYYY-MM-DD in the learner's own time zone. */
  due: string;
}

export interface PlannerSettings {
  course: string;
  hoursPerWeek: number;
  start: string;
}

export interface Progress {
  version: 3;
  /** chapter id -> true */
  done: Record<string, true>;
  /** chapter id -> chosen option for each question (null = not answered) */
  quiz: Record<string, (number | null)[]>;
  /** "chapter-id/exercise-key" -> true */
  checks: Record<string, true>;
  /** "chapter-id#question-number" -> when a question answered wrongly comes back */
  review: Record<string, ReviewItem>;
  /** What the learner last entered in the study planner */
  planner: PlannerSettings | null;
  /** What has earned experience points, and on which day: "kind:id" -> YYYY-MM-DD
   *  ("" for things done before points existed). See game.ts. */
  earned: Record<string, string>;
  /** Badge id -> the day it was first earned */
  badges: Record<string, string>;
  /** The learner's daily goal, in points */
  goal: number;
  /** ISO time of the last change */
  updated: string | null;
}

export const GOALS = [30, 60, 120, 200];
export const DEFAULT_GOAL = 60;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function empty(): Progress {
  return { version: 3, done: {}, quiz: {}, checks: {}, review: {}, planner: null, earned: {}, badges: {}, goal: DEFAULT_GOAL, updated: null };
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Checks untrusted data (a stored record or an imported file) and returns a clean copy. */
export function validate(data: unknown): { ok: true; progress: Progress } | { ok: false; error: string } {
  if (!isRecord(data)) return { ok: false, error: 'This is not a progress file.' };
  // Version 1 had no review queue and no planner settings; version 2 had no points or badges.
  // Older records are read as-is, and what they lack starts empty.
  if (data.version !== 1 && data.version !== 2 && data.version !== VERSION) {
    return { ok: false, error: `This progress file is version ${String(data.version)}; this site reads versions 1 to ${VERSION}.` };
  }
  const p = empty();
  for (const field of ['done', 'checks'] as const) {
    const src = data[field];
    if (!isRecord(src)) return { ok: false, error: `The "${field}" section is missing or damaged.` };
    for (const [k, v] of Object.entries(src)) if (v === true) p[field][k] = true;
  }
  if (!isRecord(data.quiz)) return { ok: false, error: 'The "quiz" section is missing or damaged.' };
  for (const [k, v] of Object.entries(data.quiz)) {
    if (!Array.isArray(v)) return { ok: false, error: `The quiz answers for "${k}" are damaged.` };
    p.quiz[k] = v.map((a) => (Number.isInteger(a) && (a as number) >= 0 ? (a as number) : null));
  }
  if (data.version === 2 || data.version === VERSION) {
    if (!isRecord(data.review)) return { ok: false, error: 'The "review" section is missing or damaged.' };
    for (const [k, v] of Object.entries(data.review)) {
      if (isRecord(v) && Number.isInteger(v.box) && (v.box as number) >= 1 && (v.box as number) <= 5 && typeof v.due === 'string' && DAY.test(v.due)) {
        p.review[k] = { box: v.box as number, due: v.due };
      }
    }
    const pl = data.planner;
    if (isRecord(pl) && typeof pl.course === 'string' && typeof pl.hoursPerWeek === 'number' && pl.hoursPerWeek > 0 && typeof pl.start === 'string' && DAY.test(pl.start)) {
      p.planner = { course: pl.course, hoursPerWeek: pl.hoursPerWeek, start: pl.start };
    }
  }
  if (data.version === VERSION) {
    for (const field of ['earned', 'badges'] as const) {
      const src = data[field];
      if (!isRecord(src)) continue;
      for (const [k, v] of Object.entries(src)) if (typeof v === 'string' && (v === '' || DAY.test(v)) && k.length < 300) p[field][k] = v;
    }
    if (typeof data.goal === 'number' && GOALS.includes(data.goal)) p.goal = data.goal;
  }
  p.updated = typeof data.updated === 'string' ? data.updated : null;
  return { ok: true, progress: p };
}

export function load(storage: StorageLike): Progress {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const result = validate(JSON.parse(raw));
    return result.ok ? result.progress : empty();
  } catch {
    return empty();
  }
}

/** Returns false if the browser refused to store it (private mode, storage full). */
export function save(storage: StorageLike, p: Progress, now: Date = new Date()): boolean {
  p.updated = now.toISOString();
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}

export function clear(storage: StorageLike): void {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}

export function exportJson(p: Progress): string {
  return JSON.stringify({ app: 'zero-to-engineer', ...p }, null, 2) + '\n';
}

export function importJson(text: string): { ok: true; progress: Progress } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file is not valid JSON, so it cannot be a progress file.' };
  }
  if (isRecord(data) && data.app !== 'zero-to-engineer') {
    return { ok: false, error: 'This file was not exported from this site.' };
  }
  return validate(data);
}

export function setDone(p: Progress, chapter: string, done: boolean): void {
  if (done) p.done[chapter] = true;
  else delete p.done[chapter];
}

export function setCheck(p: Progress, chapter: string, key: string, checked: boolean): void {
  const k = `${chapter}/${key}`;
  if (checked) p.checks[k] = true;
  else delete p.checks[k];
}

export function isChecked(p: Progress, chapter: string, key: string): boolean {
  return p.checks[`${chapter}/${key}`] === true;
}

export function setAnswer(p: Progress, chapter: string, question: number, option: number): void {
  const answers = p.quiz[chapter] ?? [];
  while (answers.length < question) answers.push(null);
  answers[question] = option;
  p.quiz[chapter] = answers;
}

export function countDone(p: Progress, chapterIds: string[]): { done: number; total: number } {
  return { done: chapterIds.filter((id) => p.done[id]).length, total: chapterIds.length };
}

/** Scores the latest answer to each question against the correct options. */
export function quizScore(
  answers: (number | null)[] | undefined,
  correct: number[],
): { answered: number; correct: number; total: number } {
  let answered = 0;
  let right = 0;
  correct.forEach((c, i) => {
    const a = answers?.[i];
    if (a === null || a === undefined) return;
    answered++;
    if (a === c) right++;
  });
  return { answered, correct: right, total: correct.length };
}
