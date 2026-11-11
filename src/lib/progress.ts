// Learner progress: pure logic, no DOM. Stored in the browser as one JSON record.

export const STORAGE_KEY = 'zte-progress';
export const VERSION = 1;

export interface Progress {
  version: 1;
  /** chapter id -> true */
  done: Record<string, true>;
  /** chapter id -> chosen option for each question (null = not answered) */
  quiz: Record<string, (number | null)[]>;
  /** "chapter-id/exercise-key" -> true */
  checks: Record<string, true>;
  /** ISO time of the last change */
  updated: string | null;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function empty(): Progress {
  return { version: 1, done: {}, quiz: {}, checks: {}, updated: null };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Checks untrusted data (a stored record or an imported file) and returns a clean copy. */
export function validate(data: unknown): { ok: true; progress: Progress } | { ok: false; error: string } {
  if (!isRecord(data)) return { ok: false, error: 'This is not a progress file.' };
  if (data.version !== VERSION) {
    return { ok: false, error: `This progress file is version ${String(data.version)}; this site reads version ${VERSION}.` };
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
