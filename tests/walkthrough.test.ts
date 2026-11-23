// @vitest-environment jsdom
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { LESSONS } from '../src/walk/index';
import { renderFrame, renderSvg, stageHeight } from '../src/walk/render';
import { morph } from '../src/walk/player';
import * as bs from '../src/walk/lessons/binary-search';
import * as ins from '../src/walk/lessons/insertion-sort';
import * as sq from '../src/walk/lessons/stack-queue';
import * as ht from '../src/walk/lessons/hash-table';
import * as bfs from '../src/walk/lessons/bfs';
import * as join from '../src/walk/lessons/sql-join';

const python = (code: string) => execFileSync('python3', ['-I', '-c', code], { encoding: 'utf8' }).trim();
let hasPython = true;
try { python('print(1)'); } catch { hasPython = false; }

describe('every walkthrough', () => {
  for (const lesson of Object.values(LESSONS)) {
    lesson.examples.forEach((ex, e) => {
      it(`${lesson.id} / ${ex.label}: frames are well formed`, () => {
        const frames = lesson.frames(e);
        expect(frames.length).toBeGreaterThan(3);
        const lines = lesson.code(e).split('\n').length;
        for (const f of frames) {
          expect(f.title.trim()).not.toBe('');
          expect(f.text.trim()).not.toBe('');
          for (const l of f.lines ?? []) expect(l).toBeGreaterThanOrEqual(1), expect(l).toBeLessThanOrEqual(lines);
          const { body } = renderFrame(f);
          expect(body).not.toMatch(/NaN|undefined|Infinity/);
          // Keys must be unique, or the player would merge two things into one.
          const keys = [...body.matchAll(/data-k="([^"]+)"/g)].map((m) => m[1]);
          expect(new Set(keys).size).toBe(keys.length);
        }
        const svg = renderSvg(frames[0], stageHeight(frames));
        expect(new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('parsererror')).toBeNull();
      });
    });
  }
});

