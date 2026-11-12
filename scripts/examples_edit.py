"""Small helpers for editing content/chapters/<id>/examples.yaml from a script.

Used while reviewing examples: load a chapter's spec, change one entry, and
write it back with multi-line text kept readable.
"""
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
HEAD = "# How each code block in index.mdx is checked. See tests/examples/harness.py.\n"
MULTILINE = ("output", "verify", "before", "script")


class Block(str):
    pass


yaml.add_representer(Block, lambda d, v: d.represent_scalar("tag:yaml.org,2002:str", v, style="|"))


def _file(chapter: str) -> Path:
    return ROOT / "content" / "chapters" / chapter / "examples.yaml"


def load(chapter: str) -> list[dict]:
    return yaml.safe_load(_file(chapter).read_text(encoding="utf-8"))


def save(chapter: str, entries: list[dict]) -> None:
    out = []
    for e in entries:
        out.append({k: (Block(v.rstrip() + "\n") if isinstance(v, str) and ("\n" in v or k in MULTILINE) else v) for k, v in e.items()})
    _file(chapter).write_text(HEAD + yaml.dump(out, sort_keys=False, allow_unicode=True, width=1000), encoding="utf-8")


def patch(chapter: str, block: int, drop=(), **fields) -> None:
    """Updates the entry for one block. `drop` removes fields."""
    entries = load(chapter)
    e = entries[block - 1]
    e.pop("DRAFT_PROBLEM", None)
    for d in drop:
        e.pop(d, None)
    e.update(fields)
    save(chapter, entries)
