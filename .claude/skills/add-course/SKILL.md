---
name: add-course
description: Adds a new course, or new chapters and topics to an existing course, in the Zero to Engineer learning site in this repository, taught from zero to the site's standard (worked examples, practice with hidden solutions, quizzes, exercises, tested code, checked resources) and wired into the site, search, glossary, planner and tests. Use this whenever the user wants to learn or study something new here, says "add a course on…", "I want to study…", "make me a course about…", "add a chapter/topic/section on… to the AI (or software) course", wants to extend, restructure or reuse chapters across courses, or asks how to add their own material to the site, even if they never say "course".
---

# Add a course or chapters

This repository is a learning site (Astro) holding several courses. A **course** is a YAML file in `content/courses/` listing parts and chapter ids in order; a **chapter** is a folder in `content/chapters/<id>/`. A chapter exists once and can appear in any number of courses. Everything on the site (navigation, search, glossary links, progress, review, planner) is built from these files, so adding a course is adding files.

The person using this is usually the learner themself, often a beginner. Speak plainly, define jargon, and keep them in control of anything that changes the shape of their course.

## The workflow

### 1. Understand the request

Find out, asking only what the request leaves unclear:
- the subject, and where the learner is starting from;
- the goal: job-ready at junior level (the default for this site), a hobby, or one specific skill;
- whether this is a **new course** or an addition to an **existing one** (`ls content/courses`).

### 2. Research, then propose an outline (stop here for approval)

Before writing anything:
1. List the existing chapters (`ls content/chapters`, and read front matter where the title is not enough) and pick ones to **reuse**. Reuse beats rewriting: shared chapters stay consistent and progress counts in both courses.
2. Compare against well-known public curricula and roadmaps for the subject (web search; open what you cite). Note gaps and the order they teach things in.
3. Draft the outline in the format in `references/outline-format.md`: parts, chapters, a one-line summary and a time guess each, marking which chapters are reused.
4. Show the learner the outline in plain words, plus the decisions that change the shape of the course (a language or tool choice, depth, what is left out) with your recommendation, and an honest size estimate (number of chapters, roughly how many working sessions to write them).

Wait for approval. The outline determines all the later work, so a misunderstanding here costs the most.

### 3. Create the files

Save the approved outline as `docs/plans/<course-id>-outline.yaml`, with a comment saying when it was approved and which parts exist so far. Then create **only the part you are about to write**: copy that part into a small outline file in the scratchpad (same format, same `course:` line) and run:

```bash
.venv/bin/python .claude/skills/add-course/scripts/scaffold.py PART-OUTLINE.yaml
```

It creates (or extends) the course file and one folder per new chapter with marked drafts (`DRAFT:`), and refuses id clashes and missing chapters. It never overwrites an existing chapter. Creating one part at a time means the site only ever lists chapters that are written; update the comment in the saved outline as each part is created.

### 4. Write the chapters, a part at a time

Read `references/chapter-standard.md` before writing the first chapter: it is the standard every chapter meets (who the reader is, the chapter shape, writing rules, practice problems with `<Solution>` boxes, quizzes, exercises, tested code, checked resources, status).

For each chapter: write `index.mdx`, `quiz.yaml`, `exercises.yaml`, `resources.yaml`; draft and review `examples.yaml` for its code. For the glossary, write the part's new terms in a small YAML list (`term`, `definition`, `courses`) and run `.venv/bin/python scripts/glossary_update.py NEW_TERMS.yaml`. It adds them, and adds the course to every existing term its chapters put in bold. Read every `CHECK THE MEANING` line it prints, and `git diff content/glossary.yaml`: a bold word can match a term with a different meaning ("prompt", "weight", "breakpoint" and "inheritance" all did). Then either give the entry both meanings, or use a different word in the chapter. Write a whole part, check it (step 5), commit, and tell the learner what is done before starting the next part. A full course is many sessions of work; finishing parts properly is better than a whole course of thin drafts.

### 5. Check

```bash
.venv/bin/python .claude/skills/add-course/scripts/scaffold.py --check COURSE_ID
```

```bash
npm run verify
```

```bash
.venv/bin/python -m pytest tests/examples -q
```

```bash
npx vitest run
```

`--check` lists unfinished `DRAFT:` places. `npm run verify` type-checks the content, builds the site and checks every internal link. Then open one new chapter in the browser (`npm run dev`) and look at it, including on a phone-width screen. Fix everything before reporting. If an end-to-end test counts chapters or courses and now fails because a course was added, update the number in the test, not the content.

### 6. Record and report

- Small commits with clear messages; a `CHANGELOG.md` entry under "Unreleased".
- Report in plain words: what was added, how it was checked, and what is still unverified (resources not opened, time estimates that are guesses, code that only ran against the stand-in API server, anything left as `deepened` rather than verified). Never call a course complete, comprehensive or verified unless it was checked.

## Removing a course

`scaffold.py --remove COURSE_ID` deletes the course file and the chapters only it uses (shared chapters are kept). It deletes work, so do it only when the learner asks, and confirm with them first which chapters will go.

## Things that break the build, and what to do

| Message | Cause |
| --- | --- |
| Course "x" lists chapter "y", which does not exist | A typo in the course file, or a chapter folder not created |
| Chapter "y" is not listed in any course | A chapter folder no course uses: add it to a course or delete it |
| … has two chapters with the address "z" | Two chapters in one course share a slug |
| index.mdx has N code blocks but examples.yaml has M entries | A code block was added or removed: rerun `scripts/examples_draft.py` for a new chapter, or edit `examples.yaml` |
| Reference to chapter "y", which is not in any course | `<Ref to="y" />` names a missing chapter |
