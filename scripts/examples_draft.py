#!/usr/bin/env python3
"""Drafts content/chapters/<id>/examples.yaml for chapters that have none.

It runs each Python block and records what it printed. The draft is a starting
point: a person must read every recorded output against the chapter and decide
whether it is what the chapter claims. Never overwrites an existing file.

Usage: .venv/bin/python scripts/examples_draft.py [chapter ...]
"""
import re
import subprocess
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tests" / "examples"))
import harness  # noqa: E402

HEAVY = re.compile(r"^\s*(?:from|import)\s+(torch|torchvision|sentence_transformers|transformers|peft)\b", re.M)
API = re.compile(r"\banthropic\b|\bclient\.messages\b")


class Block(str):
    pass


yaml.add_representer(Block, lambda d, v: d.represent_scalar("tag:yaml.org,2002:str", v, style="|"))


def draft(chapter):
    out = []
    probe = harness.Chapter(chapter)
    for i, (lang, code) in enumerate(harness.blocks(chapter), start=1):
        e = {"block": i, "lang": lang}
        if lang == "python":
            if HEAVY.search(code):
                e["check"] = "heavy"
            elif API.search(code):
                e["check"] = "python-fake-api"
            else:
                e["check"] = "python"
                probe.spec = [{"check": "not-run"}] * (i - 1) + [{"check": "python"}]
                import contextlib, io, json, os
                buf = io.StringIO()
                cwd = os.getcwd(); os.chdir(probe.tmp)
                try:
                    with contextlib.redirect_stdout(buf):
                        res = json.loads(probe.runner._zte_run(code, [], 0))
                finally:
                    os.chdir(cwd)
                e["output"] = Block(buf.getvalue())
                if res["status"] != "ok":
                    e["DRAFT_PROBLEM"] = Block(res.get("traceback") or f"asked for input: {res.get('prompt')}")
        elif lang == "bash":
            e["check"] = "pip" if all(l.startswith("pip install") for l in code.strip().splitlines()) else "shell"
        elif lang == "sql":
            e["check"] = "sql"
        elif lang in ("html", "css"):
            e["check"] = "web"
        elif lang in ("js", "javascript"):
            e["check"] = "js"
            printed = subprocess.run(["node", "scripts/js_output.ts", chapter, str(i)], capture_output=True, text=True).stdout
            body = printed.split("\n", 1)
            if "stopped with" in body[0]:
                e["DRAFT_PROBLEM"] = body[0]
            e["output"] = Block(body[1] if len(body) > 1 else "")
        elif lang in ("jsx", "tsx") and re.search(r"^\s*export\s+default\b|\bcreateRoot\s*\(", code, re.M):
            e["check"] = "react"
            shown = subprocess.run(["node", "scripts/react_output.ts", chapter, str(i)], capture_output=True, text=True).stdout
            e["DRAFT_SHOWN"] = Block(shown)
            if "ERROR:" in shown or "WARNED:" in shown:
                e["DRAFT_PROBLEM"] = "it stopped with an error or React warned; read DRAFT_SHOWN"
        elif lang in ("ts", "tsx"):
            e["check"] = "ts"
        elif lang in ("jsx",):
            e["check"] = "not-run"
            e["reason"] = "TODO: a piece of a component, not a whole file; combine it or explain"
        elif lang == "text":
            e["check"] = "illustration"
        else:
            e["check"] = "not-run"
            e["reason"] = "TODO"
        out.append(e)
    return out


for chapter in sys.argv[1:] or harness.chapter_ids():
    f = harness.CHAPTERS / chapter / "examples.yaml"
    if f.exists() or not harness.blocks(chapter):
        continue
    f.write_text("# How each code block in index.mdx is checked. See tests/examples/harness.py.\n" + yaml.dump(draft(chapter), sort_keys=False, allow_unicode=True, width=1000), encoding="utf-8")
    print("drafted", chapter)
