// Turns a React (JSX or TSX) or TypeScript example into code a preview can run.
//
// The same functions are used by the site (src/scripts/playground.ts) and by the
// tests that check every React example (tests/react-blocks.test.ts), so what the
// tests run is what a learner's Run button runs.
//
// How a React example runs:
//   - its JSX and types are turned into plain JavaScript by Sucrase (no type checking);
//   - `import` lines become calls to a small require() that knows only react,
//     react-dom/client, react/jsx-runtime and react-router (and ignores imports of
//     .css files, whose styles come from the example's CSS block instead);
//   - if the code shows something itself with createRoot(...).render(...), that is
//     what appears; otherwise its default export is shown, as a Vite project's
//     main.jsx would show <App />.

/** The part of Sucrase's transform() used here, passed in so this file has no imports. */
export type Transform = (
  code: string,
  options: { transforms: ('jsx' | 'typescript' | 'imports')[]; jsxRuntime?: 'automatic'; production?: boolean; filePath?: string },
) => { code: string };

export const REACT_MODULES = ['react', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-router'];

/** Compiles one file of React or TypeScript to CommonJS-style JavaScript. Throws on a syntax error. */
export function compile(code: string, lang: string, transform: Transform): string {
  const typed = lang === 'ts' || lang === 'tsx';
  const jsx = lang === 'jsx' || lang === 'tsx';
  const transforms: ('jsx' | 'typescript' | 'imports')[] = [];
  if (jsx) transforms.push('jsx');
  if (typed) transforms.push('typescript');
  transforms.push('imports');
  return transform(code, { transforms, jsxRuntime: 'automatic', production: false, filePath: `App.${lang}` }).code;
}

/** Turns a Sucrase syntax error into one plain sentence. Sucrase adds "(line:column)". */
export function syntaxMessage(e: unknown): string {
  const m = String((e as Error)?.message ?? e);
  const at = /\((\d+):(\d+)\)\s*$/.exec(m);
  const what = m.replace(/\s*\(\d+:\d+\)\s*$/, '');
  return `The code has a syntax error${at ? ` on line ${at[1]}` : ''}: ${what}`;
}

/**
 * The scripts that go at the end of the preview's <body>: the libraries, a tiny
 * module system, the compiled example, and the step that shows its component.
 */
export function reactScripts(compiled: string, runtimeUrl: string, frameId: string, runtimeCode?: string): string {
  const setup = `(function () {
  var id = ${JSON.stringify(frameId)};
  var mods = window.__zteModules;
  var shown = false;
  function hint(text) { parent.postMessage({ zte: 'playground', id: id, level: 'hint', text: text }, '*'); }
  if (!mods) throw new Error('React did not load, so this example cannot run. Check your connection and reload the page.');
  var real = mods['react-dom/client'];
  // Notice when the example shows something itself, so it is not shown twice.
  var dom = Object.assign({}, real, { createRoot: function () { shown = true; return real.createRoot.apply(null, arguments); } });
  window.__zteRequire = function (name) {
    if (name === 'react-dom/client') return dom;
    if (mods[name]) return mods[name];
    // In a Vite project, importing a CSS file adds its styles to the page. Here the
    // example's CSS block (if it has one) is already on the page, so there is nothing to do.
    if (/\\.css$/.test(name)) return {};
    if (/^\\.\\.?\\//.test(name)) throw new Error('This preview has only one file, so it cannot import "' + name + '". Put that code in this file instead.');
    throw new Error('This preview cannot load "' + name + '". It has only react, react-dom and react-router. In a Vite project, install it with npm.');
  };
  window.__zteModule = { exports: {} };
  window.__zteFailed = false;
  window.addEventListener('error', function () { window.__zteFailed = true; });
  window.__zteMount = function () {
    if (shown || window.__zteFailed) return;
    var App = window.__zteModule.exports.default;
    if (typeof App !== 'function') {
      hint('Nothing to show: the code does not export a component with "export default", or show one with createRoot(...).render(...).');
      return;
    }
    var root = document.getElementById('root');
    if (!root) { root = document.createElement('div'); root.id = 'root'; document.body.appendChild(root); }
    dom.createRoot(root).render(mods.react.createElement(App));
  };
})();`;
  // A </script> inside the example would end the script early.
  const safe = compiled.replace(/<\/script/gi, '<\\/script');
  return [
    // Normally the libraries load from the site like any script, so the browser caches them.
    // Vite's development server refuses script requests from the sandboxed frame (it blocks
    // cross-site requests, to protect source code), so in development they are put inline.
    runtimeCode !== undefined
      ? `<script>${runtimeCode.replace(/<\/script/gi, '<\\/script')}</script>`
      : `<script src="${runtimeUrl.replace(/"/g, '&quot;')}"></script>`,
    `<script>${setup}</script>`,
    // The example starts on line 1 of this script, and sourceURL makes error line
    // numbers count from there. (Sucrase keeps each line of the example on its own line.)
    `<script>(function (require, module, exports) {${safe}\n})(window.__zteRequire, window.__zteModule, window.__zteModule.exports);\n//# sourceURL=App.jsx\n</script>`,
    `<script>window.__zteMount();</script>`,
  ].join('\n');
}
