// Turns a frame into SVG markup. Pure functions, used both when the page is
// built (so the first step shows without JavaScript) and in the browser.
//
// Every top-level element carries a data-k key that stays the same for the
// same thing from frame to frame. The player uses the keys to move existing
// elements instead of redrawing them, so items glide to their new places.
// Colours come from CSS classes (t-active, t-done…), so both themes work.
import type { BucketsPart, CellsPart, Frame, GraphPart, KvPart, NotePart, Part, SeqPart, TablesPart, TerminalPart, Tone } from './types';

export const WIDTH = 640;

export function esc(s: string | number): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const n2 = (v: number) => Math.round(v * 10) / 10;
const at = (x: number, y: number) => `transform:translate(${n2(x)}px,${n2(y)}px)`;
const tone = (t?: Tone) => `t-${t ?? 'base'}`;
function item(key: string, cls: string, x: number, y: number, body: string, hidden = false): string {
  return `<g data-k="${esc(key)}" class="wk-i ${cls}" style="${at(x, y)}${hidden ? ';opacity:0' : ''}">${body}</g>`;
}
function label(text: string | number, x: number, y: number, anchor = 'start', cls = 'wk-label'): string {
  return `<text x="${n2(x)}" y="${n2(y)}" text-anchor="${anchor}" class="${cls}">${esc(text)}</text>`;
}

function cells(p: CellsPart, y0: number): [string, number] {
  return p.orient === 'column' ? column(p, y0) : row(p, y0);
}

function row(p: CellsPart, y0: number): [string, number] {
  const out: string[] = [];
  const n = Math.max(p.items.length, p.slots ?? 0, 1);
  const size = Math.min(p.width ?? 56, Math.floor((WIDTH - 32) / n) - 8);
  const step = size + 8;
  const x0 = (WIDTH - (n * step - 8)) / 2;
  const top = p.label ? 26 : 6;
  if (p.label) out.push(item(`${p.id}:label`, 'wk-static', x0, y0 + 16, label(p.label, 0, 0)));
  const barMax = 110;
  const boxH = p.bars ? barMax : Math.min(size, 46);
  const max = Math.max(1, ...p.items.map((c) => (typeof c.v === 'number' ? c.v : 0)));
  p.items.forEach((c, i) => {
    const x = x0 + i * step;
    let body: string;
    if (p.bars) {
      const h = Math.max(8, (Number(c.v) / max) * (barMax - 22));
      body = `<rect class="wk-box" x="0" y="${n2(barMax - h)}" width="${size}" height="${n2(h)}" rx="6"/>` + label(c.v, size / 2, barMax - h - 6, 'middle', 'wk-val');
    } else {
      body = `<rect class="wk-box" width="${size}" height="${boxH}" rx="8"/>` + label(c.v, size / 2, boxH / 2 + 5, 'middle', String(c.v).length * 8.6 > size - 8 ? 'wk-val wk-sm' : 'wk-val');
    }
    out.push(item(`${p.id}:${c.k}`, tone(c.tone), x, y0 + top, body));
  });
  if (!p.items.length && p.empty) out.push(item(`${p.id}:empty`, 'wk-static', WIDTH / 2, y0 + top + boxH / 2 + 5, label(p.empty, 0, 0, 'middle', 'wk-muted')));
  let y = y0 + top + boxH;
  if (p.indices) {
    for (let i = 0; i < n; i++) out.push(item(`${p.id}:ix${i}`, 'wk-static', x0 + i * step + size / 2, y + 16, label(i, 0, 0, 'middle', 'wk-index')));
    y += 20;
  }
  if (p.pointers) {
    const seen = new Map<number, number>();
    for (const ptr of p.pointers) {
      const r = seen.get(ptr.at) ?? 0;
      seen.set(ptr.at, r + 1);
      const inside = ptr.at >= 0 && ptr.at < n;
      const cx = x0 + Math.min(Math.max(ptr.at, 0), n - 1) * step + size / 2;
      const body = `<path class="wk-ptr" d="M0 0 l-6 9 h12 z"/>` + label(ptr.name, 0, 23, 'middle', 'wk-ptr-name');
      out.push(item(`${p.id}:p:${ptr.name}`, tone(ptr.tone ?? 'active'), cx, y + 6 + r * 26, body, !inside));
    }
    y += 6 + 2 * 26;
  }
  return [out.join(''), y - y0 + 10];
}

