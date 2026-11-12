// Validates every HTML and CSS code block whose examples.yaml entry has
// `check: web` or `check: browser` (the second is also rendered in a real
// browser by e2e/examples.e2e.ts).
//
// HTML: html-validate with its recommended rules.
// CSS: parsed with css-tree, and every declaration matched against the CSS
//      specifications (so a misspelt property or an impossible value fails).
//
// An example that is wrong on purpose (in a "Common mistakes" section) lists
// what should be found: `expect_problems: [rule-or-property, ...]`. The test
// then fails if those problems are NOT found, so the mistake is proven real.
import fs from 'node:fs';
import * as csstree from 'css-tree';
import { HtmlValidate } from 'html-validate';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const FENCE = /^(`{3,})(\w+)\n([\s\S]*?)\n\1[ \t]*$/gm;
const validator = new HtmlValidate({
  extends: ['html-validate:recommended'],
  rules: {
    // A typographic preference (keep phone numbers on one line), not an error.
    'tel-non-breaking': 'off',
  },
});

interface Entry {
  block: number;
  lang: string;
  check: string;
  expect_problems?: string[];
}

export async function htmlProblems(code: string): Promise<string[]> {
  const report = await validator.validateString(code);
  return report.results.flatMap((r) => r.messages.map((m) => `${m.ruleId}: ${m.message} (line ${m.line})`));
}

export function cssProblems(code: string): string[] {
  const out: string[] = [];
  const ast = csstree.parse(code, { positions: true, onParseError: (e) => out.push(`parse: ${e.message}`) });
  csstree.walk(ast, {
    visit: 'Declaration',
    enter(node, item, list) {
      void item;
      void list;
      if (node.property.startsWith('--')) return; // custom properties may hold anything
      // A value using var() is only known when the page runs, so it cannot be checked
      // here; the real-browser checks cover those (css-tree says so rather than guessing).
      if (csstree.find(node.value, (n) => n.type === 'Function' && n.name.toLowerCase() === 'var')) return;
      // Inside @font-face and similar at-rules, src and font-display are descriptors of
      // that at-rule, not properties, and are checked against its own grammar.
      const atrule = (this as unknown as { atrule: csstree.Atrule | null }).atrule;
      const descriptors = atrule && ['font-face', 'page', 'counter-style', 'property', 'font-palette-values'].includes(atrule.name.toLowerCase());
      const m = descriptors
        ? csstree.lexer.matchAtruleDescriptor(atrule!.name, node.property, node.value)
        : csstree.lexer.matchDeclaration(node);
      if (m.error) out.push(`${node.property}: ${m.error.message.split('\n')[0]} (line ${node.loc?.start.line})`);
    },
  });
  return out;
}

const cases: { chapter: string; entry: Entry; code: string }[] = [];
for (const chapter of fs.readdirSync('content/chapters').sort()) {
  const file = `content/chapters/${chapter}/examples.yaml`;
  if (!fs.existsSync(file)) continue;
  const entries = (parse(fs.readFileSync(file, 'utf8')) ?? []) as Entry[];
  const blocks = [...fs.readFileSync(`content/chapters/${chapter}/index.mdx`, 'utf8').matchAll(FENCE)].map((m) => m[3]);
  for (const entry of entries) {
    if (entry.check === 'web' || entry.check === 'browser') cases.push({ chapter, entry, code: blocks[entry.block - 1] });
  }
}

describe('HTML and CSS examples', () => {
  it('has examples to check (so a broken loader cannot pass silently)', () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  for (const { chapter, entry, code } of cases) {
    it(`${chapter} block ${entry.block} (${entry.lang})`, async () => {
      expect(code, 'the block exists').toBeTruthy();
      let problems: string[];
      if (entry.lang === 'html') problems = await htmlProblems(code);
      else if (entry.lang === 'css') problems = cssProblems(code);
      else return; // JavaScript blocks are checked in a real browser only
      if (entry.expect_problems) {
        for (const wanted of entry.expect_problems) {
          expect(problems.some((p) => p.startsWith(wanted)), `expected a problem starting "${wanted}", found: ${problems.join('; ') || 'none'}`).toBe(true);
        }
      } else {
        expect(problems).toEqual([]);
      }
    });
  }
});
