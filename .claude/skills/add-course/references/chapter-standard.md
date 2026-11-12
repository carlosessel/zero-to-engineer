# The chapter standard

Every new chapter is written to this standard. It comes from what the learner asked for when the project began: someone who knows nothing should be able to learn from it, and someone who finishes a course, projects included, should be ready for junior work in that field.

## Contents

1. Who the reader is
2. The shape of a chapter
3. Writing rules
4. Practice problems
5. Quizzes and exercises
6. Code
7. Resources and research
8. Length and time
9. Front matter and status

## 1. Who the reader is

Assume no background beyond basic arithmetic: no programming, no maths, no jargon, unless an earlier chapter in the same course taught it. If a chapter needs something earlier chapters do not teach, either teach it here, add a chapter for it, or reuse an existing chapter that teaches it (list its id in the course outline). Never hand the reader a term or tool they have not been given.

## 2. The shape of a chapter

1. **Why this matters**: two or three sentences on what the reader will be able to do. (The `summary` in the front matter appears above this as the lead, so do not repeat it word for word.)
2. **Teaching sections**, one idea each. Every idea gets at least one **worked example** shown step by step, ideally with real-looking numbers or names, before the reader is asked to do anything.
3. **Demos** only where an idea is easier to see than read. The existing demos are listed in `src/demos/html/`; a new demo is real work, so propose it rather than half-building it.
4. **Common mistakes**: the actual mistakes beginners make here, what they look like (the error message, the wrong number), and the fix.
5. **Practice**: graded problems with hidden solutions (section 4).
6. **Exercises**: the `<Exercises />` tick-list, hands-on tasks.
7. **Summary**: five to eight short points.
8. **Go deeper**: two to five checked resources.
9. The **quiz** is added automatically from `quiz.yaml` after the chapter.

## 3. Writing rules

- **Plain words.** Short sentences. Explain the idea before the name for it.
- **Define every term the first time it appears**, in **bold**, in the same sentence or the next. Add each new term to `content/glossary.yaml` with the new course's id in its `courses` list (if the term already exists, add the course id; if the course needs a different wording, use `definitions:` keyed by course id, as existing entries do). Bold plus a glossary entry is what makes the site link the term.
- **British spelling**, as in the rest of the site: organise, colour, behaviour, centre, licence (noun), practise (verb).
- Curly quotes in prose, straight quotes in code.
- Refer to other chapters with `<Ref to="chapter-id" />`, never "chapter 12": numbers differ between courses.
- **Original words only.** Do not copy text from other courses, books or sites, even a paragraph. Teach it your own way and link out.
- **Honest about uncertainty.** If something varies, is contested, or changes quickly (prices, versions, product names), say so and date it ("checked November 2026").

## 4. Practice problems

Graded **warm-up → standard → stretch**. Each problem's answer goes in a `<Solution>` box with the working, not just the result:

```mdx
**2. (standard)** A shop sells 3 notebooks for £4.50. How much do 7 cost?

<Solution>

One notebook costs £4.50 ÷ 3 = £1.50, so 7 cost 7 × £1.50 = **£10.50**.

</Solution>
```

Leave a blank line after `<Solution>` and before `</Solution>` so the Markdown inside works. Check every answer: compute it, ideally in Python, rather than trusting mental arithmetic. A wrong answer in a solution box teaches the mistake.

Foundational chapters (anything a whole course rests on, such as a first programming language or the maths a field needs) deserve many more problems, 30 to 50; other chapters 8 to 15.

## 5. Quizzes and exercises

`quiz.yaml`: 4 to 8 questions per chapter. Each has `question`, `options` (2 to 5), `answer` (the index of the right option, counting from 0), `explanation`. Questions test understanding ("what happens if…", "which of these is a mistake"), not recall of a sentence. Wrong options are believable mistakes, not jokes. The explanation says why the right answer is right.

`exercises.yaml`: hands-on tasks with a result the reader can check for themselves. Keys are short and unique within the chapter (`x1`, `x2`…).

## 6. Code

