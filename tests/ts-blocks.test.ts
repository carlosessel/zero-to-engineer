// Type-checks every TypeScript code block whose examples.yaml entry has `check: ts`,
// with the TypeScript compiler in strict mode (as a new Vite project sets it up),
// and, for blocks that are a whole program, runs the JavaScript that is left.
//
// Fields:
//   errors:         the type errors the block must have, in order, such as ["TS2322"].
//                   Leave it out when the block must have none (most blocks).
//   error_contains: pieces of those errors' messages
//   file:           the block's file name (default example.ts or example.tsx)
//   files:          other blocks that are part of the same program: { "types.ts": 3 }
//   output, output_contains, throws, expect: as for `check: js`, run after removing the types
//                   the way the site's Run button does (Sucrase).
//                   Only for blocks without import or export.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { transform } from 'sucrase';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { runExample } from './js-runner.ts';

const FENCE = /^(`{3,})(\w+)\n([\s\S]*?)\n\1[ \t]*$/gm;

interface Entry {
  block: number;
  check: string;
  errors?: string[];
  error_contains?: string[];
  file?: string;
  files?: Record<string, number>;
  output?: string;
  output_contains?: string[];
  throws?: string;
  expect?: string[];
}

const cases: { chapter: string; entry: Entry; blocks: [string, string][] }[] = [];
for (const chapter of fs.readdirSync('content/chapters').sort()) {
  const file = `content/chapters/${chapter}/examples.yaml`;
  if (!fs.existsSync(file)) continue;
  const entries = (parse(fs.readFileSync(file, 'utf8')) ?? []) as Entry[];
  const blocks = [...fs.readFileSync(`content/chapters/${chapter}/index.mdx`, 'utf8').matchAll(FENCE)].map((m) => [m[2], m[3]] as [string, string]);
  for (const entry of entries) if (entry.check === 'ts') cases.push({ chapter, entry, blocks });
}

// The settings `npm create vite` gives a React and TypeScript project (tsconfig.app.json), in short.
const OPTIONS: ts.CompilerOptions = {
  strict: true,
  target: ts.ScriptTarget.ES2022,
  lib: ['lib.es2023.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  noEmit: true,
  noUnusedLocals: false,
  noFallthroughCasesInSwitch: true,
  allowImportingTsExtensions: true,
  types: [],
  skipLibCheck: true,
};

/** Type-checks some files held in memory. Returns "TS2322 (example.ts line 4): message" for each problem. */
function check(files: Record<string, string>): { code: string; text: string }[] {
  // The files are placed inside the project folder, so `import ... from 'react'` finds node_modules.
  const dir = path.resolve('.examples-tmp/ts');
  const full = Object.fromEntries(Object.entries(files).map(([name, code]) => [path.join(dir, name), code]));
  const host = ts.createCompilerHost(OPTIONS);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, lang, ...rest) =>
    name in full ? ts.createSourceFile(name, full[name], lang) : getSourceFile(name, lang, ...rest);
  const fileExists = host.fileExists.bind(host);
  host.fileExists = (name) => name in full || fileExists(name);
  const readFile = host.readFile.bind(host);
  host.readFile = (name) => full[name] ?? readFile(name);
  const program = ts.createProgram(Object.keys(full), OPTIONS, host);
  return ts.getPreEmitDiagnostics(program).map((d) => {
    const where = d.file && d.start !== undefined ? `${path.basename(d.file.fileName)} line ${d.file.getLineAndCharacterOfPosition(d.start).line + 1}` : 'settings';
    return { code: `TS${d.code}`, text: `TS${d.code} (${where}): ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}` };
  });
}

describe('TypeScript examples', () => {
  it('finds examples to check (so a broken loader cannot pass silently)', () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  it('reports a type error when there is one (so the checker cannot pass silently)', () => {
    expect(check({ 'a.ts': 'const n: number = "five";' }).map((e) => e.code)).toEqual(['TS2322']);
  });

  for (const { chapter, entry, blocks } of cases) {
    it(`${chapter} block ${entry.block}`, async () => {
      const [lang, code] = blocks[entry.block - 1] ?? ['', ''];
      expect(code, 'the block exists').toBeTruthy();
      const own = entry.file ?? `example.${lang === 'tsx' ? 'tsx' : 'ts'}`;
      const files: Record<string, string> = { [own]: code };
      for (const [name, n] of Object.entries(entry.files ?? {})) files[name] = blocks[n - 1][1];

      const problems = check(files);
      const report = problems.map((p) => p.text).join('\n');
      expect(problems.map((p) => p.code), `type errors:\n${report}`).toEqual(entry.errors ?? []);
      for (const part of entry.error_contains ?? []) expect(report).toContain(part);

      const runs = entry.output !== undefined || entry.output_contains || entry.throws || entry.expect;
      if (!runs) return;
      expect(/^\s*(import|export)\s/m.test(code), 'only a block without import or export can be run on its own').toBe(false);
      // Types removed by Sucrase, as the site's Run button does.
      const js = transform(code, { transforms: ['typescript'] }).code;
      const result = await runExample(js);
      if (entry.throws) expect(result.error?.name).toBe(entry.throws);
      else expect(result.error, `it stopped with an error. Output so far:\n${result.output}`).toBeNull();
      const tidy = (s: string) => s.replace(/[ \t]+$/gm, '').trim();
      if (entry.output !== undefined) expect(tidy(result.output)).toBe(tidy(entry.output));
      for (const part of entry.output_contains ?? []) expect(result.output).toContain(part);
      for (const expression of entry.expect ?? []) expect(vm.runInContext(`(${expression})`, result.context), expression).toBe(true);
    });
  }
});
