import { describe, expect, it } from 'vitest';
import { renderInline } from '../src/lib/inline';

const ref = (id: string) => ({ href: `/ai/${id}/`, number: id.length });

describe('renderInline', () => {
  it('escapes HTML in ordinary text', () => {
    expect(renderInline('a < b & "c" > d', ref)).toBe('a &lt; b &amp; &quot;c&quot; &gt; d');
  });
  it('renders code, bold and italic', () => {
    expect(renderInline('Run `pwd` and **read** the *output*', ref)).toBe('Run <code>pwd</code> and <strong>read</strong> the <em>output</em>');
  });
  it('does not treat markup inside code as markup', () => {
    expect(renderInline('`a * b ** <p>`', ref)).toBe('<code>a * b ** &lt;p&gt;</code>');
  });
  it('supports code that contains a backtick', () => {
    expect(renderInline('`` a`b ``', ref)).toBe('<code>a`b</code>');
  });
  it('honours backslash escapes', () => {
    expect(renderInline('2 \\* 3 \\* 4 and x\\_y', ref)).toBe('2 * 3 * 4 and x_y');
  });
  it('renders outside links, and only http ones', () => {
    expect(renderInline('[docs](https://example.com/a)', ref)).toBe('<a href="https://example.com/a">docs</a>');
    expect(renderInline('[bad](javascript:alert(1))', ref)).not.toContain('<a');
  });
  it('renders chapter references', () => {
    expect(renderInline('your [[ref:sql]] model', ref)).toBe('your <a href="/ai/sql/">chapter 3</a> model');
    expect(renderInline('Chapters [[n:sql]] to [[n:tools]]', ref)).toBe('Chapters <a href="/ai/sql/">3</a> to <a href="/ai/tools/">5</a>');
    expect(renderInline('the [[ref:sql|database chapter]]', ref)).toBe('the <a href="/ai/sql/">database chapter</a>');
  });
  it('nests bold around code', () => {
    expect(renderInline('**1. Run `ls`.** Then stop.', ref)).toBe('<strong>1. Run <code>ls</code>.</strong> Then stop.');
  });
});
