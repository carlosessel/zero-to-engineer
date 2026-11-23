// Step-by-step walkthroughs: a picture that changes with each step, a
// sentence explaining the step, the line of code being run and the values of
// its variables. Each lesson runs the real algorithm and records a frame at
// every interesting moment, so the pictures cannot drift from what the code
// does. How to add one: .claude/skills/add-course/references/chapter-standard.md.

/** How an item is drawn. Each maps to a CSS class `t-<tone>`. */
export type Tone = 'base' | 'active' | 'compare' | 'done' | 'dim' | 'found' | 'bad';

export interface Cell {
  /** Stable key: the same item keeps the same key from frame to frame, so it slides rather than jumps. */
  k: string;
  v: string | number;
  tone?: Tone;
}

/** A row of boxes (or bars), or a vertical pile when orient is 'column'. */
export interface CellsPart {
  kind: 'cells';
  id: string;
  label?: string;
  items: Cell[];
  /** Draw bars whose height follows the value (numbers only). */
  bars?: boolean;
  /** Show 0, 1, 2… under each box. */
  indices?: boolean;
  pointers?: { name: string; at: number; tone?: Tone }[];
  orient?: 'row' | 'column';
  /** Text shown when there are no items. */
  empty?: string;
  /** Number of slots to leave room for, so the picture does not change size. */
  slots?: number;
  /** Widest a box may be (default 56), for longer values such as names. */
  width?: number;
}

export interface TableRow {
  k: string;
  cells: string[];
  tone?: Tone;
}

export interface Table {
  id: string;
  title: string;
  columns: string[];
  rows: TableRow[];
}

/** One or more tables side by side. */
export interface TablesPart {
  kind: 'tables';
  id: string;
  tables: Table[];
  /** Rows to leave room for. */
  slots?: number;
}

export interface GraphNode {
  k: string;
  label: string;
  /** Position from 0 to 1 across and down the part. */
  x: number;
  y: number;
  tone?: Tone;
  /** A small tag under the node, such as its distance. */
  note?: string;
}

export interface GraphPart {
  kind: 'graph';
  id: string;
  height: number;
  nodes: GraphNode[];
  /** Lines between nodes. With directed, an arrowhead points at b. A label sits halfway along. */
  edges: { a: string; b: string; tone?: Tone; directed?: boolean; label?: string }[];
}

/** Actors side by side, with messages passed between them, newest at the bottom. */
export interface SeqPart {
  kind: 'seq';
  id: string;
  actors: string[];
  messages: { from: string; to: string; label: string; tone?: Tone }[];
  /** Messages to leave room for. */
  slots?: number;
}

/** Names pointing at values: variables, settings, headers, environment. */
export interface KvPart {
  kind: 'kv';
  id: string;
  label?: string;
  rows: { k: string; name: string; value: string; tone?: Tone }[];
  slots?: number;
}

/** A terminal or console window, showing commands and output. */
export interface TerminalPart {
  kind: 'terminal';
  id: string;
  lines: string[];
  slots?: number;
}

export interface BucketsPart {
  kind: 'buckets';
  id: string;
  buckets: Cell[][];
  /** Which bucket rows to highlight. */
  tones?: Record<number, Tone>;
}

export interface NotePart {
  kind: 'note';
  id: string;
  text: string;
  tone?: Tone;
}

export type Part = CellsPart | TablesPart | GraphPart | BucketsPart | NotePart | SeqPart | KvPart | TerminalPart;

export interface Frame {
  title: string;
  text: string;
  /** Line numbers (from 1) of the code to highlight. */
  lines?: number[];
  vars?: Record<string, string | number>;
  parts: Part[];
}

export interface Example {
  label: string;
}

export interface Lesson {
  id: string;
  title: string;
  /** One sentence under the title. */
  hint: string;
  /** Language label shown over the code, such as "Python" or "SQL". */
  language: string;
  /** Inputs the learner can switch between. The first is shown first. */
  examples: Example[];
  code(example: number): string;
  frames(example: number): Frame[];
}