function column(p: CellsPart, y0: number): [string, number] {
  const out: string[] = [];
  const n = Math.max(p.items.length, p.slots ?? 0, 1);
  const w = 150, h = 34, step = h + 6;
  const x = (WIDTH - w) / 2;
  const top = p.label ? 26 : 6;
  if (p.label) out.push(item(`${p.id}:label`, 'wk-static', x, y0 + 16, label(p.label, 0, 0)));
  const bottom = y0 + top + n * step;
  p.items.forEach((c, i) => {
    const body = `<rect class="wk-box" width="${w}" height="${h}" rx="8"/>` + label(c.v, w / 2, h / 2 + 5, 'middle', 'wk-val');
    out.push(item(`${p.id}:${c.k}`, tone(c.tone), x, bottom - (i + 1) * step, body));
  });
  const topY = p.items.length ? bottom - p.items.length * step + h / 2 + 5 : bottom - step + h / 2 + 5;
  out.push(item(`${p.id}:top`, 'wk-static', x + w + 12, topY, label(p.items.length ? '← top' : p.empty ?? 'empty', 0, 0, 'start', 'wk-muted')));
  out.push(item(`${p.id}:floor`, 'wk-static', x - 10, bottom + 2, `<path class="wk-floor" d="M0 0 H${w + 20}"/>`));
  return [out.join(''), bottom - y0 + 14];
}

function tables(p: TablesPart, y0: number): [string, number] {
  const out: string[] = [];
  const gap = 18, k = p.tables.length;
  const w = (WIDTH - 32 - gap * (k - 1)) / k;
  const rowH = 26;
  let most = p.slots ?? 0;
  p.tables.forEach((t, ti) => {
    const x = 16 + ti * (w + gap);
    const colW = w / t.columns.length;
    out.push(item(`${p.id}:${t.id}:title`, 'wk-static', x, y0 + 16, label(t.title, 0, 0)));
    const head = `<rect class="wk-thead" width="${n2(w)}" height="${rowH}" rx="6"/>` + t.columns.map((c, ci) => label(c, ci * colW + 8, 17, 'start', 'wk-th')).join('');
    out.push(item(`${p.id}:${t.id}:head`, 'wk-static', x, y0 + 24, head));
    t.rows.forEach((r, ri) => {
      const body = `<rect class="wk-box" width="${n2(w)}" height="${rowH - 3}" rx="5"/>` + r.cells.map((c, ci) => label(c, ci * colW + 8, 16, 'start', c === 'NULL' ? 'wk-td wk-null' : 'wk-td')).join('');
      out.push(item(`${p.id}:${t.id}:${r.k}`, `wk-row ${tone(r.tone)}`, x, y0 + 24 + rowH + 3 + ri * rowH, body));
    });
    if (!t.rows.length) out.push(item(`${p.id}:${t.id}:empty`, 'wk-static', x + 8, y0 + 24 + rowH + 20, label('no rows yet', 0, 0, 'start', 'wk-muted')));
    most = Math.max(most, t.rows.length, 1);
  });
  return [out.join(''), 24 + rowH + 3 + most * rowH + 10];
}