Every fenced code block needs a language (`python`, `bash`, `sql`, `js`, `html`, `css`, `text`…) and an entry in the chapter's `examples.yaml` saying how it is checked. After writing a chapter, run:

```bash
.venv/bin/python scripts/examples_draft.py chapter-id
```

It drafts `examples.yaml` and records what each Python block printed. **Read each recorded output against what the chapter says it prints.** Then strengthen the entries: add `verify:` assertions for any claim the text makes (a value, a shape, "takes about one second"), `stdin:` for programs that ask for input, and a `note:` explaining anything unusual. The kinds of check and their fields are listed at the top of `tests/examples/harness.py`.

For HTML, CSS and JavaScript, wrap an example's blocks in `<Playground>` so the learner sees a live, editable result (see the README's table of pieces). The draft gives `html` and `css` blocks `check: web`, which runs a validator. Wherever the chapter claims something about how an example looks or behaves (a width, a colour, what a form sends, one column on phones), change it to `check: browser` and write the claim as `expect` expressions, measured in real Chrome; `combine`, `viewport`, `also_at`, `actions` and `color_scheme` are described at the top of `e2e/examples.e2e.ts`. Examples that are wrong on purpose list the problem with `expect_problems`. Writing these checks finds real mistakes: in the CSS part, one example claimed a width the browser did not produce.

Rules that keep examples honest:
- An example must run as written. If it needs a file, create the file in the example. If it continues from an earlier block in the same chapter, that is fine: blocks share a session. If it continues from another chapter, say so in a code comment.
- Python examples run in the browser too (Pyodide). Plain Python, NumPy, pandas and scikit-learn work there. PyTorch, model APIs and anything needing the learner's own files cannot; the site says so automatically.
- Model API examples use Anthropic's Python SDK as the rest of the course does, are checked against the stand-in server (`python-fake-api`), and must not use settings the current SDK rejects. Read replies with a helper that joins the text blocks, as "Your first model call" does.
- Never put a real API key, password or token anywhere.

## 7. Resources and research

Use web search to find the best free, widely respected material for the chapter: official documentation, university courses, well-known books available free, respected videos.

- **Open every link** and confirm it works and covers what you claim. A resource you could not open does not go in the chapter; mention it to the learner instead.
- Record each one in the chapter's `resources.yaml`:

  ```yaml
  - title: "Python Tutorial"
    author: "Python Software Foundation"
    url: https://docs.python.org/3/tutorial/
    type: documentation        # course | documentation | book | article | video | tool
    covers: "The official introduction: values, control flow, functions, data structures."
    why: "The language's own documentation; linked from python.org."
    checked: 2026-11-12
  ```

- `why` states evidence you actually saw (who publishes it, a university that uses it, a figure read from the page that day). **Never invent a title, author, URL or statistic.** If unsure, leave it out.
- You cannot watch videos. Judge a video by its channel, its description, a transcript if available, and figures shown on the page, and say in `why` that it was not watched.
- List the same resources, with a one-line reason each, in the chapter's "Go deeper" section.

## 8. Length and time

Ordinary chapters: roughly 2,000 to 4,000 words. Foundational chapters can be longer. Set `estimated_minutes` to an honest guess for a beginner doing the reading, the examples, the practice and the exercises; it feeds the study planner. Say in your report that it is a guess.

## 9. Front matter and status

```yaml
---
title: "Spreadsheets from zero"
summary: "One or two sentences shown at the top of the chapter and in search."
prerequisites: [what-analysts-do]     # chapter ids the reader must have done first
estimated_minutes: 180
status: deepened
---
```

`status` is shown to readers, so it must be true:
- `deepened`: written to this standard; resources not all opened and checked.
- `code-verified`: as above, and every code block has a check in `examples.yaml` that passes (the chapter page lists how each kind was checked, including any that cannot be run).
- `resources-verified`: as above, and every resource opened and recorded in `resources.yaml`. A chapter with no code can be `resources-verified` once its resources are checked.

Do not set a status the chapter has not earned.
