"""Runs the code examples that appear in the chapters.

Every fenced code block in every content/chapters/<id>/index.mdx must have an
entry in content/chapters/<id>/examples.yaml saying how it is checked. The
code that is run is read straight from the chapter, so what a learner reads is
exactly what was tested.

Kinds of check (the `check:` field):

  python           Run with the same runner the website uses (src/runner/zte_runner.py).
                   Blocks in one chapter share one session, like cells in a notebook.
                   Fields: stdin, seed, output | output_contains, raises, before, verify,
                   ends_waiting_for_input (for a program that loops on input() for ever).
                   `before` is Python run first that the reader does not see; it is only
                   for things the chapter says come from elsewhere, and `note` must say so.
  python-fake-api  As `python`, but the Anthropic SDK is pointed at a stand-in
                   server on this machine (fake_anthropic.py). Proves the SDK calls
                   and the handling of replies are valid. It is NOT the live API.
                   Extra field: replies.
  heavy            Python needing PyTorch or model downloads. Runs only when
                   EXAMPLES_HEAVY=1 (a weekly CI job). `fake_api: true` also points
                   the Anthropic SDK at the stand-in server.
  shell            Bash, in an empty temporary folder. `script:` is what runs;
                   `$BLOCK` is a file holding the block. Default: the block itself.
  sql              Run in SQLite (in memory, or the file named by `database`); `verify` gets `db`.
  Any kind may say `needs: network` to run only when EXAMPLES_NETWORK=1.
  pip              `pip install` lines: checks the packages can be resolved.
                   Needs the network: runs only when EXAMPLES_NETWORK=1.
  docker           A shell script that needs Docker. Runs only when EXAMPLES_DOCKER=1.
  vitest           Checked by a named test in tests/web-examples.test.ts.
  js               JavaScript, run in Node by tests/js-blocks.test.ts with console output
                   compared (`output`, `output_contains`, `throws`, `expect`).
  web              HTML or CSS, validated by tests/web-blocks.test.ts (html-validate,
                   css-tree). `expect_problems` for examples that are wrong on purpose.
  browser          As web, and rendered in real Chrome by e2e/examples.e2e.ts, which
                   checks the chapter's claims: `combine`, `viewport`, `actions`, `expect`.
  illustration     Not a program (worked arithmetic, sample output). Needs `verify`
                   (Python that asserts the facts shown) or a `note` saying how it was checked.
  not-run          Cannot be run automatically. Needs `reason`.

`verify:` is Python run after the block with these names available:
  block (the code as text), out (what it printed), ns (its variables),
  requests and fake (python-fake-api: the requests the SDK sent, and the stand-in
  server, whose `replies` list can be refilled), db (sql), tmp (the folder).
"""
from __future__ import annotations

import contextlib
import importlib.util
import io
import json
import os
import re
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
CHAPTERS = ROOT / "content" / "chapters"
FENCE = re.compile(r"^(`{3,})(\w+)\n(.*?)\n\1[ \t]*$", re.S | re.M)
KINDS = {"python", "python-fake-api", "heavy", "shell", "sql", "pip", "docker", "vitest", "web", "browser", "js", "illustration", "not-run"}
AUTOMATED = {"python", "shell", "sql", "pip", "docker", "vitest"}


class Skip(Exception):
    """This check cannot run here (no network, no Docker, no PyTorch)."""


def chapter_ids() -> list[str]:
    return sorted(p.parent.name for p in CHAPTERS.glob("*/index.mdx"))


def blocks(chapter: str) -> list[tuple[str, str]]:
    text = (CHAPTERS / chapter / "index.mdx").read_text(encoding="utf-8")
    return [(m.group(2), m.group(3)) for m in FENCE.finditer(text)]


def spec(chapter: str) -> list[dict]:
    f = CHAPTERS / chapter / "examples.yaml"
    return yaml.safe_load(f.read_text(encoding="utf-8")) or [] if f.exists() else []


