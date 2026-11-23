import type { Frame, Lesson } from '../types';

type Op = ['add', string] | ['take'];
export const SCRIPTS: { label: string; ops: Op[] }[] = [
  { label: 'Add three, take one, add one, take two', ops: [['add', 'A'], ['add', 'B'], ['add', 'C'], ['take'], ['add', 'D'], ['take'], ['take']] },
  { label: 'Undo history', ops: [['add', 'type'], ['add', 'bold'], ['add', 'delete'], ['take'], ['take']] },
];

const CODE = `from collections import deque

stack = []          # a list used as a stack
queue = deque()     # a double-ended queue

stack.append(x)     # add to the top
queue.append(x)     # add to the back

stack.pop()         # take from the top: the newest
queue.popleft()     # take from the front: the oldest`;

/** Runs the same operations on a stack and a queue. Exported for the tests. */
export function trace(ops: Op[]): { frames: Frame[]; fromStack: string[]; fromQueue: string[] } {
  const frames: Frame[] = [];
  const stack: { k: string; v: string }[] = [];
  const queue: { k: string; v: string }[] = [];
  const fromStack: { k: string; v: string }[] = [];
  const fromQueue: { k: string; v: string }[] = [];
  const most = Math.max(...ops.map((_, i) => ops.slice(0, i + 1).reduce((n, o) => n + (o[0] === 'add' ? 1 : -1), 0)));
  const taken = ops.filter((o) => o[0] === 'take').length;
  let n = 0;
  const snap = (title: string, text: string, lines: number[], fresh?: string) => {
    frames.push({
      title, text, lines,
      vars: { 'len(stack)': stack.length, 'len(queue)': queue.length },
      parts: [
        { kind: 'cells', id: 's', orient: 'column', label: 'Stack (last in, first out)', slots: most, items: stack.map((c, i) => ({ ...c, tone: c.k === fresh ? 'active' : i === stack.length - 1 ? 'compare' : 'base' })) },
        { kind: 'cells', id: 'q', label: 'Queue (first in, first out): front on the left', slots: Math.max(most, 4), width: 72, empty: 'empty', items: queue.map((c, i) => ({ ...c, tone: c.k === fresh ? 'active' : i === 0 ? 'compare' : 'base' })) },
        { kind: 'cells', id: 'so', label: 'Came out of the stack', slots: Math.max(taken, 4), width: 72, empty: 'nothing yet', items: fromStack.map((c) => ({ ...c, tone: 'done' })) },
        { kind: 'cells', id: 'qo', label: 'Came out of the queue', slots: Math.max(taken, 4), width: 72, empty: 'nothing yet', items: fromQueue.map((c) => ({ ...c, tone: 'done' })) },
      ],
    });
  };
  snap('Two empty containers', 'A stack and a queue both hold items in order. The difference is which item comes out when you take one. We will do exactly the same things to both.', [3, 4]);
  for (const op of ops) {
    if (op[0] === 'add') {
      const k = `i${n++}`;
      stack.push({ k, v: op[1] });
      queue.push({ k, v: op[1] });
      snap(`Add ${op[1]}`, `${op[1]} goes on the top of the stack and on the back of the queue.`, [6, 7], k);
    } else {
      const s = stack.pop()!;
      const q = queue.shift()!;
      fromStack.push(s);
      fromQueue.push(q);
      snap('Take one', s.v === q.v
        ? `Both give ${s.v}: with only one item they cannot differ.`
        : `The stack gives ${s.v}, the newest item. The queue gives ${q.v}, the oldest.`, [9, 10]);
    }
  }
  const sv = fromStack.map((c) => c.v).join(', '), qv = fromQueue.map((c) => c.v).join(', ');
  snap('Same operations, different order', `The stack gave ${sv}; the queue gave ${qv}. Stacks suit undo and the call stack (newest first); queues suit waiting lines and jobs (oldest first).`, [9, 10]);
  return { frames, fromStack: fromStack.map((c) => c.v), fromQueue: fromQueue.map((c) => c.v) };
}

export const lesson: Lesson = {
  id: 'stack-queue',
  title: 'Stack or queue? Watch the order',
  hint: 'The same items go into both. Watch which one comes out each time.',
  language: 'Python',
  examples: SCRIPTS.map(({ label }) => ({ label })),
  code: () => CODE,
  frames: (e) => trace((SCRIPTS[e] ?? SCRIPTS[0]).ops).frames,
};
