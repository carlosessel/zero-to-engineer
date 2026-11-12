// Adds an editable live preview to the HTML, CSS and JavaScript examples in a chapter.
//
// - Code blocks inside <Playground> are one example: the HTML, CSS and JavaScript
//   are combined into one page, and the preview is shown straight away.
// - An HTML block on its own gets a "Show the result" button.
// - A JavaScript or TypeScript block on its own gets a "Run" button that shows what it prints.
// - A React (JSX or TSX) block that exports a component, or shows one with createRoot,
//   gets a "Show the result" button. See src/lib/react-preview.ts for how it runs.
// The preview is a sandboxed frame: its code cannot read this site's storage or
// your progress, and nothing is sent anywhere.
import { buildDocument, webNewline, type ReactPart, type Sources } from '../lib/playground';
import { compile, syntaxMessage, type Transform } from '../lib/react-preview';

type Lang = 'html' | 'css' | 'js' | 'ts' | 'jsx' | 'tsx';
const LANG: Record<string, Lang> = { html: 'html', css: 'css', js: 'js', javascript: 'js', ts: 'ts', typescript: 'ts', jsx: 'jsx', tsx: 'tsx' };
const NAME: Record<Lang, string> = { html: 'HTML', css: 'CSS', js: 'JavaScript', ts: 'TypeScript', jsx: 'React code', tsx: 'React code' };

// Sucrase (which turns JSX and TypeScript into JavaScript) is loaded only when first needed.
let sucrase: Promise<Transform> | null = null;
const transformer = () => (sucrase ??= import('sucrase').then((m) => m.transform as unknown as Transform));
const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
const runtimeUrl = () => new URL(`${base}vendor/react-runtime.js`, location.href).href;
// In development the libraries go inline (see reactScripts); fetched once per page.
let runtimeCode: Promise<string | undefined> | null = null;
const devRuntime = () =>
  (runtimeCode ??= import.meta.env.DEV ? fetch(runtimeUrl()).then((r) => r.text()) : Promise.resolve(undefined));
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
      this.tried();
      this.frame.hidden = false;
      this.active = true;
      this.show.remove();
      this.render();
    });
    // JavaScript on its own runs in a frame that is never shown; only its output is.
    this.run.addEventListener('click', () => {
      this.tried();
      this.active = true;
      this.render();
    });
    this.edit.addEventListener('click', () => this.openEditors());
    this.reset.addEventListener('click', () => this.closeEditors());
    groups.set(this.id, this);
    if (immediate) this.render();
  }

  /** Tells the points system that a person ran or showed this example. */
  tried() {
    const pre = this.blocks[this.blocks.length - 1]?.pre;
    if (pre) document.dispatchEvent(new CustomEvent('zte:tried', { detail: { pre } }));
  }

  rendering = 0;

  async render() {
    if (!this.active) return;
    const turn = ++this.rendering;
    this.output.textContent = '';
    this.output.hidden = true;
    this.printed = false;
    const s: Sources = { html: '', css: '', js: '' };
    let react: ReactPart | undefined;
    const add = (key: keyof Sources, code: string) => (s[key] += (s[key] ? '\n' : '') + code);
    for (const b of this.blocks) {
      const code = b.editor ? b.editor.value : b.original;
      if (b.lang === 'html' || b.lang === 'css' || b.lang === 'js') { add(b.lang, code); continue; }
      let transform: Transform;
      try {
        transform = await transformer();
      } catch {
        this.log('uncaught', 'The tool that runs this example did not load. Check your connection and reload the page.');
        return;
      }
      try {
        if (b.lang === 'ts') add('js', transform(code, { transforms: ['typescript'] }).code);
        else react = { compiled: compile(code, b.lang, transform), runtimeUrl: runtimeUrl(), runtimeCode: await devRuntime() };
      } catch (e) {
        if (turn === this.rendering) this.log('uncaught', syntaxMessage(e));
        return;
      }
    }
    // Someone typed again while this was being prepared: the newer version wins.
    if (turn !== this.rendering) return;
    this.frame.srcdoc = buildDocument(s, this.id, react);
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
    this.tried();
    for (const b of this.blocks) {
      const t = document.createElement('textarea');
      t.className = 'runner-editor';
      t.value = b.original;
      t.spellcheck = false;
      t.setAttribute('autocapitalize', 'off');
      t.setAttribute('aria-label', this.mode === 'run'
        ? `${NAME[b.lang]} you can change. Press Run, or Control and Enter, to run it. To leave with the keyboard, press Escape and then Tab.`
        : `${NAME[b.lang]} you can change; the result updates as you type. To leave with the keyboard, press Escape and then Tab.`);
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
function note(anchor: HTMLElement, text: string) {
  const p = document.createElement('p');
  p.className = 'hint runner-note';
  p.textContent = text;
  anchor.after(p);
}

// JavaScript and TypeScript examples on their own.
for (const pre of Array.from(document.querySelectorAll<HTMLElement>('.body pre[data-language="js"], .body pre[data-language="javascript"], .body pre[data-language="ts"], .body pre[data-language="typescript"]'))) {
  if (pre.closest('[data-playground]')) continue;
  const anchor = pre.closest<HTMLElement>('.codewrap') ?? pre;
  // Code with import or export is a module: it needs separate files, so it cannot run on its own here.
  if (/^\s*(import|export)\s/m.test(pre.textContent ?? '')) {
    note(anchor, 'This example uses import or export, so it needs its own files. Run it with Node or Vite as the chapter describes.');
    continue;
  }
  new Group([pre], anchor, 'run');
  if (LANG[pre.dataset.language ?? ''] === 'ts') note(anchor, 'Run removes the types and runs the JavaScript that is left. It does not check the types: your editor and tsc do that.');
}

// React examples on their own: only a whole component file can be shown.
for (const pre of Array.from(document.querySelectorAll<HTMLElement>('.body pre[data-language="jsx"], .body pre[data-language="tsx"]'))) {
  if (pre.closest('[data-playground]')) continue;
  const code = pre.textContent ?? '';
  if (!/^\s*export\s+default\b|\bcreateRoot\s*\(/m.test(code)) continue;
  new Group([pre], pre.closest<HTMLElement>('.codewrap') ?? pre, 'show');
}
