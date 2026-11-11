// Links glossary terms in chapter text to the glossary page.
//
// Deliberately cautious, because many glossary words ("label", "model",
// "function") are also ordinary words with other meanings:
//   - a term is linked where the chapter puts it in **bold**, which is how the
//     chapters mark the place a term is introduced;
//   - an acronym written in capitals (API, JSON, RAG) is linked wherever it
//     first appears.
// Each term is linked once per chapter. Nothing inside code, headings or
// existing links is touched. The words themselves never change.
import fs from 'node:fs';
import { parse } from 'yaml';

export function termAnchor(term) {
  return 'term-' + term.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** "Parameter (weight)" is known as both "parameter" and "weight". */
export function termNames(entry) {
  const names = [entry.term.replace(/\s*\(.*?\)\s*/g, ' ').trim()];
  for (const m of entry.term.matchAll(/\(([^)]+)\)/g)) names.push(m[1].trim());
  for (const a of entry.aliases ?? []) names.push(a);
  return names;
}

const isAcronym = (name) => /^[A-Z][A-Z0-9]{1,}$/.test(name);
const SKIP = new Set(['a', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'script', 'style', 'button', 'label']);

function textOf(node) {
  if (node.type === 'text') return node.value;
  return (node.children ?? []).map(textOf).join('');
}

/**
 * Changes a hast tree in place. `entries` is the parsed glossary;
 * `glossaryHref` is the address of the glossary page.
 */
export function linkTerms(tree, entries, glossaryHref) {
  const bold = new Map(); // lower-case name (and its plural) -> anchor
  const acronyms = new Map(); // exact acronym -> anchor
  for (const e of entries) {
    const anchor = termAnchor(e.term);
    for (const name of termNames(e)) {
      const lower = name.toLowerCase();
      bold.set(lower, anchor);
      bold.set(lower + 's', anchor);
      if (isAcronym(name)) {
        acronyms.set(name, anchor);
        acronyms.set(name + 's', anchor);
      }
    }
  }
  const used = new Set();
  const link = (anchor, children) => ({
    type: 'element',
    tagName: 'a',
    properties: { className: ['term'], href: `${glossaryHref}#${anchor}`, title: 'Open this term in the glossary' },
    children,
  });
  const acronymRe = acronyms.size ? new RegExp(`\\b(${[...acronyms.keys()].sort((a, b) => b.length - a.length).join('|')})\\b`) : null;

  function walk(node, skipping) {
    if (!node.children) return;
    const tag = node.tagName ?? node.name; // hast element, or an MDX component
    const skip = skipping || SKIP.has(tag);
    if (!skip && tag === 'strong') {
      const anchor = bold.get(textOf(node).trim().toLowerCase());
      if (anchor && !used.has(anchor)) {
        used.add(anchor);
        node.children = [link(anchor, node.children)];
        return;
      }
    }
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (child.type === 'text' && !skip && acronymRe) {
        const m = acronymRe.exec(child.value);
        const anchor = m && acronyms.get(m[1]);
        if (m && !used.has(anchor)) {
          used.add(anchor);
          const before = { type: 'text', value: child.value.slice(0, m.index) };
          const after = { type: 'text', value: child.value.slice(m.index + m[1].length) };
          node.children.splice(i, 1, before, link(anchor, [{ type: 'text', value: m[1] }]), after);
          i += 1; // continue with the text after the link
        }
      } else {
        walk(child, skip);
      }
    }
  }
  walk(tree, false);
  return tree;
}

/** The rehype plugin used in astro.config.mjs. */
export function rehypeGlossaryLinks({ file = 'content/glossary.yaml', base = '/' } = {}) {
  const entries = parse(fs.readFileSync(file, 'utf8'));
  const href = base.replace(/\/$/, '') + '/glossary/';
  return (tree) => {
    linkTerms(tree, entries, href);
  };
}
