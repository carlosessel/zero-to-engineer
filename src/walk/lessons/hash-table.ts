import type { Cell, Frame, Lesson } from '../types';

export const SIZE = 5;
type Op = ['put', string, number] | ['get', string];
export const SCRIPTS: { label: string; ops: Op[] }[] = [
  { label: 'Store animals, then look one up', ops: [['put', 'cat', 4], ['put', 'owl', 2], ['put', 'ant', 6], ['put', 'emu', 2], ['put', 'bee', 6], ['put', 'cat', 3], ['get', 'bee'], ['get', 'yak']] },
];

const CODE = `def bucket_for(key, size):
    return sum(ord(ch) for ch in key) % size

def put(table, key, value):
    bucket = table[bucket_for(key, len(table))]
    for pair in bucket:
        if pair[0] == key:
            pair[1] = value
            return
    bucket.append([key, value])

def get(table, key):
    bucket = table[bucket_for(key, len(table))]
    for k, v in bucket:
        if k == key:
            return v
    raise KeyError(key)`;

export function codes(key: string): number[] {
  return [...key].map((c) => c.charCodeAt(0));
}
export function bucketFor(key: string, size = SIZE): number {
  return codes(key).reduce((a, b) => a + b, 0) % size;
}

/** Runs the operations on a small chained hash table. Exported for the tests. */
export function trace(ops: Op[]): { frames: Frame[]; table: [string, number][][]; results: (number | 'KeyError')[] } {
  const frames: Frame[] = [];
  const table: { key: string; value: number; k: string }[][] = Array.from({ length: SIZE }, () => []);
  const results: (number | 'KeyError')[] = [];
  let n = 0;
  const snap = (title: string, text: string, lines: number[], note: string, focus: { bucket?: number; entry?: string; tone?: 'compare' | 'found' | 'active' | 'bad' } = {}, vars: Record<string, string | number> = {}) => {
    const buckets: Cell[][] = table.map((b) => b.map((e) => ({ k: e.k, v: `${e.key}: ${e.value}`, tone: e.k === focus.entry ? focus.tone ?? 'compare' : 'base' })));
    frames.push({
      title, text, lines, vars,
      parts: [
        { kind: 'note', id: 'calc', text: note, tone: focus.tone === 'bad' ? 'bad' : focus.bucket === undefined ? 'base' : 'active' },
        { kind: 'buckets', id: 'h', buckets, tones: focus.bucket === undefined ? {} : { [focus.bucket]: 'active' } },
      ],
    });
  };
  const sum = (key: string) => `${codes(key).join(' + ')} = ${codes(key).reduce((a, b) => a + b, 0)}`;

  snap('Five empty buckets', `A hash table is an array of buckets. Here there are ${SIZE}, numbered 0 to ${SIZE - 1}. Each bucket holds a short list of key–value pairs.`, [], 'table = [[], [], [], [], []]');
  for (const op of ops) {
    const key = op[1];
    const b = bucketFor(key);
    const calc = `"${key}" → ${sum(key)} → % ${SIZE} = ${b}`;
    if (op[0] === 'put') {
      const value = op[2];
      snap(`put("${key}", ${value})`, `Turn the key into a number by adding up its letters' character codes, then take the remainder after dividing by ${SIZE}. That picks bucket ${b}.`, [1, 2, 4, 5], calc, { bucket: b }, { key, value, bucket: b });
      const existing = table[b].find((e) => e.key === key);
      for (const e of table[b]) {
        snap(`Is it "${e.key}"?`, e.key === key ? `Bucket ${b} already holds "${key}", so we replace its value instead of adding a second copy.` : `"${e.key}" is a different key that landed in the same bucket: a collision. Keep looking along the bucket.`, [6, 7], calc, { bucket: b, entry: e.k }, { key, value, bucket: b });
        if (e === existing) break;
      }
      if (existing) {
        existing.value = value;
        snap('Value updated', `"${key}" now maps to ${value}. A key appears at most once in a table.`, [8, 9], calc, { bucket: b, entry: existing.k, tone: 'found' }, { key, value, bucket: b });
      } else {
        const k = `e${n++}`;
        table[b].push({ key, value, k });
        snap('Added', table[b].length > 1
          ? `"${key}" joins the end of bucket ${b}, which now holds ${table[b].length} pairs. Collisions are normal; a lookup just checks each pair in that one bucket.`
          : `"${key}" is stored in bucket ${b}.`, [10], calc, { bucket: b, entry: k, tone: 'active' }, { key, value, bucket: b });
      }
    } else {
      snap(`get("${key}")`, `To look a key up, do the same sum. It points straight to bucket ${b}: the other buckets are never looked at, however many there are.`, [12, 13], calc, { bucket: b }, { key, bucket: b });
      let hit: number | undefined;
      for (const e of table[b]) {
        if (e.key === key) {
          hit = e.value;
          snap('Found', `"${key}" is in bucket ${b}, so get returns ${e.value}. Only ${table[b].indexOf(e) + 1} ${table[b].indexOf(e) === 0 ? 'pair was' : 'pairs were'} compared.`, [14, 15, 16], calc, { bucket: b, entry: e.k, tone: 'found' }, { key, bucket: b, result: e.value });
          break;
        }
        snap(`Is it "${e.key}"?`, `No: "${e.key}" shares the bucket but is a different key. Next pair.`, [14, 15], calc, { bucket: b, entry: e.k }, { key, bucket: b });
      }
      if (hit === undefined) {
        results.push('KeyError');
        snap('Not found', `Bucket ${b} has no "${key}", so the key is not in the table at all and get raises KeyError. Python's dict does the same: d["${key}"] fails, d.get("${key}") gives None.`, [17], calc, { bucket: b, tone: 'bad' }, { key, bucket: b });
      } else results.push(hit);
    }
  }
  return { frames, table: table.map((b) => b.map((e) => [e.key, e.value] as [string, number])), results };
}

export const lesson: Lesson = {
  id: 'hash-table',
  title: 'Inside a hash table',
  hint: 'Each key is turned into a bucket number. Watch collisions share a bucket, and a lookup go straight to the right one.',
  language: 'Python',
  examples: SCRIPTS.map(({ label }) => ({ label })),
  code: () => CODE,
  frames: (e) => trace((SCRIPTS[e] ?? SCRIPTS[0]).ops).frames,
};
