// Walkthroughs written as data, in content/chapters/<id>/walkthrough.yaml.
//
// Algorithms are best written as code that runs and records itself (see
// src/walk/lessons/). Most other ideas (an HTTP request, a Git branch, a
// container starting, a prompt becoming tokens) are a story told in steps,
// and are easier to write as YAML. The format:
//
//   - id: http-request              # unique across the site; use it in the chapter as <Walkthrough name="http-request" />
//     title: What happens when you load a page
//     hint: One sentence under the title.
//     language: HTTP                # optional label over the code
//     code: |                       # optional; steps highlight its lines
//       GET / HTTP/1.1
//     steps:
//       - title: Short step title
//         text: One to three sentences.
//         lines: [1]                # optional
//         vars: { status: 200 }     # optional; carried forward until changed ({} clears)
//         parts:                    # carried forward; a part replaces the one with the same id
//           - { kind: seq, id: s, actors: [Browser, Server], messages: [...] }
//           - { id: old, remove: true }
//
//   Instead of steps, a lesson may have examples: [{ label, code?, steps }]
//   to let the learner switch between versions of the same story.
//
// Keys: items in cells, rows in kv and tables, and nodes in graphs keep
// their identity between steps by a key k. When k is left out it defaults
// to the value, name, first cell or label, which is usually what you want.
import { parse } from 'yaml';
import type { Frame, Lesson, Part } from './types';

const KINDS = new Set(['cells', 'tables', 'graph', 'buckets', 'note', 'seq', 'kv', 'terminal']);
const TONES = new Set(['base', 'active', 'compare', 'done', 'dim', 'found', 'bad']);

interface RawStep { title?: unknown; text?: unknown; lines?: unknown; vars?: unknown; parts?: unknown }
interface RawExample { label?: unknown; code?: unknown; steps?: unknown }
interface RawLesson { id?: unknown; title?: unknown; hint?: unknown; language?: unknown; code?: unknown; steps?: unknown; examples?: unknown }

export interface DataLesson extends Lesson {
  chapter: string;
  /** All frames and code for every example, for the page to embed. */
  data: { codes: string[]; frames: Frame[][] };
}

const str = (v: unknown) => typeof v === 'string' && v.trim() !== '';

