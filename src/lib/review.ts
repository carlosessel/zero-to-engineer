// Spaced repetition with Leitner boxes. Pure logic, no DOM.
//
// A question answered wrongly goes into box 1 and comes back tomorrow. Each
// time it is answered correctly in review it moves up a box and waits longer:
// 1, 3, 7, 14, then 30 days. Answered correctly from box 5, it is retired.
// Answered wrongly at any point, it goes back to box 1.
import type { Progress } from './progress';

/** Days to wait after landing in box 1..5. */
export const INTERVALS = [1, 3, 7, 14, 30];

export function reviewKey(chapter: string, question: number): string {
  return `${chapter}#${question}`;
}

export function parseKey(key: string): { chapter: string; question: number } {
  const i = key.lastIndexOf('#');
  return { chapter: key.slice(0, i), question: Number(key.slice(i + 1)) };
}

/** A calendar day as YYYY-MM-DD, in the device's own time zone. */
export function dayOf(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Called when a question is answered inside its chapter. Only wrong answers are scheduled. */
export function recordChapterAnswer(p: Progress, chapter: string, question: number, correct: boolean, today: string): void {
  if (!correct) p.review[reviewKey(chapter, question)] = { box: 1, due: addDays(today, INTERVALS[0]) };
}

/** Called when a due question is answered on the review page. */
export function recordReviewAnswer(p: Progress, key: string, correct: boolean, today: string): 'retired' | 'promoted' | 'reset' {
  const item = p.review[key];
  if (!correct || !item) {
    p.review[key] = { box: 1, due: addDays(today, INTERVALS[0]) };
    return 'reset';
  }
  if (item.box >= INTERVALS.length) {
    delete p.review[key];
    return 'retired';
  }
  const box = item.box + 1;
  p.review[key] = { box, due: addDays(today, INTERVALS[box - 1]) };
  return 'promoted';
}

/** Keys due on or before `today`, most overdue first. */
export function dueKeys(p: Progress, today: string): string[] {
  return Object.keys(p.review)
    .filter((k) => p.review[k].due <= today)
    .sort((a, b) => p.review[a].due.localeCompare(p.review[b].due) || a.localeCompare(b));
}

export function summary(p: Progress, today: string): { due: number; later: number; next: string | null } {
  const due = dueKeys(p, today).length;
  const future = Object.values(p.review)
    .map((r) => r.due)
    .filter((d) => d > today)
    .sort();
  return { due, later: future.length, next: future[0] ?? null };
}

/** Removes entries for questions that no longer exist (a chapter was rewritten). */
export function prune(p: Progress, exists: (key: string) => boolean): number {
  let removed = 0;
  for (const k of Object.keys(p.review)) {
    if (!exists(k)) {
      delete p.review[k];
      removed++;
    }
  }
  return removed;
}
