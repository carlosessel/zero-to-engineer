# Zero to Engineer

Two free courses for people who have never programmed, published as one website:

- **Zero to AI Engineer**: from a first line of Python to building, testing and shipping products on top of language models. The maths is taught from arithmetic.
- **Zero to Software Engineer**: from how a computer works to building, testing, deploying and running real software with other people.

The two courses share their beginner chapters (the terminal and Python from zero) from one source.

## Honest status

This project is **under construction**. Read this before relying on it.

- The chapters are currently short first drafts, moved word for word from two single-page prototypes (kept in `legacy/`). They are a spine, not yet a full course.
- Every code example in the chapters is now checked automatically, but in different ways, and each chapter page says which. Model API examples run against a stand-in server, **not the live API**.
- The linked resources respond when opened, but their contents have not been reviewed.
- No subject expert has reviewed any chapter.
- The projects section is planned and **not built yet**.

What does work today: reading both courses on a phone or computer in light or dark mode, quizzes with explanations, tick-off exercises, saved progress with download and restore, a review page that brings back questions you got wrong, a study planner, search, a glossary, runnable Python in the browser, 12 interactive demos, a printable layout, and an "Ask a tutor" box that writes a prompt for whichever AI assistant you use.

Every chapter page shows its own status. `PLAN.md` has the full plan and the list of known gaps; `CHANGELOG.md` records what has been done.

## Privacy

The site has no server, no accounts, no analytics and no cookies. Progress is kept in your browser. The only request to another company's servers happens when you press **Run** on a Python example: the Python runtime (Pyodide) is then downloaded from the jsDelivr CDN. The "Ask a tutor" box sends nothing anywhere; it copies text for you to paste.

## Run it on your own computer

