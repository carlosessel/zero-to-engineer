// Runs every JavaScript code block whose examples.yaml entry has `check: js`.
//
// Fields:
//   output:          exactly what it prints (one line per console.log)
//   output_contains: pieces the output must contain
//   throws:          the name of the error it must stop with, such as TypeError
//   expect:          JavaScript expressions, run afterwards in the same context, each true
//   before, fetch_json, wait_ms: see tests/js-runner.ts
//
// The code is read straight from the chapter, so what a learner reads is what is tested.
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { runExample, type RunOptions } from './js-runner.ts';

const FENCE = /^(`{3,})(\w+)\n([\s\S]*?)\n\1[ \t]*$/gm;

interface Entry extends RunOptions {
  block: number;
  lang: string;
  check: string;
  output?: string;
  output_contains?: string[];
  throws?: string;
  expect?: string[];
}

const cases: { chapter: string; entry: Entry; code: string }[] = [];
for (const chapter of fs.readdirSync('content/chapters').sort()) {
  const file = `content/chapters/${chapter}/examples.yaml`;
  if (!fs.existsSync(file)) continue;
  const entries = (parse(fs.readFileSync(file, 'utf8')) ?? []) as Entry[];
  const blocks = [...fs.readFileSync(`content/chapters/${chapter}/index.mdx`, 'utf8').matchAll(FENCE)].map((m) => m[3]);
  for (const entry of entries) if (entry.check === 'js') cases.push({ chapter, entry, code: blocks[entry.block - 1] });
}

const tidy = (s: string) => s.replace(/[ \t]+$/gm, '').trim();

describe('JavaScript examples', () => {
  it('finds examples to run (so a broken loader cannot pass silently)', () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  for (const { chapter, entry, code } of cases) {
    it(`${chapter} block ${entry.block}`, async () => {
      expect(code, 'the block exists').toBeTruthy();
      const result = await runExample(code, entry);
      if (entry.throws) {
        expect(result.error?.name, `expected it to stop with ${entry.throws}`).toBe(entry.throws);
      } else {
        expect(result.error, `it stopped with an error. Output so far:\n${result.output}`).toBeNull();
      }
      if (entry.output !== undefined) expect(tidy(result.output)).toBe(tidy(entry.output));
      for (const part of entry.output_contains ?? []) expect(result.output).toContain(part);
      for (const expression of entry.expect ?? []) {
        expect(vm.runInContext(`(${expression})`, result.context), expression).toBe(true);
      }
    });
  }
});
