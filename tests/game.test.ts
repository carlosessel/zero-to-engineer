import { describe, expect, it } from 'vitest';
import * as G from '../src/lib/game';
import * as P from '../src/lib/progress';

describe('points', () => {
  it('gives points once per thing, so they cannot be farmed', () => {
    const p = P.empty();
    expect(G.earn(p, 'done:intro', '2026-11-12')).toBe(100);
    expect(G.earn(p, 'done:intro', '2026-11-13')).toBe(0);
    expect(G.earn(p, 'check:intro/x1', '2026-11-12')).toBe(15);
    expect(G.earn(p, 'answer:intro#0', '2026-11-12')).toBe(20);
    expect(G.earn(p, 'nonsense:x', '2026-11-12')).toBe(0);
    expect(G.totalPoints(p)).toBe(135);
    expect(G.pointsOn(p, '2026-11-12')).toBe(135);
    expect(G.pointsOn(p, '2026-11-13')).toBe(0);
  });

  it('counts old progress towards the total but not towards any day', () => {
    const p = P.empty();
    p.done.a = true;
    p.checks['a/x1'] = true;
    expect(G.backfill(p)).toBe(true);
    expect(G.backfill(p)).toBe(false);
    expect(G.totalPoints(p)).toBe(115);
    expect([...G.pointsByDay(p).keys()]).toEqual([]);
  });
});

describe('levels', () => {
  it('needs 100 more points for each level than the one before', () => {
    expect([1, 2, 3, 4, 5].map(G.levelStart)).toEqual([0, 100, 300, 600, 1000]);
    expect(G.levelInfo(0)).toMatchObject({ level: 1, title: 'Newcomer', into: 0, needed: 100 });
    expect(G.levelInfo(99).level).toBe(1);
    expect(G.levelInfo(100)).toMatchObject({ level: 2, into: 0, needed: 200 });
    expect(G.levelInfo(450)).toMatchObject({ level: 3, into: 150, needed: 300, fraction: 0.5 });
    expect(G.levelInfo(1_000_000).title).toBe('Legend');
  });
});

describe('streaks', () => {
  const on = (days: string[]) => {
    const p = P.empty();
    days.forEach((d, i) => G.earn(p, `tried:x#${i}`, d));
    return p;
  };

  it('counts days in a row up to today', () => {
    expect(G.streak(on(['2026-11-10', '2026-11-11', '2026-11-12']), '2026-11-12')).toEqual({ current: 3, best: 3, activeToday: true });
  });

  it('stays alive until the end of today if yesterday was active', () => {
    expect(G.streak(on(['2026-11-10', '2026-11-11']), '2026-11-12')).toEqual({ current: 2, best: 2, activeToday: false });
  });

  it('breaks after a missed day, but remembers the best run', () => {
    expect(G.streak(on(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-12']), '2026-11-12')).toEqual({ current: 1, best: 4, activeToday: true });
    expect(G.streak(on(['2026-11-09']), '2026-11-12').current).toBe(0);
  });

  it('crosses month and year ends', () => {
    expect(G.streak(on(['2026-12-31', '2027-01-01']), '2027-01-01').current).toBe(2);
    expect(G.addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('badges', () => {
  it('unlocks each badge once, on the day it is earned', () => {
    const p = P.empty();
    p.done.a = true;
    G.earn(p, 'done:a', '2026-11-12');
    const first = G.unlockBadges(p, G.stats(p, '2026-11-12'), '2026-11-12');
    expect(first.map((b) => b.id)).toEqual(['first-steps']);
    expect(G.unlockBadges(p, G.stats(p, '2026-11-12'), '2026-11-13')).toEqual([]);
    expect(p.badges['first-steps']).toBe('2026-11-12');
  });

  it('knows when a part and a course are finished', () => {
    const p = P.empty();
    p.done.a = true;
    p.done.b = true;
    const courses = [{ id: 'web', parts: [['a', 'b'], ['c']] }, { id: 'ai', parts: [['a']] }];
    const s = G.stats(p, '2026-11-12', courses);
    expect(s).toMatchObject({ partsDone: 2, coursesDone: 1, coursesStarted: 2 });
  });

  it('every badge has a unique id and a way to earn it', () => {
    const ids = G.BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of G.BADGES) expect(b.how.length).toBeGreaterThan(5);
  });
});

describe('saving the game', () => {
  it('keeps points, badges and the goal through export and import', () => {
    const p = P.empty();
    G.earn(p, 'done:a', '2026-11-12');
    p.badges['first-steps'] = '2026-11-12';
    p.goal = 120;
    const back = P.importJson(P.exportJson(p));
    expect(back.ok && back.progress.earned).toEqual({ 'done:a': '2026-11-12' });
    expect(back.ok && back.progress.badges).toEqual({ 'first-steps': '2026-11-12' });
    expect(back.ok && back.progress.goal).toBe(120);
  });

  it('ignores damaged entries and goals that are not offered', () => {
    const r = P.importJson('{"app":"zero-to-engineer","version":3,"done":{},"quiz":{},"checks":{},"review":{},"earned":{"done:a":"yesterday","done:b":"2026-11-12"},"badges":{},"goal":99999}');
    expect(r.ok && r.progress.earned).toEqual({ 'done:b': '2026-11-12' });
    expect(r.ok && r.progress.goal).toBe(P.DEFAULT_GOAL);
  });
});