You need [Node.js](https://nodejs.org/) 22.23.4 or newer (24 is what CI uses).

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:4321. The page reloads as you edit.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Builds the finished site into `dist/`, then builds the search index |
| `npm run preview` | Serves `dist/` so you can try the built site (search only works here, not in `npm run dev`) |
| `npm test` | Unit tests: progress, review scheduling, planner, course model, glossary links, tutor prompt, runner helpers |
| `npm run test:e2e` | After a build: drives the site in a real browser (see below) |
| `npm run check` | Type checks, and checks every chapter's front matter |
| `npm run verify:migration` | After a build: proves no chapter is missing words compared with the prototypes |
| `npm run verify:links` | After a build: checks every link between pages of the site, including glossary anchors |
| `npm run verify` | Everything above except the end-to-end tests, in order |

The end-to-end tests need a browser installed once:

```bash
npx playwright install chromium
```

Or, to use Chrome if it is already on your computer, run them as `PW_CHANNEL=chrome npm run test:e2e`.

They cover saved progress, export and import, the review queue, the planner, search, glossary links, the tutor box, demos, keyboard use, the phone menu, automated accessibility checks (axe) on 15 page types in light and dark mode, and running Python. The Python test needs an internet connection.

## Testing the code in the chapters

Every fenced code block in every chapter has an entry in that chapter's `examples.yaml` saying how it is checked. The test reads the code straight from the chapter, so what a learner reads is exactly what is tested. A new code block with no entry fails the tests.

Set up once (needs Python 3.12 or newer):

```bash
python3 -m venv .venv
```

```bash
.venv/bin/pip install -r tests/examples/requirements.txt
```

Then run:

```bash
.venv/bin/python -m pytest tests/examples
```

Some checks are skipped unless you ask for them, because they are slow or need something extra:

| Set this | To also run |
| --- | --- |
| `EXAMPLES_NETWORK=1` | `pip install` lines (resolved, not installed) |
| `EXAMPLES_DOCKER=1` | the Dockerfile example (builds and starts a container) |
| `EXAMPLES_HEAVY=1` | PyTorch and model-download examples (install `tests/examples/requirements-heavy.txt` and PyTorch first) |

The kinds of check, and what each proves, are described at the top of `tests/examples/harness.py`. In short: Python runs through the same runner the website uses; SQL runs in SQLite; shell and Git commands run in an empty temporary folder with a throwaway Git identity; HTML and CSS examples are validated (`tests/web-blocks.test.ts`, using html-validate and css-tree) and, where the chapter makes a claim about how they look or behave, rendered in real Chrome and measured (`e2e/examples.e2e.ts`); the older JavaScript and React examples are tested in `tests/web-examples.test.ts`; model API examples talk to a stand-in server (`tests/examples/fake_anthropic.py`) that returns scripted replies. That last kind proves the code and its handling of replies are right, not what a real model would say.

To add a chapter with code, run `.venv/bin/python scripts/examples_draft.py your-chapter-id`. It writes a draft `examples.yaml` recording what each Python block printed. **Read every recorded output against what the chapter claims** before relying on it; the draft is a starting point, and the tests refuse an entry still marked as a draft.

## How it is organised

```
content/
  chapters/<id>/index.mdx      the teaching text for one chapter
  chapters/<id>/quiz.yaml      its quiz: question, options, answer, explanation
  chapters/<id>/exercises.yaml its tick-off exercise list
  courses/*.yaml               one file per course: parts, and the chapters in order
  glossary.yaml                every glossary term
src/
  pages/                       home, course and chapter pages, review, planner, search, glossary, progress
  components/                  pieces a chapter can use (see below)
  lib/                         logic with unit tests: progress, review, planner, course model,
                               glossary links, tutor prompt, inline text
  runner/pyworker.js           runs Python in the browser (Pyodide, in a web worker)
  demos/                       the interactive demos
  scripts/                     what runs in the browser
scripts/                       migration and checking scripts
tests/                         unit tests
e2e/                           end-to-end tests
legacy/                        the two original prototype pages, untouched
```

A chapter exists **once**. A course is a list of chapter ids, so a chapter listed in both course files appears in both courses, is edited in one place, and a learner's progress in it counts for both.

Progress is stored only in the learner's browser (`localStorage`). The progress page can download it as a file and restore it from one. Nothing is sent to a server.

How the learning features work:

- **Review.** A quiz question answered wrongly comes back on the review page the next day. Each correct review moves it up a box and it waits longer (1, 3, 7, 14, 30 days); a wrong answer sends it back to the start.
- **Planner.** Lays unfinished chapters, in course order, onto weeks of the hours you enter, using each chapter's `estimated_minutes`.
- **Runnable Python.** Every `python` code block gets Run and Edit buttons, unless it needs something a browser cannot provide (PyTorch, an API key, a file of yours); those say so instead. Examples on one page share one Python session, like cells in a notebook. A line that is just a value shows that value, as the `>>>` prompt does. `input()` works by re-running the program with the answers typed so far.
- **Glossary links.** A term is linked to the glossary where a chapter puts it in bold, and capital-letter acronyms are linked where they first appear. To make a new term link, add it to `content/glossary.yaml` (an optional `aliases:` list adds other spellings).
- **Search.** Pagefind builds an index from the finished site; the browser loads only the pieces it needs.

## Add a chapter

1. Create a folder `content/chapters/your-chapter-id/` (lower-case letters, numbers and hyphens).
2. Add `index.mdx`:

   ```mdx
   ---
   title: "Your chapter title"
   summary: "One or two sentences. Shown at the top of the chapter."
   prerequisites: [python-basics]
   estimated_minutes: 60
   status: deepened
   ---

   ## First section

   Ordinary Markdown. Code goes in fenced blocks with a language, such as python.
   ```

3. Optionally add `quiz.yaml`:

   ```yaml
   - question: "What does print do?"
     options:
       - "Shows a value on screen"
       - "Sends a page to a printer"
     answer: 0
     explanation: "print writes to the screen. It has nothing to do with paper."
   ```

4. Optionally add `exercises.yaml`, and put `<Exercises />` in the chapter where the list should appear:

   ```yaml
   - title: "Do this"
     items:
       - key: x1
         text: "Run `python --version`"
   ```

5. Add the chapter id to the right part in `content/courses/ai-engineer.yaml`, `content/courses/software-engineer.yaml`, or both.
6. Run `npm run verify`. The build stops with a plain message if a field is missing, a quiz answer does not match an option, a chapter is not in any course, or a reference points at a chapter that does not exist.

Pieces you can use inside a chapter, with no import needed:

| Write | You get |
| --- | --- |
| `<Ref to="chapter-id" />` | A link reading "chapter 12", with the right number for the course being read |
| `<Ref to="chapter-id">any words</Ref>` | A link with your own words |
| `<Note>` … `</Note>` | A boxed note (leave a blank line after the opening tag and before the closing one) |
| `<Exercises />` | The tick-off list from `exercises.yaml` |
| `<Demo name="line" />` | An interactive demo from `src/demos/html/` |
| `<Only course="ai">` … `</Only>` | Text shown in one course only, inside a shared chapter |
| `<Solution>` … `</Solution>` | A practice answer hidden until the learner opens it |
| `<Playground>` … `</Playground>` | Wraps an example's `html`, `css` and `js` code blocks into one live, editable preview |

Every `html` code block gets a "Show the result" button even outside a `<Playground>`. Previews run in a sandboxed frame: they cannot read the site's storage, and submitting a form shows what would be sent instead of sending it.

Writing rules: British spelling; plain words; define a term the first time it appears; teach in original words and link out rather than copying from other courses.

## Deploying

The site is plain files, so any static host works. This repository is set up for **GitHub Pages**: `.github/workflows/deploy.yml` builds and publishes on every push to `main`.

One-time setup:

1. Create an empty repository on GitHub (no README, no licence).
2. Connect this folder to it and upload (replace `YOUR-NAME` and `YOUR-REPO`):

   ```bash
   git remote add origin https://github.com/YOUR-NAME/YOUR-REPO.git
   ```

   ```bash
   git push -u origin main
   ```

3. On GitHub, open the repository's **Settings → Pages** and under **Build and deployment → Source** choose **GitHub Actions**.
4. Open the **Actions** tab and wait for "Deploy to GitHub Pages" to go green. The address is shown on the run and under Settings → Pages. It will look like `https://YOUR-NAME.github.io/YOUR-REPO/`.

The workflow asks GitHub for the site's address and passes it to the build as `SITE_URL` and `SITE_BASE`, so nothing needs editing if the repository is renamed. To deploy elsewhere, build with those two variables set (`SITE_BASE` is the path the site lives under, or empty for the root of a domain) and upload `dist/`.

## Checks that run automatically

- **CI** (`ci.yml`), on every push and pull request: type and content checks, unit tests, a full build, the no-lost-text check, the internal link check, the end-to-end tests in a real browser, and every chapter code example (including package installs and the Docker build).
- **Heavy examples** (`examples-heavy.yml`), every Monday and on request: the PyTorch and model-download examples.
- **Outside links** (`links.yml`), when content changes and every Monday: opens every link to another site.

## Licence

- Code: MIT, see `LICENSE`.
- Course text: CC BY 4.0, see `LICENSE-CONTENT.md`.
