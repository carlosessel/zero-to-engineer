# Handoff: Zero to AI Engineer and Zero to Software Engineer

This file is a record of a claude.ai chat held on 11 November 2026, written so Claude Code can pick the work up. It is a faithful summary, not a word-for-word transcript. The user's requests are quoted exactly; the assistant's replies and work are summarised.

Files that go with this document:

- `ai-engineer-course.html`: the AI engineering course (41 chapters, single self-contained page)
- `software-engineer-course.html`: the software engineering course (36 chapters, same format)

---

## Part 1. The prompt for Claude Code

Paste everything in this section into Claude Code, in a folder that contains this file and the two HTML files.

```
You are taking over a learning project from a claude.ai chat. Read HANDOFF.md
fully first, then open ai-engineer-course.html and software-engineer-course.html
and read their structure and content before changing anything.

WHO THIS IS FOR
I am the learner. Assume I know nothing: no programming, no maths beyond basic
arithmetic, no jargon. I want to go from zero to a capable AI engineer and a
capable software engineer. Everything must be taught, not just listed.

WHAT I WANT
Turn the two single-file prototypes into one solid, publishable learning
project: a real repository and a deployed website that I can study from every
day and share with others. It should be complete enough that someone who works
through all of it, including the projects, is job-ready at junior level.

HOW TO WORK
1. Start by writing a plan (PLAN.md): proposed architecture, content structure,
   phases, and the open decisions you need from me. Stop and show me the plan
   before building. Ask me questions instead of guessing on anything that
   changes the shape of the project.
2. Work in small commits with clear messages. Keep a CHANGELOG.md.
3. After each phase, tell me what you built, how you checked it, and what is
   still unverified.

CONTENT REQUIREMENTS
- Move the content out of the HTML into one Markdown (or MDX) file per chapter,
  with front matter for title, part, order, prerequisites and estimated time.
  Keep quizzes and exercise checklists as structured data next to each chapter.
- Keep and improve everything already there. Do not shorten chapters.
- Deepen every chapter: more worked examples, more practice problems with
  solutions hidden behind a reveal, common mistakes, and a short summary.
  The maths and the from-zero Python chapters matter most: add many more
  graded practice problems there.
- Add what is missing. Review both curricula against well-known public
  curricula and roadmaps and tell me the gaps you find before filling them.
- Keep the two courses separate but let them share the common beginner
  chapters (terminal, Python from zero, Git) from one source.
- Plain language throughout. Define every term the first time it appears and
  link it to the glossary. British spelling, as in the existing text.

RESEARCH REQUIREMENTS
- Use web search to find the best free, widely respected material for every
  chapter: courses, documentation, books, articles and YouTube videos.
- For each resource record: title, author or channel, URL, type, what it
  covers, why it was chosen (evidence of quality such as view counts, stars,
  university use, or frequent recommendation), and the date you checked it.
- Open every link and confirm it works. Never list a resource you have not
  been able to open; put those in a separate "unverified" list instead.
- You cannot watch videos. Say so where relevant and judge them by channel
  reputation, description, transcript if available, and popularity.
- Do not invent titles, authors, URLs or statistics. If unsure, leave it out
  and tell me.
- Re-check the resources already listed in the two "library" chapters.
- Do not copy copyrighted text from other courses. Teach in original words
  and link out.

LEARNING SYSTEM REQUIREMENTS
- A static site (suggest a framework in the plan) that works on a phone,
  supports light and dark mode, is accessible by keyboard and screen reader,
  and loads fast on a slow connection.
- Progress tracking that survives closing the browser, with export and import
  of progress as a file.
- Quizzes with explanations, as now. Add spaced-repetition review: questions
  I got wrong come back later.
- Runnable code in the browser for the Python chapters (for example Pyodide),
  so a beginner can practise before installing anything.
- Keep and extend the interactive demos (listed in HANDOFF.md). Add demos
  where an idea is easier to see than to read.
- A study planner: I enter hours per week and it lays out a schedule.
- Search across all chapters, a glossary with links back to chapters, and a
  printable version of each chapter.
- The current pages have an "Ask the tutor" box that only works inside
  claude.ai. In the standalone site it will not work. Propose options in the
  plan (remove it, or make it optional with the learner's own API key kept
  only in their browser) and let me choose. Never put an API key in the
  repository or the built site.
- A projects section with a specification, starter repository layout,
  acceptance checklist and self-review rubric for every project on both
  project ladders.

QUALITY REQUIREMENTS
- Every code example in the courses must be run and confirmed to work. Put
  the examples under automated tests so they stay working.
- Add a link checker and a build check to CI (GitHub Actions).
- Add tests for the site's own logic (progress, quizzes, planner).
- Write a README that explains the project, how to run it locally, how to
  add a chapter, and how to deploy.
- Set up deployment to a free static host (suggest one) and give me the
  exact steps I need to do myself.
- Choose a licence with me before publishing.

HONESTY
Tell me plainly what you could not verify, what you are unsure about, and
where the course is still thin. Do not describe anything as complete,
comprehensive or verified unless you checked it.
```

