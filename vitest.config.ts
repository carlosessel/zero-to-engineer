import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // .examples-tmp holds the little projects that tests/vitest-blocks.test.ts builds
    // from chapter examples; their test files are run by that test, not directly.
    exclude: [...configDefaults.exclude, '.examples-tmp/**', '.claude/worktrees/**'],
  },
});
