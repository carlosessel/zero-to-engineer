#!/usr/bin/env python3
"""Adds new glossary terms and marks which courses use each term.

Usage: .venv/bin/python scripts/glossary_update.py [NEW_TERMS.yaml]

NEW_TERMS.yaml is a list of {term, definition, courses} entries to add. Then,
for every course, any glossary term that a chapter of that course puts in
**bold** gets that course added to its `courses` list, so the term shows in
the course's glossary. The file is rewritten sorted, in the existing style.

Each time an existing term is added to another course, a CHECK THE MEANING
line is printed: the same word can mean different things in different
courses (weight, prompt, breakpoint), and then the definition must give
both meanings or the chapter must use a different word.
"""
import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
GLOSSARY = ROOT / "content" / "glossary.yaml"


def names(entry):
    out = [re.sub(r"\s*\(.*?\)\s*", " ", entry["term"]).strip()] + [m.strip() for m in re.findall(r"\(([^)]+)\)", entry["term"])]
    return [n.lower() for n in out + list(entry.get("aliases") or [])]


def main():
    entries = yaml.safe_load(GLOSSARY.read_text(encoding="utf-8"))
    if len(sys.argv) > 1:
        existing = {e["term"].lower() for e in entries}
        for new in yaml.safe_load(Path(sys.argv[1]).read_text(encoding="utf-8")):
            if new["term"].lower() in existing:
                sys.exit(f"{new['term']!r} is already in the glossary")
            entries.append(new)

    lookup = {}
    for e in entries:
        for n in names(e):
            lookup[n] = e
            lookup[n + "s"] = e
    for course_file in sorted((ROOT / "content" / "courses").glob("*.yaml")):
        course = yaml.safe_load(course_file.read_text(encoding="utf-8"))
        for chapter in (c for p in course["parts"] for c in p["chapters"]):
            text = (ROOT / "content" / "chapters" / chapter / "index.mdx").read_text(encoding="utf-8")
            text = re.sub(r"```.*?```", "", text, flags=re.S)
            for bold in re.findall(r"\*\*(.+?)\*\*", text):
                e = lookup.get(bold.strip().lower())
                if e is not None and course["id"] not in e["courses"]:
                    if e["courses"]:
                        # An existing term from another course: the same word may mean something else here.
                        print(f"CHECK THE MEANING: {e['term']!r} (from {', '.join(e['courses'])}) now also in {course['id']}, because {chapter} has **{bold}**")
                    e["courses"].append(course["id"])

    lines = []
    for e in sorted(entries, key=lambda e: e["term"].lower()):
        lines.append(f"- term: {json.dumps(e['term'], ensure_ascii=False)}")
        if e.get("aliases"):
            lines.append("  aliases: [" + ", ".join(json.dumps(a, ensure_ascii=False) for a in e["aliases"]) + "]")
        if "definitions" in e:
            lines.append("  definitions:")
            lines += [f"    {k}: {json.dumps(v, ensure_ascii=False)}" for k, v in e["definitions"].items()]
        else:
            lines.append(f"  definition: {json.dumps(e['definition'], ensure_ascii=False)}")
        lines.append("  courses: [" + ", ".join(e["courses"]) + "]")
    GLOSSARY.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(entries)} terms")


if __name__ == "__main__":
    main()
