# Outline format

The outline is a small YAML file the learner approves before anything is created. Save it to the scratchpad (not the repository), then run:

```bash
.venv/bin/python .claude/skills/add-course/scripts/scaffold.py path/to/outline.yaml
```

## A new course

```yaml
course: data-analyst                 # becomes the address: /data-analyst/
title: "Zero to Data Analyst"
tagline: "Read, practise, do the exercises, pass the quiz."
description: "From your first spreadsheet to cleaning, analysing and presenting real data with SQL and Python."
order: 3                             # optional; position on the home page (the existing courses are 1 and 2)
parts:
  - name: "Start here"
    blurb: "What the job is, and the tools you need"
    chapters:
      - id: what-analysts-do
        title: "What a data analyst actually does"
        summary: "What the job involves day to day, and what this course will teach you."
        minutes: 45
      - terminal-files                # an existing chapter, reused unchanged
  - name: "Python"
    blurb: "Programming from the first line"
    chapters:
      - python-basics
      - python-logic
      - python-collections
      - id: pandas-for-analysts
        title: "pandas for analysts"
        summary: "Loading, cleaning and summarising tables of data."
        minutes: 240
```

## Adding to an existing course

Name the existing course id. A part whose `name` matches an existing part gets the chapters appended to it, or inserted after the chapter named in `after:`. A new part name is added at the end (and needs a `blurb`).

```yaml
course: ai
parts:
  - name: "Going deeper"
    chapters:
      - id: speech-apps
        title: "Building voice applications"
        summary: "Speech to text, text to speech, and keeping it fast."
        minutes: 180
        after: multimodal
```

## Reusing chapters

Any existing chapter can appear in any course by writing just its id. It is then shared: edited in one place, and progress in it counts in every course that lists it. List the existing chapters with:

```bash
ls content/chapters
```

and read a chapter's front matter to see what it covers. The shared beginner chapters are `terminal-files`, `python-basics`, `python-logic` and `python-collections`. Reuse is usually better than writing a second version of the same thing.

Do not edit a shared chapter's text for one course; if one sentence must differ, use `<Only course="id">…</Only>` (see `python-collections` for an example), and tell the learner.

## Ids

Lower-case letters, numbers and hyphens: `data-analyst`, `sql-joins`. A chapter id must be unique across the whole site. The script refuses clashes and explains why.