function graph(p: GraphPart, y0: number): [string, number] {
  const out: string[] = [];
  const pos = new Map(p.nodes.map((nd) => [nd.k, [60 + nd.x * (WIDTH - 120), y0 + 26 + nd.y * (p.height - 60)]]));
  const half = new Map(p.nodes.map((nd) => [nd.k, nodeWidth(nd.label) / 2]));
  const labels: string[] = [];
  for (const e of p.edges) {
    const [ax, ay] = pos.get(e.a)!;
    let [bx, by] = pos.get(e.b)!;
    const key = esc(`${p.id}:e:${e.a}-${e.b}`);
    let head = '';
    if (e.directed) {
      // Stop at the edge of b's box, and draw an arrowhead there.
      const dx = bx - ax, dy = by - ay;
      const t = Math.min(dx ? half.get(e.b)! / Math.abs(dx) : Infinity, dy ? 17 / Math.abs(dy) : Infinity, 1);
      const len = Math.hypot(dx, dy) || 1;
      bx -= dx * t + (dx / len) * 3;
      by -= dy * t + (dy / len) * 3;
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
      head = `<path data-k="${key}:h" class="wk-ahead ${tone(e.tone)}" d="M0 0 l-11 -5.5 v11 z" transform="translate(${n2(bx)} ${n2(by)}) rotate(${n2(ang)})"/>`;
    }
    out.push(`<line data-k="${key}" class="wk-edge ${tone(e.tone)}" x1="${n2(ax)}" y1="${n2(ay)}" x2="${n2(bx)}" y2="${n2(by)}"/>` + head);
    if (e.label) labels.push(item(`${p.id}:el:${e.a}-${e.b}`, `wk-static ${tone(e.tone)}`, (ax + bx) / 2, (ay + by) / 2 + 4, label(e.label, 0, 0, 'middle', 'wk-elabel')));
  }
  for (const nd of p.nodes) {
    const [x, y] = pos.get(nd.k)!;
    const w = nodeWidth(nd.label);
    let body = `<rect class="wk-box" x="${n2(-w / 2)}" y="-16" width="${n2(w)}" height="32" rx="16"/>` + label(nd.label, 0, 5, 'middle', 'wk-val');
    if (nd.note) body += label(nd.note, 0, 32, 'middle', 'wk-note');
    out.push(item(`${p.id}:n:${nd.k}`, tone(nd.tone), x, y, body));
  }
  return [out.join('') + labels.join(''), p.height];
}

const nodeWidth = (text: string) => 20 + text.length * 8.4;

const seqX = (p: SeqPart, name: string) => {
  const gap = (WIDTH - 32) / p.actors.length;
  return 16 + gap * (p.actors.indexOf(name) + 0.5);
};

function seq(p: SeqPart, y0: number): [string, number] {
  const out: string[] = [];
  const rowH = 32;
  const n = Math.max(p.messages.length, p.slots ?? 0, 1);
  const gap = (WIDTH - 32) / p.actors.length;
  const bottom = y0 + 40 + n * rowH + 6;
  p.actors.forEach((a) => {
    const x = seqX(p, a);
    const w = Math.min(gap - 10, nodeWidth(a));
    out.push(item(`${p.id}:a:${a}`, 'wk-static', x, y0 + 4, `<path class="wk-life" d="M0 28 V${n2(bottom - y0 - 4)}"/><rect class="wk-box" x="${n2(-w / 2)}" width="${n2(w)}" height="28" rx="8"/>` + label(a, 0, 19, 'middle', 'wk-val')));
  });
  p.messages.forEach((m, i) => {
    const y = y0 + 40 + i * rowH + 20;
    const ax = seqX(p, m.from), bx = seqX(p, m.to);
    let body: string;
    if (ax === bx) {
      body = `<path class="wk-msg" d="M0 -6 h26 v12 h-20" fill="none"/><path class="wk-mhead" d="M0 6 l9 -4.5 v9 z"/>` + label(m.label, 32, 4, 'start', 'wk-mlabel');
    } else {
      const d = bx - ax, s = Math.sign(d);
      body = `<path class="wk-msg" d="M${s * 4} 0 H${n2(d - s * 12)}"/><path class="wk-mhead" d="M${n2(d - s * 3)} 0 l${-s * 11} -5.5 v11 z"/>` + label(m.label, d / 2, -6, 'middle', 'wk-mlabel');
    }
    out.push(item(`${p.id}:m${i}`, tone(m.tone), ax, y, body));
  });
  return [out.join(''), bottom - y0 + 6];
}

function kv(p: KvPart, y0: number): [string, number] {
  const out: string[] = [];
  const rowH = 38, nameW = 190, valX = 250, valW = WIDTH - 16 - valX;
  const top = p.label ? 26 : 4;
  if (p.label) out.push(item(`${p.id}:label`, 'wk-static', 16, y0 + 16, label(p.label, 0, 0)));
  p.rows.forEach((r, i) => {
    const body = `<rect class="wk-box" width="${nameW}" height="30" rx="7"/>` + label(r.name, 12, 20, 'start', 'wk-val') +
      `<path class="wk-link" d="M${nameW + 4} 15 H${valX - 22}"/><path class="wk-ptr" d="M${valX - 12} 15 l-10 -5 v10 z"/>` +
      `<rect class="wk-box wk-valbox" x="${valX - 16}" width="${valW}" height="30" rx="7"/>` + label(r.value, valX - 4, 20, 'start', 'wk-val');
    out.push(item(`${p.id}:${r.k}`, tone(r.tone), 16, y0 + top + i * rowH, body));
  });
  const n = Math.max(p.rows.length, p.slots ?? 0, 1);
  if (!p.rows.length) out.push(item(`${p.id}:empty`, 'wk-static', 16, y0 + top + 20, label('nothing yet', 0, 0, 'start', 'wk-muted')));
  return [out.join(''), top + n * rowH + 4];
}

