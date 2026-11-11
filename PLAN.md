# PLAN

Status: **draft for your approval. Nothing has been built yet.**
Written 11 November 2026, after reading `HANDOFF.md` and both HTML files in full.

Contents: 1. What I found · 2. Architecture · 3. Content structure · 4. Gaps against public curricula · 5. Learning system · 6. Quality and testing · 7. Research method · 8. Phases · 9. Decisions I need from you · 10. Honest limits

---

## 1. What I found in the prototypes

| | AI course | Software engineering course |
|---|---|---|
| Chapters | 41 | 36 |
| Prose (words, excluding code) | about 12,300 | about 10,400 |
| Average per teaching chapter | about 270 words | about 265 words |
| Code blocks | 62 | 46 |
| Quiz questions | 83 | 68 |
| Live demos | 10 | 2 |
| Chapters identical in both | terminal, Python ×3 (one sentence differs) | same |

The handoff's description is accurate: this is a good **spine**, not yet a course. A typical chapter is one screen of explanation and one or two code blocks. A chapter that properly teaches a beginner needs roughly ten times that, plus practice.

Problems I noticed while reading (to fix during migration, not a full review):

- **Jargon used before it is taught.** The AI setup chapter says a virtual environment is "like node_modules". The NumPy chapter says "if you know SQL". Neither is known to a beginner.
- **Things used but never taught.** The AI course's "Python habits" chapter uses classes, decorators, dataclasses and `**d` unpacking, but classes are only taught in the other course. An exercise asks for PCA, which is never explained. Async is given eight lines.
- **The AI course asks for skills it does not teach.** "Wrap it in FastAPI", "Dockerise it", "query a SQLite database", "add a GitHub Action" appear as exercises, but HTTP, back ends, SQL, Docker and CI are only taught in the software engineering course.
- **The software engineering course never teaches virtual environments**, yet uses `pip install` from the testing chapter onward.
- **Git has no chapter of its own** in either course: half a page inside "setup", then "Git with other people".
- **The terminal chapter stops at six commands.** No copying, moving, deleting or reading files.
- **Hard-coded things that will age:** the year 2026 in a Python example, a model name in every API example.
- **API examples need checking against current documentation** (for example, the structured-output chapter strips code fences by hand where providers now offer schema-constrained output; the tool-use example assumes the first reply block is text).
- The arithmetic I spot-checked by hand (the 9% base-rate example, the standard deviation of 14.3, the softmax values) is correct. Nothing else has been verified yet.

---

## 2. Proposed architecture

**One repository, one website, two courses.**

| Concern | Proposal | Why |
|---|---|---|
| Site framework | **Astro** with MDX content collections | Built for content sites. Ships almost no JavaScript by default, so pages load fast on a slow connection. Front matter is type-checked at build time, so a chapter with a missing field fails the build. Interactive parts load only where used. |
| Interactive parts | Small **Preact** components ("islands"), plain canvas for demos | Tiny download; the existing demo code ports almost directly. |
| Search | **Pagefind** | Builds a search index at build time, runs entirely in the browser, no server, loads only the fragments it needs. |
| Python in the browser | **Pyodide** in a web worker, loaded only when the learner presses Run | Real Python (CPython compiled to WebAssembly). Loading on demand keeps normal pages light. |
| SQL in the browser | **sql.js** (SQLite compiled to WebAssembly) for the SQL chapters | Same idea: practise before installing anything. |
| JavaScript and HTML/CSS practice | Sandboxed `<iframe>` editor | The browser already runs these. |
| Progress storage | `localStorage`, one versioned record, export/import as a JSON file | Survives closing the browser; no account, no server. |
| Fonts | The three current fonts, **self-hosted** | No request to Google; faster and more private. (I will confirm their licences allow it.) |
| Tests | **Vitest** for site logic, **pytest** for course code, **Playwright** for a few browser checks | See section 6. |
| CI | GitHub Actions: build, unit tests, code-example tests, link check, accessibility check | Required by your brief. |
| Hosting | **GitHub Pages** (alternative: Cloudflare Pages) | Free, no extra account, deploys from the same Actions run. |

