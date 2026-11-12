// Adds an editable live preview to the HTML, CSS and JavaScript examples in a chapter.
//
// - Code blocks inside <Playground> are one example: the HTML, CSS and JavaScript
//   are combined into one page, and the preview is shown straight away.
// - An HTML block on its own gets a "Show the result" button.
// - A JavaScript block on its own gets a "Run" button that shows what it prints.
// The preview is a sandboxed frame: its code cannot read this site's storage or
// your progress, and nothing is sent anywhere.
import { buildDocument, webNewline, type Sources } from '../lib/playground';

type Lang = keyof Sources;
const LANG: Record<string, Lang> = { html: 'html', css: 'css', js: 'js', javascript: 'js' };
let counter = 0;
const groups = new Map<string, Group>();

function button(text: string, cls = 'btn ghost'): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = cls;
  b.textContent = text;
  return b;
}

class Group {
  id = `pg${++counter}`;
  blocks: { pre: HTMLElement; lang: Lang; original: string; editor?: HTMLTextAreaElement }[] = [];
  frame = document.createElement('iframe');
  output = document.createElement('div');
  bar = document.createElement('div');
  edit = button('Edit');
  reset = button('Reset');
  show = button('Show the result', 'btn');
  run = button('Run', 'btn');
  active = false;
  printed = false;
  timer = 0;
  resized = false;
  escaped = false;

  /** live: shown at once and updated as you type; show: shown when asked; run: JavaScript only, output shown when run. */
  constructor(pres: HTMLElement[], public anchor: HTMLElement, public mode: 'live' | 'show' | 'run') {
    const immediate = mode === 'live';
    for (const pre of pres) {
      const lang = LANG[pre.dataset.language ?? ''];
      if (lang) this.blocks.push({ pre, lang, original: pre.textContent ?? '' });
    }
    this.bar.className = 'runner-bar';
    this.reset.hidden = true;
    const box = document.createElement('div');
    box.className = 'playground-result';
    this.frame.title = 'Result of the example';
    this.frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-modals');
    this.frame.hidden = !immediate;
    this.active = immediate;
    // Once someone drags the frame's corner, stop resizing it for them.
    this.frame.addEventListener('pointerdown', () => (this.resized = true));
    this.output.className = 'playground-console';
    this.output.setAttribute('role', 'log');
    this.output.setAttribute('aria-label', 'Messages from the example');
    this.output.hidden = true;
    const first = mode === 'run' ? [this.run] : mode === 'show' ? [this.show] : [];
    this.bar.append(...first, this.edit, this.reset);
    if (mode === 'run') this.output.setAttribute('aria-label', 'What the code printed');
    box.append(this.bar, this.frame, this.output);
    anchor.after(box);
    this.show.addEventListener('click', () => {
      this.frame.hidden = false;
      this.active = true;
      this.show.remove();
      this.render();
    });
    // JavaScript on its own runs in a frame that is never shown; only its output is.
    this.run.addEventListener('click', () => {
      this.active = true;
      this.render();
    });
    this.edit.addEventListener('click', () => this.openEditors());
    this.reset.addEventListener('click', () => this.closeEditors());
    groups.set(this.id, this);
    if (immediate) this.render();
  }

  sources(): Sources {
    const s: Sources = { html: '', css: '', js: '' };
    for (const b of this.blocks) s[b.lang] += (s[b.lang] ? '\n' : '') + (b.editor ? b.editor.value : b.original);
    return s;
  }

  render() {
    if (!this.active) return;
    this.output.textContent = '';
    this.output.hidden = true;
    this.printed = false;
    this.frame.srcdoc = buildDocument(this.sources(), this.id);
  }

