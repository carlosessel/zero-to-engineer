#!/usr/bin/env python3
"""One-off migration: legacy single-file courses -> content/ (MDX + YAML).

Run from the repository root:  python3 scripts/migrate/migrate.py

It is kept in the repository as a record of how the content was produced.
It refuses to overwrite a chapter whose front matter says anything other
than `status: migrated`, so hand-edited chapters are safe.
"""
import html
import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LEGACY = ROOT / "legacy"
CONTENT = ROOT / "content"
DEMOS = ROOT / "src" / "demos" / "html"

COURSES = [
    dict(id="ai", file="ai-engineer-course.html", out="ai-engineer.yaml"),
    dict(id="se", file="software-engineer-course.html", out="software-engineer.yaml"),
]
# Chapters that exist once and are used by both courses.
SHARED = ["terminal-files", "python-basics", "python-logic", "python-collections"]
DEMO_NAMES = {
    "lnC": "line", "vcC": "vectors", "tgC": "tangent", "cnBars": "coin-flips",
    "gdC": "gradient-descent", "pfC": "polynomial-fit", "tkIn": "tokenizer",
    "tpBars": "temperature", "rgQ": "retrieval", "ccR": "cost",
    "boBars": "big-o", "bsRow": "binary-search",
}


# ---------- a tiny DOM ----------
class Node:
    def __init__(self, tag, attrs=None, parent=None):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs or {}), parent, []

    def text(self):
        return "".join(c if isinstance(c, str) else c.text() for c in self.children)

    def cls(self):
        return self.attrs.get("class", "")

    def find_all(self, tag):
        out = []
        for c in self.children:
            if isinstance(c, Node):
                if c.tag == tag:
                    out.append(c)
                out += c.find_all(tag)
        return out

    def outer(self):
        if self.tag in VOID:
            return f"<{self.tag}{attr_str(self.attrs)}>"
        inner = "".join(html.escape(c, quote=False) if isinstance(c, str) else c.outer() for c in self.children)
        return f"<{self.tag}{attr_str(self.attrs)}>{inner}</{self.tag}>"


VOID = {"input", "br", "img", "hr", "meta", "link"}


def attr_str(attrs):
    return "".join(f" {k}" if v is None else f' {k}="{html.escape(v)}"' for k, v in attrs.items())


class Builder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("root")
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs, self.cur)
        self.cur.children.append(n)
        if tag not in VOID:
            self.cur = n

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        assert self.cur.tag == tag, f"mismatched </{tag}> inside <{self.cur.tag}>"
        self.cur = self.cur.parent

    def handle_data(self, data):
        self.cur.children.append(data)


def parse(fragment):
    b = Builder()
    b.feed(fragment)
    b.close()
    return b.root


# ---------- inline conversion ----------
def esc_text(t):
    t = re.sub(r"([\\`*_{}\[\]<])", r"\\\1", t)
    return re.sub(r"\s+", " ", t)


def wrap(mark, inner):
    lead = inner[: len(inner) - len(inner.lstrip())]
    trail = inner[len(inner.rstrip()):]
    core = inner.strip()
    return f"{lead}{mark}{core}{mark}{trail}" if core else inner


class Ctx:
    """Knows how to turn 'chapter 24' into a reference, for one course."""

    def __init__(self, course, order, uid, mdx):
        self.course, self.order, self.uid, self.mdx = course, order, uid, mdx
        self.refs = []

    def ref(self, n, bare=False):
        target = self.uid[self.order[int(n) - 1]]
        self.refs.append(target)
        if self.mdx:
            return f'<Ref to="{target}"{" bare" if bare else ""} />'
        return f"[[{'n' if bare else 'ref'}:{target}]]"

    def link_refs(self, t):
        if self.course != "ai":
            assert not re.search(r"[Cc]hapters? \d", t), t
            return t

        def plural(m):
            return m.group(1) + re.sub(r"\d+", lambda d: self.ref(d.group(0), bare=True), m.group(2))

        t = re.sub(r"\b(Chapters )(\d+(?:(?: to |, )\d+)*)", plural, t)
        return re.sub(r"\bchapter (\d+)", lambda m: self.ref(m.group(1)), t)


