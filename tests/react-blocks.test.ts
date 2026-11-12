// @vitest-environment jsdom
//
// Runs every React (JSX or TSX) code block whose examples.yaml entry has `check: react`
// (and TSX blocks with `check: ts` that also have `steps`),
// compiled exactly as the site's preview compiles it (src/lib/react-preview.ts), and
// shown in a simulated page (jsdom). Clicks and typing go through Testing Library's
// user-event, which fires the same events a person's mouse and keyboard would.
//
// Fields:
//   steps: a list, run in order. Each step is one of
//     { click: "Add" }              click the button or link with this text
//     { click_selector: "css" }     click the element matching this selector
//     { type: ["css", "text"] }     type into the field matching the selector
//     { clear: "css" }              empty that field
//     { select: ["css", "value"] }  choose an option in a <select>
//     { text: "..." }               the page must show this text (waits up to 2 seconds,
//                                   or `within_ms` if given)
//     { no_text: "..." }            the page must not show this text
//     { expect: "js" }              this expression, with `document` available, must be true
//     { printed: "..." }            what was printed so far must contain this
//     { fetches_at_least: 5 }       fetch must have been called at least this often
//   output:          everything printed with console.log, exactly
//   warnings_contain: pieces React's warnings (console.error) must contain
//   throws:          an error message part that showing the component must fail with
//   fetch_json:      address -> JSON reply; any other address gives a 404
//   fetch_delay_ms:  how long each fake reply takes (default 10)
//   path:            for examples using React Router's BrowserRouter: the address to start at
//   append:          hidden code added after the block, for a block that is only part of a
//                    file (such as one component); `note` must say what it adds
//   modules:         other blocks this one imports, by the name it imports: { "./Header.jsx": 8 }
import fs from 'node:fs';
import { act } from 'react';
import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import * as JSXRuntime from 'react/jsx-runtime';
import * as JSXDevRuntime from 'react/jsx-dev-runtime';
import * as Router from 'react-router';
import { transform } from 'sucrase';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { parse } from 'yaml';
import { afterEach, describe, expect, it } from 'vitest';
import { compile, type Transform } from '../src/lib/react-preview';
import { showAll } from '../src/lib/show-value';

