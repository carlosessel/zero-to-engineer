import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JavaScript module, shared with astro.config.mjs
import { linkTerms, termAnchor, termNames } from '../src/lib/glossary-links.mjs';

const entries = [{ term: 'Model' }, { term: 'API' }, { term: 'Parameter (weight)' }, { term: 'Learning rate' }];
const t = (value: string) => ({ type: 'text', value });
const el = (tagName: string, ...children: any[]) => ({ type: 'element', tagName, properties: {}, children });
const root = (...children: any[]) => ({ type: 'root', children });

function html(node: any): string {
  if (node.type === 'text') return node.value;
  const inner = (node.children ?? []).map(html).join('');
  if (node.type === 'root') return inner;
  const href = node.properties?.href ? ` href="${node.properties.href}"` : '';
  return `<${node.tagName}${href}>${inner}</${node.tagName}>`;
}
const run = (tree: any) => html(linkTerms(tree, entries, '/glossary/'));

describe('names and anchors', () => {
  it('makes an anchor from a term', () => {
    expect(termAnchor('Parameter (weight)')).toBe('term-parameter-weight');
    expect(termAnchor('API key')).toBe('term-api-key');
  });
  it('treats a bracketed word as a second name', () => {
    expect(termNames({ term: 'Parameter (weight)' })).toEqual(['Parameter', 'weight']);
  });
});

describe('linkTerms', () => {
  it('links a term where it is in bold, whatever its capitals, including the plural', () => {
    expect(run(root(el('p', t('A '), el('strong', t('model')), t(' is a file.'))))).toBe('<p>A <strong><a href="/glossary/#term-model">model</a></strong> is a file.</p>');
    expect(run(root(el('p', el('strong', t('Weights')))))).toBe('<p><strong><a href="/glossary/#term-parameter-weight">Weights</a></strong></p>');
  });
  it('does not link the same word when it is not bold', () => {
    expect(run(root(el('p', t('Put a label on the model.'))))).toBe('<p>Put a label on the model.</p>');
  });
  it('links only the first use in a chapter', () => {
    const out = run(root(el('p', el('strong', t('model'))), el('p', el('strong', t('Model')))));
    expect(out.match(/<a /g)).toHaveLength(1);
  });
  it('links a capital-letter acronym in ordinary text, once', () => {
    expect(run(root(el('p', t('Call the API. The API replies.'))))).toBe('<p>Call the <a href="/glossary/#term-api">API</a>. The API replies.</p>');
  });
  it('does not link part of a longer word or a lower-case match', () => {
    expect(run(root(el('p', t('RAPID apis and APIARY'))))).toBe('<p>RAPID apis and APIARY</p>');
  });
  it('leaves code, headings and existing links alone', () => {
    const tree = root(el('h2', t('The API')), el('p', el('code', t('API')), el('a', t('API docs'))), el('pre', el('code', t('API = 1'))));
    expect(run(tree)).not.toContain('/glossary/');
  });
  it('never changes the words', () => {
    const tree = root(el('p', t('An '), el('strong', t('API')), t(' and a '), el('strong', t('learning rate')), t(', then JSON and API.')));
    const before = html(tree).replace(/<[^>]+>/g, '');
    expect(run(tree).replace(/<[^>]+>/g, '')).toBe(before);
  });
});