function terminal(p: TerminalPart, y0: number): [string, number] {
  const out: string[] = [];
  const n = Math.max(p.lines.length, p.slots ?? 0, 1);
  const h = 20 + n * 20;
  out.push(item(`${p.id}:bg`, 'wk-static', 16, y0 + 2, `<rect class="wk-term" width="${WIDTH - 32}" height="${h}" rx="10"/>`));
  p.lines.forEach((l, i) => {
    const prompt = l.startsWith('$ ') || l.startsWith('> ') || l.startsWith('>>> ');
    out.push(item(`${p.id}:l${i}`, 'wk-static', 30, y0 + 2 + 24 + i * 20, label(l, 0, 0, 'start', prompt ? 'wk-tline wk-tcmd' : 'wk-tline')));
  });
  return [out.join(''), h + 6];
}

function buckets(p: BucketsPart, y0: number): [string, number] {
  const out: string[] = [];
  const rowH = 40, entryW = 96, gap = 22;
  p.buckets.forEach((b, i) => {
    const y = y0 + 4 + i * rowH;
    const idx = `<rect class="wk-box" width="40" height="30" rx="6"/>` + label(i, 20, 20, 'middle', 'wk-val');
    out.push(item(`${p.id}:b${i}`, `wk-bucket ${tone(p.tones?.[i])}`, 16, y, idx));
    b.forEach((c, j) => {
      const body = `<path class="wk-link" d="M${-gap} 15 H-4"/><path class="wk-ptr" d="M-4 15 l-6 -4 v8 z"/>` +
        `<rect class="wk-box" width="${entryW}" height="30" rx="6"/>` + label(c.v, entryW / 2, 20, 'middle', 'wk-val');
      out.push(item(`${p.id}:${c.k}`, tone(c.tone), 16 + 40 + gap + j * (entryW + gap), y, body));
    });
  });
  return [out.join(''), 8 + p.buckets.length * rowH];
}

function note(p: NotePart, y0: number): [string, number] {
  return [item(`${p.id}:note`, tone(p.tone), WIDTH / 2, y0 + 20, label(p.text, 0, 0, 'middle', 'wk-note-text')), 32];
}

function part(p: Part, y: number): [string, number] {
  switch (p.kind) {
    case 'cells': return cells(p, y);
    case 'tables': return tables(p, y);
    case 'graph': return graph(p, y);
    case 'buckets': return buckets(p, y);
    case 'note': return note(p, y);
    case 'seq': return seq(p, y);
    case 'kv': return kv(p, y);
    case 'terminal': return terminal(p, y);
  }
}

/** The inside of the picture and its height. */
export function renderFrame(frame: Frame): { body: string; height: number } {
  let y = 8;
  const out: string[] = [];
  for (const p of frame.parts) {
    const [svg, h] = part(p, y);
    out.push(svg);
    y += h + 6;
  }
  return { body: out.join(''), height: Math.ceil(y + 4) };
}

/** The highest height over all frames, so the picture does not change size as you step. */
export function stageHeight(frames: Frame[]): number {
  return Math.max(...frames.map((f) => renderFrame(f).height));
}

