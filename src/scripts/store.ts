// The learner's progress, shared by every script on a page.
import * as P from '../lib/progress';
import { dayOf } from '../lib/review';

const memory = new Map<string, string>();
const fallback: P.StorageLike = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => void memory.set(k, v),
  removeItem: (k) => void memory.delete(k),
};
function pick(): P.StorageLike {
  try {
    const s = window.localStorage;
    s.getItem(P.STORAGE_KEY);
    return s;
  } catch {
    return fallback;
  }
}

export const storage = pick();
export const state = { progress: P.load(storage) };

/** Saves, and shows the warning banner if the browser would not keep it. */
export function save(): void {
  const ok = P.save(storage, state.progress) && storage !== fallback;
  const warn = document.querySelector<HTMLElement>('#saveWarn');
  if (warn) warn.hidden = ok;
  document.dispatchEvent(new CustomEvent('zte:progress'));
}

export function today(): string {
  return dayOf(new Date());
}

export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));
export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);

export function download(filename: string, text: string, type: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
