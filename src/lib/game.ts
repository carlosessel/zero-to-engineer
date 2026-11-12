// Points, levels, streaks and badges: pure logic, no DOM.
//
// Points are earned once per thing, recorded in progress.earned as "kind:id" -> day.
// Earning the same thing twice gives nothing, so unticking and ticking again,
// or answering a question again, cannot be used to pile up points.
//
//   done:<chapter>          finishing a chapter                 100
//   check:<chapter>/<key>   ticking an exercise                  15
//   answer:<chapter>#<n>    answering a quiz question correctly  20
//   perfect:<chapter>       every question in a quiz right       50
//   review:<key>:<day>      a correct review answer, once a day  10
//   tried:<chapter>#<n>     running or showing a code example     5
import type { Progress } from './progress';

export const POINTS: Record<string, number> = { done: 100, check: 15, answer: 20, perfect: 50, review: 10, tried: 5 };

export function pointsFor(key: string): number {
  return POINTS[key.slice(0, key.indexOf(':'))] ?? 0;
}

/** Records something earned. Returns the points gained: 0 if it was already earned. */
export function earn(p: Progress, key: string, day: string): number {
  if (key in p.earned) return 0;
  const pts = pointsFor(key);
  if (!pts) return 0;
  p.earned[key] = day;
  return pts;
}

export function totalPoints(p: Progress): number {
  let sum = 0;
  for (const key of Object.keys(p.earned)) sum += pointsFor(key);
  return sum;
}

/** Points earned on each day. Things from before points existed (day "") are left out. */
export function pointsByDay(p: Progress): Map<string, number> {
  const out = new Map<string, number>();
  for (const [key, day] of Object.entries(p.earned)) if (day) out.set(day, (out.get(day) ?? 0) + pointsFor(key));
  return out;
}

export function pointsOn(p: Progress, day: string): number {
  return pointsByDay(p).get(day) ?? 0;
}

// ---------- levels ----------

/** Points needed to reach a level: 0, 100, 300, 600, 1000, 1500… (each level needs 100 more than the last). */
export function levelStart(level: number): number {
  return 50 * (level - 1) * level;
}

export const TITLES = [
  'Newcomer', 'Explorer', 'Tinkerer', 'Builder', 'Debugger', 'Problem solver', 'Craftsperson',
  'Engineer', 'Senior engineer', 'Architect', 'Principal', 'Wizard', 'Legend',
];

export function levelInfo(points: number) {
  let level = 1;
  while (levelStart(level + 1) <= points) level++;
  const start = levelStart(level);
  const next = levelStart(level + 1);
  return {
    level,
    title: TITLES[Math.min(level - 1, TITLES.length - 1)],
    into: points - start,
    needed: next - start,
    /** 0 to 1: how far through this level */
    fraction: (points - start) / (next - start),
  };
}

// ---------- days and streaks ----------

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * The streak: how many days in a row the learner has earned points, counting back
 * from today. A streak is still alive if the last active day was yesterday (today
 * is not over yet), but it is not counted as including today until something is done.
 */
export function streak(p: Progress, today: string): { current: number; best: number; activeToday: boolean } {
  const days = new Set(pointsByDay(p).keys());
  const activeToday = days.has(today);
  let current = 0;
  let d = activeToday ? today : addDays(today, -1);
  while (days.has(d)) {
    current++;
    d = addDays(d, -1);
  }
  let best = 0;
  for (const day of days) {
    if (days.has(addDays(day, -1))) continue; // not the start of a run
    let run = 0;
    let e = day;
    while (days.has(e)) {
      run++;
      e = addDays(e, 1);
    }
    best = Math.max(best, run);
  }
  return { current, best, activeToday };
}

// ---------- badges ----------

export interface Stats {
  points: number;
  chapters: number;
  exercises: number;
  answers: number;
  perfect: number;
  reviews: number;
  tried: number;
  bestStreak: number;
  /** Courses with at least one finished chapter */
  coursesStarted: number;
  /** Parts of courses with every chapter finished */
  partsDone: number;
  coursesDone: number;
}

export interface CourseShape {
  id: string;
  parts: string[][];
}