def problems_with_spec(chapter: str) -> list[str]:
    """Structural checks: every block accounted for, nothing left over."""
    bl, sp = blocks(chapter), spec(chapter)
    out = []
    if len(bl) != len(sp):
        return [f"{chapter}: index.mdx has {len(bl)} code blocks but examples.yaml has {len(sp)} entries"]
    for i, ((lang, _), entry) in enumerate(zip(bl, sp), start=1):
        where = f"{chapter} block {i}"
        if entry.get("block") != i:
            out.append(f"{where}: entry says block {entry.get('block')}")
        if entry.get("lang") != lang:
            out.append(f"{where}: chapter says {lang}, examples.yaml says {entry.get('lang')}")
        kind = entry.get("check")
        if kind not in KINDS:
            out.append(f"{where}: unknown check {kind!r}")
        if kind == "not-run" and not entry.get("reason"):
            out.append(f"{where}: not-run needs a reason")
        if kind == "illustration" and not (entry.get("verify") or entry.get("note")):
            out.append(f"{where}: illustration needs verify or note")
        if "DRAFT_PROBLEM" in entry or "TODO" in str(entry.get("reason", "")):
            out.append(f"{where}: still a draft (DRAFT_PROBLEM or a TODO reason)")
        if kind == "browser" and not entry.get("expect"):
            out.append(f"{where}: browser needs at least one expectation")
        if kind == "vitest" and not entry.get("test"):
            out.append(f"{where}: vitest needs the test name")
    return out


def _load_runner():
    spec_ = importlib.util.spec_from_file_location("zte_runner", ROOT / "src" / "runner" / "zte_runner.py")
    mod = importlib.util.module_from_spec(spec_)
    spec_.loader.exec_module(mod)
    return mod


def _clean(text: str) -> str:
    return "\n".join(line.rstrip() for line in text.strip().splitlines())