def inline(node, ctx):
    out = []
    for c in node.children:
        if isinstance(c, str):
            out.append(ctx.link_refs(esc_text(c)))
        elif c.tag == "b":
            out.append(wrap("**", inline(c, ctx)))
        elif c.tag == "i":
            out.append(wrap("*", inline(c, ctx)))
        elif c.tag == "code":
            code = c.text()
            fence = "``" if "`" in code else "`"
            pad = " " if "`" in code else ""
            out.append(f"{fence}{pad}{code}{pad}{fence}")
        elif c.tag == "a":
            href = c.attrs["href"]
            if href.startswith("#"):
                target = ctx.uid[href[1:]]
                label = inline(c, ctx)
                out.append(f'<Ref to="{target}">{label}</Ref>' if ctx.mdx else f"[[ref:{target}|{label}]]")
            else:
                out.append(f"[{inline(c, ctx)}]({href})")
        elif c.tag == "span" and not c.attrs:
            out.append(inline(c, ctx))
        elif c.tag == "input":
            pass
        else:
            raise ValueError(f"unexpected inline <{c.tag}>")
    return "".join(out)


def para(node, ctx):
    t = inline(node, ctx).strip()
    if re.match(r"(\d+[.)]|[-+#>]|=+$)\s", t):
        t = "\\" + t
    return t


# ---------- code language guess ----------
def guess_lang(code):
    first = code.strip().splitlines()[0] if code.strip() else ""
    if re.search(r"^\s*(FROM|WORKDIR|CMD) ", code, re.M) and "RUN " in code:
        return "dockerfile"
    if "<!DOCTYPE html>" in code or re.search(r"^<(button|script|div)", code.strip()):
        return "html"
    if re.search(r"^\s*(CREATE TABLE|SELECT|INSERT INTO)\b", code, re.M) and "db.execute" not in code:
        return "sql"
    if first.startswith("# .github/workflows") or re.search(r"^runs-on:|^jobs:", code, re.M):
        return "yaml"
    if first.startswith("/* style.css") or re.search(r"^\s*@media ", code, re.M):
        return "css"
    if "useState" in code and "return (" in code:
        return "jsx"
    if re.search(r"^\s*(const|let) \w+ =|^(async )?function \w+\(|console\.log", code, re.M):
        return "js"
    if first.startswith("Traceback") or first.startswith("<<<<<<<") or first.startswith("|") or "a · b" in code:
        return "text"
    if re.match(r"\s*output = activation", code) or re.match(r"3x \+ 2 = 14", code.strip()):
        return "text"
    if first.startswith("# .env"):
        return "bash"
    shell = r"^(pip|git|mkdir|cd|python|source|docker|ollama|uvicorn|npm|curl|pytest) "
    lines = [l for l in code.strip().splitlines() if l.strip() and not l.strip().startswith("#")]
    if lines and all(re.match(shell, l) for l in lines):
        return "bash"
    return "python"


def fence(code, lang):
    ticks = "`" * max(3, max((len(m) for m in re.findall(r"`+", code)), default=0) + 1)
    return f"{ticks}{lang}\n{code.rstrip()}\n{ticks}"


def yaml_str(s):
    return json.dumps(s, ensure_ascii=False)


