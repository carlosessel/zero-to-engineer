import type { Frame, Lesson, Tone } from '../types';

// Made-up rows in the style of the databases course.
export const CUSTOMERS: [number, string][] = [[1, 'Ama'], [2, 'Kofi'], [3, 'Esi'], [4, 'Yaa']];
export const ORDERS: [number, number, string][] = [[10, 1, '12.50'], [11, 3, '4.00'], [12, 1, '7.25'], [13, 2, '9.90']];
export const KINDS = ['LEFT', 'INNER'] as const;

const code = (kind: string) => `SELECT c.name, o.id, o.total
FROM customers AS c
${kind} JOIN orders AS o
  ON o.customer_id = c.id;`;

/** Runs the join the way you can picture it, one left row at a time. Exported for the tests. */
export function trace(kind: 'LEFT' | 'INNER'): { frames: Frame[]; rows: string[][] } {
  const frames: Frame[] = [];
  const result: { k: string; cells: string[] }[] = [];
  const snap = (title: string, text: string, lines: number[], left?: number, right?: number, rightTone: Tone = 'compare', fresh?: string, vars: Record<string, string | number> = {}) => {
    frames.push({
      title, text, lines, vars: { ...vars, 'result rows': result.length },
      parts: [
        {
          kind: 'tables', id: 'in', slots: 4, tables: [
            { id: 'c', title: 'customers (c)', columns: ['id', 'name'], rows: CUSTOMERS.map(([id, name], i) => ({ k: `c${id}`, cells: [String(id), name], tone: i === left ? 'active' : left !== undefined && i < left ? 'dim' : 'base' })) },
            { id: 'o', title: 'orders (o)', columns: ['id', 'customer_id', 'total'], rows: ORDERS.map(([id, cid, total], i) => ({ k: `o${id}`, cells: [String(id), String(cid), total], tone: i === right ? rightTone : 'base' })) },
          ],
        },
        {
          kind: 'tables', id: 'out', slots: 5, tables: [
            { id: 'r', title: 'result', columns: ['c.name', 'o.id', 'o.total'], rows: result.map((r) => ({ ...r, tone: r.k === fresh ? (r.cells[1] === 'NULL' ? 'bad' : 'found') : 'base' })) },
          ],
        },
      ],
    });
  };
  snap(`${kind} JOIN`, kind === 'LEFT'
    ? 'A LEFT JOIN pairs each customer with their orders, and keeps every customer even if they have no orders.'
    : 'An INNER JOIN (plain JOIN) pairs each customer with their orders, and keeps only the pairs that match.', [1, 2, 3, 4]);
  CUSTOMERS.forEach(([cid, name], li) => {
    snap(`Customer ${name}`, `Take the next row on the left: ${name}, id ${cid}. Look for orders whose customer_id is ${cid}.`, [2, 4], li, undefined, 'compare', undefined, { 'c.id': cid });
    let matched = 0;
    ORDERS.forEach(([oid, ocid, total], ri) => {
      if (ocid === cid) {
        matched++;
        const k = `r${cid}-${oid}`;
        result.push({ k, cells: [name, String(oid), total] });
        snap(`Match: order ${oid}`, `Order ${oid} has customer_id ${ocid} = ${cid}, so the pair becomes a result row.`, [1, 4], li, ri, 'found', k, { 'c.id': cid, 'o.customer_id': ocid });
      } else {
        snap(`Order ${oid}: no`, `Order ${oid} belongs to customer ${ocid}, not ${cid}. Skip it.`, [4], li, ri, 'dim', undefined, { 'c.id': cid, 'o.customer_id': ocid });
      }
    });
    if (!matched) {
      if (kind === 'LEFT') {
        const k = `r${cid}-none`;
        result.push({ k, cells: [name, 'NULL', 'NULL'] });
        snap(`${name} has no orders`, `No order matched. A LEFT JOIN still keeps ${name}, and fills the orders columns with NULL. Adding WHERE o.id IS NULL would find exactly these customers.`, [3], li, undefined, 'compare', k, { 'c.id': cid });
      } else {
        snap(`${name} has no orders`, `No order matched, so an INNER JOIN produces no row for ${name}. ${name} silently disappears from the result.`, [3], li, undefined, 'compare', undefined, { 'c.id': cid });
      }
    } else if (matched > 1) {
      snap(`${name} appears ${matched} times`, `${name} matched ${matched} orders, so ${name} is in the result ${matched} times. Joins can make rows multiply: one row per matching pair.`, [3, 4], li, undefined, 'compare', undefined, { 'c.id': cid });
    }
  });
  snap('Done', kind === 'LEFT'
    ? `${result.length} rows: every customer is there, and Yaa, who has no orders, has NULLs. Switch to INNER JOIN to compare.`
    : `${result.length} rows: only customers with orders. Switch to LEFT JOIN to see Yaa kept.`, [1, 2, 3, 4]);
  return { frames, rows: result.map((r) => r.cells) };
}

export const lesson: Lesson = {
  id: 'sql-join',
  title: 'How a join pairs up rows',
  hint: 'Follow each customer along the orders table. Switch between LEFT and INNER to see who is kept.',
  language: 'SQL',
  examples: KINDS.map((k) => ({ label: `${k} JOIN` })),
  code: (e) => code(KINDS[e] ?? KINDS[0]),
  frames: (e) => trace(KINDS[e] ?? KINDS[0]).frames,
};