const FENCE = /^(`{3,})(\w+)\n([\s\S]*?)\n\1[ \t]*$/gm;
const MODULES: Record<string, unknown> = {
  react: React,
  'react-dom/client': ReactDOMClient,
  'react/jsx-runtime': JSXRuntime,
  'react/jsx-dev-runtime': JSXDevRuntime,
  'react-router': Router,
};

type Step =
  | { click: string }
  | { click_selector: string }
  | { type: [string, string] }
  | { clear: string }
  | { select: [string, string] }
  | { text: string; within_ms?: number }
  | { fetches_at_least: number }
  | { no_text: string }
  | { expect: string }
  | { printed: string };

interface Entry {
  block: number;
  check: string;
  steps?: Step[];
  output?: string;
  warnings_contain?: string[];
  throws?: string;
  fetch_json?: Record<string, unknown>;
  fetch_delay_ms?: number;
  path?: string;
  append?: string;
  modules?: Record<string, number>;
}

const cases: { chapter: string; entry: Entry; lang: string; code: string; blocks: RegExpMatchArray[] }[] = [];
for (const chapter of fs.readdirSync('content/chapters').sort()) {
  const file = `content/chapters/${chapter}/examples.yaml`;
  if (!fs.existsSync(file)) continue;
  const entries = (parse(fs.readFileSync(file, 'utf8')) ?? []) as Entry[];
  const blocks = [...fs.readFileSync(`content/chapters/${chapter}/index.mdx`, 'utf8').matchAll(FENCE)];
  for (const entry of entries) {
    // TSX blocks checked as TypeScript can also be shown and clicked through here, by giving them steps.
    const typedAndShown = entry.check === 'ts' && blocks[entry.block - 1]?.[2] === 'tsx' && entry.steps;
    if (entry.check !== 'react' && !typedAndShown) continue;
    const m = blocks[entry.block - 1];
    cases.push({ chapter, entry, lang: m?.[2] ?? '', code: (m?.[3] ?? '') + (entry.append ? `\n${entry.append}` : ''), blocks });
  }
}

const g = globalThis as Record<string, unknown>;
g.IS_REACT_ACT_ENVIRONMENT = true;
let unmount: (() => void) | null = null;
afterEach(() => {
  if (unmount) act(() => unmount!());
  unmount = null;
  document.body.innerHTML = '';
});

/** Runs the compiled example the way the preview's setup script does. */
function load(compiled: string, files: Record<string, string> = {}) {
  let shown = false;
  const roots: ReactDOMClient.Root[] = [];
  const dom = {
    ...ReactDOMClient,
    createRoot: (el: Element) => {
      shown = true;
      const r = ReactDOMClient.createRoot(el);
      roots.push(r);
      return r;
    },
  };
  const require = (name: string) => {
    if (name === 'react-dom/client') return dom;
    if (name in MODULES) return MODULES[name];
    if (name.endsWith('.css')) return {};
    if (name in files) {
      const m = { exports: {} as Record<string, unknown> };
      // eslint-disable-next-line no-new-func
      new Function('require', 'module', 'exports', files[name])(require, m, m.exports);
      return m.exports;
    }
    throw new Error(`This preview cannot load "${name}".`);
  };
  const module = { exports: {} as Record<string, unknown> };
  // eslint-disable-next-line no-new-func
  new Function('require', 'module', 'exports', compiled)(require, module, module.exports);
  return { shown: () => shown, roots, exports: module.exports, dom };
}

describe('React examples', () => {
  it('finds examples to run (so a broken loader cannot pass silently)', () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  for (const { chapter, entry, lang, code, blocks } of cases) {
    it(`${chapter} block ${entry.block}`, { timeout: 30_000 }, async () => {
      expect(code, 'the block exists').toBeTruthy();
      expect(['jsx', 'tsx'], 'a react check is for jsx or tsx blocks').toContain(lang);
      document.body.innerHTML = '<div id="root"></div>';
      if (entry.path) window.history.replaceState(null, '', entry.path);

      const printed: string[] = [];
      const warnings: string[] = [];
      const log = console.log;
      const error = console.error;
      const warn = console.warn;
      console.log = (...a: unknown[]) => void printed.push(showAll(a));
      console.error = (...a: unknown[]) => void warnings.push(showAll(a));
      console.warn = (...a: unknown[]) => void warnings.push(showAll(a));
      const realFetch = g.fetch;
      const fetched: string[] = [];
      g.fetch = async (url: string) => {
        fetched.push(String(url));
        await new Promise((r) => setTimeout(r, entry.fetch_delay_ms ?? 10));
        const known = entry.fetch_json && Object.prototype.hasOwnProperty.call(entry.fetch_json, String(url));
        return {
          ok: !!known,
          status: known ? 200 : 404,
          json: async () => (known ? structuredClone(entry.fetch_json![String(url)]) : { message: 'Not Found' }),
        };
      };
      // React reports an error thrown while showing a component here, as browsers do.
      const uncaught: string[] = [];
      const onError = (e: ErrorEvent) => {
        uncaught.push(String(e.error?.message ?? e.message));
        e.preventDefault();
      };
      window.addEventListener('error', onError);

      try {
        const compiled = compile(code, lang, transform as unknown as Transform);
        let app!: ReturnType<typeof load>;
        await act(async () => {
          const files = Object.fromEntries(
            Object.entries(entry.modules ?? {}).map(([name, n]) => [name, compile(blocks[n - 1][3], blocks[n - 1][2], transform as unknown as Transform)]),
          );
          app = load(compiled, files);
          if (!app.shown()) {
            const App = app.exports.default;
            expect(typeof App, 'the block exports a component or shows one with createRoot').toBe('function');
            app.dom.createRoot(document.getElementById('root')!).render(React.createElement(App as React.FC));
          }
        });
        unmount = () => app.roots.forEach((r) => r.unmount());

        if (entry.throws) {
          await waitFor(() => expect(uncaught.join('\n')).toContain(entry.throws));
          return;
        }

        const user = userEvent.setup();
        for (const step of entry.steps ?? []) {
          const what = JSON.stringify(step);
          if ('click' in step) {
            const target =
              screen.queryByRole('button', { name: step.click }) ??
              screen.queryByRole('link', { name: step.click }) ??
              screen.queryByRole('checkbox', { name: step.click }) ??
              screen.getByText(step.click);
            await user.click(target);
          }
          else if ('click_selector' in step) await user.click(document.querySelector(step.click_selector)!);
          else if ('type' in step) await user.type(document.querySelector(step.type[0])!, step.type[1]);
          else if ('clear' in step) await user.clear(document.querySelector(step.clear)!);
          else if ('select' in step) await user.selectOptions(document.querySelector(step.select[0])!, step.select[1]);
          else if ('text' in step) await waitFor(() => expect(document.body.textContent, what).toContain(step.text), { timeout: step.within_ms ?? 2000 });
          else if ('fetches_at_least' in step) await waitFor(() => expect(fetched.length, what).toBeGreaterThanOrEqual(step.fetches_at_least));
          else if ('no_text' in step) expect(document.body.textContent, what).not.toContain(step.no_text);
          else if ('expect' in step) {
            // eslint-disable-next-line no-new-func
            const ok = await waitFor(() => {
              const r = new Function('document', `return (${step.expect});`)(document);
              expect(r, what).toBe(true);
              return r;
            });
            expect(ok).toBe(true);
          } else if ('printed' in step) await waitFor(() => expect(printed.join('\n'), what).toContain(step.printed));
          else throw new Error(`unknown step ${what}`);
        }
        expect(uncaught, 'nothing stopped with an error').toEqual([]);
        if (entry.output !== undefined) expect(printed.join('\n').trim()).toBe(entry.output.trim());
        for (const part of entry.warnings_contain ?? []) expect(warnings.join('\n')).toContain(part);
        // React's warnings are mistakes; an example only shows one when the chapter says so.
        if (!entry.warnings_contain) expect(warnings, 'React printed no warnings').toEqual([]);
      } finally {
        console.log = log;
        console.error = error;
        console.warn = warn;
        g.fetch = realFetch;
        window.removeEventListener('error', onError);
      }
    });
  }
});
