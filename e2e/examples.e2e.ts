// Renders chapter examples in a real browser and checks what the chapter says
// about them: sizes, colours, layout, what happens when you click.
//
// For each examples.yaml entry with `check: browser`:
//   combine:  block numbers to put together into one page (default: just this block)
//   viewport: { width, height } to render at (default 1000 x 700)
//   expect:   JavaScript expressions run in the page; each must be true
//   actions:  optional steps before the expectations, such as
//             { click: "selector" } or { fill: ["selector", "text"] }
//   color_scheme: "dark" or "light", to test prefers-color-scheme
//   also_at:  a list of { viewport, expect } to check the same page at other sizes
import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import { parse } from 'yaml';
import { buildDocument, type Sources } from '../src/lib/playground';

const FENCE = /^(`{3,})(\w+)\n([\s\S]*?)\n\1[ \t]*$/gm;
const LANG: Record<string, keyof Sources> = { html: 'html', css: 'css', js: 'js', javascript: 'js' };

interface Entry {
  block: number;
  check: string;
  combine?: number[];
  viewport?: { width: number; height: number };
  expect: string[];
  actions?: ({ click: string } | { fill: [string, string] })[];
  color_scheme?: 'dark' | 'light';
  also_at?: { viewport: { width: number; height: number }; expect: string[] }[];
}

const cases: { chapter: string; entry: Entry; blocks: [string, string][] }[] = [];
for (const chapter of fs.readdirSync('content/chapters').sort()) {
  const file = `content/chapters/${chapter}/examples.yaml`;
  if (!fs.existsSync(file)) continue;
  const entries = (parse(fs.readFileSync(file, 'utf8')) ?? []) as Entry[];
  const blocks = [...fs.readFileSync(`content/chapters/${chapter}/index.mdx`, 'utf8').matchAll(FENCE)].map((m) => [m[2], m[3]] as [string, string]);
  for (const entry of entries) if (entry.check === 'browser') cases.push({ chapter, entry, blocks });
}

for (const { chapter, entry, blocks } of cases) {
  test(`${chapter} block ${entry.block} renders as the chapter says`, async ({ page }) => {
    expect(entry.expect?.length, 'a browser check needs at least one expectation').toBeGreaterThan(0);
    const sources: Sources = { html: '', css: '', js: '' };
    for (const n of entry.combine ?? [entry.block]) {
      const [lang, code] = blocks[n - 1];
      const key = LANG[lang];
      if (!key) throw new Error(`block ${n} is ${lang}, which cannot be shown in a page`);
      sources[key] += (sources[key] ? '\n' : '') + code;
    }
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    if (entry.color_scheme) await page.emulateMedia({ colorScheme: entry.color_scheme });
    const html = buildDocument(sources, 'test');
    const sizes = [{ viewport: entry.viewport ?? { width: 1000, height: 700 }, expect: entry.expect }, ...(entry.also_at ?? [])];
    for (const size of sizes) {
      await page.setViewportSize(size.viewport);
      await page.setContent(html, { waitUntil: 'load' });
      for (const step of entry.actions ?? []) {
        if ('click' in step) await page.click(step.click);
        else await page.fill(step.fill[0], step.fill[1]);
      }
      for (const expression of size.expect) {
        const result = await page.evaluate((code) => {
          // eslint-disable-next-line no-new-func
          return new Function(`return (${code});`)();
        }, expression);
        expect(result, `at ${size.viewport.width} pixels wide: ${expression}`).toBe(true);
      }
    }
    expect(errors).toEqual([]);
  });
}
