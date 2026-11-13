// Prints what each TypeScript block in the given chapters outputs, with types
// removed the way the site's Run button removes them. For drafting examples.yaml.
// Usage: node scripts/ts_output.ts <chapter> [<chapter> ...]
import fs from 'node:fs';
import { transform } from 'sucrase';
import { runExample } from '../tests/js-runner.ts';
const FENCE = /^(`{3,})(\w+)\n([\s\S]*?)\n\1[ \t]*$/gm;
for (const chapter of process.argv.slice(2)) {
  const blocks = [...fs.readFileSync(`content/chapters/${chapter}/index.mdx`, 'utf8').matchAll(FENCE)];
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i][2] !== 'ts') continue;
    if (/^\s*declare\s/m.test(blocks[i][3])) { console.log(`== ${chapter} ${i + 1}: has declare, not run`); continue; }
    const r = await runExample(transform(blocks[i][3], { transforms: ['typescript'] }).code, { wait_ms: 1000 });
    console.log(`== ${chapter} ${i + 1}${r.error ? ' ERROR ' + r.error.message : ''}\n${r.output}`);
  }
}
