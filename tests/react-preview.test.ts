import { transform } from 'sucrase';
import { describe, expect, it } from 'vitest';
import { buildDocument } from '../src/lib/playground';
import { compile, reactScripts, syntaxMessage, type Transform } from '../src/lib/react-preview';

const t = transform as unknown as Transform;

describe('compiling React and TypeScript examples', () => {
  it('turns JSX and imports into plain JavaScript, keeping line numbers', () => {
    const code = "import { useState } from 'react';\n\nexport default function App() {\n  const [n] = useState(0);\n  return <p>{n}</p>;\n}";
    const out = compile(code, 'jsx', t);
    expect(out).toContain('require("react/jsx-dev-runtime")');
    expect(out).toContain("require('react')");
    expect(out).toContain('exports.default = App');
    expect(out).not.toContain('<p>');
    // The line holding the JSX is still line 5, so error messages point at the right line.
    expect(out.split('\n')[4]).toContain('jsxDEV');
  });

  it('removes TypeScript types', () => {
    const out = compile('export default function App({ name }: { name: string }) {\n  return <p>{name}</p>;\n}', 'tsx', t);
    expect(out).not.toContain(': string');
  });

  it('explains a syntax error in one sentence with its line', () => {
    let message = '';
    try {
      // (Sucrase does not notice a closing tag that does not match, such as <p>hi</b>;
      // the browser does not either, so that mistake shows as wrong output instead.)
      compile('export default function App() {\n  const n = ;\n  return <p>{n}</p>;\n}', 'jsx', t);
    } catch (e) {
      message = syntaxMessage(e);
    }
    expect(message).toMatch(/^The code has a syntax error on line 2: /);
  });
});

describe('the React part of a preview', () => {
  it('loads React first, then the example, then shows its component', () => {
    const html = reactScripts('exports.default = 1;', 'https://example.test/vendor/react-runtime.js', 'f1');
    const order = ['react-runtime.js', '__zteRequire =', 'exports.default = 1;', '__zteMount()'].map((s) => html.indexOf(s));
    expect(order.every((n) => n >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('cannot be ended early by </script> in the example', () => {
    const html = reactScripts('const s = "</script><b>";', 'x.js', 'f1');
    expect(html).not.toContain('"</script><b>"');
  });

  it('adds an element with id="root" when the page has none', () => {
    const doc = buildDocument({ html: '', css: '', js: '' }, 'f', { compiled: '', runtimeUrl: 'x.js' });
    expect(doc).toContain('<div id="root"></div>');
    const own = buildDocument({ html: '<main id="root"></main>', css: '', js: '' }, 'f', { compiled: '', runtimeUrl: 'x.js' });
    expect(own.match(/id="root"/g)).toHaveLength(1);
  });
});
