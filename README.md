# Zero to Engineer

Two free courses for people who have never programmed, published as one website:

- **Zero to AI Engineer**: from a first line of Python to building, testing and shipping products on top of language models. The maths is taught from arithmetic.
- **Zero to Software Engineer**: from how a computer works to building, testing, deploying and running real software with other people.

The two courses share their beginner chapters (the terminal and Python from zero) from one source.

## Honest status

This project is **under construction**. Read this before relying on it.

- The chapters are currently short first drafts, moved word for word from two single-page prototypes (kept in `legacy/`). They are a spine, not yet a full course.
- **No code example has been run under test yet.**
- The linked resources respond when opened, but their contents have not been reviewed.
- No subject expert has reviewed any chapter.
- Search, in-browser Python, spaced-repetition review, the study planner, glossary links and the projects section are planned and **not built yet**.

Every chapter page shows its own status. `PLAN.md` has the full plan and the list of known gaps; `CHANGELOG.md` records what has been done.

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
| `npm run build` | Builds the finished site into `dist/` |
| `npm run preview` | Serves `dist/` so you can try the built site |
| `npm test` | Unit tests for progress, the course model and inline text |
| `npm run check` | Type checks, and checks every chapter's front matter |
| `npm run verify:migration` | After a build: proves no chapter is missing words compared with the prototypes |
| `npm run verify:links` | After a build: checks every link between pages of the site |
| `npm run verify` | All of the above, in order |

## How it is organised

```
content/
  chapters/<id>/index.mdx      the teaching text for one chapter
  chapters/<id>/quiz.yaml      its quiz: question, options, answer, explanation
  chapters/<id>/exercises.yaml its tick-off exercise list
  courses/*.yaml               one file per course: parts, and the chapters in order
  glossary.yaml                every glossary term
src/
  pages/                       the home page, course pages, chapter pages, progress page
  components/                  pieces a chapter can use (see below)
  lib/                         logic with unit tests: progress, course model, inline text
  demos/                       the interactive demos
  scripts/app.ts               what runs in the browser: progress, quizzes, theme
scripts/                       migration and checking scripts
tests/                         unit tests
legacy/                        the two original prototype pages, untouched
```

A chapter exists **once**. A course is a list of chapter ids, so a chapter listed in both course files appears in both courses, is edited in one place, and a learner's progress in it counts for both.

Progress is stored only in the learner's browser (`localStorage`). The progress page can download it as a file and restore it from one. Nothing is sent to a server.

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

- **CI** (`ci.yml`), on every push and pull request: type and content checks, unit tests, a full build, the no-lost-text check, and the internal link check.
- **Outside links** (`links.yml`), when content changes and every Monday: opens every link to another site.

## Licence

- Code: MIT, see `LICENSE`.
- Course text: CC BY 4.0, see `LICENSE-CONTENT.md`.
