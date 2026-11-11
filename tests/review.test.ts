import { describe, expect, it } from 'vitest';
import { empty } from '../src/lib/progress';
import * as R from '../src/lib/review';

const TODAY = '2026-11-11';

describe('dates', () => {
  it('adds days across month and year ends', () => {
    expect(R.addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(R.addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(R.addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(R.addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('uses the local calendar day', () => {
    expect(R.dayOf(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
  it('splits keys even when a chapter id contains a hash-like part', () => {
    expect(R.parseKey(R.reviewKey('big-o', 3))).toEqual({ chapter: 'big-o', question: 3 });
  });
});

describe('answering in a chapter', () => {
  it('schedules a wrong answer for tomorrow in box 1', () => {
    const p = empty();
    R.recordChapterAnswer(p, 'sql', 0, false, TODAY);
    expect(p.review).toEqual({ 'sql#0': { box: 1, due: '2026-11-12' } });
  });
  it('does not schedule a correct answer', () => {
    const p = empty();
    R.recordChapterAnswer(p, 'sql', 0, true, TODAY);
    expect(p.review).toEqual({});
  });
  it('keeps a scheduled question when it is later answered correctly in the chapter', () => {
    const p = empty();
    R.recordChapterAnswer(p, 'sql', 0, false, TODAY);
    R.recordChapterAnswer(p, 'sql', 0, true, TODAY);
    expect(p.review['sql#0']).toBeDefined();
  });
});

describe('answering in review', () => {
  it('walks up the boxes 1, 3, 7, 14, 30 days and then retires', () => {
    const p = empty();
    R.recordChapterAnswer(p, 'sql', 0, false, TODAY);
    let day = TODAY;
    const waits: number[] = [];
    for (;;) {
      day = p.review['sql#0'].due;
      const before = day;
      const result = R.recordReviewAnswer(p, 'sql#0', true, day);
      if (result === 'retired') break;
      const [a, b] = [before, p.review['sql#0'].due].map((d) => Date.parse(d));
      waits.push((b - a) / 86400000);
    }
    expect(waits).toEqual([3, 7, 14, 30]);
    expect(p.review).toEqual({});
  });
  it('sends a wrong answer back to box 1 from any box', () => {
    const p = empty();
    p.review['sql#0'] = { box: 4, due: TODAY };
    expect(R.recordReviewAnswer(p, 'sql#0', false, TODAY)).toBe('reset');
    expect(p.review['sql#0']).toEqual({ box: 1, due: '2026-11-12' });
  });
});

describe('what is due', () => {
  const p = empty();
  p.review = {
    'a#0': { box: 1, due: '2026-11-11' },
    'b#1': { box: 2, due: '2026-11-09' },
    'c#0': { box: 1, due: '2026-11-12' },
    'd#0': { box: 3, due: '2026-11-20' },
  };
  it('lists due and overdue questions, most overdue first', () => {
    expect(R.dueKeys(p, TODAY)).toEqual(['b#1', 'a#0']);
  });
  it('summarises', () => {
    expect(R.summary(p, TODAY)).toEqual({ due: 2, later: 2, next: '2026-11-12' });
    expect(R.summary(empty(), TODAY)).toEqual({ due: 0, later: 0, next: null });
  });
  it('prunes questions that no longer exist', () => {
    const q = empty();
    q.review = { 'a#0': { box: 1, due: TODAY }, 'gone#4': { box: 1, due: TODAY } };
    expect(R.prune(q, (k) => k === 'a#0')).toBe(1);
    expect(Object.keys(q.review)).toEqual(['a#0']);
  });
});
