import type { Frame, Lesson, Tone } from '../types';

// The towns from the graphs chapter, plus Sheffield to give a second route.
export const NODES: Record<string, [number, number]> = {
  Liverpool: [0, 0.55], Manchester: [0.3, 0.6], Leeds: [0.5, 0.2], Sheffield: [0.55, 0.95],
  York: [0.75, 0.05], Hull: [1, 0.35], Grimsby: [1, 0.95],
};
export const GRAPH: Record<string, string[]> = {
  Liverpool: ['Manchester'],
  Manchester: ['Liverpool', 'Leeds', 'Sheffield'],
  Leeds: ['Manchester', 'York', 'Sheffield'],
  Sheffield: ['Manchester', 'Leeds'],
  York: ['Leeds', 'Hull'],
  Hull: ['York', 'Grimsby'],
  Grimsby: ['Hull'],
};
export const STARTS = ['Liverpool', 'Leeds'];

const CODE = `from collections import deque

def bfs(graph, start):
    distance = {start: 0}
    queue = deque([start])
    order = []
    while queue:
        town = queue.popleft()
        order.append(town)
        for nxt in graph[town]:
            if nxt not in distance:
                distance[nxt] = distance[town] + 1
                queue.append(nxt)
    return order, distance`;

const edgeKey = (a: string, b: string) => [a, b].sort().join('|');
const EDGES = [...new Set(Object.entries(GRAPH).flatMap(([a, ns]) => ns.map((b) => edgeKey(a, b))))].map((k) => k.split('|') as [string, string]);

/** Runs breadth-first search and records each step. Exported for the tests. */
export function trace(start: string): { frames: Frame[]; order: string[]; distance: Record<string, number> } {
  const frames: Frame[] = [];
  const distance: Record<string, number> = { [start]: 0 };
  const queue: string[] = [start];
  const order: string[] = [];
  const total = Object.keys(GRAPH).length;
  const snap = (title: string, text: string, lines: number[], current?: string, looking?: string, vars: Record<string, string | number> = {}) => {
    const tones: Record<string, Tone> = {};
    for (const t of Object.keys(GRAPH)) tones[t] = order.includes(t) ? 'done' : t in distance ? 'compare' : 'base';
    if (current) tones[current] = 'active';
    if (looking && !(looking in tones && tones[looking] === 'done') && looking !== current) tones[looking] = tones[looking] === 'base' ? 'found' : tones[looking];
    frames.push({
      title, text, lines,
      vars: { ...vars, queue: `[${queue.join(', ')}]` },
      parts: [
        {
          kind: 'graph', id: 'g', height: 250,
          nodes: Object.entries(NODES).map(([k, [x, y]]) => ({ k, label: k, x, y, tone: tones[k], note: k in distance ? `${distance[k]} away` : undefined })),
          edges: EDGES.map(([a, b]) => ({ a, b, tone: current && looking && edgeKey(a, b) === edgeKey(current, looking) ? 'active' as Tone : 'base' as Tone })),
        },
        { kind: 'cells', id: 'q', label: 'Queue: front on the left', slots: 4, width: 100, empty: 'empty', items: queue.map((t) => ({ k: t, v: t, tone: 'compare' })) },
        { kind: 'cells', id: 'o', label: 'Visited, in order', slots: total, width: 100, empty: 'none yet', items: order.map((t) => ({ k: t, v: t, tone: 'done' })) },
      ],
    });
  };
  snap('A map of towns', `Each line is a road between two towns. Breadth-first search finds how many roads each town is from ${start}, nearest first.`, [3]);
  snap(`Start at ${start}`, `${start} is 0 roads from itself. It goes into the queue: the list of towns found but not yet explored.`, [4, 5, 6]);
  while (queue.length) {
    const town = queue.shift()!;
    order.push(town);
    snap(`Explore ${town}`, `Take the town at the front of the queue: ${town}, ${distance[town]} ${distance[town] === 1 ? 'road' : 'roads'} away. The queue makes sure nearer towns are always explored before farther ones.`, [7, 8, 9], town, undefined, { town });
    for (const nxt of GRAPH[town]) {
      if (!(nxt in distance)) {
        distance[nxt] = distance[town] + 1;
        queue.push(nxt);
        snap(`New: ${nxt}`, `${nxt} has not been seen before. It is one road further than ${town}: ${distance[nxt]} away. Add it to the back of the queue.`, [10, 11, 12, 13], town, nxt, { town, nxt });
      } else {
        snap(`${nxt} already seen`, `${nxt} already has a distance, which can only be the same or shorter. Skip it, so no town is explored twice.`, [10, 11], town, nxt, { town, nxt });
      }
    }
  }
  snap('Every town reached', `The queue is empty. Each town got its distance the first time it was found, and because the search spreads out one ring at a time, that is the fewest roads. Each town and road was handled once: O(V + E).`, [7, 14]);
  return { frames, order, distance };
}

export const lesson: Lesson = {
  id: 'bfs',
  title: 'Breadth-first search, step by step',
  hint: 'The search spreads out in rings: every town one road away, then two, then three.',
  language: 'Python',
  examples: STARTS.map((s) => ({ label: `Start at ${s}` })),
  code: () => CODE,
  frames: (e) => trace(STARTS[e] ?? STARTS[0]).frames,
};
