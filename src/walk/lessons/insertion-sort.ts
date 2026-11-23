import type { Frame, Lesson, Tone } from '../types';

export const INPUTS: { label: string; values: number[] }[] = [
  { label: 'Mixed up', values: [5, 2, 9, 1, 6, 3] },
  { label: 'Nearly sorted', values: [1, 2, 4, 3, 5, 6] },
  { label: 'Backwards', values: [6, 5, 4, 3, 2, 1] },
];

const CODE = `def insertion_sort(items):
    for i in range(1, len(items)):
        current = items[i]
        j = i - 1
        while j >= 0 and items[j] > current:
            items[j + 1] = items[j]
            j -= 1
        items[j + 1] = current
    return items`;

/** Sorts a copy and records each step. Exported for the tests. */
export function trace(input: number[]): { frames: Frame[]; result: number[]; comparisons: number; shifts: number } {
  const frames: Frame[] = [];
  // Each value keeps a key so the same bar slides when it moves.
  const items = input.map((v, i) => ({ k: `v${i}`, v }));
  let comparisons = 0, shifts = 0;
  let sortedUpTo = 0; // items[0..sortedUpTo] are in order
  const snap = (title: string, text: string, lines: number[], moving = -1, against = -1, vars: Record<string, string | number> = {}) => {
    frames.push({
      title, text, lines,
      vars: { ...vars, comparisons, shifts },
      parts: [{
        kind: 'cells', id: 'a', bars: true, indices: true,
        items: items.map((c, idx) => {
          let t: Tone = idx <= sortedUpTo ? 'done' : 'base';
          if (idx === moving) t = 'active';
          else if (idx === against) t = 'compare';
          return { k: c.k, v: c.v, tone: t };
        }),
      }],
    });
  };

  snap('The cards in your hand', 'Insertion sort works like sorting playing cards: keep a sorted section on the left and slide each new card into its place. One card on its own is already sorted.', [1]);
  for (let i = 1; i < items.length; i++) {
    const current = items[i].v;
    let j = i - 1;
    snap(`Pick up ${current}`, `The next unsorted value is ${current}. We will slide it left until the value before it is not bigger.`, [2, 3, 4], i, -1, { i, current, j });
    let pos = i;
    while (j >= 0) {
      comparisons++;
      if (items[j].v > current) {
        snap(`${items[j].v} > ${current}`, `${items[j].v} is bigger than ${current}, so it moves one place right to make room.`, [5], pos, j, { i, current, j });
        [items[j], items[pos]] = [items[pos], items[j]];
        shifts++;
        pos = j;
        j--;
        snap('Shift right', `${current} now sits at position ${pos}.`, [6, 7], pos, -1, { i, current, j });
      } else {
        snap(`${items[j].v} ≤ ${current}: stop`, `${items[j].v} is not bigger than ${current}, so ${current} is in the right place. No need to look further left: that part is already sorted.`, [5], pos, j, { i, current, j });
        break;
      }
    }
    if (j < 0) snap('Reached the front', `Nothing is left to compare with, so ${current} goes first.`, [5], pos, -1, { i, current, j });
    sortedUpTo = i;
    snap('Drop it in', `The first ${i + 1} values are now in order.`, [8], -1, -1, { i, current, j });
  }
  snap('Sorted', `Done: ${comparisons} comparisons and ${shifts} shifts. Try the other inputs: nearly sorted data needs very few, backwards data needs the most (about n²/2).`, [9]);
  return { frames, result: items.map((c) => c.v), comparisons, shifts };
}

export const lesson: Lesson = {
  id: 'insertion-sort',
  title: 'Insertion sort, step by step',
  hint: 'Watch each value slide left past the bigger ones until it reaches its place.',
  language: 'Python',
  examples: INPUTS.map(({ label }) => ({ label })),
  code: () => CODE,
  frames: (e) => trace((INPUTS[e] ?? INPUTS[0]).values).frames,
};
