import { describe, expect, it } from 'vitest';
import { buildDocument, dropLocalLinks, webNewline } from '../src/lib/playground';

const empty = { html: '', css: '', js: '' };

describe('buildDocument', () => {
  it('wraps a fragment in a full page with the bridge first', () => {
    const doc = buildDocument({ ...empty, html: '<p>Hi</p>' }, 'f1');
    expect(doc.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(doc.indexOf('zte')).toBeLessThan(doc.indexOf('<p>Hi</p>'));
    expect(doc).toContain('"f1"');
  });

  it('puts the CSS at the end of the head and the JavaScript at the end of the body of a full page', () => {
    const html = '<!DOCTYPE html>\n<html><head><title>T</title></head><body><h1>Hi</h1></body></html>';
    const doc = buildDocument({ html, css: 'h1 { color: red; }', js: 'console.log(1)' }, 'f');
    expect(doc.indexOf('<title>')).toBeLessThan(doc.indexOf('h1 { color: red; }'));
    expect(doc.indexOf('h1 { color: red; }')).toBeLessThan(doc.indexOf('</head>'));
    expect(doc.indexOf('<h1>Hi</h1>')).toBeLessThan(doc.indexOf('console.log(1)'));
    expect(doc.indexOf('console.log(1)')).toBeLessThan(doc.indexOf('</body>'));
  });

  it('adds a head to a page that has none', () => {
    const doc = buildDocument({ ...empty, html: '<html><body>x</body></html>' }, 'f');
    expect(doc).toMatch(/<html>\s*<head>[\s\S]*zte[\s\S]*<\/head><body>x<\/body>/);
  });

  it('reports the example\'s height so the frame can fit it', () => {
    expect(buildDocument({ ...empty, html: '<p>x</p>' }, 'f')).toContain("level: 'size'");
  });

  it('stops a </script> in the learner\'s code ending the script early', () => {
    const doc = buildDocument({ ...empty, html: '<p>x</p>', js: 'const s = "</script>";' }, 'f');
    expect(doc).toContain('const s = "<\\/script>";');
  });
});

describe('dropLocalLinks', () => {
  it('removes a link to a local stylesheet only when CSS is supplied', () => {
    const html = '<link rel="stylesheet" href="style.css">\n<p>x</p>';
    expect(dropLocalLinks(html, { css: 'p{}', js: '' })).toBe('<p>x</p>');
    expect(dropLocalLinks(html, { css: '', js: '' })).toBe(html);
  });
  it('keeps links to stylesheets on other sites', () => {
    const html = '<link rel="stylesheet" href="https://fonts.example.com/a.css">';
    expect(dropLocalLinks(html, { css: 'p{}', js: '' })).toBe(html);
  });
  it('removes a local script when JavaScript is supplied', () => {
    expect(dropLocalLinks('<script src="script.js"></script>\n<p>x</p>', { css: '', js: 'x()' })).toBe('<p>x</p>');
  });
});

describe('webNewline', () => {
  it('keeps the indentation', () => {
    expect(webNewline('  <li>one</li>')).toBe('\n  ');
  });
  it('indents after an opening brace', () => {
    expect(webNewline('body {')).toBe('\n  ');
    expect(webNewline('  if (x) {')).toBe('\n    ');
  });
});
