"""Runs a learner's Python the way the site does.

This one file is used in two places, so they cannot drift apart:
  - in the browser, by src/runner/pyworker.js (inside Pyodide);
  - in the test suite, by tests/examples/test_examples.py, which runs every
    Python example in every chapter through it.

Behaviour, matching the >>> prompt: a line that is just a value shows that
value; input() takes its answers from a list and asks for more by raising.
"""
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
        text = "Traceback (most recent call last):\n" + "".join(traceback.format_list(frames)) + text
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
