// Runs Python in the browser with Pyodide (CPython compiled to WebAssembly).
// This file is a web worker: it runs off the main thread, so a slow or endless
// program cannot freeze the page, and "Stop" can simply end the worker.
//
// Pyodide is downloaded from the jsDelivr CDN the first time Run is pressed.
// Nothing is downloaded before that.
export const PYODIDE_VERSION = '314.0.7';
const BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// Python that prepares the interpreter. Kept as a string so it loads with the worker.
const SETUP = `
import ast, builtins, json, linecache, random, sys, traceback

class _ZteNeedInput(BaseException):
    """Raised when the program calls input() and no answer has been typed yet."""

_zte_ns = {"__name__": "__main__"}
_ZTE_FILE = "your_code.py"

def _zte_error():
    et, ev, tb = sys.exc_info()
    frames = [f for f in traceback.extract_tb(tb) if f.filename == _ZTE_FILE]
    text = "".join(traceback.format_exception_only(et, ev))
    if frames:
        text = "Traceback (most recent call last):\\n" + "".join(traceback.format_list(frames)) + text
    return json.dumps({"status": "error", "traceback": text, "kind": et.__name__})

def _zte_run(code, answers, seed):
    answers = list(answers)

    def _input(prompt=""):
        # The page cannot pause Python to wait for typing, so the program is
        # re-run from the top with every answer given so far.
        if answers:
            value = answers.pop(0)
            print(str(prompt) + value)
            return value
        raise _ZteNeedInput(str(prompt))

    builtins.input = _input
    random.seed(seed)  # the same "random" numbers on each re-run after input()
    linecache.cache[_ZTE_FILE] = (len(code), None, code.splitlines(True), _ZTE_FILE)
    try:
        tree = ast.parse(code, _ZTE_FILE)
    except SyntaxError:
        return _zte_error()
    try:
        for node in tree.body:
            if isinstance(node, ast.Expr):
                # Like the >>> prompt: a line that is just a value shows that value.
                value = eval(compile(ast.Expression(node.value), _ZTE_FILE, "eval"), _zte_ns)
                if value is not None:
                    print(repr(value))
            else:
                exec(compile(ast.Module([node], []), _ZTE_FILE, "exec"), _zte_ns)
    except _ZteNeedInput as need:
        return json.dumps({"status": "input", "prompt": str(need)})
    except SystemExit:
        pass
    except BaseException:
        return _zte_error()
    return json.dumps({"status": "ok"})
`;

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