  later() {
    if (this.mode === 'run') return; // run only when asked: half-typed code would only show errors
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.render(), 300);
  }

  /** Grows or shrinks the frame to its content, within limits; a person can still drag it bigger. */
  fit(height: number) {
    if (!Number.isFinite(height) || this.resized) return;
    this.frame.style.height = `${Math.min(Math.max(height + 4, 120), 640)}px`;
  }

  log(level: string, text: string) {
    this.output.hidden = false;
    this.printed = true;
    const line = document.createElement('div');
    line.className = `playground-line ${level === 'uncaught' ? 'error' : level}`;
    line.textContent = text;
    this.output.appendChild(line);
  }

  /** Called when the example's page has loaded: say so if a JavaScript example printed nothing. */
  loaded() {
    if (this.mode !== 'run') return;
    window.setTimeout(() => {
      if (this.printed) return;
      this.output.hidden = false;
      const line = document.createElement('div');
      line.className = 'playground-line hint';
      line.textContent = 'The code ran and printed nothing. Use console.log(…) to see a value.';
      this.output.appendChild(line);
    }, 300);
  }

  openEditors() {
    for (const b of this.blocks) {
      const t = document.createElement('textarea');
      t.className = 'runner-editor';
      t.value = b.original;
      t.spellcheck = false;
      t.setAttribute('autocapitalize', 'off');
      t.setAttribute('aria-label', this.mode === 'run'
        ? 'JavaScript you can change. Press Run, or Control and Enter, to run it. To leave with the keyboard, press Escape and then Tab.'
        : `${b.lang.toUpperCase()} you can change; the result updates as you type. To leave with the keyboard, press Escape and then Tab.`);
      t.rows = Math.max(3, b.original.split('\n').length + 1);
      t.addEventListener('input', () => this.later());
      t.addEventListener('keydown', (e) => this.key(e, t));
      const shown = b.pre.closest<HTMLElement>('.codewrap') ?? b.pre;
      shown.hidden = true;
      shown.before(t);
      b.editor = t;
    }
    this.edit.hidden = true;
    this.reset.hidden = false;
    if (this.mode === 'show' && this.frame.hidden) this.show.click();
    this.blocks[0]?.editor?.focus();
  }

  closeEditors() {
    for (const b of this.blocks) {
      b.editor?.remove();
      b.editor = undefined;
      (b.pre.closest<HTMLElement>('.codewrap') ?? b.pre).hidden = false;
    }
    this.edit.hidden = false;
    this.reset.hidden = true;
    this.render();
  }

  key(e: KeyboardEvent, t: HTMLTextAreaElement) {
    const insert = (text: string) => {
      t.setRangeText(text, t.selectionStart, t.selectionEnd, 'end');
      t.rows = Math.max(t.rows, t.value.split('\n').length + 1);
      this.later();
    };
    if (e.key === 'Escape') {
      this.escaped = true;
      return;
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.active = true;
      this.render();
      return;
    }
    if (e.key === 'Tab' && !e.shiftKey && !this.escaped && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      insert('  ');
    } else if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      insert(webNewline(t.value.slice(0, t.selectionStart)));
    }
    this.escaped = false;
  }
}

window.addEventListener('message', (e: MessageEvent) => {
  const d = e.data;
  if (!d || d.zte !== 'playground') return;
  const g = groups.get(d.id);
  // Only accept messages from that group's own frame.
  if (!g || e.source !== g.frame.contentWindow) return;
  if (d.level === 'size') g.fit(Number(d.text));
  else if (d.level === 'loaded') g.loaded();
  else g.log(String(d.level), String(d.text));
});

// Examples grouped with <Playground>.
for (const wrap of Array.from(document.querySelectorAll<HTMLElement>('[data-playground]'))) {
  const pres = Array.from(wrap.querySelectorAll<HTMLElement>('pre[data-language]'));
  if (pres.length) new Group(pres, wrap, 'live');
}
// HTML examples on their own.
for (const pre of Array.from(document.querySelectorAll<HTMLElement>('.body pre[data-language="html"]'))) {
  if (pre.closest('[data-playground]')) continue;
  new Group([pre], pre.closest<HTMLElement>('.codewrap') ?? pre, 'show');
}
// JavaScript examples on their own.
for (const pre of Array.from(document.querySelectorAll<HTMLElement>('.body pre[data-language="js"], .body pre[data-language="javascript"]'))) {
  if (pre.closest('[data-playground]')) continue;
  const anchor = pre.closest<HTMLElement>('.codewrap') ?? pre;
  // Code with import or export is a module: it needs separate files, so it cannot run on its own here.
  if (/^\s*(import|export)\s/m.test(pre.textContent ?? '')) {
    const note = document.createElement('p');
    note.className = 'hint runner-note';
    note.textContent = 'This example uses import or export, so it needs its own files. Run it with Node or Vite as the chapter describes.';
    anchor.after(note);
    continue;
  }
  new Group([pre], anchor, 'run');
}