class Chapter:
    """One chapter's session: a temporary folder and one shared Python namespace."""

    def __init__(self, chapter: str):
        self.id = chapter
        self.blocks = blocks(chapter)
        self.spec = spec(chapter)
        self.tmp = Path(tempfile.mkdtemp(prefix=f"zte-{chapter}-"))
        self.runner = _load_runner()
        self.results: dict[int, str | None | Skip] = {}
        self.fake = None

    # -- running ---------------------------------------------------------
    def result(self, n: int):
        """Runs blocks 1..n in order (once each) and returns block n's outcome."""
        for i in range(1, n + 1):
            if i not in self.results:
                try:
                    self.results[i] = self._run(i)
                except Skip as s:
                    self.results[i] = s
        return self.results[n]

    def _run(self, n: int) -> str | None:
        lang, code = self.blocks[n - 1]
        e = self.spec[n - 1]
        kind = e["check"]
        if kind == "not-run":
            raise Skip(f"not run: {e['reason']}")
        if kind == "vitest":
            raise Skip(f"checked in tests/web-examples.test.ts ({e['test']})")
        if kind == "web":
            raise Skip("validated in tests/web-blocks.test.ts")
        if kind == "js":
            raise Skip("run in tests/js-blocks.test.ts")
        if kind == "browser":
            raise Skip("validated in tests/web-blocks.test.ts and rendered in a real browser by e2e/examples.e2e.ts")
        if kind == "illustration":
            if not e.get("verify"):
                raise Skip(f"checked by hand: {e['note']}")
            return self._verify(e, code, "", {})
        if kind == "heavy" and os.environ.get("EXAMPLES_HEAVY") != "1":
            raise Skip("needs PyTorch or a model download; set EXAMPLES_HEAVY=1")
        if kind == "docker" and os.environ.get("EXAMPLES_DOCKER") != "1":
            raise Skip("needs Docker; set EXAMPLES_DOCKER=1")
        if (kind == "pip" or e.get("needs") == "network") and os.environ.get("EXAMPLES_NETWORK") != "1":
            raise Skip("needs the network; set EXAMPLES_NETWORK=1")
        if kind in ("python", "python-fake-api", "heavy"):
            return self._python(e, code)
        if kind in ("shell", "docker"):
            return self._shell(e, code)
        if kind == "pip":
            pkgs = [w for line in code.splitlines() if line.startswith("pip install") for w in line.split("#")[0].split()[2:]]
            return self._shell({**e, "script": f"python -m pip install --dry-run --quiet {' '.join(pkgs)}"}, code)
        if kind == "sql":
            db = sqlite3.connect(str(self.tmp / e["database"]) if e.get("database") else ":memory:")
            try:
                db.executescript(code)
            except sqlite3.Error as err:
                return f"SQL failed: {err}"
            db.commit()
            return self._verify(e, code, "", {"db": db})
        raise AssertionError(kind)

    def _python(self, e: dict, code: str) -> str | None:
        extra = {}
        env_before = dict(os.environ)
        cwd = os.getcwd()
        os.chdir(self.tmp)
        try:
            if e["check"] == "python-fake-api" or e.get("fake_api"):
                from fake_anthropic import FakeAnthropic

                self.fake = self.fake or FakeAnthropic()
                self.fake.replies = list(e.get("replies") or [])
                self.fake.requests.clear()
                os.environ["ANTHROPIC_BASE_URL"] = self.fake.url
                os.environ["ANTHROPIC_API_KEY"] = "test-key-not-real"
                extra["requests"] = self.fake.requests
                extra["fake"] = self.fake
            ns = self.runner._zte_ns
            if e.get("before"):
                exec(e["before"], ns)
            buf = io.StringIO()
            with contextlib.redirect_stdout(buf), contextlib.redirect_stderr(buf):
                res = json.loads(self.runner._zte_run(code, e.get("stdin") or [], e.get("seed", 0)))
            out = buf.getvalue()
        finally:
            os.chdir(cwd)
            os.environ.clear()
            os.environ.update(env_before)

        if res["status"] == "input" and e.get("ends_waiting_for_input"):
            res = {"status": "ok"}  # a loop that asks for ever; the answers given were all used
        if res["status"] == "input":
            return f"the program asked for more input than `stdin` supplies (prompt: {res['prompt']!r})\n{out}"
        if e.get("raises"):
            if res.get("kind") != e["raises"]:
                return f"expected {e['raises']}, got {res.get('kind') or 'no error'}\n{out}{res.get('traceback', '')}"
        elif res["status"] == "error":
            return f"raised {res['kind']}\n{out}{res['traceback']}"
        if "output" in e and _clean(out) != _clean(e["output"]):
            return f"output differs\n--- expected\n{_clean(e['output'])}\n--- got\n{_clean(out)}"
        for part in e.get("output_contains") or []:
            if part not in out:
                return f"output does not contain {part!r}\n--- got\n{out}"
        return self._verify(e, code, out, {"ns": ns, **extra})

    def _shell(self, e: dict, code: str) -> str | None:
        block_file = self.tmp / "_block.sh"
        block_file.write_text(code + "\n", encoding="utf-8")
        env = {
            **os.environ,
            "BLOCK": str(block_file),
            "REPO": str(ROOT),
            "PATH": f"{Path(sys.executable).parent}{os.pathsep}{os.environ['PATH']}",
            # A clean Git identity, so the examples never read or change the developer's own settings.
            "GIT_CONFIG_GLOBAL": os.devnull,
            "GIT_CONFIG_NOSYSTEM": "1",
            "GIT_AUTHOR_NAME": "Learner", "GIT_AUTHOR_EMAIL": "learner@example.com",
            "GIT_COMMITTER_NAME": "Learner", "GIT_COMMITTER_EMAIL": "learner@example.com",
            "GIT_TERMINAL_PROMPT": "0",
        }
        script = e.get("script") or 'bash -e "$BLOCK"'
        p = subprocess.run(["bash", "-e", "-o", "pipefail", "-c", script], cwd=self.tmp, env=env, capture_output=True, text=True, timeout=e.get("timeout", 300))
        out = p.stdout + p.stderr
        if p.returncode != 0:
            return f"exit code {p.returncode}\n{out[-3000:]}"
        for part in e.get("output_contains") or []:
            if part not in out:
                return f"output does not contain {part!r}\n--- got\n{out[-3000:]}"
        return self._verify(e, code, out, {})

    def _verify(self, e: dict, code: str, out: str, extra: dict) -> str | None:
        if not e.get("verify"):
            return None
        scope = {"block": code, "out": out, "tmp": self.tmp, **extra}
        try:
            exec(e["verify"], scope)
        except AssertionError as err:
            return f"verify failed: {err or 'assertion'}"
        except Exception as err:  # a broken verify is a failure, not a pass
            return f"verify raised {type(err).__name__}: {err}"
        return None


_sessions: dict[str, Chapter] = {}


def session(chapter: str) -> Chapter:
    if chapter not in _sessions:
        _sessions[chapter] = Chapter(chapter)
    return _sessions[chapter]
