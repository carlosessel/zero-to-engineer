# Changelog

All notable changes to this project are recorded here, newest first.

## Unreleased

### 2026-11-12: Three new courses planned; Mastering Claude and Claude Code, parts 1 and 2

Added
- Outlines, approved, for three new courses, in docs/plans: Mastering Claude and Claude Code (24 new chapters), Software Engineering Mastery (71 new chapters; examples in TypeScript, with Java and C# where the languages differ) and Zero to Backend Engineer (one course with C#/.NET, Java and Node.js tracks; 30 new chapters, reusing 46, most of them from the Mastery course). They are written in that order, a part at a time.
- Mastering Claude and Claude Code, part 1 (How Claude works: the map, how Claude works, choosing a model) and part 2 (Using Claude well: prompting, the apps in depth, learning and writing with Claude). Six chapters, about 14,700 words, 39 practice problems, 31 quiz questions.
- Every fact about models, prices, effort levels and app features was checked against Anthropic's documentation and help centre on 12 November 2026, and every linked page opened. The API example runs against the stand-in server; the cost and token arithmetic is asserted in the example checks.
- 27 glossary terms for the new course.

Fixed
- The glossary said a token is roughly three-quarters of a word. On Claude's current tokeniser an English word is about 1.8 tokens (Anthropic's figure: about 555,000 words per million tokens), so the entry now says it depends on the tokeniser. "Batch" now gives both meanings (a training batch, and an API batch at half price).

Not verified
- Sample prompts in these chapters were written to Anthropic's guidance but not measured against a live model. No API key is used anywhere.
- Plan limits and menu names in the apps chapter change often; they are dated November 2026.

### 2026-11-12: Zero to Web Developer, part 4 (Front-end applications)

