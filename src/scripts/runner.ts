// Adds "Run" and "Edit" to the Python examples in a chapter.
import { hintFor, newlineIndent, whyNotRunnable } from '../lib/runnable';

interface Done { type: 'done'; id: number; status: 'ok' | 'input' | 'error' | 'failed'; prompt?: string; traceback?: string; kind?: string; message?: string }
type Message = Done | { type: 'out'; text: string } | { type: 'status'; id: number; text: string };

let worker: Worker | null = null;
let nextId = 1;
let busy: Runner | null = null;
const runners: Runner[] = [];

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../runner/pyworker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<Message>) => busy?.receive(e.data);
    worker.onerror = () => busy?.finish('Python could not be loaded. Check your connection and try again.');
  }
  return worker;
}

function button(text: string, cls = 'btn ghost'): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = cls;
  b.textContent = text;
  return b;
}

class Runner {
  original: string;
  editor: HTMLTextAreaElement | null = null;
  bar = document.createElement('div');
  run = button('Run', 'btn');
  edit = button('Edit');
  reset = button('Reset');
  stop = button('Stop');
  status = document.createElement('span');
  out = document.createElement('pre');
  ask = document.createElement('form');
  answers: string[] = [];
  seed = 0;
  id = 0;
  escaped = false;

  /** The code block as shown: its wrapper once the Copy button has been added, else the block itself. */
  get shown(): HTMLElement {
    return this.pre.closest<HTMLElement>('.codewrap') ?? this.pre;
  }

  constructor(public pre: HTMLElement, wrap: HTMLElement) {
    this.original = pre.textContent ?? '';
    this.bar.className = 'runner-bar';
    this.status.className = 'hint';
    this.status.setAttribute('role', 'status');
    this.out.className = 'runner-out';
    this.out.hidden = true;
    this.out.tabIndex = 0;
    this.out.setAttribute('aria-label', 'Output');
    this.ask.className = 'runner-ask';
    this.ask.hidden = true;
    this.reset.hidden = true;
    this.stop.hidden = true;
    this.bar.append(this.run, this.edit, this.reset, this.stop, this.status);
    const box = document.createElement('div');
    box.className = 'runner';
    wrap.after(box);
    box.append(this.bar, this.out, this.ask);

    this.run.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('zte:tried', { detail: { pre: this.pre } }));
      this.start(true);
    });
    this.stop.addEventListener('click', () => this.halt());
    this.edit.addEventListener('click', () => this.openEditor());
    this.reset.addEventListener('click', () => this.closeEditor());
  }

  code(): string {
    return this.editor ? this.editor.value : this.original;
  }

  openEditor() {
    if (this.editor) return this.editor.focus();
    const t = document.createElement('textarea');
    t.className = 'runner-editor';
    t.value = this.original;
    t.spellcheck = false;
    t.setAttribute('autocapitalize', 'off');
    t.setAttribute('autocorrect', 'off');
    t.setAttribute('aria-label', 'Python code you can change. Press Control and Enter to run it. To leave with the keyboard, press Escape and then Tab.');
    t.rows = Math.max(3, this.original.split('\n').length + 1);
    t.addEventListener('keydown', (e) => this.key(e));
    this.shown.hidden = true;
    this.shown.before(t);
    this.editor = t;
    this.edit.hidden = true;
    this.reset.hidden = false;
    this.status.textContent = 'Change the code, then press Run.';
    t.focus();
  }

  closeEditor() {
    this.editor?.remove();
    this.editor = null;
    this.shown.hidden = false;
    this.edit.hidden = false;
    this.reset.hidden = true;
    this.out.hidden = true;
    this.ask.hidden = true;
    this.status.textContent = '';
  }

  key(e: KeyboardEvent) {
    const t = this.editor!;
    const insert = (text: string) => {
      t.setRangeText(text, t.selectionStart, t.selectionEnd, 'end');
      t.rows = Math.max(t.rows, t.value.split('\n').length + 1);
    };
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.start(true);
    } else if (e.key === 'Escape') {
      this.escaped = true; // the next Tab leaves the editor instead of indenting
      return;
    } else if (e.key === 'Tab' && !e.shiftKey && !this.escaped && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      insert('    ');
    } else if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      insert(newlineIndent(t.value.slice(0, t.selectionStart)));
    }
    this.escaped = false;
  }

  start(fresh: boolean) {
    if (busy) return;
    if (fresh) {
      this.answers = [];
      this.seed = Math.floor(Math.random() * 2 ** 31);
    }
    busy = this;
    this.id = nextId++;
    this.out.textContent = '';
    this.out.hidden = false;
    this.ask.hidden = true;
    this.stop.hidden = false;
    for (const r of runners) r.run.disabled = true;
    if (!worker) this.status.textContent = 'Loading Python. The first time, this downloads about 10 MB from cdn.jsdelivr.net…';
    getWorker().postMessage({ id: this.id, code: this.code(), answers: this.answers, seed: this.seed });
  }

  receive(m: Message) {
    if (m.type === 'out') this.out.textContent += m.text;
    else if (m.type === 'status' && m.id === this.id) this.status.textContent = m.text;
    else if (m.type === 'done' && m.id === this.id) {
      if (m.status === 'input') return this.needInput(m.prompt ?? '');
      if (m.status === 'error') {
        this.out.textContent += m.traceback;
        this.finish(['The program stopped with an error. Read the last line first.', hintFor(m.kind)].filter(Boolean).join(' '));
      } else if (m.status === 'failed') this.finish(`Python could not run this: ${m.message}`);
      else this.finish(this.out.textContent ? 'Finished.' : 'Finished. The program printed nothing.');
    }
  }

  needInput(prompt: string) {
    this.release();
    this.status.textContent = 'The program is waiting for you to type something.';
    this.ask.textContent = '';
    const label = document.createElement('label');
    label.textContent = prompt.trim() || 'Your answer';
    const input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    label.append(' ', input);
    const send = button('Enter', 'btn');
    send.type = 'submit';
    this.ask.append(label, send);
    this.ask.hidden = false;
    this.ask.onsubmit = (e) => {
      e.preventDefault();
      this.answers.push(input.value);
      this.start(false);
    };
    input.focus();
  }

  release() {
    busy = null;
    this.stop.hidden = true;
    for (const r of runners) r.run.disabled = false;
  }

  finish(text: string) {
    this.release();
    this.status.textContent = text;
  }

  halt() {
    worker?.terminate();
    worker = null;
    this.finish('Stopped. Python will start afresh next time, so earlier examples on this page need running again.');
  }
}

for (const pre of Array.from(document.querySelectorAll<HTMLElement>('.body pre[data-language="python"]'))) {
  const wrap = pre.closest<HTMLElement>('.codewrap') ?? pre;
  const why = whyNotRunnable(pre.textContent ?? '');
  if (why) {
    const note = document.createElement('p');
    note.className = 'hint runner-note';
    note.textContent = why;
    wrap.after(note);
  } else {
    runners.push(new Runner(pre, wrap));
  }
}
