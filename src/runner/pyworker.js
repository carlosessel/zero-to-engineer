// Runs Python in the browser with Pyodide (CPython compiled to WebAssembly).
// This file is a web worker: it runs off the main thread, so a slow or endless
// program cannot freeze the page, and "Stop" can simply end the worker.
//
// Pyodide is downloaded from the jsDelivr CDN the first time Run is pressed.
// Nothing is downloaded before that.
export const PYODIDE_VERSION = '314.0.7';
const BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// The Python that prepares the interpreter. It is a real .py file so the test
// suite can run every chapter example through exactly the same code.
import SETUP from './zte_runner.py?raw';

let ready;
function boot() {
  ready ??= (async () => {
    const { loadPyodide } = await import(/* @vite-ignore */ `${BASE}pyodide.mjs`);
    const py = await loadPyodide({ indexURL: BASE });
    py.setStdout({ batched: (text) => postMessage({ type: 'out', text: text + '\n' }) });
    py.setStderr({ batched: (text) => postMessage({ type: 'out', text: text + '\n' }) });
    await py.runPythonAsync(SETUP);
    return py;
  })();
  return ready;
}

onmessage = async (event) => {
  const { id, code, answers, seed } = event.data;
  try {
    postMessage({ type: 'status', id, text: 'Loading Python…' });
    const py = await boot();
    await py.loadPackagesFromImports(code, {
      messageCallback: () => postMessage({ type: 'status', id, text: 'Loading the libraries this example imports…' }),
    });
    postMessage({ type: 'status', id, text: 'Running…' });
    py.globals.set('_zte_code', code);
    py.globals.set('_zte_answers', py.toPy(answers));
    py.globals.set('_zte_seed', seed);
    const result = JSON.parse(await py.runPythonAsync('_zte_run(_zte_code, _zte_answers, _zte_seed)'));
    postMessage({ type: 'done', id, ...result });
  } catch (err) {
    postMessage({ type: 'done', id, status: 'failed', message: String((err && err.message) || err) });
  }
};