describe('the pictures match what the code really does', () => {
  it('binary search finds what Python finds', () => {
    for (const t of [...bs.TARGETS, 3, 71, 72, 0]) {
      expect(bs.trace(bs.ITEMS, t).result).toBe(bs.ITEMS.indexOf(t));
    }
  });
  it.runIf(hasPython)('binary search: the shown Python gives the same answers', () => {
    const code = LESSONS['binary-search'].code(0);
    const out = python(`${code}\nprint([binary_search(${JSON.stringify(bs.ITEMS)}, t) for t in ${JSON.stringify(bs.TARGETS)}])`);
    expect(out).toBe(`[${bs.TARGETS.map((t) => bs.trace(bs.ITEMS, t).result).join(', ')}]`);
  });
  it('insertion sort sorts, and counts the work honestly', () => {
    for (const { values } of ins.INPUTS) {
      const r = ins.trace(values);
      expect(r.result).toEqual([...values].sort((a, b) => a - b));
      let inversions = 0;
      for (let i = 0; i < values.length; i++) for (let j = i + 1; j < values.length; j++) if (values[i] > values[j]) inversions++;
      expect(r.shifts).toBe(inversions);
    }
  });
  it.runIf(hasPython)('insertion sort: the shown Python sorts the same way', () => {
    const code = LESSONS['insertion-sort'].code(0);
    for (const { values } of ins.INPUTS) expect(python(`${code}\nprint(insertion_sort(${JSON.stringify(values)}))`)).toBe(`[${ins.trace(values).result.join(', ')}]`);
  });
  it('a stack gives newest first and a queue oldest first', () => {
    const r = sq.trace(sq.SCRIPTS[0].ops);
    expect(r.fromStack).toEqual(['C', 'D', 'B']);
    expect(r.fromQueue).toEqual(['A', 'B', 'C']);
  });
  it('the hash table lands keys where the shown Python puts them', () => {
    const r = ht.trace(ht.SCRIPTS[0].ops);
    expect(r.results).toEqual([6, 'KeyError']);
    expect(r.table.flat().find(([k]) => k === 'cat')).toEqual(['cat', 3]);
    // There are collisions to show.
    expect(r.table.some((b) => b.length > 1)).toBe(true);
    if (!hasPython) return;
    const code = LESSONS['hash-table'].code(0);
    const ops = ht.SCRIPTS[0].ops.filter((o) => o[0] === 'put').map((o) => `put(t, ${JSON.stringify(o[1])}, ${o[2]})`).join('\n');
    expect(JSON.parse(python(`${code}\nt = [[] for _ in range(${ht.SIZE})]\n${ops}\nimport json\nprint(json.dumps(t))`))).toEqual(r.table);
  });
  it('breadth-first search gives fewest-road distances', () => {
    for (const start of bfs.STARTS) {
      const r = bfs.trace(start);
      expect(r.order).toHaveLength(Object.keys(bfs.GRAPH).length);
      // Distances never decrease along the visiting order, and every road changes distance by at most one.
      const d = r.order.map((t) => r.distance[t]);
      expect(d).toEqual([...d].sort((a, b) => a - b));
      for (const [a, ns] of Object.entries(bfs.GRAPH)) for (const b of ns) expect(Math.abs(r.distance[a] - r.distance[b])).toBeLessThanOrEqual(1);
      for (const [a, ns] of Object.entries(bfs.GRAPH)) for (const b of ns) expect(bfs.GRAPH[b]).toContain(a);
    }
    expect(bfs.trace('Liverpool').distance.Grimsby).toBe(5);
  });
  it.runIf(hasPython)('breadth-first search: the shown Python visits in the same order', () => {
    const code = LESSONS.bfs.code(0);
    for (const start of bfs.STARTS) {
      const out = python(`${code}\nimport json\nprint(json.dumps(bfs(${JSON.stringify(bfs.GRAPH)}, ${JSON.stringify(start)})))`);
      const r = bfs.trace(start);
      expect(JSON.parse(out)).toEqual([r.order, r.distance]);
    }
  });
  it.runIf(hasPython)('the join gives the rows a real database gives', () => {
    for (const kind of join.KINDS) {
      const sql = LESSONS['sql-join'].code(join.KINDS.indexOf(kind));
      const out = python(`import sqlite3, json
db = sqlite3.connect(':memory:')
db.execute('CREATE TABLE customers (id INTEGER, name TEXT)')
db.execute('CREATE TABLE orders (id INTEGER, customer_id INTEGER, total TEXT)')
db.executemany('INSERT INTO customers VALUES (?, ?)', ${JSON.stringify(join.CUSTOMERS)})
db.executemany('INSERT INTO orders VALUES (?, ?, ?)', ${JSON.stringify(join.ORDERS)})
rows = [[n, 'NULL' if i is None else str(i), 'NULL' if t is None else t] for n, i, t in db.execute(${JSON.stringify(sql)})]
print(json.dumps(sorted(rows)))`);
      expect(JSON.parse(out)).toEqual([...join.trace(kind).rows].sort());
    }
  });
});

describe('morph', () => {
  it('keeps elements with the same key and moves them instead of redrawing', () => {
    document.body.innerHTML = '<svg></svg>';
    const svg = document.querySelector('svg')!;
    const frames = LESSONS['insertion-sort'].frames(0);
    morph(svg, renderFrame(frames[0]).body, 200);
    const bar = svg.querySelector('[data-k="a:v1"]');
    const before = bar!.getAttribute('style');
    const moved = frames.findIndex((f) => renderFrame(f).body.match(/data-k="a:v1"[^>]*style="([^"]+)"/)![1] !== before);
    morph(svg, renderFrame(frames[moved]).body, 200);
    expect(svg.querySelector('[data-k="a:v1"]')).toBe(bar);
    expect(bar!.getAttribute('style')).not.toBe(before);
    expect(svg.innerHTML.match(/data-k=/g)!.length).toBe(renderFrame(frames[moved]).body.match(/data-k=/g)!.length);
  });
});
