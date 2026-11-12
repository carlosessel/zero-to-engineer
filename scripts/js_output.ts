// Prints what a chapter's JavaScript code blocks print, for drafting
// examples.yaml. A person must still read each output against the chapter.
//
// Usage: node scripts/js_output.ts chapter-id [block-number ...]
import fs from 'node:fs';
import { runExample } from '../tests/js-runner.ts';

const FENCE = /^(`{3,})(\w+)\n([\s\S]*?)\n\1[ \t]*$/gm;
const [chapter, ...wanted] = process.argv.slice(2);
if (!chapter) {
  console.error('Usage: node scripts/js_output.ts chapter-id [block-number ...]');
  process.exit(2);
}
const blocks = [...fs.readFileSync(`content/chapters/${chapter}/index.mdx`, 'utf8').matchAll(FENCE)].map((m) => [m[2], m[3]]);
for (const [i, [lang, code]] of blocks.entries()) {
  if (!['js', 'javascript'].includes(lang)) continue;
  if (wanted.length && !wanted.includes(String(i + 1))) continue;
  const r = await runExample(code);
  console.log(`--- block ${i + 1}${r.error ? `  (stopped with ${r.error.name}: ${r.error.message})` : ''}`);
  console.log(r.output);
}
