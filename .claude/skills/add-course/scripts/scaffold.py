#!/usr/bin/env python3
"""Creates the files for a new course, or new chapters in an existing course,
from an outline the learner has approved.

Usage (from the repository root):
  .venv/bin/python .claude/skills/add-course/scripts/scaffold.py OUTLINE.yaml
  .venv/bin/python .claude/skills/add-course/scripts/scaffold.py --check COURSE_ID
  .venv/bin/python .claude/skills/add-course/scripts/scaffold.py --remove COURSE_ID

The outline (see ../references/outline-format.md):

  course: data-analyst            # new or existing course id
  title: Zero to Data Analyst     # new courses only
  tagline: ...                    # new courses only
  description: ...                # new courses only
  order: 3                        # optional
  parts:
    - name: Start here
      blurb: ...
      chapters:
        - terminal-files          # an existing chapter, reused as it is
        - id: what-analysts-do    # a new chapter
          title: What a data analyst does
          summary: One or two sentences.
          minutes: 60
          after: some-chapter     # optional: insert after this chapter of the part

Rules it enforces, so mistakes surface now rather than in the build:
  - ids are lower-case letters, numbers and hyphens;
  - a new chapter id must not already exist; a reused one must exist;
  - existing chapter folders are never overwritten.

New chapter files contain visible "DRAFT:" markers. `--check` lists every
marker left in a course's new chapters and exits non-zero while any remain.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[4]
CONTENT = ROOT / "content"
CHAPTERS = CONTENT / "chapters"
COURSES = CONTENT / "courses"
ID = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
MARK = "DRAFT:"


def fail(msg: str) -> None:
    sys.exit(f"scaffold: {msg}")


def q(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def course_file(course_id: str) -> Path:
    return COURSES / f"{course_id}.yaml"


def chapter_skeleton(ch: dict) -> str:
    return f"""---
title: {q(ch["title"])}
summary: {q(ch["summary"])}
prerequisites: []
estimated_minutes: {int(ch.get("minutes", 60))}
status: deepened
---

{MARK} Why this matters, in two or three plain sentences: what the learner will be able to do after this chapter.

## {MARK} First idea

{MARK} Teach it from zero. Define each new term the first time it appears, in bold. Then a worked example, step by step.

## Common mistakes

{MARK} The real mistakes beginners make here, and what each looks like when it happens.

## Practice

{MARK} Graded problems: warm-up, standard, stretch. Each answer goes in a Solution box.

<Exercises />

## Summary

{MARK} Five to eight short points a learner could revise from.

## Go deeper

