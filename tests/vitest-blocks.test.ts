// Runs the test files that chapters show, with Vitest, exactly as a learner would
// run them with `npx vitest run`, for every examples.yaml entry with `check: vitest-run`.
//
// Fields:
//   files:   the blocks that make up the little project, by file name:
//            { "src/sum.js": 1, "src/sum.test.js": 2 }. The entry's own block must be one of them.
//   hidden_files: { "name": "contents" } files the chapter mentions but does not show
//            in full; `note` must say why.
//   passed:  how many tests must pass
//   failed:  how many tests must fail (default 0), for examples that fail on purpose
//   output_contains: pieces Vitest's own printed report must contain
//
// Each project is written to .examples-tmp/vitest/<chapter>-<block>/ inside this
// repository, so its imports of vitest, react and Testing Library find node_modules.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const FENCE = /^(`{3,})(\w+)\n([\s\S]*?)\n\1[ \t]*$/gm;

interface Entry {
  block: number;
  check: string;
  files: Record<string, number>;
  hidden_files?: Record<string, string>;
  passed: number;
  failed?: number;
  output_contains?: string[];
}

const cases: { chapter: string; entry: Entry; blocks: string[] }[] = [];
for (const chapter of fs.readdirSync('content/chapters').sort()) {
  const file = `content/chapters/${chapter}/examples.yaml`;
  if (!fs.existsSync(file)) continue;
  const entries = (parse(fs.readFileSync(file, 'utf8')) ?? []) as Entry[];
  const blocks = [...fs.readFileSync(`content/chapters/${chapter}/index.mdx`, 'utf8').matchAll(FENCE)].map((m) => m[3]);
  for (const entry of entries) if (entry.check === 'vitest-run') cases.push({ chapter, entry, blocks });
}

describe('Vitest examples', () => {
  for (const { chapter, entry, blocks } of cases) {
    it(`${chapter} block ${entry.block}`, { timeout: 120_000 }, () => {
      expect(Object.values(entry.files), 'the entry lists its own block').toContain(entry.block);
      const dir = path.resolve(`.examples-tmp/vitest/${chapter}-${entry.block}`);
      fs.rmSync(dir, { recursive: true, force: true });
      const write = (name: string, text: string) => {
        fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
        fs.writeFileSync(path.join(dir, name), text.endsWith('\n') ? text : text + '\n');
      };
      for (const [name, n] of Object.entries(entry.files)) {
        expect(blocks[n - 1], `block ${n} exists`).toBeTruthy();
        write(name, blocks[n - 1]);
      }
      for (const [name, text] of Object.entries(entry.hidden_files ?? {})) write(name, text);
      // Without a settings file of its own, Vitest's defaults are used (and not this repository's).
      if (!fs.readdirSync(dir).some((f) => /^vite(st)?\.config\./.test(f))) write('vitest.config.js', 'export default {};');

      const run = spawnSync(
        process.execPath,
        ['node_modules/vitest/vitest.mjs', 'run', '--root', dir, '--reporter=default', '--reporter=json', `--outputFile.json=${dir}/result.json`],
        { encoding: 'utf8', env: { ...process.env, CI: '1', NO_COLOR: '1', FORCE_COLOR: '0' } },
      );
      const printed = `${run.stdout}\n${run.stderr}`;
      expect(fs.existsSync(`${dir}/result.json`), `Vitest wrote no results:\n${printed}`).toBe(true);
      const result = JSON.parse(fs.readFileSync(`${dir}/result.json`, 'utf8'));
      expect({ passed: result.numPassedTests, failed: result.numFailedTests }, printed).toEqual({ passed: entry.passed, failed: entry.failed ?? 0 });
      for (const part of entry.output_contains ?? []) expect(printed).toContain(part);
    });
  }
});
