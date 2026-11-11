import { describe, expect, it } from 'vitest';
import { isRelevant, markedWords } from '../src/lib/search';

describe('markedWords', () => {
  it('pulls out the highlighted words without punctuation or capitals', () => {
    expect(markedWords('the <mark>Gradient:</mark> of a <mark>max_tokens</mark> x')).toEqual(['gradient', 'maxtokens']);
  });
});

describe('isRelevant', () => {
  it('keeps exact matches, plurals and stems', () => {
    expect(isRelevant('gradient', ['gradients'])).toBe(true);
    expect(isRelevant('running', ['run'])).toBe(true);
  });
  it('keeps the other spelling of a word', () => {
    expect(isRelevant('tokeniser', ['tokenizer'])).toBe(true);
    expect(isRelevant('normalization', ['normalisation'])).toBe(true);
  });
  it('drops a fallback to a single letter', () => {
    expect(isRelevant('xylophone', ['x', 'x'])).toBe(false);
    expect(isRelevant('qqqzzzxxx', ['q'])).toBe(false);
  });
  it('allows short queries', () => {
    expect(isRelevant('ci', ['ci'])).toBe(true);
    expect(isRelevant('x', ['x'])).toBe(true);
  });
  it('needs only one of several typed words to match well', () => {
    expect(isRelevant('recursion xylophone', ['recursion'])).toBe(true);
    expect(isRelevant('', ['anything'])).toBe(false);
  });
});
