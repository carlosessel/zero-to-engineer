// Pagefind is forgiving: when a word is not in the index it falls back to the
// longest beginning of the word that is. That is useful ("tokeniser" finds
// "tokenizer") but for a word that is nowhere in the course it can fall back
// to a single letter and return pages that merely contain "x". This filter
// keeps a result only when what was matched genuinely resembles what was typed.

const clean = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

function sharedStart(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/** The words Pagefind highlighted in an excerpt. */
export function markedWords(excerpt: string): string[] {
  return [...excerpt.matchAll(/<mark>(.*?)<\/mark>/g)].map((m) => clean(m[1])).filter(Boolean);
}

/** True when at least one typed word shares its first three letters (or all of them, if shorter) with a matched word. */
export function isRelevant(query: string, matched: string[]): boolean {
  const terms = query.split(/\s+/).map(clean).filter(Boolean);
  if (!terms.length) return false;
  return terms.some((t) => matched.some((w) => sharedStart(t, w) >= Math.min(t.length, 3)));
}