---

## Part 2. What the user asked for, in their words

1. "I want to become an AI Engineer or to be able to create stuff AI stuff.. give me a complete book or tutorial or something that would teach me from begineer to very good or being able to create, stuff, don't miss anything, let it be interactive too.."
2. "can we do thorough search accross the internet and give solid materials and approved by public materials and content on the topic and so that we design something that is full and all in one, something that is all you need and contains all you need to know and learn from everywhere in there, so once you complete it you good.. let's create it as a project that can be published, don't assume I know anything, teach me like a beginner and everything"
3. "let's move to claude code where you do web searches on searches on youtube to get more content? what about the maths? won't you teach me it? I also want another one of this for software engineering, something that you go through that would cover everything from zero or foundation to a very good software engineer, very comprehensive and covers everything you need to know"
4. "Give me a copy of the entire chat I can share with claude code, and a prompt to get it make the whole thing into a solid project and system for learning"

## Part 3. What was built

### Turn 1: first version of the AI course
A single HTML page with 30 chapters in nine parts, running from "what an AI engineer does" to deployment and monitoring. Each chapter had an explanation, code, a tick-off exercise list and a quiz. Six live demos, progress saved in the browser, and an "Ask the tutor" box.

The first version assumed the learner could already program. That was wrong for this learner and was corrected in turn 2.

### Turn 2: from zero, plus a checked library
- Added five beginner chapters: what code and AI are; files, folders and the terminal; and three chapters of Python from the first line.
- Reworked the old Python chapter into "compact Python" that follows them.
- Added Git and API-key explanations to the setup chapter.
- Added a library chapter and a glossary chapter.
- The tutor's instructions were changed to assume a complete beginner.

### Turn 3: maths, and the second course
- Added four maths chapters taught from arithmetic upward, each with a live demo: numbers, algebra and functions; vectors and matrices; slopes and derivatives; probability and statistics. The earlier single maths chapter became a one-page recap with softmax and cross-entropy.
- Built "Zero to Software Engineer": 36 chapters in ten parts, reusing the terminal and Python-from-zero chapters.

### Final state

| | AI course | Software engineering course |
|---|---|---|
| File | `ai-engineer-course.html` | `software-engineer-course.html` |
| Chapters | 41 | 36 |
| Published at | https://claude.ai/artifact/SqtmKdd1Cnpm2WYTb1rrHL | https://claude.ai/artifact/EuQ6ufyqCDvgUZA23fp2ko |
| Live demos | 10 | 2 |
| Project ladder | 8 projects | 9 projects |

The published links are private to the user unless shared.

**AI course parts:** Start here; Foundations (Python); Maths and data; Machine learning; Deep learning; How language models work; Building with language models (API calls, prompting, structured output, tool use, RAG, agents, evals); Going deeper (open models, fine-tuning, multimodal); Shipping it (architecture and cost, security, operations); Build and grow; Reference.

**Software engineering course parts:** Start here; Programming; Computer science; Tools of the trade (Git with a team, testing); The web (internet, HTML and CSS, JavaScript, front ends, back ends, login); Data (SQL, data design); Systems (architecture, concurrency, system design, security); Shipping (servers and containers, CI and CD, monitoring); The job (teamwork, AI coding tools, projects, career); Reference.

