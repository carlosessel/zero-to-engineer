# Changelog

All notable changes to this project are recorded here, newest first.

## Unreleased

### 2026-11-12: Phase 4, code examples verified

Added
- `tests/examples`: every one of the 93 code blocks in the chapters (108 in the two prototypes, fewer now that shared chapters exist once, plus one new block) has an entry in its chapter's `examples.yaml` saying how it is checked, and a test that reads the code from the chapter and runs it. A code block with no entry, or an entry still marked as a draft, fails.
- The browser runner's Python moved into `src/runner/zte_runner.py`; the website and the tests use the same file.
- A stand-in Anthropic API server for the model API examples (scripted replies, streaming, tool calls). It is not the live API.
- `tests/web-examples.test.ts` for the JavaScript, HTML, CSS and React examples.
- Each chapter page now states how its code was checked.
- CI runs every example on every push (including package installs and the Docker build); a weekly job runs the PyTorch and model-download examples.

Fixed in the chapters (status changed to "corrected")
- **The model API examples would have failed.** They passed `temperature=0`, which Anthropic's current Python SDK rejects with an error, and read replies as `msg.content[0].text`, which fails when a reply begins with a thinking block, as replies from current models can. Affected: Your first model call, Prompt engineering, Structured output, Tool use, RAG. They now use a small `reply_text` helper, introduced in "Your first model call", and `max_tokens` values with room for the model's thinking.
- The sampling chapter now says, in a note, that Anthropic's current models no longer accept `temperature`, `top_p` and `top_k`.
- Structured output gained a short example of the SDK's built-in schema parsing (`messages.parse`).
- Five examples used a file or a name the chapter never created: `docs.json` (Python habits), `sales.csv` (NumPy and pandas), `y_test`/`preds` (Metrics), `classify` (Evals), the passages list (RAG). The files are now created in the example; the others say in a comment which chapter they continue from.
- The sample traceback in "Python from zero: lists, dictionaries, files and errors" lacked the line of `~` and `^` marks that current Python prints, and the text now explains it. The check produces the traceback for real and compares.

### 2026-11-11: Phase 3, learning system

Added
- **Review** page with spaced repetition (Leitner boxes: 1, 3, 7, 14, 30 days). Quiz questions answered wrongly are scheduled automatically.
- **Study planner**: hours a week and a start date give a week-by-week schedule and a finish date; downloadable as a calendar file; settings remembered.
- **Search** across all chapters and the glossary (Pagefind).
- **Glossary page** for both courses with the chapters that mention each term. Terms are linked from chapters where they are introduced in bold; capital-letter acronyms where they first appear.
- **Runnable Python** in the browser (Pyodide 314.0.7, Python 3.14, in a web worker): Run, Edit, Reset, Stop; `input()`; readable tracebacks; NumPy, pandas and scikit-learn load on demand. Examples that need PyTorch, an API key or a learner's file say so instead of offering Run.
- **Ask a tutor** box: copies a prompt (beginner instructions, the chapter text, the question) for pasting into any AI assistant. No key and no network request.
- Site navigation bar on the non-course pages; links to the tools in each course sidebar; favicon.
- Progress format version 2 (adds the review list and planner settings; version 1 files and stored records are still read).
- Search results are filtered so that a word found nowhere in the course says "Nothing found" instead of listing pages that contain its first letter.
- Unit tests now 94. 16 end-to-end tests (Playwright) for progress, export/import, review, planner, search, glossary links, tutor box, demos, keyboard use, phone menu, Python, and axe accessibility checks on 15 page types in light and dark.

Changed
- Demo and exercise box titles are level-2 headings so heading levels never skip (found by axe). Demo read-outs are announced by screen readers.
- Fonts reduced from six files to four (about 90 KB in total, down from 155 KB).
- Markdown is processed with the unified (remark/rehype) processor rather than Astro 7's new default, because glossary linking is a rehype plugin.
- Home-page wording about resources corrected: links respond, contents not reviewed.

Known limits
- The planner's totals are far too low while chapters are short drafts; the page says so.
- Glossary linking is deliberately narrow (bold terms and acronyms only) to avoid linking ordinary words such as "label" to a technical meaning.
- The in-browser SQL and JavaScript editors proposed in PLAN.md are not built; they belong with the deepening of those chapters.
- New demos proposed in PLAN.md are not built; they belong with the chapters they illustrate.
- No manual screen-reader (VoiceOver) run has been done; only automated checks and keyboard tests.

### 2026-11-11: Phase 1, skeleton and faithful migration

Added
- Astro site with one page per chapter per course, a contents page per course, a home page and a progress page.
- All 77 prototype chapters moved to `content/chapters/<id>/` as MDX, with quizzes (151 questions) and exercise lists as YAML beside them. The words are unchanged.
- The four chapters that were identical in both prototypes (terminal, Python from zero ×3) now exist once and appear in both courses. The one sentence that differed is marked per course.
- Course files (`content/courses/*.yaml`) listing parts and chapters in order.
- Glossary as data (`content/glossary.yaml`, 90 terms). Where the two courses worded a definition differently, both wordings are kept.
- Chapter cross-references by id (`<Ref to="…" />`) instead of hard-coded numbers.
- The 12 interactive demos, ported with their drawing code unchanged.
- Progress stored in the browser, with download, restore from file (validated) and erase. "Mark as not done" added.
- Light, dark and automatic theme with a switch. Self-hosted fonts (no request to Google). Print stylesheet. Skip link. Syntax highlighting.
- Per-chapter status line and estimated time (a formula, not a measurement).
- Unit tests (37) for progress, the course model and inline text.
- `scripts/verify-migration.mjs`: compares every built chapter with the original article text and quiz. `scripts/check-internal-links.mjs`.
- GitHub Actions: CI, weekly outside-link check, deploy to GitHub Pages.
- README, MIT licence for code, CC BY 4.0 for course text.

Changed
- Prototype pages moved to `legacy/`.
- Exercise ticks are now stored per chapter, because both prototypes used the same keys for different exercises.

Known and deliberately not fixed in this phase (words were not to change)
- "Parts 6 and 8 are what employers pay for" and "Parts 2 to 5" on the AI course's first page are plain text and look out of date against the current part order.
- The link to docs.claude.com now redirects to platform.claude.com/docs.
- The "Ask the tutor" box is not carried over; a few chapters still mention it. Its replacement is in phase 3.
- All content problems listed in PLAN.md section 1.


### 2026-11-11: Phase 0, plan

- Started the repository with the two prototype pages (`ai-engineer-course.html`, `software-engineer-course.html`) and `HANDOFF.md`, unchanged.
- Added `PLAN.md`: proposed architecture, content structure, first-pass gap list against public curricula, phases, and the decisions needed before building. Awaiting approval; nothing built yet.
