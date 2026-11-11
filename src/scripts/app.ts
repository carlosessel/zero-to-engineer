// Runs on every page. Everything it touches is optional: a page without a
// quiz, a sidebar or a "done" button simply skips that part.
import * as P from '../lib/progress';

const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);

const memory = new Map<string, string>();
const fallback: P.StorageLike = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => void memory.set(k, v),
  removeItem: (k) => void memory.delete(k),
};
function storage(): P.StorageLike {
  try {
    const s = window.localStorage;
    s.getItem(P.STORAGE_KEY);
    return s;
  } catch {
    return fallback;
  }
}
const store = storage();
let progress = P.load(store);

function save() {
  const ok = P.save(store, progress) && store !== fallback;
  const warn = $('#saveWarn');
  if (warn) warn.hidden = ok;
}

// ---------- painting progress onto the page ----------
function paint() {
  for (const link of $$('[data-nav-chapter]')) {
    const done = !!progress.done[link.dataset.navChapter!];
    link.classList.toggle('done', done);
    const tick = $('.tick', link);
    if (tick) tick.hidden = !done;
  }
  for (const meter of $$('[data-meter]')) {
    const { done, total } = P.countDone(progress, meter.dataset.meter!.split(' '));
    const bar = $('.bar i', meter);
    const text = $('span', meter);
    if (bar) bar.style.width = `${(100 * done) / total}%`;
    if (text) text.textContent = `${done} of ${total} chapters done`;
  }
  for (const btn of $$<HTMLButtonElement>('[data-done]')) {
    const done = !!progress.done[btn.dataset.done!];
    const undo = $<HTMLButtonElement>(`[data-undone="${btn.dataset.done}"]`);
    if (undo) undo.hidden = !done;
    if (!btn.dataset.label) btn.dataset.label = btn.textContent!.trim();
    btn.textContent = done ? (btn.dataset.next ? 'Done. Continue' : 'Done') : btn.dataset.label;
  }
  const resume = $<HTMLAnchorElement>('[data-resume]');
  if (resume) {
    const pairs = resume.dataset.resume!.split(' ').map((p) => p.split('='));
    const firstOpen = pairs.find(([id]) => !progress.done[id]);
    const started = pairs.some(([id]) => progress.done[id]);
    if (started && firstOpen) {
      resume.href = firstOpen[1];
      resume.textContent = `Continue at chapter ${pairs.indexOf(firstOpen) + 1}`;
    }
  }
}

// ---------- done buttons ----------
for (const btn of $$<HTMLButtonElement>('[data-done]')) {
  btn.addEventListener('click', () => {
    P.setDone(progress, btn.dataset.done!, true);
    save();
    paint();
    if (btn.dataset.next) window.location.href = btn.dataset.next;
  });
}
for (const btn of $$<HTMLButtonElement>('[data-undone]')) {
  btn.addEventListener('click', () => {
    P.setDone(progress, btn.dataset.undone!, false);
    save();
    paint();
  });
}

// ---------- exercise checkboxes ----------
for (const box of $$<HTMLInputElement>('input[data-check]')) {
  const [chapter, key] = box.dataset.check!.split('/');
  box.checked = P.isChecked(progress, chapter, key);
  box.addEventListener('change', () => {
    P.setCheck(progress, chapter, key, box.checked);
    save();
  });
}

// ---------- quizzes ----------
function showAnswer(q: HTMLElement, chosen: number) {
  const answer = Number(q.dataset.answer);
  for (const b of $$<HTMLButtonElement>('button[data-o]', q)) {
    const i = Number(b.dataset.o);
    b.classList.remove('right', 'wrong');
    b.removeAttribute('aria-pressed');
    if (i === chosen) {
      b.classList.add(chosen === answer ? 'right' : 'wrong');
      b.setAttribute('aria-pressed', 'true');
    }
    if (chosen !== answer && i === answer) b.classList.add('right');
  }
  const why = $('.why', q);
  if (why) {
    why.hidden = false;
    why.textContent = (chosen === answer ? 'Correct. ' : 'Not quite. ') + why.dataset.why;
  }
}
for (const quiz of $$('[data-quiz]')) {
  const chapter = quiz.dataset.quiz!;
  for (const q of $$('.q', quiz)) {
    const qi = Number(q.dataset.q);
    const stored = progress.quiz[chapter]?.[qi];
    if (typeof stored === 'number') showAnswer(q, stored);
    for (const b of $$<HTMLButtonElement>('button[data-o]', q)) {
      b.addEventListener('click', () => {
        const chosen = Number(b.dataset.o);
        showAnswer(q, chosen);
        P.setAnswer(progress, chapter, qi, chosen);
        save();
      });
    }
  }
}

