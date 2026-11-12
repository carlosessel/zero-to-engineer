// Tests for the JavaScript, HTML, CSS and React examples in the chapters.
// The code is read straight from each chapter, so what a learner reads is what is tested.
// Each test name matches the `test:` field in that chapter's examples.yaml.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

const FENCE = /^(`{3,})(\w+)\n([\s\S]*?)\n\1[ \t]*$/gm;
function block(chapter: string, n: number): string {
  const text = fs.readFileSync(`content/chapters/${chapter}/index.mdx`, 'utf8');
  const all = [...text.matchAll(FENCE)].map((m) => m[3]);
  if (!all[n - 1]) throw new Error(`${chapter} has no block ${n}`);
  return all[n - 1];
}

/** Runs browser-style code with console.log captured. */
function runScript(code: string, extra: Record<string, unknown> = {}) {
  const logs: string[] = [];
  const errors: string[] = [];
  const context = vm.createContext({
    console: { log: (...a: unknown[]) => logs.push(a.map(String).join(' ')), error: (...a: unknown[]) => errors.push(a.map(String).join(' ')) },
    ...extra,
  });
  const result = vm.runInContext(code, context);
  return { logs, errors, result, context };
}

describe('javascript chapter', () => {
  it('javascript block 1', () => {
    const { logs, context } = runScript(block('javascript', 1));
    expect(logs).toEqual(['Kofi 10', 'empty', '10', '20', '30', 'Total is 60']);
    // The comments state these values.
    expect(vm.runInContext('JSON.stringify([doubled, big, add(2, 3), double(4)])', context)).toBe('[[20,40,60],[20,30],5,8]');
  });

  it('javascript block 2', () => {
    const dom = new JSDOM(`<!doctype html><body>${block('javascript', 2)}</body>`, { runScripts: 'dangerously' });
    const doc = dom.window.document;
    const button = doc.querySelector<HTMLButtonElement>('#like')!;
    expect(doc.querySelector('#count')!.textContent).toBe('0');
    button.click();
    button.click();
    expect(doc.querySelector('#count')!.textContent).toBe('2');
  });

  it('javascript block 3', async () => {
    // fetch is replaced by a stand-in so the test does not depend on GitHub being up.
    const calls: string[] = [];
    const fakeFetch = (ok: boolean) => async (url: string) => {
      calls.push(url);
      return { ok, status: ok ? 200 : 404, json: async () => ({ name: 'The Octocat' }) };
    };
    const code = block('javascript', 3).replace(/loadUser\(\);\s*$/, 'globalThis.done = loadUser();');

    let run = runScript(code, { fetch: fakeFetch(true) });
    await (run.context as { done: Promise<void> }).done;
    expect(calls).toEqual(['https://api.github.com/users/octocat']);
    expect(run.logs).toEqual(['The Octocat']);

    run = runScript(code, { fetch: fakeFetch(false) });
    await (run.context as { done: Promise<void> }).done;
    expect(run.logs).toEqual([]);
    expect(run.errors.join(' ')).toContain('Request failed: 404');
  });
});

describe('html-css chapter', () => {
  it('html-css block 1', () => {
    const html = block('html-css', 1);
    const doc = new JSDOM(html).window.document;
    expect(doc.documentElement.lang).toBe('en');
    expect(doc.querySelector('meta[name=viewport]')?.getAttribute('content')).toBe('width=device-width, initial-scale=1');
    expect(doc.querySelector('link[rel=stylesheet]')?.getAttribute('href')).toBe('style.css');
    expect(doc.querySelector('header h1')?.textContent).toBe("Ama's Bakery");
    expect(doc.querySelectorAll('main li')).toHaveLength(2);
    expect(doc.querySelector('img')?.getAttribute('alt')).toBeTruthy();
    // The parser repairs broken HTML silently, so also check every tag is closed in the source.
    const opened = (html.match(/<(header|main|p|ul|li|strong|a|head|body|html|title)\b/g) ?? []).length;
    const closed = (html.match(/<\/(header|main|p|ul|li|strong|a|head|body|html|title)>/g) ?? []).length;
    expect(opened).toBe(closed);
  });

  it('html-css block 2', () => {
    const css = block('html-css', 2);
    const dom = new JSDOM(`<!doctype html><head><style>${css}</style></head><body><h1>x</h1><p class="intro">y</p><ul><li>a</li></ul></body>`);
    const sheet = dom.window.document.styleSheets[0] as CSSStyleSheet;
    const rules = Array.from(sheet.cssRules);
    const selectors = rules.map((r) => (r as CSSStyleRule).selectorText ?? (r as CSSMediaRule).conditionText ?? (r as CSSMediaRule).media?.mediaText);
    // Every rule in the source was understood: nothing was dropped as invalid.
    expect(selectors).toEqual(['body', 'h1', '.intro', 'ul', 'li', '(max-width: 500px)']);
    const media = rules[5] as CSSMediaRule;
    expect((media.cssRules[0] as CSSStyleRule).style.flexDirection).toBe('column');
    const win = dom.window;
    expect(win.getComputedStyle(win.document.querySelector('.intro')!).fontSize).toBe('1.2rem');
    expect(win.getComputedStyle(win.document.querySelector('ul')!).display).toBe('flex');
  });
});

describe('frontend chapter', () => {
  it('frontend block 1', async () => {
    const { transform } = await import('esbuild');
    const { code } = await transform(block('frontend', 1) + '\nexport default Counter;', { loader: 'jsx', jsx: 'automatic', format: 'esm' });
    const file = `${fs.mkdtempSync(path.join(os.tmpdir(), 'zte-jsx-'))}/counter.mjs`;
    fs.writeFileSync(file, code);
    const Counter = (await import(file)).default;

    const dom = new JSDOM('<!doctype html><div id="root"></div>', { pretendToBeVisual: true });
    const g = globalThis as Record<string, unknown>;
    Object.assign(g, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
    const React = await import('react');
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(dom.window.document.getElementById('root')!);
    await React.act(async () => root.render(React.createElement(Counter, { step: 5 })));
    const button = dom.window.document.querySelector('button')!;
    expect(button.textContent).toBe('Clicked 0 times');
    await React.act(async () => button.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })));
    await React.act(async () => button.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })));
    expect(button.textContent).toBe('Clicked 10 times');
    await React.act(async () => root.unmount());
  });
});

describe('web-setup chapter', () => {
  it('web-setup block 2', () => {
    const html = block('web-setup', 2);
    const doc = new JSDOM(html).window.document;
    expect(doc.title).toBe('My first page');
    expect(doc.documentElement.lang).toBe('en');
    expect(doc.querySelector('meta[charset]')?.getAttribute('charset')).toBe('utf-8');
    expect(doc.querySelector('h1')?.textContent).toBe('Hello, web');
    expect(doc.querySelector('p')?.textContent).toBe('I made this page myself.');
    const opened = (html.match(/<(html|head|title|body|h1|p)\b/g) ?? []).length;
    const closed = (html.match(/<\/(html|head|title|body|h1|p)>/g) ?? []).length;
    expect(opened).toBe(closed);
  });
});
