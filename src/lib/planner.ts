// The study planner. Pure logic, no DOM.
import { addDays } from './review';

export interface PlanChapter {
  id: string;
  title: string;
  number: number;
  minutes: number;
}

export interface PlanItem {
  id: string;
  title: string;
  number: number;
  /** Minutes of this chapter to do this week. */
  minutes: number;
  /** True when the chapter started in an earlier week. */
  continued: boolean;
  /** True when the chapter is finished this week. */
  finishes: boolean;
}

export interface PlanWeek {
  index: number; // 1-based
  start: string; // YYYY-MM-DD
  end: string; // the last day of the week
  minutes: number;
  items: PlanItem[];
}

export interface Plan {
  weeks: PlanWeek[];
  totalMinutes: number;
  /** The last day of the last week, or null when nothing is left to do. */
  finish: string | null;
}

export const MIN_HOURS = 0.5;
export const MAX_HOURS = 80;

export function checkHours(hours: number): string | null {
  if (!Number.isFinite(hours)) return 'Enter the number of hours you can study each week.';
  if (hours < MIN_HOURS) return `Enter at least ${MIN_HOURS} hours a week.`;
  if (hours > MAX_HOURS) return `${MAX_HOURS} hours a week is the most this planner accepts.`;
  return null;
}

/**
 * Lays the unfinished chapters, in course order, onto weeks of `hoursPerWeek`.
 * Course order already respects prerequisites, so the plan does too.
 * A chapter that does not fit in what is left of a week carries over.
 */
export function makePlan(chapters: PlanChapter[], done: (id: string) => boolean, hoursPerWeek: number, start: string): Plan {
  const problem = checkHours(hoursPerWeek);
  if (problem) throw new Error(problem);
  const capacity = Math.round(hoursPerWeek * 60);
  const todo = chapters.filter((c) => !done(c.id));
  const weeks: PlanWeek[] = [];
  const newWeek = (): PlanWeek => {
    const s = addDays(start, 7 * weeks.length);
    const w = { index: weeks.length + 1, start: s, end: addDays(s, 6), minutes: 0, items: [] };
    weeks.push(w);
    return w;
  };
  let week: PlanWeek | undefined;
  for (const c of todo) {
    let left = c.minutes;
    let continued = false;
    while (left > 0) {
      if (!week || week.minutes >= capacity) week = newWeek();
      const take = Math.min(left, capacity - week.minutes);
      left -= take;
      week.items.push({ id: c.id, title: c.title, number: c.number, minutes: take, continued, finishes: left === 0 });
      week.minutes += take;
      continued = true;
    }
  }
  return {
    weeks,
    totalMinutes: todo.reduce((s, c) => s + c.minutes, 0),
    finish: weeks.length ? weeks[weeks.length - 1].end : null,
  };
}

export function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

// ---------- calendar file (iCalendar, RFC 5545) ----------
function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Lines longer than 75 bytes must be folded: continued on the next line after a space. */
function fold(line: string): string {
  const bytes = new TextEncoder();
  const out: string[] = [];
  let current = '';
  for (const ch of line) {
    if (bytes.encode(current + ch).length > (out.length ? 74 : 75)) {
      out.push(current);
      current = '';
    }
    current += ch;
  }
  out.push(current);
  return out.join('\r\n ');
}

/** One all-day event per week, on the first day of that week. */
export function toIcs(plan: Plan, courseTitle: string, stamp: Date): string {
  const dt = (day: string) => day.replace(/-/g, '');
  const dtstamp = stamp.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Zero to Engineer//Study planner//EN', 'CALSCALE:GREGORIAN'];
  for (const w of plan.weeks) {
    const list = w.items.map((i) => `${i.number}. ${i.title}${i.continued ? ' (continued)' : ''}: ${formatMinutes(i.minutes)}`).join('\n');
    lines.push(
      'BEGIN:VEVENT',
      `UID:zte-${dt(w.start)}-week${w.index}@zero-to-engineer`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dt(w.start)}`,
      `DTEND;VALUE=DATE:${dt(addDays(w.start, 1))}`,
      `SUMMARY:${icsEscape(`${courseTitle}: week ${w.index} (${formatMinutes(w.minutes)})`)}`,
      `DESCRIPTION:${icsEscape(list)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
