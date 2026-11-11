import { describe, expect, it } from 'vitest';
import { checkHours, formatMinutes, makePlan, toIcs, type PlanChapter } from '../src/lib/planner';

const ch = (n: number, minutes: number): PlanChapter => ({ id: `c${n}`, title: `Chapter ${n}`, number: n, minutes });
const none = () => false;

describe('makePlan', () => {
  it('fills each week up to the hours given', () => {
    const plan = makePlan([ch(1, 60), ch(2, 60), ch(3, 60)], none, 2, '2026-11-16');
    expect(plan.weeks.map((w) => w.items.map((i) => i.id))).toEqual([['c1', 'c2'], ['c3']]);
    expect(plan.weeks.map((w) => [w.start, w.end])).toEqual([
      ['2026-11-16', '2026-11-22'],
      ['2026-11-23', '2026-11-29'],
    ]);
    expect(plan.finish).toBe('2026-11-29');
    expect(plan.totalMinutes).toBe(180);
  });

  it('carries a long chapter over into the following weeks', () => {
    const plan = makePlan([ch(1, 150)], none, 1, '2026-11-16');
    expect(plan.weeks.map((w) => w.items[0])).toEqual([
      { id: 'c1', title: 'Chapter 1', number: 1, minutes: 60, continued: false, finishes: false },
      { id: 'c1', title: 'Chapter 1', number: 1, minutes: 60, continued: true, finishes: false },
      { id: 'c1', title: 'Chapter 1', number: 1, minutes: 30, continued: true, finishes: true },
    ]);
  });

  it('never plans more than the weekly hours, and loses no minutes', () => {
    const chapters = [45, 200, 10, 95, 130, 5, 60].map((m, i) => ch(i + 1, m));
    const plan = makePlan(chapters, none, 1.5, '2026-01-05');
    for (const w of plan.weeks) expect(w.minutes).toBeLessThanOrEqual(90);
    for (const w of plan.weeks.slice(0, -1)) expect(w.minutes).toBe(90);
    expect(plan.weeks.reduce((s, w) => s + w.minutes, 0)).toBe(545);
  });

  it('keeps course order', () => {
    const plan = makePlan([ch(1, 30), ch(2, 30), ch(3, 30), ch(4, 30)], none, 1, '2026-01-05');
    expect(plan.weeks.flatMap((w) => w.items.map((i) => i.number))).toEqual([1, 2, 3, 4]);
  });

  it('skips finished chapters', () => {
    const plan = makePlan([ch(1, 60), ch(2, 60), ch(3, 60)], (id) => id === 'c2', 1, '2026-01-05');
    expect(plan.weeks.flatMap((w) => w.items.map((i) => i.id))).toEqual(['c1', 'c3']);
  });

  it('returns an empty plan when everything is done', () => {
    expect(makePlan([ch(1, 60)], () => true, 5, '2026-01-05')).toEqual({ weeks: [], totalMinutes: 0, finish: null });
  });

  it('more hours a week means an earlier finish', () => {
    const chapters = Array.from({ length: 20 }, (_, i) => ch(i + 1, 120));
    const slow = makePlan(chapters, none, 4, '2026-01-05');
    const fast = makePlan(chapters, none, 10, '2026-01-05');
    expect(slow.weeks.length).toBe(10);
    expect(fast.weeks.length).toBe(4);
  });

  it.each([0, -3, NaN, 0.2, 500])('refuses %s hours a week', (h) => {
    expect(checkHours(h)).toBeTruthy();
    expect(() => makePlan([ch(1, 60)], none, h, '2026-01-05')).toThrow();
  });
});

describe('formatMinutes', () => {
  it('formats', () => {
    expect([formatMinutes(45), formatMinutes(60), formatMinutes(135)]).toEqual(['45 min', '1 h', '2 h 15 min']);
  });
});

describe('calendar file', () => {
  const plan = makePlan([ch(1, 60), { id: 'x', title: 'Lists, dictionaries; files', number: 2, minutes: 90 }], none, 2, '2026-11-16');
  const ics = toIcs(plan, 'Zero to AI Engineer', new Date('2026-11-11T10:00:00Z'));
  it('has one all-day event per week', () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261116\r\nDTEND;VALUE=DATE:20261117');
    expect(ics).toContain('DTSTAMP:20261111T100000Z');
  });
  it('escapes commas and semicolons and uses CRLF line ends', () => {
    expect(ics).toContain('Lists\\, dictionaries\; files');
    expect(ics.split('\r\n').length).toBeGreaterThan(10);
    expect(ics.replace(/\r\n/g, '')).not.toContain('\n');
  });
  it('folds lines to at most 75 bytes', () => {
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});