# ---------- block conversion ----------
def convert_article(art, ctx):
    """Returns dict(lead, body, exercises, glossary, demos, stats)."""
    body, exercises, glossary, demos = [], [], [], []
    lead = None
    stats = dict(code=0, checks=0)
    for c in art.children:
        if isinstance(c, str):
            assert not c.strip(), f"loose text: {c!r}"
            continue
        k = c.cls()
        if c.tag == "p" and k == "lead":
            lead = re.sub(r"\s+", " ", c.text()).strip()
        elif c.tag == "p":
            body.append(para(c, ctx))
        elif c.tag in ("h2", "h3"):
            body.append("#" * int(c.tag[1]) + " " + inline(c, ctx).strip())
        elif c.tag == "ul" and k == "roadmap":
            body.append("<Route />")
        elif c.tag in ("ul", "ol"):
            items = [x for x in c.children if isinstance(x, Node)]
            assert all(x.tag == "li" for x in items)
            body.append("\n".join((f"{i + 1}. " if c.tag == "ol" else "- ") + inline(x, ctx).strip() for i, x in enumerate(items)))
        elif c.tag == "div" and k == "codewrap":
            code = c.text()
            body.append(fence(code, guess_lang(code)))
            stats["code"] += 1
        elif c.tag == "div" and k == "tablewrap":
            rows = c.find_all("tr")
            lines = []
            for i, r in enumerate(rows):
                cells = [inline(x, ctx).strip().replace("|", "\\|") for x in r.children if isinstance(x, Node)]
                lines.append("| " + " | ".join(cells) + " |")
                if i == 0:
                    lines.append("|" + " --- |" * len(cells))
            body.append("\n".join(lines))
        elif c.tag == "div" and k == "note":
            body.append("<Note>\n\n" + para(c, ctx) + "\n\n</Note>")
        elif c.tag == "div" and k == "try":
            kids = [x for x in c.children if isinstance(x, Node)]
            assert kids[0].tag == "h3"
            yctx = Ctx(ctx.course, ctx.order, ctx.uid, mdx=False)
            items = []
            for lab in kids[1:]:
                assert lab.tag == "label"
                box = lab.find_all("input")[0]
                items.append(dict(key=box.attrs["data-k"], text=inline(lab, yctx).strip()))
            ctx.refs += yctx.refs
            exercises.append(dict(title=kids[0].text().strip(), items=items))
            stats["checks"] += len(items)
            body.append(f"<Exercises set={{{len(exercises) - 1}}} />")
        elif c.tag == "div" and k == "widget":
            ids = re.findall(r'id="(\w+)"', c.outer())
            name = next(DEMO_NAMES[i] for i in ids if i in DEMO_NAMES)
            demos.append((name, c.outer()))
            body.append(f'<Demo name="{name}" />')
        elif c.tag == "dl":
            kids = [x for x in c.children if isinstance(x, Node)]
            for dt, dd in zip(kids[0::2], kids[1::2]):
                assert dt.tag == "dt" and dd.tag == "dd"
                glossary.append((dt.text().strip(), dd.text().strip()))
            body.append("<GlossaryList />")
        else:
            raise ValueError(f"unexpected block <{c.tag} class={k!r}>")
    return dict(lead=lead, body="\n\n".join(body) + "\n", exercises=exercises, glossary=glossary, demos=demos, stats=stats)


def estimate_minutes(conv):
    """A formula, not a measurement: reading at 150 words a minute, 5 minutes
    per code example to type and run, 20 minutes per exercise item."""
    words = len(re.sub(r"```.*?```", "", conv["body"], flags=re.S).split())
    m = words / 150 + 5 * conv["stats"]["code"] + 20 * conv["stats"]["checks"]
    return max(10, int(round(m / 5.0)) * 5)


def load_quiz(page):
    src = page[page.index("var QUIZ=") + len("var QUIZ="):]
    src = src[: src.index("\n};") + 2]
    js = "process.stdout.write(JSON.stringify(" + src + "))"
    return json.loads(subprocess.run(["node", "-e", js], capture_output=True, text=True, check=True).stdout)