export function stats(p: Progress, today: string, courses: CourseShape[] = []): Stats {
  const count = (kind: string) => Object.keys(p.earned).filter((k) => k.startsWith(`${kind}:`)).length;
  const done = (id: string) => !!p.done[id];
  let partsDone = 0;
  let coursesDone = 0;
  let coursesStarted = 0;
  for (const c of courses) {
    const all = c.parts.flat();
    if (all.some(done)) coursesStarted++;
    if (all.length && all.every(done)) coursesDone++;
    partsDone += c.parts.filter((part) => part.length && part.every(done)).length;
  }
  return {
    points: totalPoints(p),
    chapters: Object.keys(p.done).length,
    exercises: count('check'),
    answers: count('answer'),
    perfect: count('perfect'),
    reviews: count('review'),
    tried: count('tried'),
    bestStreak: streak(p, today).best,
    coursesStarted,
    partsDone,
    coursesDone,
  };
}

export interface Badge {
  id: string;
  name: string;
  /** How to earn it, shown before it is earned */
  how: string;
  /** A single character shown on the badge */
  icon: string;
  /** Colour family: one of the badge colours in the stylesheet */
  tone: 'sun' | 'sea' | 'leaf' | 'rose' | 'violet' | 'gold';
  test: (s: Stats) => boolean;
}

export const BADGES: Badge[] = [
  { id: 'first-steps', name: 'First steps', how: 'Finish your first chapter', icon: '★', tone: 'sun', test: (s) => s.chapters >= 1 },
  { id: 'hands-on', name: 'Hands on', how: 'Run or show your first code example', icon: '▶', tone: 'sea', test: (s) => s.tried >= 1 },
  { id: 'quiz-whiz', name: 'Quiz whiz', how: 'Get every question right in a chapter quiz', icon: '✓', tone: 'leaf', test: (s) => s.perfect >= 1 },
  { id: 'on-a-roll', name: 'On a roll', how: 'Learn three days in a row', icon: '3', tone: 'rose', test: (s) => s.bestStreak >= 3 },
  { id: 'doer', name: 'Doer', how: 'Tick 10 exercises', icon: '✎', tone: 'violet', test: (s) => s.exercises >= 10 },
  { id: 'tinkerer', name: 'Tinkerer', how: 'Run or show 25 code examples', icon: '⚙', tone: 'sea', test: (s) => s.tried >= 25 },
  { id: 'bookworm', name: 'Bookworm', how: 'Finish 5 chapters', icon: '5', tone: 'sun', test: (s) => s.chapters >= 5 },
  { id: 'week-warrior', name: 'Week warrior', how: 'Learn seven days in a row', icon: '7', tone: 'rose', test: (s) => s.bestStreak >= 7 },
  { id: 'comeback', name: 'Comeback', how: 'Answer 10 review questions correctly', icon: '↺', tone: 'leaf', test: (s) => s.reviews >= 10 },
  { id: 'part-done', name: 'Milestone', how: 'Finish every chapter in one part of a course', icon: '◆', tone: 'violet', test: (s) => s.partsDone >= 1 },
  { id: 'sharpshooter', name: 'Sharpshooter', how: 'Get 10 chapter quizzes completely right', icon: '◎', tone: 'leaf', test: (s) => s.perfect >= 10 },
  { id: 'explorer', name: 'Explorer', how: 'Finish a chapter in three different courses', icon: '✦', tone: 'sea', test: (s) => s.coursesStarted >= 3 },
  { id: 'twenty', name: 'Deep diver', how: 'Finish 20 chapters', icon: '20', tone: 'sun', test: (s) => s.chapters >= 20 },
  { id: 'thousand', name: 'Four figures', how: 'Earn 1,000 points', icon: 'K', tone: 'gold', test: (s) => s.points >= 1000 },
  { id: 'month', name: 'Unstoppable', how: 'Learn 30 days in a row', icon: '30', tone: 'rose', test: (s) => s.bestStreak >= 30 },
  { id: 'graduate', name: 'Graduate', how: 'Finish every chapter of a course', icon: '♛', tone: 'gold', test: (s) => s.coursesDone >= 1 },
];

/** Records any badges newly earned and returns them. */
export function unlockBadges(p: Progress, s: Stats, today: string): Badge[] {
  const fresh: Badge[] = [];
  for (const b of BADGES) {
    if (!(b.id in p.badges) && b.test(s)) {
      p.badges[b.id] = today;
      fresh.push(b);
    }
  }
  return fresh;
}

/**
 * Gives points for things done before points existed (finished chapters and ticked
 * exercises), dated "" so they count towards the total but not towards any day's streak.
 */
export function backfill(p: Progress): boolean {
  let changed = false;
  for (const id of Object.keys(p.done)) if (!(`done:${id}` in p.earned)) (p.earned[`done:${id}`] = ''), (changed = true);
  for (const k of Object.keys(p.checks)) if (!(`check:${k}` in p.earned)) (p.earned[`check:${k}`] = ''), (changed = true);
  return changed;
}
