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
//   fetch_json: address -> JSON reply, so examples that call web APIs get a fixed
//             answer and the test never depends on the internet
// React (jsx, tsx) and TypeScript blocks are compiled as the site compiles them, and
// React loads from the built site's public/vendor/react-runtime.js.
import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import { parse } from 'yaml';
import { transform } from 'sucrase';
import { buildDocument, type ReactPart, type Sources } from '../src/lib/playground';
import { compile, type Transform } from '../src/lib/react-preview';

const FENCE = /^(`{3,})(\w+)\n([\s\S]*?)\n\1[ \t]*$/gm;
const LANG: Record<string, keyof Sources> = { html: 'html', css: 'css', js: 'js', javascript: 'js' };
const sucrase = transform as unknown as Transform;

interface Entry {
  block: number;
  check: string;
  combine?: number[];
  viewport?: { width: number; height: number };
  expect: string[];
  actions?: ({ click: string } | { fill: [string, string] })[];
  color_scheme?: 'dark' | 'light';
  also_at?: { viewport: { width: number; height: number }; expect: string[] }[];
  fetch_json?: Record<string, unknown>;
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
    let react: ReactPart | undefined;
    for (const n of entry.combine ?? [entry.block]) {
      const [lang, code] = blocks[n - 1];
      if (lang === 'jsx' || lang === 'tsx') {
        react = { compiled: compile(code, lang, sucrase), runtimeUrl: `http://localhost:${process.env.E2E_PORT || 4323}/vendor/react-runtime.js` };
        continue;
      }
      if (lang === 'ts') {
        sources.js += (sources.js ? '\n' : '') + sucrase(code, { transforms: ['typescript'] }).code;
        continue;
      }
      const key = LANG[lang];
      if (!key) throw new Error(`block ${n} is ${lang}, which cannot be shown in a page`);
      sources[key] += (sources[key] ? '\n' : '') + code;
    }
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    if (entry.color_scheme) await page.emulateMedia({ colorScheme: entry.color_scheme });
    if (entry.fetch_json) {
      // Anything else the example asks for fails, as an unknown address would. Added first,
      // because Playwright tries the most recently added route first.
      await page.route(/^https?:\/\/(?!localhost)/, (route) => route.fulfill({ status: 404, headers: { 'access-control-allow-origin': '*' }, body: '{"message":"Not Found"}' }));
    }
    for (const [url, body] of Object.entries(entry.fetch_json ?? {})) {
      await page.route(url, (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) }),
      );
    }
    const html = buildDocument(sources, 'test', react);
    const sizes = [{ viewport: entry.viewport ?? { width: 1000, height: 700 }, expect: entry.expect }, ...(entry.also_at ?? [])];
    for (const size of sizes) {
      await page.setViewportSize(size.viewport);
      await page.setContent(html, { waitUntil: 'load' });
      if (react) await page.waitForFunction(() => document.getElementById('root')?.childElementCount);
      for (const step of entry.actions ?? []) {
        if ('click' in step) await page.click(step.click);
        else await page.fill(step.fill[0], step.fill[1]);
      }
      for (const expression of size.expect) {
        // Retried for a few seconds: after a click, React (and React Router especially)
        // may update the page a moment later, and slower machines take longer.
        await expect
          .poll(
            () =>
              page.evaluate((code) => {
                // eslint-disable-next-line no-new-func
                return new Function(`return (${code});`)();
              }, expression),
            { message: `at ${size.viewport.width} pixels wide: ${expression}`, timeout: 5000 },
          )
          .toBe(true);
      }
    }
    expect(errors).toEqual([]);
  });
}
