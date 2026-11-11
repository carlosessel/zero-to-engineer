// Checks that every link from a built page to another page or file on this
// site points at something that exists. Run after `npm run build`.
// Links to other sites are checked separately by lychee in CI.
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const DIST = 'dist';
const base = (process.env.SITE_BASE || '/').replace(/\/$/, '');
const pages = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) walk(full);
    else if (f.name.endsWith('.html')) pages.push(full);
  }
})(DIST);

const idCache = new Map();
function idsOf(file) {
  if (!idCache.has(file)) {
    const d = new JSDOM(fs.readFileSync(file, 'utf8')).window.document;
    idCache.set(file, new Set([...d.querySelectorAll('[id]')].map((e) => e.id)));
  }
  return idCache.get(file);
}

let links = 0;
const broken = [];
for (const page of pages) {
  const doc = new JSDOM(fs.readFileSync(page, 'utf8')).window.document;
  const ids = new Set([...doc.querySelectorAll('[id]')].map((e) => e.id));
  for (const el of doc.querySelectorAll('a[href], link[href], script[src], img[src]')) {
    const raw = el.getAttribute('href') ?? el.getAttribute('src');
    if (/^(https?:|mailto:|data:)/.test(raw)) continue;
    links++;
    const [p, hash] = raw.split('#');
    if (!p) {
      if (hash && !ids.has(hash)) broken.push(`${page}: #${hash} (no such place on the page)`);
      continue;
    }
    if (!p.startsWith('/')) {
      broken.push(`${page}: ${raw} (links inside the site must start with /)`);
      continue;
    }
    if (base && !p.startsWith(base + '/')) {
      broken.push(`${page}: ${raw} (missing the site base "${base}")`);
      continue;
    }
    let target = path.join(DIST, decodeURIComponent(p.slice(base.length)));
    if (p.endsWith('/')) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) broken.push(`${page}: ${raw} (nothing at ${target})`);
    else if (hash && target.endsWith('.html') && !idsOf(target).has(hash)) broken.push(`${page}: ${raw} (the page exists but has no place called "${hash}")`);
  }
}
for (const b of broken) console.error('BROKEN  ' + b);
console.log(`${pages.length} pages, ${links} internal links checked, ${broken.length} broken.`);
process.exit(broken.length ? 1 : 0);
