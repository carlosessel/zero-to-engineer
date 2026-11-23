# Writing a walkthrough

A walkthrough is a picture that changes step by step, with a sentence explaining each step, the line of code being run highlighted, and the current values. It appears in a chapter with `<Walkthrough name="…" />`.

There are two kinds:

- **Coded** (`src/walk/lessons/*.ts`): for algorithms. The lesson runs the real algorithm and records a frame per step, and a test runs the Python shown beside it to prove they agree. Use this when the steps are computed.
- **Data** (`content/chapters/<id>/walkthrough.yaml`): for everything else, a story told in steps: an HTTP request, a Git branch, a container starting, a prompt becoming tokens. This guide is about these.

## What makes a good one

- **One idea, seen changing.** Pick the thing in the chapter that is hardest to picture from text alone: something that moves, grows, waits, is passed along or changes state. Not a summary of the chapter.
- **Built from the chapter's own example.** Use the same names, data and code the chapter uses, so the walkthrough and the text explain each other. If the chapter has code, put the relevant lines (copied, trimmed if long, never changed in meaning) in `code` and highlight them with `lines`.
- **5 to 12 steps.** Each step changes something visible. The first sets the scene; the last says what was learned.
- **Plain, accurate words.** The reader is a beginner. British spelling. Define a term or don't use it. Each `text` is one to three short sentences explaining *why*, not just *what*. Never state a fact the chapter does not support; if unsure, leave it out.
- **Tones carry meaning**, used the same way everywhere: `active` = happening now, `compare` = being looked at or waiting, `found` = success or the result, `done` = finished, `bad` = an error or a rejected thing, `dim` = no longer relevant, `base` = ordinary.

Place the tag on its own line, with a blank line before and after, straight after the paragraph or code block it illustrates (never inside a list, table, `<Solution>` or code block). Big chapters may have two walkthroughs; most should have one.

## The file

```yaml
- id: http-request-response        # unique across the site, lower-case-with-hyphens
  title: One request, one response # shown as the heading
  hint: One sentence saying what to watch.
  language: HTTP                   # label over the code (Python, SQL, TypeScript, Shell…); omit with no code
  code: |                          # optional
    POST /orders HTTP/1.1
    Host: api.bakery.example
  steps:
    - title: Short step title
      text: One to three sentences.
      lines: [1]                   # optional: code lines to highlight, counting from 1
      vars: { method: POST }       # optional: "Values right now"; carried forward; {} clears
      parts:                       # the picture; carried forward to later steps
        - { kind: seq, id: s, actors: [App, Server], messages: [...] }
```

**Parts carry forward.** A step only lists the parts that change. A part with the same `id` as an earlier one replaces it completely (repeat every field). `{ id: x, remove: true }` removes one. Parts are drawn top to bottom in the order first added.

Instead of `steps`, a lesson may have `examples: [{ label, code?, steps }]` to let the reader switch between versions of the story (good for "with and without", "LEFT vs INNER").

Quote any text containing `: `, `#`, `{`, `[`, or starting with a special character: `text: "Status: 200"`.

## Picture parts

The picture is 640 units wide. Text that does not fit fails the tests (`npx vitest run tests/walkthrough.test.ts` names the step and the text). Sizes below are the room you have.

### `seq`: messages between actors

For requests, protocols, handshakes, queues, anything passed between parties.

```yaml
- kind: seq
  id: s
  actors: [Browser, "DNS", Server]           # 2 to 5; short names (about 70 / n characters each)
  slots: 6                                   # room for this many messages, so the picture does not grow
  messages:
    - { from: Browser, to: DNS, label: "where is shop.example?", tone: active }
    - { from: Server, to: Server, label: "check password" }     # to itself
```

Messages accumulate: each step repeats the earlier ones (usually with `tone: dim`) and adds the new one. Label room is about the distance between the two actors (roughly 48 characters with two actors, 34 between neighbours with three, 27 with four, 22 with five).

### `graph`: boxes and arrows

For architectures, dependency graphs, Git commits, trees, networks, pipelines, state machines.

```yaml
- kind: graph
  id: g
  height: 240                       # 160 to 320
  nodes:
    - { label: main, x: 0, y: 0.5, tone: active, note: "HEAD" }   # x, y from 0 to 1; note is a small tag under it
    - { k: c2, label: "c2: add menu", x: 0.5, y: 0.5 }            # k is the identity; defaults to label
  edges:
    - { a: main, b: c2, directed: true, label: "points to", tone: active }
```

Nodes are pills about `20 + 8.4 × characters` units wide; the tests reject nodes that stick out or overlap. Keep labels under 16 characters and spread nodes out (x from 0 to 1 spans about 520 units; y spans height − 60). Give a node `k` if its label changes between steps but it is the same thing, so it stays put.

### `kv`: names pointing at values

For variables, memory, settings, environment variables, headers, a cache's contents, a token's claims.

```yaml
- kind: kv
  id: mem
  label: "Names Python knows"
  slots: 4
  rows:
    - { name: price, value: "50", tone: active }     # name up to 20 characters, value up to 40
```

### `terminal`: commands and output

```yaml
- kind: terminal
  id: t
  slots: 5
  lines: ["$ git status", "On branch main", "nothing to commit"]   # up to 74 characters each; "$ ", "> " and ">>> " lines are shown as commands
```

### `cells`: a row of boxes, bars or a pile

For arrays, lists, queues, stacks, bytes, tokens, a buffer, histograms.

```yaml
- kind: cells
  id: a
  label: "tokens"
  items: [The, " cat", " sat"]      # or { k, v, tone } to set the colour or keep identity when values repeat
  slots: 6                          # boxes to leave room for
  width: 90                         # widest a box may be (default 56): about width / 8.4 characters
  indices: true                     # 0, 1, 2 under the boxes
  bars: true                        # bars sized by value (numbers only)
  orient: column                    # a vertical pile (stacks); up to 16 characters
  pointers: [{ name: i, at: 2 }]    # an arrow under box 2
  empty: "empty"                    # shown with no items
```

### `tables`: rows and columns

For SQL, data frames, spreadsheets, routing tables. Up to 3 tables side by side.

```yaml
- kind: tables
  id: t
  slots: 4
  tables:
    - id: c
      title: customers
      columns: [id, name]
      rows: [[1, Ama], { cells: [2, Kofi], tone: active }]   # null shows as NULL
```

A cell has room for about `(600 / tables / columns − 10) / 7.6` characters: 38 with one table of two columns, 9 with two tables of four.

### `note`: one line of text

```yaml
- { kind: note, id: n, text: '"cat" → 312 → % 5 = 2', tone: active }   # up to 74 characters
```

### `buckets`

Rows of chains, as in a hash table. Rarely needed outside one.

## Check

```bash
npx vitest run tests/walkthrough.test.ts
```

It checks every file parses, every step's text fits, nodes don't overlap, messages name real actors, highlighted lines exist, ids are unique and each walkthrough is used once in its own chapter. Then look at it: `npm run dev` and open the chapter.
