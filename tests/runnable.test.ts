import { describe, expect, it } from 'vitest';
import { hintFor, newlineIndent, whyNotRunnable } from '../src/lib/runnable';

describe('whyNotRunnable', () => {
  it('lets ordinary Python and the scientific libraries run', () => {
    expect(whyNotRunnable('print("hi")')).toBeNull();
    expect(whyNotRunnable('import numpy as np\nimport pandas as pd\nfrom sklearn.metrics import accuracy_score')).toBeNull();
  });
  it('names the library that cannot run in the browser', () => {
    expect(whyNotRunnable('import torch\nfrom torch import nn')).toContain('torch');
    expect(whyNotRunnable('x = 1\nfrom sentence_transformers import SentenceTransformer')).toContain('sentence_transformers');
  });
  it('does not mistake a longer name for a blocked library', () => {
    expect(whyNotRunnable('import torchless')).toBeNull();
  });
  it('spots examples that need an API key or a file', () => {
    expect(whyNotRunnable('msg = client.messages.create(model=MODEL)')).toContain('API key');
    expect(whyNotRunnable('df = pd.read_csv("sales.csv")')).toContain('file');
  });
});

describe('newlineIndent', () => {
  it('keeps the current indentation', () => {
    expect(newlineIndent('x = 1')).toBe('\n');
    expect(newlineIndent('if x:\n    y = 2')).toBe('\n    ');
  });
  it('indents one more level after a colon, even with a comment', () => {
    expect(newlineIndent('for i in range(5):')).toBe('\n    ');
    expect(newlineIndent('    if ok:   # check')).toBe('\n        ');
  });
});

describe('hintFor', () => {
  it('gives a hint for the errors beginners meet here, and nothing otherwise', () => {
    expect(hintFor('NameError')).toContain('earlier example');
    expect(hintFor('ZeroDivisionError')).toBe('');
  });
});