// ---------- copy buttons on code ----------
for (const pre of $$('article pre')) {
  const wrap = document.createElement('div');
  wrap.className = 'codewrap';
  pre.replaceWith(wrap);
  wrap.appendChild(pre);
  pre.tabIndex = 0; // so keyboard users can scroll wide code
  const b = document.createElement('button');
  b.className = 'copy';
  b.type = 'button';
  b.textContent = 'Copy';
  b.setAttribute('aria-label', 'Copy this code');
  b.addEventListener('click', () => {
    const done = () => {
      b.textContent = 'Copied';
      setTimeout(() => (b.textContent = 'Copy'), 1200);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(pre.textContent ?? '').then(done, () => (b.textContent = 'Select and copy'));
    else b.textContent = 'Select and copy';
  });
  wrap.appendChild(b);
}

// ---------- chapter menu on small screens ----------
const menuBtn = $<HTMLButtonElement>('#menuBtn');
const side = $('#side');
if (menuBtn && side) {
  const setOpen = (open: boolean) => {
    side.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Chapters';
  };
  menuBtn.addEventListener('click', () => setOpen(!side.classList.contains('open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && side.classList.contains('open')) {
      setOpen(false);
      menuBtn.focus();
    }
  });
  const current = $('[aria-current="page"]', side);
  if (current && getComputedStyle(side).position === 'sticky') current.scrollIntoView({ block: 'center' });
}

// ---------- theme ----------
const THEMES = ['auto', 'light', 'dark'] as const;
function theme(): (typeof THEMES)[number] {
  const t = document.documentElement.dataset.theme;
  return t === 'light' || t === 'dark' ? t : 'auto';
}
function paintTheme() {
  for (const b of $$('[data-theme-toggle]')) b.textContent = `Theme: ${theme()}`;
}
for (const b of $$('[data-theme-toggle]')) {
  b.addEventListener('click', () => {
    const next = THEMES[(THEMES.indexOf(theme()) + 1) % THEMES.length];
    if (next === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
    try {
      if (next === 'auto') localStorage.removeItem('zte-theme');
      else localStorage.setItem('zte-theme', next);
    } catch {
      /* the choice just will not be remembered */
    }
    paintTheme();
  });
}
paintTheme();

// ---------- the progress page ----------
const msg = $('#progressMsg');
function say(text: string) {
  if (msg) {
    msg.hidden = false;
    msg.textContent = text;
  }
}
$('#exportBtn')?.addEventListener('click', () => {
  const blob = new Blob([P.exportJson(progress)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `zero-to-engineer-progress-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  say('Downloaded. Keep the file somewhere safe.');
});
const importFile = $<HTMLInputElement>('#importFile');
const importBtn = $<HTMLButtonElement>('#importBtn');
if (importFile && importBtn) {
  importFile.addEventListener('change', () => (importBtn.disabled = !importFile.files?.length));
  importBtn.addEventListener('click', async () => {
    const file = importFile.files?.[0];
    if (!file) return;
    const result = P.importJson(await file.text());
    if (!result.ok) return say(`Nothing was changed. ${result.error}`);
    progress = result.progress;
    save();
    paint();
    const n = Object.keys(progress.done).length;
    say(`Restored: ${n} finished ${n === 1 ? 'chapter' : 'chapters'}, ${Object.keys(progress.checks).length} ticked exercises.`);
  });
}
const resetBtn = $<HTMLButtonElement>('#resetBtn');
if (resetBtn) {
  let armed = false;
  resetBtn.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      resetBtn.textContent = 'Press again to erase everything';
      setTimeout(() => {
        armed = false;
        resetBtn.textContent = 'Erase my progress';
      }, 4000);
      return;
    }
    P.clear(store);
    progress = P.empty();
    armed = false;
    resetBtn.textContent = 'Erase my progress';
    paint();
    say('Your progress has been erased.');
  });
}

paint();
