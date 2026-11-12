// Adds an editable live preview to the HTML, CSS and JavaScript examples in a chapter.
//
// - Code blocks inside <Playground> are one example: the HTML, CSS and JavaScript
//   are combined into one page, and the preview is shown straight away.
// - An HTML block on its own gets a "Show the result" button.
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
  timer = 0;
  resized = false;
  escaped = false;

  constructor(pres: HTMLElement[], public anchor: HTMLElement, immediate: boolean) {
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
    // Once someone drags the frame's corner, stop resizing it for them.
    this.frame.addEventListener('pointerdown', () => (this.resized = true));
    this.output.className = 'playground-console';
    this.output.setAttribute('role', 'log');
    this.output.setAttribute('aria-label', 'Messages from the example');
    this.output.hidden = true;
    this.bar.append(...(immediate ? [] : [this.show]), this.edit, this.reset);
    box.append(this.bar, this.frame, this.output);
    anchor.after(box);
    this.show.addEventListener('click', () => {
      this.frame.hidden = false;
      this.show.remove();
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
    if (this.frame.hidden) return;
    this.output.textContent = '';
    this.output.hidden = true;
    this.frame.srcdoc = buildDocument(this.sources(), this.id);
  }

  later() {
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
    const line = document.createElement('div');
    line.className = `playground-line ${level}`;
    line.textContent = (level === 'error' ? 'Error: ' : '') + text;
    this.output.appendChild(line);
  }

  openEditors() {
    for (const b of this.blocks) {
      const t = document.createElement('textarea');
      t.className = 'runner-editor';
      t.value = b.original;
      t.spellcheck = false;
      t.setAttribute('autocapitalize', 'off');
      t.setAttribute('aria-label', `${b.lang.toUpperCase()} you can change; the result updates as you type. To leave with the keyboard, press Escape and then Tab.`);
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
    if (this.frame.hidden) this.show.click();
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
  else g.log(String(d.level), String(d.text));
});

// Examples grouped with <Playground>.
for (const wrap of Array.from(document.querySelectorAll<HTMLElement>('[data-playground]'))) {
  const pres = Array.from(wrap.querySelectorAll<HTMLElement>('pre[data-language]'));
  if (pres.length) new Group(pres, wrap, true);
}
// HTML examples on their own.
for (const pre of Array.from(document.querySelectorAll<HTMLElement>('.body pre[data-language="html"]'))) {
  if (pre.closest('[data-playground]')) continue;
  new Group([pre], pre.closest<HTMLElement>('.codewrap') ?? pre, false);
}