export function renderSvg(frame: Frame, height: number): string {
  const { body } = renderFrame(frame);
  return `<svg class="wk-svg" viewBox="0 0 ${WIDTH} ${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
}

/** The code as HTML, one span per line, ready to highlight. */
export function renderCode(code: string): string {
  return code.split('\n').map((l, i) => `<span class="wk-line" data-line="${i + 1}">${esc(l) || ' '}</span>`).join('');
}

/**
 * Problems a reader would see: text too long for its box, nodes off the
 * edge, a message to an actor that does not exist. Used by the tests so
 * every walkthrough stays readable.
 */
export function lint(frame: Frame): string[] {
  const out: string[] = [];
  const fits = (text: string | number, room: number, per: number, where: string) => {
    if (String(text).length * per > room) out.push(`${where}: "${text}" is too long (${String(text).length} characters, room for ${Math.floor(room / per)})`);
  };
  for (const p of frame.parts) {
    const where = `${p.kind} "${p.id}"`;
    switch (p.kind) {
      case 'cells': {
        if (p.orient === 'column') { p.items.forEach((c) => fits(c.v, 142, 8.4, where)); break; }
        const n = Math.max(p.items.length, p.slots ?? 0, 1);
        const size = Math.min(p.width ?? 56, Math.floor((WIDTH - 32) / n) - 8);
        p.items.forEach((c) => fits(c.v, size - 2, String(c.v).length * 8.6 > size - 8 ? 7 : 8.4, where));
        break;
      }
      case 'tables':
        for (const t of p.tables) {
          const colW = (WIDTH - 32 - 18 * (p.tables.length - 1)) / p.tables.length / t.columns.length;
          [t.columns, ...t.rows.map((r) => r.cells)].forEach((cells) => {
            if (cells.length !== t.columns.length) out.push(`${where}: a row in "${t.title}" has ${cells.length} cells for ${t.columns.length} columns`);
            cells.forEach((c) => fits(c, colW - 10, 7.6, where));
          });
          fits(t.title, (WIDTH - 32) / p.tables.length, 7.8, where);
        }
        break;
      case 'graph': {
        const keys = new Set(p.nodes.map((nd) => nd.k));
        if (keys.size !== p.nodes.length) out.push(`${where}: two nodes share a key`);
        for (const nd of p.nodes) {
          const cx = 60 + nd.x * (WIDTH - 120), w = nodeWidth(nd.label);
          if (cx - w / 2 < 2 || cx + w / 2 > WIDTH - 2) out.push(`${where}: node "${nd.label}" sticks out of the picture (x = ${nd.x})`);
          if (nd.x < 0 || nd.x > 1 || nd.y < 0 || nd.y > 1) out.push(`${where}: node "${nd.label}" has x or y outside 0 to 1`);
          if (nd.note) fits(nd.note, 160, 6.6, where);
        }
        for (let i = 0; i < p.nodes.length; i++) for (let j = i + 1; j < p.nodes.length; j++) {
          const a = p.nodes[i], b = p.nodes[j];
          const dx = Math.abs(a.x - b.x) * (WIDTH - 120), dy = Math.abs(a.y - b.y) * (p.height - 60);
          if (dx < (nodeWidth(a.label) + nodeWidth(b.label)) / 2 + 4 && dy < (a.note || b.note ? 50 : 36)) out.push(`${where}: nodes "${a.label}" and "${b.label}" overlap`);
        }
        for (const e of p.edges) {
          if (!keys.has(e.a) || !keys.has(e.b)) out.push(`${where}: edge ${e.a} → ${e.b} names a node that does not exist`);
          if (e.label) fits(e.label, 200, 7, where);
        }
        break;
      }
      case 'seq':
        for (const m of p.messages) {
          if (!p.actors.includes(m.from) || !p.actors.includes(m.to)) { out.push(`${where}: message "${m.label}" names an actor that does not exist`); continue; }
          const room = m.from === m.to ? WIDTH - 16 - seqX(p, m.from) - 36 : Math.abs(seqX(p, m.to) - seqX(p, m.from)) + 40;
          fits(m.label, room, 7, where);
        }
        p.actors.forEach((a) => fits(a, (WIDTH - 32) / p.actors.length - 14, 8.4, where));
        break;
      case 'kv':
        for (const r of p.rows) { fits(r.name, 170, 8.4, where); fits(r.value, WIDTH - 16 - 250 - 6, 8.4, where); }
        break;
      case 'terminal':
        p.lines.forEach((l) => fits(l, WIDTH - 56, 7.8, where));
        break;
      case 'note':
        fits(p.text, WIDTH - 20, 8.4, where);
        break;
      case 'buckets':
        p.buckets.flat().forEach((c) => fits(c.v, 92, 8.4, where));
        break;
    }
  }
  return out;
}
