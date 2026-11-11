import { describe, expect, it } from 'vitest';
import { buildTutorPrompt, MAX_CHAPTER_CHARS, MAX_QUESTION_CHARS } from '../src/lib/tutor';

describe('buildTutorPrompt', () => {
  const p = buildTutorPrompt('Zero to AI Engineer', 'Tokens and "embeddings"', 'First line.   \n\n\n\nSecond line.', '  Why are tokens not words?  ');
  it('includes the course, the chapter, its text and the question', () => {
    expect(p).toContain('"Zero to AI Engineer"');
    expect(p).toContain(`<chapter title="Tokens and 'embeddings'">`);
    expect(p).toContain('First line.\n\nSecond line.');
    expect(p).toContain('<learner_message>\nWhy are tokens not words?\n</learner_message>');
  });
  it('tells the assistant the learner is a beginner', () => {
    expect(p).toContain('complete beginner');
  });
  it('shortens a very long chapter and says so', () => {
    const long = buildTutorPrompt('C', 'T', 'x'.repeat(MAX_CHAPTER_CHARS + 500), 'q');
    expect(long).toContain('[The chapter continues');
    expect(long.length).toBeLessThan(MAX_CHAPTER_CHARS + 1500);
  });
  it('limits the length of the question', () => {
    const long = buildTutorPrompt('C', 'T', 'text', 'q'.repeat(MAX_QUESTION_CHARS + 100));
    expect(long).not.toContain('q'.repeat(MAX_QUESTION_CHARS + 1));
  });
});