I considered Starlight (Astro's documentation theme: free search, sidebar and dark mode), Docusaurus and MkDocs Material. They are quicker to start but are built for documentation, and this project needs custom learning features on every page (quizzes, review queue, planner, code runner, two courses sharing chapters). Plain Astro gives control without fighting a theme. If you would rather have the fastest route to a working site, Starlight is the fallback.

Exact versions will be the latest stable at the time of building, pinned in a lockfile.

### Repository layout

```
courses/
  content/
    chapters/
      python-basics/
        index.mdx          # the teaching text
        quiz.yaml          # questions, options, answer, explanation
        exercises.yaml     # tick-off checklist
        problems.yaml      # graded practice problems with hidden solutions
        resources.yaml     # researched links with evidence and date checked
        code/              # every runnable example as a real file, with tests
      ...
    courses/
      ai-engineer.yaml         # ordered list: parts → chapter ids
      software-engineer.yaml
    glossary.yaml              # term, definition, first chapter, aliases
    projects/
      ai/01-tabular-predictor/ # spec.mdx, checklist.yaml, rubric.yaml, starter/
      se/01-cli-tool/
  src/                     # site: layouts, components, demos, logic
    lib/                   # progress, quiz, spaced repetition, planner (unit-tested)
    demos/
  tests/                   # site logic tests, code-example harness
  legacy/                  # the two original HTML files, kept untouched
  .github/workflows/
  PLAN.md  CHANGELOG.md  README.md  LICENSE  HANDOFF.md
```

### How shared chapters work

A chapter lives **once** in `content/chapters/`. Each course is a manifest listing chapter ids in order. A chapter listed in both manifests appears in both courses (at `/ai/python-basics/` and `/se/python-basics/`), is edited in one place, and its progress counts for both. Where one sentence must differ between courses, the text uses a small `<Only course="ai">` marker.

Cross-references are written by chapter id (`<Ref to="gradient-descent" />`) and the site prints the right number and link for whichever course you are in. The build fails on a reference to a chapter that does not exist.

### Chapter front matter

```yaml
title: "Python from zero: values and variables"
id: python-basics
summary: One sentence shown in lists and search.
prerequisites: [terminal-files, setup]
estimated_minutes: 240        # reading + examples + problems
level: beginner
runnable: python              # python | sql | js | none
demos: []
last_reviewed: 2026-11-11
status: migrated              # migrated | deepened | code-verified | resources-verified
```

`status` is shown on the site, so a learner (and you) can see honestly how far each chapter has got.

### Standard chapter shape (the template every chapter is deepened to)

1. Why this matters, and what you will be able to do
2. Teaching sections, each with a **worked example** shown step by step
3. Runnable code and, where it helps, a demo
4. **Common mistakes** (the real ones beginners make, with the error message they produce)
5. **Practice problems**, graded warm-up → standard → stretch, solutions behind a reveal
6. Exercise checklist ("Do this")
7. **Summary**
8. Quiz
9. Go deeper: the researched resources

Target sizes (a proposal, to be tested on a pilot chapter): ordinary chapters 2,000–4,000 words and 8–15 problems; Python-from-zero and maths chapters 30–50 graded problems each.

---

## 3. Content structure

### Shared foundation (one source, used by both courses)

Existing: terminal, Python ×3. Proposed additions marked **new**.

- Files, folders and the terminal
- **new** More terminal: copying, moving, deleting, reading files, pipes, environment variables
- Setup (split per course where tools differ; virtual environments taught properly in both)
- **new** Git from zero: commits, history, undoing, `.gitignore`, GitHub (pulled out of "setup")
- Python from zero ×3 → proposed ×6: values and variables · strings in depth · decisions · loops · functions · lists and dictionaries · files and errors · modules, packages and virtual environments
- Objects and classes (currently SE only; the AI course needs it)
- Debugging, testing (currently SE only; the AI course needs them, see decision D3)

### The two courses

Both keep their current parts and order. New chapters are listed in section 4; I will not add any until you have seen the gap list and agreed.

### Projects

All 8 AI and 9 SE ladder projects get a page with: specification, starter repository layout (a real folder you can copy), acceptance checklist, self-review rubric, and common pitfalls. Starter layouts that contain code are tested like course code.

---

## 4. Gaps against public curricula (first pass)

Compared on 11 November 2026 against: the roadmap.sh topic lists for AI Engineer, Machine Learning, MLOps, Backend, Frontend, DevOps, Computer Science and Software Design & Architecture (read from the `nilbuild/developer-roadmap` repository); OSSU Computer Science; teachyourselfcs.com; mlabonne's LLM Course outline; The Odin Project's full-stack path outline.

This is a **topic-level comparison from their outlines**, not a reading of their lessons. Phase 4 does it properly and I will show you the full report before writing any new chapter. Items marked ● I think are needed for "job-ready junior"; ○ are worth a short treatment or a pointer; ✕ I propose leaving out and saying so.

### AI course

**Foundations and maths**
- ● Bayes' theorem as a named tool (currently one example, no method)
- ● Logarithm and exponent rules with practice; they are used later without drilling
- ● Matrix × matrix multiplication, transpose, identity (only matrix × vector is taught)
- ● Random variables, expected value, sampling; confidence intervals ("is 85% really better than 82% on 50 test cases?", needed for evals)
- ○ Eigenvectors, PCA and SVD at intuition level (PCA is used in an exercise)
- ● Plotting with matplotlib (never taught, used throughout)
- ● Data cleaning and preparation: missing values, categories, scaling, feature engineering

**Machine learning**
- ● Linear and logistic regression from the inside (currently only a table row)
- ● Cross-validation, hyperparameter tuning, regularisation (L1/L2) explained
- ● ROC and AUC, thresholds
- ○ Unsupervised learning: clustering and dimensionality reduction
- ○ A survey chapter: recommendation, anomaly detection, time series, reinforcement learning (one sentence today)

**Deep learning**
- ● Backpropagation worked by hand on a tiny network (currently "watch a video")
- ● Optimisers, initialisation, normalisation (currently checklist lines)
- ● Convolutional networks properly (currently a table row)
- ○ Text before transformers: bag of words, TF-IDF, word vectors, RNNs. Explains why attention mattered

**How language models work**
- ● Attention in code, with a demo (the chapter has no code and no demo)
- ● Build a tiny GPT step by step in our own words (currently "watch a video"; it is also project 3)
- ○ How assistants are trained after pretraining; reasoning models; why inference costs what it does (KV cache)

**Building with models**
- ● Context engineering and memory: what goes in the window, compaction, long documents
- ● Vector databases as their own chapter; advanced retrieval: hybrid search, reranking, query rewriting, metadata filters (one line today)
- ● MCP as its own chapter: build a server and a client (one paragraph today)
- ● Evals in depth: RAG metrics, grader calibration, statistics, regression testing in CI, observability tools
- ● Working across providers: the OpenAI-compatible API shape, choosing a model, prompt caching, batch
- ○ Agent frameworks and SDKs: what they do, when to use one (not mentioned today)
- ○ Multi-agent systems; coding agents as tools you use

**Engineering skills the AI course assumes but does not teach** (see decision D3)
- ● HTTP and APIs, a back end, SQL, testing, Docker, CI

**Professional**
- ● Reading a paper; ethics, bias and regulation beyond one section; AI-specific interview preparation

### Software engineering course

**Programming**
- ● Virtual environments and dependency management (absent)
- ● Modules and packages, type hints, the standard library
- ● Iterators and generators, decorators, functional style, regular expressions
- ● Error handling and exceptions in depth
- ● A second, statically typed language (see decision D4). The course says "learn a second language" but teaches only Python and a little JavaScript

**Computer science**
- ● Binary, hexadecimal, how numbers and text are stored, floating point surprises
- ● Memory: stack, heap, references, mutation, garbage collection
- ● Recursion as its own chapter; trees and binary search trees; heaps; graphs (BFS, DFS, shortest path); dynamic programming (a bullet today)
- ● Hashing vs encryption vs encoding; public-key cryptography at intuition level
- ● Operating systems: processes, memory, file systems, scheduling (OSSU and Teach Yourself CS both treat this as core)
- ● Networking below HTTP: IP, TCP, TLS, sockets
- ○ How languages work: interpreters and compilers at intuition level
- ○ Discrete maths and logic for programmers (the SE course has no maths at all)

**Web**
- ● HTML and CSS as two or three chapters with accessibility done properly (one 216-word chapter today)
- ● JavaScript as three or four chapters (one 140-word chapter today); the DOM; modules; tooling
- ● TypeScript (one sentence today); React properly: state, effects, routing, forms, data fetching
- ● Front-end testing; web performance; browser developer tools
- ● API design in depth: REST conventions, pagination, versioning, OpenAPI, CORS; ○ GraphQL, WebSockets and server-sent events at survey level

**Data**
- ● PostgreSQL (only SQLite is used); query plans and indexing; transactions and isolation
- ○ Redis and document stores hands-on

**Systems and shipping**
- ● Linux and shell scripting (one paragraph today); web servers and reverse proxies
- ● Distributed systems basics: replication, consistency, message brokers, failure modes
- ○ Infrastructure as code hands-on; ○ Kubernetes at "what it is and when" level; ○ serverless

**The job**
- ● Interview preparation: a data-structures practice plan, system design practice, behavioural questions
- ● Open source and licences; ethics, privacy law and accessibility law at awareness level
- ✕ Mobile development, game development, embedded: out of scope; say so and link out

If all ● items are accepted, the rough shape becomes **about 60–65 chapters for AI and 70–75 for software engineering, with 20–25 shared**. That is a large increase and it is your call (decision D2).

---

## 5. Learning system

| Feature | Design |
|---|---|
| Phone, light/dark | Mobile-first CSS; theme follows the device and can be switched; demos read theme colours as now |
| Accessibility | Semantic HTML, skip link, visible focus, full keyboard operation of quizzes, demos and the code runner, text alternatives and value read-outs for every demo, reduced-motion support. Checked with axe in CI and by hand with VoiceOver |
| Slow connections | Static HTML per chapter; no JavaScript needed to read; Pyodide, search and demos load on demand; fonts self-hosted and subset. Budget: under 100 KB compressed for a chapter page before optional features |
| Progress | One versioned record: chapters done, quiz answers, checkboxes, problem attempts, review queue, planner settings. Export and import as a JSON file, with validation on import |
| Quizzes | As now (question, options, answer, explanation) plus more questions per chapter |
| Spaced repetition | Leitner boxes: a wrong answer goes to box 1 and returns tomorrow; each correct review moves it up (1, 3, 7, 14, 30 days). A "Review" page shows what is due today. Simple, well understood, testable |
| Code runner | Editable code block with Run, Reset and output. Python via Pyodide, including `input()` (through a prompt) and file reading/writing in a temporary in-browser file system. NumPy and pandas work. **PyTorch does not run in Pyodide**, so deep-learning chapters point to Colab |
| Demos | Port the 12 existing ones. Proposed new ones: attention heat-map; neuron/activation playground; confusion matrix and threshold slider; softmax and cross-entropy; Bayes with a population grid; matrix transformation of a grid; sorting visualiser; stack/queue/hash-table animations; HTTP request walk-through; Git commit graph; SQL join visualiser; race-condition stepper; cache hit/miss simulator |
| Study planner | Enter hours per week, start date and course; it lays chapters and projects onto weeks using each chapter's estimated time, respects prerequisites, shows a finish date, re-plans when you fall behind, exports a calendar file |
| Search | Pagefind across all chapters, glossary and projects |
| Glossary | One data file; first use of a term in each chapter links to it automatically; each glossary entry links back to every chapter that uses it |
| Print | Print stylesheet per chapter: no navigation, solutions expanded or hidden by choice, demos replaced by a static picture and caption |
| Tutor | Your choice, see decision D5 |

---

## 6. Quality and testing

**Course code.** Every code block lives as a real file next to its chapter and is included into the page, so what you read is exactly what was run.

| Kind | How it is run | In CI? |
|---|---|---|
| Plain Python | pytest, output compared with the output shown in the text | Yes, every push |
| NumPy, pandas, scikit-learn | Same, pinned versions | Yes |
| PyTorch, sentence-transformers, transformers | Small-data versions of the same code | Weekly job (large downloads) |
| Model API examples | Against a recorded fake by default; against the live API if you provide a key as a repository secret | See decision D6 |
| SQL | Run against SQLite (and PostgreSQL in a container once that chapter exists) | Yes |
| JavaScript | Node; DOM examples in a headless browser | Yes |
| HTML/CSS | Validated | Yes |
| Dockerfile, Compose | Built in CI | Yes |
| GitHub Actions examples | Checked with a workflow linter | Yes |
| Shell commands | Run in a Linux container; Windows PowerShell variants **cannot be tested by me** | Partly |

**Site logic.** Unit tests for progress (save, load, migrate, export, import of bad files), quiz scoring, spaced-repetition scheduling, planner arithmetic. A few browser tests: complete a chapter, reload, progress is still there; run Python; search finds a chapter.

**Content checks at build time.** Front matter schema, cross-references resolve, every glossary link resolves, every quiz has an answer and explanation, British-spelling check, a chapter may not be shorter than its migrated original.

**Links.** A link checker (lychee) in CI on every push and weekly on a schedule.

---

## 7. Research method

For each chapter: search for the most recommended free material; **open every candidate**; record title, author or channel, URL, type, what it covers, why it was chosen with the evidence I actually saw, and the date checked. Anything I could not open goes into `UNVERIFIED.md`, not into a chapter.

- I **cannot watch videos**. Videos are judged on channel reputation, the description, a transcript where one is available, and popularity figures read from the page. This will be stated on the site.
- Statistics (stars, views) are recorded only if I read them from the page that day.
- Every one of the 56 existing library entries is re-opened, and the "not checked that day" items (CS50, Kaggle Learn, Khan Academy, 3Blue1Brown, fast.ai, the books) are verified or moved to the unverified list.
- No text is copied from other courses. Resources are linked, not reproduced.

---

## 8. Phases

Each phase ends with a report: what was built, how it was checked, what is still unverified. Small commits throughout; `CHANGELOG.md` kept up to date.

| # | Phase | Result | Done when |
|---|---|---|---|
| 0 | Plan (this document) | Decisions agreed | You approve |
| 1 | **Skeleton and faithful migration** | Astro site; all 77 chapters moved to MDX **without changing their words**; quizzes and checklists as YAML; shared chapters from one source; cross-references by id; glossary as data; progress with export/import; light/dark; print; README; CI (build + tests + links) | Automated check shows no chapter lost text; site builds; you can click through it locally |
| 2 | **Deploy** | Live on the free host; exact steps for the parts only you can do | The URL works on your phone |
| 3 | **Learning system** | The 12 demos ported; Python runner; spaced repetition; planner; search; glossary auto-linking; tutor decision implemented; accessibility pass | Tests pass; manual keyboard and screen-reader run recorded |
| 4 | **Verify existing code** | Every one of the 108 current code blocks run, fixed where wrong, under test | CI green; list of what was wrong |
| 5 | **Research and gap report** | Full gap report for your approval; resources per chapter; library re-checked; `UNVERIFIED.md` | You approve the new-chapter list |
| 6 | **Pilot: one chapter at full depth** | `python-basics` (and one maths chapter) written to the standard shape | You approve the depth and tone before it is applied to 100+ chapters |
| 7 | **Deepen: shared foundation and maths** | Terminal, Git, all Python, all maths chapters, with the large problem sets | Per-chapter status reaches "deepened" and "code-verified" |
| 8 | **Deepen: AI course**, part by part | Existing chapters deepened, then agreed new chapters | As above |
| 9 | **Deepen: software engineering course**, part by part | As above | As above |
| 10 | **Projects** | 17 project pages with spec, starter layout, checklist, rubric | Starter layouts tested |
| 11 | **Audit and release** | Honest status report per chapter; performance and accessibility measurements; licence in place | You decide to publish |

Phases 1–4 are engineering and are well bounded. **Phases 7–9 are the bulk of the work by a wide margin**: something like 100–130 chapters at a few thousand words each, with hundreds of tested examples and well over a thousand practice problems. It will take many working sessions, part by part, and I will report after each part instead of promising a date.

---

## 9. Decisions I need from you

My recommendation is first in each.

**D1. Order of work.** (a) Site first, as in section 8: you get a deployed, usable site early and content deepens in place. (b) Content first: deepen chapters as Markdown now, build the site later.

**D2. How far to go on gaps.** (a) Fill all ● items (roughly 60–65 AI and 70–75 SE chapters). (b) Deepen the existing 77 first, add new chapters only afterwards. (c) You pick from the list in section 4.

**D3. Shared chapters beyond the three you named.** The AI course needs testing, debugging, classes, HTTP/APIs, a back end, SQL, Docker and CI to do its own exercises. (a) Share those chapters from the software engineering course into the AI course (one source, more shared chapters, longer AI course). (b) Write shorter AI-specific versions. (c) Make them "recommended from the other course" links only.

**D4. A second language in the software engineering course.** (a) TypeScript, taught properly on top of JavaScript: one ecosystem, the one most junior web jobs use. (b) Also add a compiled, statically typed language (Go or Java) as a short part. (c) Leave as is.

**D5. The tutor box.** (a) Replace with a "copy a tutor prompt" button: it copies the chapter text, your question and beginner instructions to the clipboard for pasting into any AI assistant you already use. No key, works everywhere. (b) Optional built-in tutor using your own API key, stored only in your browser, sent only to the model provider, off by default, with a plain warning that a key in a browser can be read by anyone with access to that device. (c) Both. (d) Remove it. In every case no key is ever in the repository or the built site.

**D6. Testing the model API examples.** (a) I test against a recorded fake only, and mark those chapters "not run against the live API". (b) You create an API key and add it yourself as a GitHub Actions secret and a local `.env` file (I never see or handle the value), so examples run for real; cost should be small but is not zero. Also: (i) keep Anthropic's SDK as the main example and add a section on the OpenAI-compatible shape, or (ii) Anthropic only.

**D7. Hosting.** (a) GitHub Pages. (b) Cloudflare Pages (adds preview links for every change; needs a second account). Either way you will need to create the GitHub repository yourself or install the GitHub command-line tool (`gh` is not installed on this machine) and sign in.

**D8. Licence** (needed before publishing, not before building). (a) Text under CC BY 4.0, code under MIT: anyone may reuse with credit. (b) Text under CC BY-SA 4.0: reuse with credit, and adaptations must stay open. (c) Text under CC BY-NC-SA: no commercial reuse; this also stops some legitimate uses, such as a paid bootcamp using it. (d) All rights reserved for now.

**D9. Names.** A name for the site and repository (working name: `zero-to-engineer`), and whether your name appears as author.

**D10. Spelling of chapter ids.** Existing ids use American spelling in places (`data-modeling`, `tokenizer`). Text stays British; (a) I leave ids alone so old links keep working, or (b) rename them.

---

## 10. Honest limits

- I have **not** yet run any code, opened the prototypes in a browser, or verified any resource beyond the pages fetched today for the gap comparison.
- "Job-ready at junior level" is a goal I can design towards, not something I can verify. No subject expert reviews this unless you arrange it. The site will say so.
- I cannot watch videos, cannot test Windows-specific instructions, and cannot test anything needing a GPU beyond small CPU versions.
- Model APIs, model names and tool versions change. The course will isolate them (one config value, dated "last checked" notes) but will need maintenance.
- Time estimates per chapter will be my estimates until real learners report otherwise.
- Progress saved in the two claude.ai artifacts cannot be carried over automatically: it is stored under a different web address and the prototypes have no export.
