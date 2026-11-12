import { describe, expect, it } from 'vitest';
import * as P from '../src/lib/progress';

function fakeStorage(initial: Record<string, string> = {}): P.StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => void (data[k] = v),
    removeItem: (k) => void delete data[k],
  };
}

describe('saving and loading', () => {
  it('starts empty when nothing is stored', () => {
    expect(P.load(fakeStorage())).toEqual(P.empty());
  });

  it('survives a round trip through storage', () => {
    const s = fakeStorage();
    const p = P.empty();
    P.setDone(p, 'python-basics', true);
    P.setCheck(p, 'python-basics', 'pb1', true);
    P.setAnswer(p, 'python-basics', 2, 1);
    expect(P.save(s, p, new Date('2026-11-11T10:00:00Z'))).toBe(true);
    const again = P.load(s);
    expect(again.done).toEqual({ 'python-basics': true });
    expect(P.isChecked(again, 'python-basics', 'pb1')).toBe(true);
    expect(again.quiz['python-basics']).toEqual([null, null, 1]);
    expect(again.updated).toBe('2026-11-11T10:00:00.000Z');
  });

  it('starts empty instead of crashing when the stored record is damaged', () => {
    expect(P.load(fakeStorage({ [P.STORAGE_KEY]: '{not json' }))).toEqual(P.empty());
    expect(P.load(fakeStorage({ [P.STORAGE_KEY]: '{"version":99}' }))).toEqual(P.empty());
  });

  it('upgrades a stored version 1 record', () => {
    const s = fakeStorage({ [P.STORAGE_KEY]: '{"version":1,"done":{"a":true},"quiz":{},"checks":{}}' });
    expect(P.load(s)).toEqual({ ...P.empty(), done: { a: true } });
  });

  it('reports failure when the browser refuses to store', () => {
    const s = fakeStorage();
    s.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    expect(P.save(s, P.empty())).toBe(false);
  });

  it('clear removes the record', () => {
    const s = fakeStorage();
    P.save(s, P.empty());
    P.clear(s);
    expect(s.data).toEqual({});
  });
});

describe('changing progress', () => {
  it('marks and unmarks a chapter', () => {
    const p = P.empty();
    P.setDone(p, 'a', true);
    P.setDone(p, 'b', true);
    P.setDone(p, 'a', false);
    expect(p.done).toEqual({ b: true });
  });

  it('keeps exercise ticks separate per chapter, even with the same key', () => {
    const p = P.empty();
    P.setCheck(p, 'ai-projects', 'pj1', true);
    expect(P.isChecked(p, 'ai-projects', 'pj1')).toBe(true);
    expect(P.isChecked(p, 'se-projects', 'pj1')).toBe(false);
    P.setCheck(p, 'ai-projects', 'pj1', false);
    expect(p.checks).toEqual({});
  });

  it('a later answer replaces an earlier one', () => {
    const p = P.empty();
    P.setAnswer(p, 'c', 0, 2);
    P.setAnswer(p, 'c', 0, 1);
    expect(p.quiz.c).toEqual([1]);
  });

  it('counts finished chapters for one course only', () => {
    const p = P.empty();
    P.setDone(p, 'shared', true);
    P.setDone(p, 'other-course-only', true);
    expect(P.countDone(p, ['shared', 'x', 'y'])).toEqual({ done: 1, total: 3 });
  });
});

describe('quiz scoring', () => {
  it('counts answered and correct questions', () => {
    expect(P.quizScore([1, 0, null], [1, 2, 0])).toEqual({ answered: 2, correct: 1, total: 3 });
  });
  it('handles a quiz that was never opened', () => {
    expect(P.quizScore(undefined, [0, 1])).toEqual({ answered: 0, correct: 0, total: 2 });
  });
});

describe('export and import', () => {
  it('imports exactly what was exported', () => {
    const p = P.empty();
    P.setDone(p, 'sql', true);
    P.setCheck(p, 'sql', 'sq2', true);
    P.setAnswer(p, 'sql', 1, 0);
    p.updated = '2026-11-11T10:00:00.000Z';
    const result = P.importJson(P.exportJson(p));
    expect(result).toEqual({ ok: true, progress: p });
  });

  it.each([
    ['not JSON at all', 'hello'],
    ['JSON from somewhere else', '{"name":"package"}'],
    ['a list', '[1,2,3]'],
    ['a future version', '{"app":"zero-to-engineer","version":4,"done":{},"quiz":{},"checks":{},"review":{}}'],
    ['a version 2 file with no review section', '{"app":"zero-to-engineer","version":2,"done":{},"quiz":{},"checks":{}}'],
    ['a missing section', '{"app":"zero-to-engineer","version":1,"done":{},"checks":{}}'],
    ['damaged quiz answers', '{"app":"zero-to-engineer","version":1,"done":{},"quiz":{"a":"x"},"checks":{}}'],
  ])('rejects %s with a message', (_name, text) => {
    const result = P.importJson(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThan(10);
  });

  it('reads a version 1 file, starting the review queue and planner empty', () => {
    const result = P.importJson('{"app":"zero-to-engineer","version":1,"done":{"a":true},"quiz":{"a":[1]},"checks":{"a/k":true}}');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.progress).toEqual({ ...P.empty(), done: { a: true }, quiz: { a: [1] }, checks: { 'a/k': true } });
  });

  it('keeps the review queue and planner settings, dropping damaged entries', () => {
    const p = P.empty();
    p.review = { 'sql#0': { box: 2, due: '2026-11-14' } };
    p.planner = { course: 'ai', hoursPerWeek: 8, start: '2026-11-16' };
    const result = P.importJson(P.exportJson(p));
    expect(result).toEqual({ ok: true, progress: p });
    const bad = P.importJson('{"app":"zero-to-engineer","version":2,"done":{},"quiz":{},"checks":{},"review":{"a#0":{"box":9,"due":"2026-11-14"},"b#0":{"box":1,"due":"tomorrow"},"c#0":{"box":1,"due":"2026-11-14"}},"planner":{"course":"ai","hoursPerWeek":-1,"start":"2026-11-16"}}');
    expect(bad.ok && bad.progress.review).toEqual({ 'c#0': { box: 1, due: '2026-11-14' } });
    expect(bad.ok && bad.progress.planner).toBeNull();
  });

  it('drops values that are not what they should be', () => {
    const text = '{"app":"zero-to-engineer","version":1,"done":{"a":true,"b":"yes","c":false},"quiz":{"a":[0,-1,"2",1.5,3]},"checks":{"a/k":true,"a/j":1}}';
    const result = P.importJson(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.progress.done).toEqual({ a: true });
      expect(result.progress.quiz.a).toEqual([0, null, null, null, 3]);
      expect(result.progress.checks).toEqual({ 'a/k': true });
    }
  });
});
