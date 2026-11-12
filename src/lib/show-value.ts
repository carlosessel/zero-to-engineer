// How a value printed with console.log is shown under an example.
//
// One function, used in two places so they cannot disagree:
//   - inside example previews (its source is copied into the preview, see playground.ts);
//   - by the tests that run every chapter example (tests/js-blocks.test.ts).
// It must stay self-contained: no imports and no outside variables, because
// its source text is copied into another page.
//
// The style is close to what browser consoles show for simple values:
//   console.log("hi")             -> hi
//   console.log([1, "a", true])   -> [1, "a", true]
//   console.log({ name: "Ama" })  -> { name: "Ama" }
export function showValue(value: unknown): string {
  const seen: unknown[] = [];
  // Checked by type tag rather than instanceof, so values made in another frame or
  // sandbox (where Error, Map and so on are different objects) are still recognised.
  const tag = (v: unknown) => Object.prototype.toString.call(v).slice(8, -1);
  function inner(v: unknown, depth: number): string {
    if (typeof v === 'string') return depth === 0 ? v : JSON.stringify(v);
    if (typeof v === 'number') return Object.is(v, -0) ? '-0' : String(v);
    if (typeof v === 'bigint') return `${v}n`;
    if (v === undefined || v === null || typeof v === 'boolean') return String(v);
    if (typeof v === 'symbol') return v.toString();
    if (typeof v === 'function') return `function ${v.name || '(anonymous)'}`;
    if (typeof Element !== 'undefined' && v instanceof Element) {
      return `<${v.tagName.toLowerCase()}${v.id ? ` id="${v.id}"` : ''}${v.className && typeof v.className === 'string' ? ` class="${v.className}"` : ''}>`;
    }
    if (tag(v) === 'Error') return `${(v as Error).name}: ${(v as Error).message}`;
    if (seen.includes(v)) return '[circular]';
    if (depth > 4) return Array.isArray(v) ? '[…]' : '{…}';
    seen.push(v);
    try {
      if (Array.isArray(v)) return `[${v.map((x) => inner(x, depth + 1)).join(', ')}]`;
      if (tag(v) === 'Map') { const m = v as Map<unknown, unknown>; return `Map(${m.size}) {${[...m].map(([k, x]) => `${inner(k, depth + 1)} => ${inner(x, depth + 1)}`).join(', ')}}`; }
      if (tag(v) === 'Set') { const t = v as Set<unknown>; return `Set(${t.size}) {${[...t].map((x) => inner(x, depth + 1)).join(', ')}}`; }
      if (tag(v) === 'Date') { const d = v as Date; return isNaN(d.getTime()) ? 'Invalid Date' : d.toISOString(); }
      if (tag(v) === 'Promise') return 'Promise {…}';
      const entries = Object.entries(v as Record<string, unknown>);
      if (!entries.length) return '{}';
      const key = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));
      return `{ ${entries.map(([k, x]) => `${key(k)}: ${inner(x, depth + 1)}`).join(', ')} }`;
    } finally {
      seen.pop();
    }
  }
  return inner(value, 0);
}

/**
 * How console.log joins several values: each shown, separated by spaces.
 * Like browsers, a first string containing %s, %d, %i, %f, %o, %O or %c takes
 * the next values in its place (React's warnings are written this way).
 * Self-contained, like showValue, because its source is copied into previews.
 */
export function formatArgs(values: ArrayLike<unknown>, show: (v: unknown) => string): string {
  const rest = Array.prototype.slice.call(values) as unknown[];
  let first = '';
  if (typeof rest[0] === 'string' && /%[sdifoOc]/.test(rest[0] as string)) {
    first = (rest.shift() as string).replace(/%([sdifoOc%])/g, (m, k: string) => {
      if (k === '%') return '%';
      if (!rest.length) return m;
      const v = rest.shift();
      if (k === 'c') return '';
      if (k === 'd' || k === 'i') return String(parseInt(String(v), 10));
      if (k === 'f') return String(parseFloat(String(v)));
      return typeof v === 'string' ? v : show(v);
    });
    return [first, ...rest.map((v) => show(v))].join(' ');
  }
  return rest.map((v) => show(v)).join(' ');
}

export function showAll(values: ArrayLike<unknown>): string {
  return formatArgs(values, showValue);
}