def load_blurbs(page):
    m = re.search(r"var blurbs=(\{.*?\});", page)
    return json.loads(m.group(1))


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def main():
    pages = {}
    for c in COURSES:
        page = (LEGACY / c["file"]).read_text(encoding="utf-8")
        arts = re.findall(r'<article id="([^"]+)" data-part="([^"]+)" data-title="([^"]+)">(.*?)</article>', page, re.S)
        pages[c["id"]] = dict(page=page, arts=arts)
    ids = {cid: [a[0] for a in p["arts"]] for cid, p in pages.items()}
    clash = (set(ids["ai"]) & set(ids["se"])) - set(SHARED)

    glossary = {}
    written = set()
    for c in COURSES:
        cid = c["id"]
        page, arts = pages[cid]["page"], pages[cid]["arts"]
        uid = {a: (f"{cid}-{a}" if a in clash else a) for a in ids[cid]}
        quiz = load_quiz(page)
        blurbs = load_blurbs(page)
        parts = []
        for slug, part, title, inner in arts:
            part, title = html.unescape(part), html.unescape(title)
            if not parts or parts[-1]["name"] != part:
                parts.append(dict(name=part, blurb=blurbs.get(part, ""), chapters=[]))
            chapter = uid[slug]
            parts[-1]["chapters"].append(chapter)
            if chapter in written:
                continue  # shared chapter, already written from the first course
            written.add(chapter)

            ctx = Ctx(cid, ids[cid], uid, mdx=True)
            if slug == "python-collections":
                # The one sentence that differs between the courses.
                se_inner = dict((a[0], a[3]) for a in pages["se"]["arts"])[slug]
                ai_s = "<p>That is exactly how a conversation is sent to a language model later in this course.</p>"
                se_s = "<p>A list of dictionaries is also how most data travels between programs, as you will see when you build web APIs.</p>"
                assert inner.replace(ai_s, se_s) == se_inner
                inner = inner.replace(ai_s, "<p>@@ONLY@@</p>")
            conv = convert_article(parse(inner), ctx)
            if slug == "python-collections":
                conv["body"] = conv["body"].replace(
                    "@@ONLY@@",
                    '<Only course="ai">\n\nThat is exactly how a conversation is sent to a language model later in this course.\n\n</Only>\n\n'
                    '<Only course="se">\n\nA list of dictionaries is also how most data travels between programs, as you will see when you build web APIs.\n\n</Only>',
                )
            d = CONTENT / "chapters" / chapter
            mdx = d / "index.mdx"
            if mdx.exists() and "\nstatus: migrated\n" not in mdx.read_text(encoding="utf-8"):
                print("skip (edited by hand):", chapter)
                continue
            prereq = sorted(set(r for r in ctx.refs if ids[cid].index(next(k for k, v in uid.items() if v == r)) < ids[cid].index(slug)),
                            key=lambda r: ids[cid].index(next(k for k, v in uid.items() if v == r)))
            fm = ["---", f"title: {yaml_str(title)}"]
            if chapter != slug:
                fm.append(f"slug: {slug}")
            fm += [
                f"summary: {yaml_str(conv['lead'])}",
                "prerequisites: [" + ", ".join(prereq) + "]",
                f"estimated_minutes: {estimate_minutes(conv)}",
                "status: migrated",
                "---",
            ]
            write(mdx, "\n".join(fm) + "\n\n" + conv["body"])

            if conv["exercises"]:
                y = []
                for ex in conv["exercises"]:
                    y.append(f"- title: {yaml_str(ex['title'])}\n  items:")
                    for it in ex["items"]:
                        y.append(f"    - key: {it['key']}\n      text: {yaml_str(it['text'])}")
                write(d / "exercises.yaml", "\n".join(y) + "\n")
            if slug in quiz:
                y = []
                for q in quiz[slug]:
                    y.append(f"- question: {yaml_str(q['q'])}\n  options:")
                    y += [f"    - {yaml_str(o)}" for o in q["o"]]
                    y.append(f"  answer: {q['a']}\n  explanation: {yaml_str(q['w'])}")
                write(d / "quiz.yaml", "\n".join(y) + "\n")
            for name, markup in conv["demos"]:
                write(DEMOS / f"{name}.html", markup + "\n")
            for term, definition in conv["glossary"]:
                e = glossary.setdefault(term, dict(defs={}, courses=[]))
                e["courses"].append(cid)
                e["defs"][cid] = definition

        title = re.search(r"<title>(.*?):", page).group(1)
        tagline = re.search(r'<p class="brand">.*?<small>(.*?)</small>', page).group(1)
        y = [f"id: {cid}", f"title: {yaml_str(title)}", f"tagline: {yaml_str(html.unescape(tagline))}", "parts:"]
        for p in parts:
            y.append(f"  - name: {yaml_str(p['name'])}\n    blurb: {yaml_str(p['blurb'])}\n    chapters:")
            y += [f"      - {ch}" for ch in p["chapters"]]
        write(CONTENT / "courses" / c["out"], "\n".join(y) + "\n")

    # Glossary: one entry per term. Where the two courses define a term
    # differently, both wordings are kept so that no text is lost.
    y = []
    for term in sorted(glossary, key=str.lower):
        e = glossary[term]
        y.append(f"- term: {yaml_str(term)}")
        defs = e["defs"]
        if len(set(defs.values())) == 1:
            y.append(f"  definition: {yaml_str(next(iter(defs.values())))}")
            y.append("  courses: [" + ", ".join(e["courses"]) + "]")
        else:
            y.append("  definitions:")
            y += [f"    {k}: {yaml_str(v)}" for k, v in defs.items()]
            y.append("  courses: [" + ", ".join(e["courses"]) + "]")
    write(CONTENT / "glossary.yaml", "\n".join(y) + "\n")
    print(f"wrote {len(written)} chapters, {len(glossary)} glossary terms")


if __name__ == "__main__":
    sys.exit(main())