{MARK} Two to five free resources you opened and checked, each recorded in resources.yaml.
"""


def scaffold(outline_path: Path) -> None:
    outline = yaml.safe_load(outline_path.read_text(encoding="utf-8"))
    cid = outline.get("course")
    if not cid or not ID.match(cid):
        fail(f"'course' must be a lower-case id such as data-analyst, not {cid!r}")
    existing_course = course_file(cid).exists()
    if existing_course:
        manifest = yaml.safe_load(course_file(cid).read_text(encoding="utf-8"))
    else:
        for field in ("title", "tagline", "description"):
            if not outline.get(field):
                fail(f"a new course needs '{field}'")
        manifest = {"id": cid, "title": outline["title"], "tagline": outline["tagline"], "description": outline["description"]}
        if "order" in outline:
            manifest["order"] = outline["order"]
        manifest["parts"] = []

    existing_ids = {p.parent.name for p in CHAPTERS.glob("*/index.mdx")}
    new_chapters: list[dict] = []
    seen: set[str] = set()
    for part in outline.get("parts") or []:
        target = next((p for p in manifest["parts"] if p["name"] == part["name"]), None)
        if target is None:
            if not part.get("blurb"):
                fail(f"the new part {part['name']!r} needs a 'blurb'")
            target = {"name": part["name"], "blurb": part["blurb"], "chapters": []}
            manifest["parts"].append(target)
        for item in part.get("chapters") or []:
            if isinstance(item, str):
                if item not in existing_ids:
                    fail(f"{item!r} is listed as an existing chapter, but content/chapters/{item} does not exist")
                chid, after = item, None
            else:
                chid, after = item.get("id"), item.get("after")
                if not chid or not ID.match(chid):
                    fail(f"chapter id {chid!r} must be lower-case letters, numbers and hyphens")
                if chid in existing_ids:
                    fail(f"a chapter called {chid!r} already exists; reuse it by writing just its id, or choose another id")
                for field in ("title", "summary"):
                    if not item.get(field):
                        fail(f"new chapter {chid!r} needs '{field}'")
                new_chapters.append(item)
            if chid in seen or chid in target["chapters"]:
                fail(f"{chid!r} appears twice")
            seen.add(chid)
            if after:
                if after not in target["chapters"]:
                    fail(f"{chid!r} says after: {after!r}, which is not in part {part['name']!r}")
                target["chapters"].insert(target["chapters"].index(after) + 1, chid)
            else:
                target["chapters"].append(chid)

    for ch in new_chapters:
        d = CHAPTERS / ch["id"]
        d.mkdir(parents=True)
        (d / "index.mdx").write_text(chapter_skeleton(ch), encoding="utf-8")
        (d / "exercises.yaml").write_text(f'- title: "Do this"\n  items:\n    - key: x1\n      text: "{MARK} a hands-on task with a result the learner can check"\n', encoding="utf-8")
        (d / "quiz.yaml").write_text(
            f'- question: "{MARK} a question that checks understanding, not memory"\n  options:\n    - "{MARK} right answer"\n    - "{MARK} a believable wrong answer"\n  answer: 0\n  explanation: "{MARK} why the right answer is right and the others are not"\n',
            encoding="utf-8",
        )
        (d / "resources.yaml").write_text(f"# Resources linked from this chapter. Only list what you opened and checked.\n# {MARK} fill in, or leave as an empty list: []\n[]\n", encoding="utf-8")

    lines = [f"id: {manifest['id']}", f"title: {q(manifest['title'])}", f"tagline: {q(manifest['tagline'])}", f"description: {q(manifest['description'])}"]
    if "order" in manifest:
        lines.append(f"order: {manifest['order']}")
    lines.append("parts:")
    for p in manifest["parts"]:
        lines.append(f"  - name: {q(p['name'])}\n    blurb: {q(p['blurb'])}\n    chapters:")
        lines += [f"      - {c}" for c in p["chapters"]]
    course_file(cid).write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"{'Updated' if existing_course else 'Created'} content/courses/{cid}.yaml")
    for ch in new_chapters:
        print(f"Created content/chapters/{ch['id']}/ (index.mdx, quiz.yaml, exercises.yaml, resources.yaml)")
    print(f"Next: write each chapter, then run --check {cid} until nothing is left.")


def new_chapters_of(cid: str) -> list[str]:
    manifest = yaml.safe_load(course_file(cid).read_text(encoding="utf-8"))
    ids = [c for p in manifest["parts"] for c in p["chapters"]]
    return [c for c in ids if (CHAPTERS / c / "resources.yaml").exists() or MARK in (CHAPTERS / c / "index.mdx").read_text(encoding="utf-8")]


def check(cid: str) -> int:
    if not course_file(cid).exists():
        fail(f"no course called {cid!r}")
    left = 0
    for c in new_chapters_of(cid):
        for f in sorted((CHAPTERS / c).glob("*")):
            if f.is_file():
                for n, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
                    if MARK in line:
                        print(f"content/chapters/{c}/{f.name}:{n}: {line.strip()[:100]}")
                        left += 1
    print(f"{left} unfinished {'place' if left == 1 else 'places'} in course {cid!r}.")
    return 1 if left else 0


def remove(cid: str) -> None:
    """Deletes a course file and the chapters only it uses. Shared chapters are kept."""
    if not course_file(cid).exists():
        fail(f"no course called {cid!r}")
    mine = {c for p in yaml.safe_load(course_file(cid).read_text())["parts"] for c in p["chapters"]}
    others = set()
    for f in COURSES.glob("*.yaml"):
        if f != course_file(cid):
            others |= {c for p in yaml.safe_load(f.read_text())["parts"] for c in p["chapters"]}
    for c in sorted(mine - others):
        shutil.rmtree(CHAPTERS / c)
        print(f"Removed content/chapters/{c}/")
    course_file(cid).unlink()
    print(f"Removed content/courses/{cid}.yaml (chapters shared with other courses were kept)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("outline", nargs="?", type=Path)
    g.add_argument("--check", metavar="COURSE_ID")
    g.add_argument("--remove", metavar="COURSE_ID")
    a = ap.parse_args()
    if a.check:
        sys.exit(check(a.check))
    if a.remove:
        remove(a.remove)
    else:
        scaffold(a.outline)
