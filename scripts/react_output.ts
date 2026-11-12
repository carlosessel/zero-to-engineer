// Shows what a React block from a chapter displays and warns, for drafting
// examples.yaml (the real checks are in tests/react-blocks.test.ts).
// Usage: node scripts/react_output.ts <chapter> <block number>
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { transform } from 'sucrase';
import { compile, type Transform } from '../src/lib/react-preview.ts';
import { showAll } from '../src/lib/show-value.ts';

const [chapter, n] = process.argv.slice(2);
const FENCE = /^(`{3,})(\w+)\n([\s\S]*?)\n\1[ \t]*$/gm;
const m = [...fs.readFileSync(`content/chapters/${chapter}/index.mdx`, 'utf8').matchAll(FENCE)][Number(n) - 1];
const dom = new JSDOM('<!doctype html><div id="root"></div>', { pretendToBeVisual: true, url: 'http://localhost/' });
const g = globalThis as Record<string, unknown>;
for (const k of ['window', 'document', 'HTMLElement', 'Node', 'Event', 'MouseEvent']) g[k] = (dom.window as unknown as Record<string, unknown>)[k];
g.IS_REACT_ACT_ENVIRONMENT = true;
const printed: string[] = [];
const warned: string[] = [];
console.log = (...a: unknown[]) => void printed.push(showAll(a));
console.error = (...a: unknown[]) => void warned.push(showAll(a));
const out = (s: string) => process.stdout.write(s + '\n');

const React = await import('react');
const ReactDOMClient = await import('react-dom/client');
const mods: Record<string, unknown> = {
  react: React,
  'react-dom/client': ReactDOMClient,
  'react/jsx-runtime': await import('react/jsx-runtime'),
  'react/jsx-dev-runtime': await import('react/jsx-dev-runtime'),
  'react-router': await import('react-router'),
};
try {
  const compiled = compile(m[3], m[2], transform as unknown as Transform);
  const module = { exports: {} as Record<string, unknown> };
  let shown = false;
  const domMod = { ...ReactDOMClient, createRoot: (el: Element) => ((shown = true), ReactDOMClient.createRoot(el)) };
  const req = (name: string) => (name === 'react-dom/client' ? domMod : name.endsWith('.css') ? {} : mods[name]);
  await React.act(async () => {
    new Function('require', 'module', 'exports', compiled)(req, module, module.exports);
    if (!shown) ReactDOMClient.createRoot(dom.window.document.getElementById('root')!).render(React.createElement(module.exports.default as React.FC));
  });
  await new Promise((r) => setTimeout(r, 100));
  out('TEXT: ' + dom.window.document.body.textContent);
  out('HTML: ' + dom.window.document.body.innerHTML);
} catch (e) {
  out('ERROR: ' + String((e as Error).message));
}
if (printed.length) out('PRINTED: ' + printed.join(' | '));
if (warned.length) out('WARNED: ' + warned.join(' | '));
process.exit(0);