**Live demos in the AI course:** line with slope and height sliders; two vectors with dot product and cosine; tangent line on a curve; coin-flip simulator; gradient descent stepper; polynomial curve fit showing overfitting; toy tokenizer; temperature sampler; small word-overlap search engine; cost calculator.

**Live demos in the software engineering course:** Big O growth bars; binary search stepper.

## Part 4. How the research was done, and its limits

This matters, because the user asked for a thorough search of the whole internet and that did not happen.

- The chat had **no web search tool**. The only outside site reachable was GitHub.
- For each candidate resource, the public GitHub page was fetched to confirm the repository exists and is not archived, and the star count was read from the page. This was done on 11 November 2026.
- **54 distinct repositories were checked this way**: 34 in a first pass for the AI course and 20 in a second pass for software engineering and maths. The AI library lists 34 of them (one first-pass repository, fastai/course22, was checked but left out); the software engineering library lists 22; three appear in both. The full lists with links and star counts are in the "library" chapter of each HTML file.
- **The contents of those resources were not reviewed.** Stars measure popularity, not correctness.
- One repository had moved: `kamranahmedse/developer-roadmap` now redirects to `nilbuild/developer-roadmap`. The library uses the new address.
- Resources that live outside GitHub (for example Harvard's CS50, Kaggle Learn, Khan Academy, 3Blue1Brown, fast.ai's video course, and several books) are listed in a separate "not checked that day" section. They were named from the assistant's memory and **need verifying**, including titles and editions of books.
- No YouTube search was done. No videos are linked.

## Part 5. Known gaps and things to verify

- **Nothing was tested in a browser.** The scripts were syntax-checked with Node, and every element id the scripts look up was confirmed to exist in the page. No one has clicked through the pages.
- **None of the code examples were run.** This includes the Python, SQL, JavaScript, Dockerfile and GitHub Actions examples.
- **Model names and API details change.** The AI course's API examples use Anthropic's Python SDK with a placeholder model name and tell the reader to check the provider's documentation. Check all of it against current docs.
- **Depth.** Each chapter teaches the core idea in a few hundred words with one or two code examples. That is a spine, not a full textbook. Practice problems are few. The maths chapters in particular need many more worked problems.
- **Time estimates** in the courses (roughly nine to twelve months for the AI course and about a year for the software engineering course at 8 to 10 hours a week) are rough guesses, not measured.
- **The software engineering course has only two demos** and no runnable code.
- **No chapter was reviewed by a subject expert.**

## Part 6. Technical notes on the two HTML files

Both files share one engine. The software engineering file was generated from the AI file's shell and scripts with different content.

- **Chapters** are `<article id="..." data-part="..." data-title="...">` elements. The script builds the sidebar, chapter numbers, headings, previous and next buttons, and the route list on the first chapter from these attributes. Chapter order is document order.
- **Routing** uses the URL hash: `#chapter-id`.
- **Quizzes** are in a `QUIZ` object in the script, keyed by chapter id. Each question has `q` (text), `o` (options), `a` (index of the correct option) and `w` (explanation).
- **Exercise checkboxes** are `<input type="checkbox" data-k="...">` with a unique key.
- **Progress** is saved in `localStorage` under `aie-course-v1` (AI course) and `se-course-v1` (software engineering course) as `{done, quiz, checks}`.
- **Cross-references** between chapters are written as plain numbers in the text ("chapter 24"). They were shifted by script each time chapters were inserted. A rebuilt project should replace them with links by chapter id.
- **Theme:** colours are CSS variables on `:root` with light and dark values. Demos drawn on canvas read those variables.
- **Fonts** load from Google Fonts: Bricolage Grotesque, IBM Plex Sans, JetBrains Mono.
- **The tutor box** calls `window.claude.use("sample")`, which exists only when the page is opened as a claude.ai artifact. Anywhere else it resolves to nothing and the box stays hidden. A standalone site needs a different approach or should drop it.
- **Browser limits that shaped the prototype:** the artifact host blocks network requests from the page, so in-browser Python (Pyodide) could not be used. That limit does not apply to a normal website.
- **Writing conventions:** British spelling, curly quotes in prose, straight quotes in code.