/** Fills in default keys so items slide between steps. */
function normalisePart(raw: Record<string, unknown>, where: string, errors: string[]): Part | null {
  const p = { ...raw } as Record<string, any>;
  if (!str(p.id)) { errors.push(`${where}: a part needs an id`); return null; }
  if (!KINDS.has(p.kind)) { errors.push(`${where}: part "${p.id}" has unknown kind "${p.kind}" (use ${[...KINDS].join(', ')})`); return null; }
  const uniq = (base: string, seen: Map<string, number>) => {
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n ? `${base}#${n}` : base;
  };
  const checkTone = (t: unknown, what: string) => { if (t !== undefined && !TONES.has(t as string)) errors.push(`${where}: ${what} has unknown tone "${t}" (use ${[...TONES].join(', ')})`); };
  checkTone(p.tone, `part "${p.id}"`);
  const list = (name: string) => {
    if (p[name] === undefined) p[name] = [];
    if (!Array.isArray(p[name])) { errors.push(`${where}: part "${p.id}" needs ${name} to be a list`); p[name] = []; }
    return p[name] as any[];
  };
  switch (p.kind) {
    case 'cells': {
      const seen = new Map<string, number>();
      p.items = list('items').map((c) => {
        const cell = typeof c === 'object' && c !== null ? { ...c } : { v: c };
        if (cell.v === undefined || cell.v === null) errors.push(`${where}: a cell in "${p.id}" has no value v`);
        checkTone(cell.tone, `a cell in "${p.id}"`);
        cell.k = String(cell.k ?? uniq(String(cell.v), seen));
        return cell;
      });
      for (const ptr of p.pointers ?? []) checkTone(ptr.tone, `pointer "${ptr.name}"`);
      break;
    }
    case 'kv': {
      const seen = new Map<string, number>();
      p.rows = list('rows').map((r) => {
        if (!str(r?.name) || r.value === undefined) errors.push(`${where}: a row in kv "${p.id}" needs a name and a value`);
        checkTone(r?.tone, `row "${r?.name}"`);
        return { ...r, value: String(r?.value ?? ''), k: String(r?.k ?? uniq(String(r?.name), seen)) };
      });
      break;
    }
    case 'tables':
      p.tables = list('tables').map((t) => {
        const seen = new Map<string, number>();
        if (!str(t?.id) || !str(t?.title) || !Array.isArray(t?.columns)) errors.push(`${where}: each table in "${p.id}" needs an id, a title and columns`);
        return {
          ...t,
          columns: (t?.columns ?? []).map(String),
          rows: (t?.rows ?? []).map((r: any) => {
            const row = Array.isArray(r) ? { cells: r } : { ...r };
            row.cells = (row.cells ?? []).map((c: unknown) => (c === null ? 'NULL' : String(c)));
            checkTone(row.tone, `a row in "${t?.title}"`);
            row.k = String(row.k ?? uniq(String(row.cells[0]), seen));
            return row;
          }),
        };
      });
      break;
    case 'graph':
      if (typeof p.height !== 'number') p.height = 240;
      p.nodes = list('nodes').map((nd) => {
        if (!str(nd?.label) || typeof nd?.x !== 'number' || typeof nd?.y !== 'number') errors.push(`${where}: a node in graph "${p.id}" needs a label, x and y`);
        checkTone(nd?.tone, `node "${nd?.label}"`);
        return { ...nd, k: String(nd?.k ?? nd?.label) };
      });
      p.edges = list('edges').map((e) => { checkTone(e?.tone, `edge ${e?.a} → ${e?.b}`); return { ...e, a: String(e?.a), b: String(e?.b) }; });
      break;
    case 'seq':
      if (!Array.isArray(p.actors) || !p.actors.length) errors.push(`${where}: seq "${p.id}" needs actors`);
      p.actors = (p.actors ?? []).map(String);
      p.messages = list('messages').map((m) => {
        if (!str(m?.from) || !str(m?.to) || !str(m?.label)) errors.push(`${where}: a message in seq "${p.id}" needs from, to and label`);
        checkTone(m?.tone, `message "${m?.label}"`);
        return m;
      });
      break;
    case 'terminal':
      p.lines = list('lines').map(String);
      break;
    case 'note':
      if (!str(p.text)) errors.push(`${where}: note "${p.id}" needs text`);
      break;
    case 'buckets':
      p.buckets = list('buckets').map((b: any[], i: number) => (b ?? []).map((c: any, j: number) => (typeof c === 'object' ? { k: `b${i}-${j}`, ...c } : { k: String(c), v: c })));
      break;
  }
  return p as Part;
}

