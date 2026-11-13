// In MDX, { ... } in ordinary text is run as JavaScript. A set written as {1, 2, 3}
// silently renders as "3" (a comma expression), and {a, b} crashes the build.
// This test finds braces in chapter prose that are outside code and outside
// component tags, so they can be put in `code` (or escaped as \{) instead.
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

function strayBraces(text: string): string[] {
  const problems: string[] = [];
  let inFence = false;
  text.split('\n').forEach((line, i) => {
    if (/^\s*(`{3,}|~{3,})/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence || /^\s*</.test(line) || /^---/.test(line)) return;
    const withoutCode = line.replace(/``.*?``/g, '').replace(/`[^`]*`/g, '').replace(/\\[{}]/g, '');
    if (/[{}]/.test(withoutCode)) problems.push(`line ${i + 1}: ${line.trim()}`);
  });
  return problems;
}

describe('chapter text', () => {
  it('finds a stray brace (so the check cannot pass silently)', () => {
    expect(strayBraces('A set such as {1, 2} here.')).toHaveLength(1);
    expect(strayBraces('In code: `{1, 2}`.\n<Exercises set={0} />\n```ts\nconst a = {};\n```')).toHaveLength(0);
  });

  for (const chapter of fs.readdirSync('content/chapters').sort()) {
    const file = `content/chapters/${chapter}/index.mdx`;
    if (!fs.existsSync(file)) continue;
    it(`${chapter} has no braces in its prose that MDX would run as code`, () => {
      const front = fs.readFileSync(file, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '');
      expect(strayBraces(front)).toEqual([]);
    });
  }
});
