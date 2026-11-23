import type { Frame, Lesson, Tone } from '../types';

export const ITEMS = [3, 8, 12, 17, 21, 26, 34, 40, 47, 55, 63, 71];
export const TARGETS = [34, 71, 5];

const CODE = `def binary_search(items, target):
    low, high = 0, len(items) - 1
    while low <= high:
        mid = (low + high) // 2
        if items[mid] == target:
            return mid
        if items[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`;

/** Runs binary search and records each step. Exported for the tests. */
export function trace(items: number[], target: number): { frames: Frame[]; result: number } {
  const frames: Frame[] = [];
  let low = 0, high = items.length - 1, mid = -1, checks = 0;
  let found = -1;
  const snap = (title: string, text: string, lines: number[], opts: { mid?: number; tone?: Tone } = {}) => {
    const cells = items.map((v, i) => {
      let t: Tone = i < low || i > high ? 'dim' : 'base';
      if (found === i) t = 'found';
      else if (opts.mid === i) t = opts.tone ?? 'compare';
      return { k: `v${i}`, v, tone: t };
    });
    const pointers = [{ name: 'low', at: low, tone: 'done' as Tone }, { name: 'high', at: high, tone: 'done' as Tone }];
    if (opts.mid !== undefined) pointers.push({ name: 'mid', at: opts.mid, tone: 'active' });
    const vars: Record<string, string | number> = { target, low, high };
    if (opts.mid !== undefined) { vars.mid = opts.mid; vars['items[mid]'] = items[opts.mid]; }
    vars.checks = checks;
    frames.push({
      title, text, lines, vars,
      parts: [
        { kind: 'note', id: 'goal', text: `Looking for ${target}`, tone: found >= 0 ? 'found' : 'base' },
        { kind: 'cells', id: 'a', items: cells, indices: true, pointers },
      ],
    });
  };

  snap('A sorted list', `The list is sorted, smallest first. We want to know where ${target} is, if it is there at all.`, [1]);
  snap('Search the whole list', `At the start the answer could be anywhere, so low points at the first position (0) and high at the last (${high}).`, [2]);
  while (low <= high) {
    mid = Math.floor((low + high) / 2);
    checks++;
    snap('Look in the middle', `Halfway between ${low} and ${high} is position ${mid}, which holds ${items[mid]}.`, [3, 4], { mid });
    if (items[mid] === target) {
      found = mid;
      snap('Found it', `${items[mid]} is the target, so we return its position, ${mid}. It took ${checks} ${checks === 1 ? 'check' : 'checks'} instead of up to ${items.length}.`, [5, 6], { mid });
      return { frames, result: mid };
    }
    if (items[mid] < target) {
      snap('Too small: drop the left half', `${items[mid]} is less than ${target}. The list is sorted, so everything at or before position ${mid} is too small as well.`, [7], { mid, tone: 'bad' });
      low = mid + 1;
      snap('Move low up', `low becomes ${low}. Half of what was left is gone with one comparison.`, [8], { mid, tone: 'dim' });
    } else {
      snap('Too big: drop the right half', `${items[mid]} is more than ${target}, so everything at or after position ${mid} is too big as well.`, [7, 9], { mid, tone: 'bad' });
      high = mid - 1;
      snap('Move high down', `high becomes ${high}. Half of what was left is gone with one comparison.`, [10], { mid, tone: 'dim' });
    }
  }
  snap('Not there', `low (${low}) has passed high (${high}): there is nowhere left to look, so ${target} is not in the list and we return -1. That took ${checks} checks.`, [3, 11]);
  return { frames, result: -1 };
}

export const lesson: Lesson = {
  id: 'binary-search',
  title: 'Binary search, step by step',
  hint: 'Each check looks at the middle of what is left and throws away the half that cannot hold the target.',
  language: 'Python',
  examples: TARGETS.map((t) => ({ label: t === 5 ? `Find ${t} (missing)` : `Find ${t}` })),
  code: () => CODE,
  frames: (e) => trace(ITEMS, TARGETS[e] ?? TARGETS[0]).frames,
};