function buildFrames(steps: unknown, where: string, errors: string[]): Frame[] {
  if (!Array.isArray(steps) || steps.length < 2) { errors.push(`${where}: needs a list of at least two steps`); return []; }
  let parts: Part[] = [];
  let vars: Record<string, string | number> = {};
  return (steps as RawStep[]).map((s, i) => {
    const at = `${where}, step ${i + 1}`;
    if (!str(s?.title) || !str(s?.text)) errors.push(`${at}: needs a title and text`);
    if (s?.vars !== undefined) {
      if (typeof s.vars !== 'object' || s.vars === null || Array.isArray(s.vars)) errors.push(`${at}: vars must be a map of names to values`);
      else vars = Object.fromEntries(Object.entries(s.vars).map(([k, v]) => [k, typeof v === 'number' ? v : String(v)]));
    }
    if (s?.parts !== undefined) {
      if (!Array.isArray(s.parts)) errors.push(`${at}: parts must be a list`);
      else {
        parts = [...parts];
        for (const raw of s.parts as Record<string, unknown>[]) {
          const idx = parts.findIndex((p) => p.id === raw?.id);
          if (raw?.remove) {
            if (idx < 0) errors.push(`${at}: cannot remove part "${raw.id}": there is no such part`);
            else parts.splice(idx, 1);
            continue;
          }
          const p = normalisePart(raw ?? {}, at, errors);
          if (!p) continue;
          if (idx >= 0) parts[idx] = p;
          else parts.push(p);
        }
      }
    }
    if (!parts.length) errors.push(`${at}: has nothing to show (no parts so far)`);
    let lines: number[] | undefined;
    if (s?.lines !== undefined) {
      if (!Array.isArray(s.lines) || !s.lines.every((n) => Number.isInteger(n))) errors.push(`${at}: lines must be a list of line numbers`);
      else lines = s.lines as number[];
    }
    return { title: String(s?.title ?? ''), text: String(s?.text ?? '').trim(), lines, vars, parts };
  });
}

/** Reads one chapter's walkthrough.yaml. Problems are collected in errors rather than thrown, so a test can list them all. */
export function parseLessons(raw: string, chapter: string, errors: string[] = []): DataLesson[] {
  let doc: unknown;
  try { doc = parse(raw); } catch (e) { errors.push(`${chapter}/walkthrough.yaml: not valid YAML: ${(e as Error).message}`); return []; }
  if (!Array.isArray(doc)) { errors.push(`${chapter}/walkthrough.yaml: must be a list of walkthroughs`); return []; }
  return (doc as RawLesson[]).map((l, li) => {
    const where = `${chapter}/walkthrough.yaml, ${str(l?.id) ? `"${l.id}"` : `walkthrough ${li + 1}`}`;
    if (!str(l?.id) || !/^[a-z0-9-]+$/.test(String(l?.id))) errors.push(`${where}: needs an id of lower-case letters, digits and hyphens`);
    if (!str(l?.title) || !str(l?.hint)) errors.push(`${where}: needs a title and a hint`);
    const examples: { label: string; code: string; frames: Frame[] }[] = [];
    if (l?.examples !== undefined) {
      if (!Array.isArray(l.examples) || !l.examples.length) errors.push(`${where}: examples must be a non-empty list`);
      else (l.examples as RawExample[]).forEach((ex, ei) => {
        if (!str(ex?.label)) errors.push(`${where}, example ${ei + 1}: needs a label`);
        examples.push({ label: String(ex?.label ?? ''), code: String(ex?.code ?? l.code ?? '').replace(/\n$/, ''), frames: buildFrames(ex?.steps, `${where}, example "${ex?.label}"`, errors) });
      });
      if (l.steps !== undefined) errors.push(`${where}: has both steps and examples; use one`);
    } else {
      examples.push({ label: 'Walkthrough', code: String(l?.code ?? '').replace(/\n$/, ''), frames: buildFrames(l?.steps, where, errors) });
    }
    examples.forEach((ex) => {
      const n = ex.code ? ex.code.split('\n').length : 0;
      ex.frames.forEach((f, fi) => (f.lines ?? []).forEach((ln) => {
        if (ln < 1 || ln > n) errors.push(`${where}, step ${fi + 1}: line ${ln} is not in the code (it has ${n} lines)`);
      }));
    });
    return {
      id: String(l?.id ?? ''),
      chapter,
      title: String(l?.title ?? ''),
      hint: String(l?.hint ?? ''),
      language: String(l?.language ?? ''),
      examples: examples.map(({ label }) => ({ label })),
      code: (e: number) => examples[e]?.code ?? '',
      frames: (e: number) => examples[e]?.frames ?? [],
      data: { codes: examples.map((x) => x.code), frames: examples.map((x) => x.frames) },
    };
  });
}