Added
- Six chapters: React components and props; state, events and forms; effects, loading data and routing (React Router 8); TypeScript basics; testing JavaScript and React (Vitest, React Testing Library); web performance. About 29,000 words including code, 77 practice problems (15 in each of the React and TypeScript chapters), 42 quiz questions, 30 exercises, 30 resource records, each opened on 12 November 2026.
- **React and TypeScript examples run on the page.** A React block that is a whole component file gets **Show the result**: Sucrase turns its JSX and types into JavaScript in the browser, and it runs in the sandboxed preview with React, ReactDOM and React Router from a bundle the site builds itself (`npm run vendor`, `public/vendor/react-runtime.js`, not committed). The bundle uses React's development builds on purpose, so warnings such as a missing `key` show under the example. TypeScript blocks get **Run**, with a note that the types are removed, not checked. `<Playground>` groups can mix CSS and JSX.
- **New kinds of check**: `react` (compiled exactly as the preview compiles it, then clicked and typed through in jsdom with user-event: `tests/react-blocks.test.ts`), `ts` (strict type-checking, with deliberate errors listed by code: `tests/ts-blocks.test.ts`), and `vitest-run` (a chapter's test files run with Vitest as a learner would: `tests/vitest-blocks.test.ts`). 139 code blocks in this part: 58 checked as React, 25 as TypeScript, 23 by running their tests with Vitest, 7 as shell commands with the network (creating and building the real Vite React and React-TypeScript starters, installing React Router, Vitest and Testing Library, and checking that the starter's own TypeScript 7 reports the chapter's first error), 2 rendered in real Chrome, and the rest validated or checked by hand-written assertions. One block is a single line repeated from the example before it, and is not run on its own.
- Browser tests for the React and TypeScript buttons on the built site, and the six new pages added to the accessibility (axe) checks.
- 88 glossary terms. Key, Routing and Regression now give both of their meanings (React and Python; web and AI agents; testing and machine learning).

Fixed (found by the checks while writing)
- The testing chapter's sign-up form could never show its own error message: the browser's built-in check for `type="email"` stopped the form first. It now has `noValidate`, and the chapter explains why.
- Testing Library only cleans up between tests when Vitest's `globals` setting is on; without it, the second test found two of everything. The chapter's setup file now calls `cleanup` after each test, and says why.
- The research for the TypeScript chapter assumed the Vite starter's tsconfig sets `"strict": true`. It does not: TypeScript 6 and later are strict by default. The chapter says that instead.
- A phone number in a practice answer was removed: I could not confirm it was in a range set aside for fiction.
- Error line numbers in all previews counted from the top of the hidden preview page (an error on line 2 said "line 130"). They now come from the example's own lines.
- React previews did not load during `npm run dev`: Vite's development server refuses script requests from the sandboxed frame. In development the bundle is now put inline; the built site loads it as a normal script.
- The CSS validator treated `src` and `font-display` inside `@font-face` as unknown properties; it now checks them against the at-rule's own grammar.

Not verified
- Sucrase, which compiles the examples on the page, does not report a closing JSX tag that does not match its opening tag (`<p>hi</b>`), and reports some mistakes less clearly than Vite. The common mistakes sections quote Vite's real messages.
- The type checks use this repository's TypeScript 6 compiler; learners' new projects get TypeScript 7. One network check runs real TypeScript 7 on the chapter's first error.
- No person has read these chapters yet; time estimates are guesses.

### 2026-11-12: Zero to Web Developer, part 3 (JavaScript from zero)

Added
- Seven chapters: values and variables; decisions, loops and functions; arrays and objects; the DOM and events; debugging; promises, async and fetch; modules, npm and Vite. About 17,500 words, 135 practice problems (30 each in the first three chapters), 50 quiz questions, 33 exercises, 24 resource records.
- **Run button for JavaScript.** Examples that are not part of a live preview get Run, Edit and Reset; output appears under the code in the same format the checks use; uncaught errors are reported plainly; a hint appears when nothing is printed. Examples using import or export get a note instead, because they need separate files.
- **JavaScript checks.** `tests/js-blocks.test.ts` runs every `check: js` example in Node and compares its output (`output`, `throws`, `stack_contains`, `expect`), with saved replies for examples that call web APIs. Real-browser checks can also be given saved API replies, so no test depends on the internet. 172 code blocks in this part; 101 run as JavaScript, 10 as shell commands (including creating, installing and building a real Vite project when network checks are on), 10 in a real browser.
- Previews get a temporary stand-in for localStorage (the real one stays out of reach), and leave form submissions alone when the example handles them itself.
- 42 glossary terms. The build now fails if a glossary term used by a course has no wording for that course.

Fixed (found by running the examples before publishing)
- The debugging chapter's worked example gave a wrong printed number (2023360 instead of 202360) and a wrong middle line of output.
- A practice problem said some buggy code "always returns 0"; it actually stops with a ReferenceError. The question and answer now say so and explain why.
- An example printed "1 are left over".
- The value formatter showed errors from the test sandbox as `{}`; it now recognises errors, maps, sets and dates from any frame.
- Frames meant to stay hidden until asked for were showing as empty white boxes (a bug from part 2), and previews could measure their height before layout finished.
- I had named two Eloquent JavaScript chapters from memory with the wrong numbers; corrected from the book's contents page. Two other claims (the size of the npm registry, Vite being "the most popular") were replaced with what the sources actually say.
- Glossary: "parameter", "index", "object" and "method" each have two meanings across the courses; the entries now give both. API and JSON were missing a wording for the web course.

### 2026-11-12: Zero to Web Developer, part 2 (HTML and CSS)

Added
- Eight chapters: HTML from zero; forms and tables; accessibility; CSS from zero; the box model and positioning; layout with Flexbox and Grid; responsive design; design basics. About 17,000 words, 93 practice problems with hidden solutions, 51 quiz questions, 37 exercises, 25 resources opened and recorded (plus one source of a statistic).
- **Live examples.** Every HTML example has "Show the result"; examples wrapped in `<Playground>` combine HTML, CSS and JavaScript into one preview shown straight away. Edit to change the code and watch the result update. Previews run in a sandboxed frame that cannot read the site's storage; console messages and errors appear under the preview; submitting a form shows what it would send instead of sending it; previews grow to fit their content.
- **Two new kinds of example check.** `web`: HTML is validated with html-validate and CSS with css-tree (`tests/web-blocks.test.ts`). `browser`: the example is rendered in real Chrome and the chapter's claims are measured, at several screen widths and in dark mode where the chapter says so (`e2e/examples.e2e.ts`). 64 of part 2's 95 code blocks have browser checks. Examples that are wrong on purpose declare the problem they should trigger, so the check proves it is real.
- 41 glossary terms. `scripts/glossary_update.py` now prints a warning whenever a bold word matches a term from another course.

Fixed (found by the new checks before publishing)
- A centred-column example said "never wider than 400 pixels" but was 432, because its padding was added to the width: the exact mistake the chapter teaches. A practice solution had the same problem at 720 pixels.
- "weight" (font weight) in the design chapter matched the AI glossary's "Parameter (weight)", and "breakpoint" and "inheritance" each have two meanings across the courses. The entries now give both meanings, and the design chapter says "font weight".
- Two example previews contained their own `<main>`, which gave those chapter pages two main landmarks for screen reader users; one now uses a `<div>`. The site's accessibility check now excludes example previews, because examples are the learner's code and some are inaccessible on purpose; they are checked separately.
- A sentence claimed screen readers always announce a styled navigation list as a list; Safari with VoiceOver does not when the bullets are removed. Reworded.
- Two figures I had written without a source were removed or sourced: the share of problems automatic accessibility tools find (removed), and colour-blindness rates (sourced to Colour Blind Awareness).

### 2026-11-12: Zero to Web Developer, part 1

Added
- A third course, **Zero to Web Developer**, for people with no experience. The outline (43 chapters in 8 parts, JavaScript throughout, with a Node and Express back end) was approved and is saved in `docs/plans/web-outline.yaml`. Parts are added one at a time, so only finished chapters appear on the site.
- Part 1, "Start here": three new chapters, "What a web developer actually does", "Set up your tools" and "Git from zero: saving your work", plus three reused chapters (how computers work, the terminal, how the internet works). The new chapters have worked examples, 23 practice problems with hidden solutions, 19 quiz questions, 14 exercises, and 14 linked resources, each opened on 12 November 2026 and recorded in `resources.yaml`.
- 18 glossary terms; `scripts/glossary_update.py` adds terms and marks which courses use each one.
- Every code example in the new chapters is checked: Git commands run in a throwaway folder against a local stand-in for GitHub, and the `git status` output shown in the chapter is compared with what Git really prints.

Fixed
- The glossary's "Prompt" entry gave only the AI meaning, but the terminal chapter links to it for the terminal's prompt. It now gives both meanings (the AI and software engineering glossaries are marked "corrected").
- Chapter status wording no longer claims "every code example runs under test" when some cannot be run; the code line underneath says exactly how they were checked.
- The no-lost-text check counted a term and its definition as one word when their tags touched.

Found while writing
- Advice that is common online ("just run `git pull`") does not fix a first push to a GitHub repository created with a README: the histories are unrelated. The chapter gives the command that works, and a test reproduces the situation.

### 2026-11-12: Adding courses

Added
- **`add-course` skill** (`.claude/skills/add-course/`): when you ask Claude Code in this folder to add a course or chapters, it researches, proposes an outline for approval, creates the files with `scripts/scaffold.py`, writes chapters to the standard in `references/chapter-standard.md`, and runs every check.
- Course files now carry their own `description` and `order`; the home page no longer assumes two courses. A course file with a missing field or a duplicate id stops the build with a plain message.
- `<Solution>` box for practice problems: the answer stays hidden until the learner opens it.

### 2026-11-12: Phase 4, code examples verified

Added
- `tests/examples`: every one of the 93 code blocks in the chapters (108 in the two prototypes, fewer now that shared chapters exist once, plus one new block) has an entry in its chapter's `examples.yaml` saying how it is checked, and a test that reads the code from the chapter and runs it. A code block with no entry, or an entry still marked as a draft, fails.
- The browser runner's Python moved into `src/runner/zte_runner.py`; the website and the tests use the same file.
- A stand-in Anthropic API server for the model API examples (scripted replies, streaming, tool calls). It is not the live API.
- `tests/web-examples.test.ts` for the JavaScript, HTML, CSS and React examples.
- Each chapter page now states how its code was checked.
- CI runs every example on every push (including package installs and the Docker build); a weekly job runs the PyTorch and model-download examples.
- Results on 12 November 2026: 142 checks pass and 24 are skipped on a Mac (Docker, network and heavy examples run separately; examples that are checked by hand or in the JavaScript tests are reported as skipped, not passed). The Docker examples pass. All 16 PyTorch and model-download checks pass in a Linux container.

Found but not changed (for the deepening phases)
- PyTorch could not be installed on this Intel Mac with Python 3.14 ("no matching distribution"). Learners on similar machines will hit the same wall; the deep-learning chapters point to Colab, which avoids it, but the setup chapter should say so.
- In the Python-from-zero chapters, lines that are just a value (`7 + 2  # 9`) show their result in the browser runner and at the `>>>` prompt, but print nothing when saved in a file and run with `python hello.py`, which is how the chapter says real programs are run. A beginner will be confused; the chapter should explain it.

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
