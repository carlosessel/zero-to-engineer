// Search uses Pagefind: an index built from the finished site, loaded in
// small pieces by the browser. Nothing is sent to a server.
import { isRelevant, markedWords } from '../lib/search';
import { $ } from './store';

const form = $<HTMLFormElement>('#searchForm')!;
const input = $<HTMLInputElement>('#searchQ')!;
const status = $('#searchStatus')!;
const list = $('#searchResults')!;
const MAX = 30; // shown
const CONSIDER = 80; // loaded and filtered (the whole site is smaller than this)

interface Hit { url: string; excerpt: string; meta: { title?: string; course?: string } }
interface Pagefind {
  options(o: Record<string, unknown>): Promise<void>;
  debouncedSearch(q: string, o?: unknown, ms?: number): Promise<{ results: { data(): Promise<Hit> }[] } | null>;
}
let engine: Promise<Pagefind> | null = null;
function load(): Promise<Pagefind> {
  engine ??= import(/* @vite-ignore */ form.dataset.pagefind!).then(async (pf: Pagefind) => {
    await pf.options({ baseUrl: form.dataset.base });
    return pf;
  });
  return engine;
}

async function run() {
  const q = input.value.trim();
  history.replaceState(null, '', q ? `?q=${encodeURIComponent(q)}` : location.pathname);
  if (!q) {
    list.textContent = '';
    status.textContent = '';
    return;
  }
  let pf: Pagefind;
  try {
    pf = await load();
  } catch {
    status.textContent = 'Search is not available here. It is built with the finished site: run "npm run build" and then "npm run preview".';
    return;
  }
  const found = await pf.debouncedSearch(q, {}, 200);
  if (!found) return; // a newer search has replaced this one
  const all = await Promise.all(found.results.slice(0, CONSIDER).map((r) => r.data()));
  if (input.value.trim() !== q) return;
  const relevant = all.filter((hit) => isRelevant(q, markedWords(hit.excerpt)));
  const hits = relevant.slice(0, MAX);
  list.textContent = '';
  const n = relevant.length;
  status.textContent = n === 0 ? `Nothing found for "${q}".` : `${n} ${n === 1 ? 'page' : 'pages'} found${n > MAX ? `; showing the first ${MAX}` : ''}.`;
  for (const hit of hits) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = hit.url;
    a.textContent = hit.meta.title ?? hit.url;
    li.appendChild(a);
    if (hit.meta.course) {
      const c = document.createElement('span');
      c.className = 'hint';
      c.textContent = ` · ${hit.meta.course}`;
      li.appendChild(c);
    }
    const p = document.createElement('p');
    // Pagefind's excerpt is the page's own text, escaped, with <mark> around the matches.
    p.innerHTML = hit.excerpt;
    li.appendChild(p);
    list.appendChild(li);
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  run();
});
input.addEventListener('input', run);
const initial = new URLSearchParams(location.search).get('q');
if (initial) {
  input.value = initial;
  run();
}
