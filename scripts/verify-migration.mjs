// Proves that the migration lost no words.
//
// For every chapter of every course it compares the text of the original
// <article> in legacy/*.html with the text of the built page in dist/, and
// the quiz data with the original QUIZ object. Run after `npm run build`.
//
// Chapters whose status is no longer "migrated" have been rewritten on
// purpose, so for them the rule changes to "must not be shorter than the
// original".
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { parse } from 'yaml';

const COURSES = [
  { id: 'ai', legacy: 'legacy/ai-engineer-course.html' },
  { id: 'se', legacy: 'legacy/software-engineer-course.html' },
];
const squash = (s) => s.replace(/\s+/g, '');
const words = (s) => s.split(/\s+/).filter(Boolean).length;
let failures = 0;
let checked = 0;
const fail = (msg) => {
  failures++;
  console.error('FAIL  ' + msg);
};

function firstDifference(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return `at character ${i}:\n   original: …${a.slice(Math.max(0, i - 40), i + 60)}…\n   built:    …${b.slice(Math.max(0, i - 40), i + 60)}…`;
}

for (const course of COURSES) {
  const html = fs.readFileSync(course.legacy, 'utf8');
  const legacy = new JSDOM(html).window.document;
  const quizSrc = html.slice(html.indexOf('var QUIZ=') + 9, html.indexOf('\n};', html.indexOf('var QUIZ=')) + 2);
  const QUIZ = new Function(`return ${quizSrc}`)();
  const manifest = parse(fs.readFileSync(`content/courses/${course.id === 'ai' ? 'ai-engineer' : 'software-engineer'}.yaml`, 'utf8'));
  const order = manifest.parts.flatMap((p) => p.chapters);
  const articles = [...legacy.querySelectorAll('article')];
  if (articles.length !== order.length) fail(`${course.id}: ${articles.length} chapters in the original, ${order.length} in the course file`);

  articles.forEach((art, i) => {
    const slug = art.id;
    const chapterId = order[i];
    const where = `${course.id}/${slug}`;
    checked++;
    const page = path.join('dist', course.id, slug, 'index.html');
    if (!fs.existsSync(page)) return fail(`${where}: no built page at ${page}`);
    const doc = new JSDOM(fs.readFileSync(page, 'utf8')).window.document;
    const body = doc.querySelector('[data-migrated-body]');
    if (!body) return fail(`${where}: built page has no chapter body`);
    for (const el of body.querySelectorAll('[data-generated], noscript, script, style')) el.remove();

    const status = /^status: (.+)$/m.exec(fs.readFileSync(`content/chapters/${chapterId}/index.mdx`, 'utf8'))?.[1];
    const original = art.textContent;
    const built = body.textContent;
    if (status === 'migrated') {
      if (squash(original) !== squash(built)) fail(`${where}: text differs ${firstDifference(squash(original), squash(built))}`);
    } else if (words(built) < words(original)) {
      fail(`${where}: ${words(built)} words, shorter than the original ${words(original)}`);
    }

    if (doc.querySelector('h1')?.textContent !== art.dataset.title) fail(`${where}: title differs`);
    if (!doc.querySelector('.crumb')?.textContent.includes(`Chapter ${i + 1} of ${articles.length}, ${art.dataset.part}`)) fail(`${where}: chapter number or part differs`);
    // A chapter still marked "migrated" must match exactly; an edited one may only grow.
    const same = status === 'migrated';
    const compare = (what, built, orig) => {
      if (same ? built !== orig : built < orig) fail(`${where}: ${built} ${what}, the original had ${orig}`);
    };
    compare('exercise tick-boxes', body.querySelectorAll('input[type=checkbox]').length, art.querySelectorAll('input[type=checkbox]').length);
    compare('code blocks', body.querySelectorAll('pre').length, art.querySelectorAll('pre').length);
    compare('outside links', body.querySelectorAll('a[href^="http"]').length, art.querySelectorAll('a[href^="http"]').length);

    const want = QUIZ[slug] ?? [];
    const got = [...doc.querySelectorAll('.quiz .q')].map((q) => ({
      q: q.querySelector('p').textContent.replace(/^\d+\. /, ''),
      o: [...q.querySelectorAll('button')].map((b) => b.textContent),
      a: Number(q.dataset.answer),
      w: q.querySelector('.why').dataset.why,
    }));
    if (status === 'migrated' ? JSON.stringify(want) !== JSON.stringify(got) : got.length < want.length) fail(`${where}: quiz differs from the original`);
  });
}

console.log(`${checked} chapter pages checked, ${failures} ${failures === 1 ? 'problem' : 'problems'}.`);
process.exit(failures ? 1 : 0);
