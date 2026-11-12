import { describe, expect, it } from 'vitest';
import { codeStatus } from '../src/lib/code-status';

describe('codeStatus', () => {
  it('says nothing for a chapter with no code', () => {
    expect(codeStatus([])).toBeNull();
  });
  it('counts each kind of check in plain words', () => {
    const s = codeStatus([{ check: 'python' }, { check: 'sql' }, { check: 'python-fake-api' }, { check: 'heavy' }, { check: 'heavy' }, { check: 'not-run' }]);
    expect(s).toBe(
      'Code: 2 examples run under automatic tests; 1 model API example run against a stand-in server, not the live API; 2 examples needing PyTorch or a model download, checked in a separate heavy run; 1 example that cannot be run automatically.',
    );
  });
  it('uses the singular', () => {
    expect(codeStatus([{ check: 'illustration' }])).toBe('Code: 1 worked example or sample output checked by hand-written assertions.');
  });
});
