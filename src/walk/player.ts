// Brings a <Walkthrough> on the page to life: Back, Next, Play, the step
// slider, the example picker and the arrow keys. The page is built with the
// first step already drawn, so without JavaScript the learner still sees it.
import { LESSONS } from './index';
import { renderFrame, stageHeight, WIDTH } from './render';
import type { Frame, Lesson } from './types';
import { renderCode } from './render';

const SVG_NS = 'http://www.w3.org/2000/svg';
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * Updates the picture in place. Elements whose data-k key is in both the old
 * and new picture are kept and given the new position and contents, so CSS
 * transitions move them smoothly; the rest are added or removed.
 */
export function morph(svg: SVGSVGElement, body: string, height: number): void {
  svg.setAttribute('viewBox', `0 0 ${WIDTH} ${height}`);
  const tmp = document.createElementNS(SVG_NS, 'svg');
  tmp.innerHTML = body;
  const old = new Map<string, Element>();
  for (const el of Array.from(svg.children)) {
    const k = el.getAttribute('data-k');
    if (k) old.set(k, el);
    else el.remove();
  }
  const kept = new Set<Element>();
  let prev: Element | null = null;
  for (const fresh of Array.from(tmp.children)) {
    const k = fresh.getAttribute('data-k');
    const match = k ? old.get(k) : undefined;
    let el: Element;
    if (match) {
      for (const a of Array.from(match.attributes)) if (!fresh.hasAttribute(a.name)) match.removeAttribute(a.name);
      for (const a of Array.from(fresh.attributes)) if (match.getAttribute(a.name) !== a.value) match.setAttribute(a.name, a.value);
      if (match.innerHTML !== fresh.innerHTML) match.innerHTML = fresh.innerHTML;
      el = match;
    } else {
      el = fresh;
      el.classList.add('wk-enter');
    }
    kept.add(el);
    // Keep drawing order without moving elements that are already in place
    // (moving a node in the DOM would cancel its transition).
    const want: ChildNode | null = prev ? prev.nextSibling : svg.firstChild;
    if (el !== want) svg.insertBefore(el, want);
    prev = el;
  }
  for (const el of old.values()) if (!kept.has(el)) el.remove();
  requestAnimationFrame(() => svg.querySelectorAll('.wk-enter').forEach((e) => e.classList.remove('wk-enter')));
}

function setup(root: HTMLElement, lesson: Lesson): void {
  const $ = <T extends Element>(s: string) => root.querySelector(s) as T;
  const svg = $<SVGSVGElement>('.wk-svg');
  const title = $<HTMLElement>('.wk-step-title');
  const text = $<HTMLElement>('.wk-text');
  const count = $<HTMLElement>('.wk-count');
  const back = $<HTMLButtonElement>('[data-wk=back]');
  const next = $<HTMLButtonElement>('[data-wk=next]');
  const play = $<HTMLButtonElement>('[data-wk=play]');
  const slider = $<HTMLInputElement>('.wk-slider');
  const code = $<HTMLElement>('.wk-code code');
  const codebox = $<HTMLElement>('.wk-codebox');
  const detail = $<HTMLElement>('.wk-detail');
  const vars = $<HTMLElement>('.wk-vars');
  const picker = root.querySelector<HTMLSelectElement>('.wk-example');

  let frames: Frame[] = [];
  let height = 0;
  let i = 0;
  let timer: number | undefined;

  const show = (n: number) => {
    i = Math.max(0, Math.min(frames.length - 1, n));
    const f = frames[i];
    morph(svg, renderFrame(f).body, height);
    title.textContent = f.title;
    text.textContent = f.text;
    count.textContent = `Step ${i + 1} of ${frames.length}`;
    slider.value = String(i);
    slider.setAttribute('aria-valuetext', `Step ${i + 1} of ${frames.length}: ${f.title}`);
    back.disabled = i === 0;
    next.disabled = i === frames.length - 1;
    const lines = new Set(f.lines ?? []);
    code.querySelectorAll<HTMLElement>('.wk-line').forEach((l) => l.classList.toggle('on', lines.has(Number(l.dataset.line))));
    vars.replaceChildren(...Object.entries(f.vars ?? {}).flatMap(([k, v]) => {
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = String(v);
      return [dt, dd];
    }));
    if (i === frames.length - 1) stop();
  };
  const stop = () => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
    play.textContent = 'Play';
    play.setAttribute('aria-pressed', 'false');
  };
  const start = () => {
    if (i === frames.length - 1) show(0);
    play.textContent = 'Pause';
    play.setAttribute('aria-pressed', 'true');
    timer = window.setInterval(() => show(i + 1), reduceMotion() ? 2600 : 1600);
  };
  const load = (example: number) => {
    stop();
    frames = lesson.frames(example);
    height = stageHeight(frames);
    slider.max = String(frames.length - 1);
    const src = lesson.code(example);
    code.innerHTML = renderCode(src);
    codebox.hidden = !src;
    detail.classList.toggle('wk-nocode', !src);
    // A new example draws from scratch: nothing should slide across from the old one.
    svg.replaceChildren();
    show(0);
  };

  back.addEventListener('click', () => { stop(); show(i - 1); });
  next.addEventListener('click', () => { stop(); show(i + 1); });
  play.addEventListener('click', () => (timer === undefined ? start() : stop()));
  slider.addEventListener('input', () => { stop(); show(Number(slider.value)); });
  picker?.addEventListener('change', () => load(Number(picker.value)));
  root.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (t.matches('input, select, textarea')) return;
    if (e.key === 'ArrowRight') { stop(); show(i + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { stop(); show(i - 1); e.preventDefault(); }
  });
  root.classList.add('wk-ready');
  load(0);
}

/** A lesson whose steps were written into the page (walkthrough.yaml lessons). */
function embedded(root: HTMLElement): Lesson | undefined {
  const el = root.querySelector('script.wk-data');
  if (!el?.textContent) return undefined;
  const data = JSON.parse(el.textContent) as { codes: string[]; frames: Frame[][] };
  return { id: root.dataset.walk!, title: '', hint: '', language: '', examples: [], code: (e) => data.codes[e] ?? '', frames: (e) => data.frames[e] ?? [] };
}

export function initWalkthroughs(): void {
  document.querySelectorAll<HTMLElement>('.walk[data-walk]:not(.wk-ready)').forEach((root) => {
    const lesson = embedded(root) ?? LESSONS[root.dataset.walk!];
    if (lesson) setup(root, lesson);
  });
}
