import { describe, expect, it } from 'vitest';
import { buildDocument } from '../src/lib/playground';
import { showAll, showValue } from '../src/lib/show-value';

describe('showValue', () => {
  it('shows text as it is at the top level and in quotes inside lists', () => {
    expect(showValue('hi')).toBe('hi');
    expect(showValue(['a', 'b'])).toBe('["a", "b"]');
  });
  it('shows numbers, booleans, null and undefined', () => {
    expect([42, 3.5, true, null, undefined, -0, NaN].map(showValue)).toEqual(['42', '3.5', 'true', 'null', 'undefined', '-0', 'NaN']);
    expect(showValue(0.1 + 0.2)).toBe('0.30000000000000004');
  });
  it('shows arrays and objects in a readable way', () => {
    expect(showValue([1, 'two', [3]])).toBe('[1, "two", [3]]');
    expect(showValue({ name: 'Ama', age: 20, 'first name': 'A' })).toBe('{ name: "Ama", age: 20, "first name": "A" }');
    expect(showValue({})).toBe('{}');
    expect(showValue([])).toBe('[]');
  });
  it('shows functions, errors, maps, sets and dates', () => {
    expect(showValue(function greet() {})).toBe('function greet');
    expect(showValue(new TypeError('bad'))).toBe('TypeError: bad');
    expect(showValue(new Map([['a', 1]]))).toBe('Map(1) {"a" => 1}');
    expect(showValue(new Set([1, 2]))).toBe('Set(2) {1, 2}');
    expect(showValue(new Date(Date.UTC(2026, 0, 5)))).toBe('2026-01-05T00:00:00.000Z');
  });
  it('recognises errors, maps and dates made in another sandbox', async () => {
    const vm = await import('node:vm');
    const [err, map, date] = vm.runInNewContext('[new Error("no"), new Map([[1, 2]]), new Date(0)]');
    expect(showValue(err)).toBe('Error: no');
    expect(showValue(map)).toBe('Map(1) {1 => 2}');
    expect(showValue(date)).toBe('1970-01-01T00:00:00.000Z');
  });
  it('does not loop for ever on something that contains itself', () => {
    const a: unknown[] = [1];
    a.push(a);
    expect(showValue(a)).toBe('[1, [circular]]');
  });
  it('joins several values with spaces, like console.log', () => {
    expect(showAll(['Total:', 30, [1, 2]])).toBe('Total: 30 [1, 2]');
  });
});

describe('the copy inside previews', () => {
  it('is the same function', () => {
    const doc = buildDocument({ html: '<p>x</p>', css: '', js: '' }, 'f');
    expect(doc).toContain('var show = function showValue');
  });
});
