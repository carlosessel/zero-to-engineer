import { describe, expect, it } from 'vitest';
import { buildCourses, coursesContaining, resolveRef, type ChapterMeta, type CourseManifest } from '../src/lib/model';

const meta = (id: string, extra: Partial<ChapterMeta> = {}): ChapterMeta => ({ id, title: id.toUpperCase(), prerequisites: [], ...extra });
const course = (id: string, parts: Record<string, string[]>): CourseManifest => ({
  id,
  title: id,
  tagline: '',
  parts: Object.entries(parts).map(([name, chapters]) => ({ name, blurb: '', chapters })),
});

const metas = [meta('ai-setup', { slug: 'setup' }), meta('se-setup', { slug: 'setup' }), meta('python'), meta('maths'), meta('web')];
const manifests = [course('ai', { Start: ['ai-setup', 'python'], Maths: ['maths'] }), course('se', { Start: ['se-setup', 'python'], Web: ['web'] })];

describe('buildCourses', () => {
  const [ai, se] = buildCourses(manifests, metas);

  it('numbers chapters in order across parts', () => {
    expect(ai.chapters.map((c) => [c.number, c.id, c.part])).toEqual([
      [1, 'ai-setup', 'Start'],
      [2, 'python', 'Start'],
      [3, 'maths', 'Maths'],
    ]);
  });

  it('lets two courses use the same address for different chapters', () => {
    expect(ai.chapters[0].slug).toBe('setup');
    expect(se.chapters[0].slug).toBe('setup');
    expect(se.chapters[0].id).toBe('se-setup');
  });

  it('puts a shared chapter in both courses', () => {
    expect(coursesContaining([ai, se], 'python').map((c) => c.id)).toEqual(['ai', 'se']);
    expect(coursesContaining([ai, se], 'web').map((c) => c.id)).toEqual(['se']);
  });

  it('refuses a course that lists a missing chapter', () => {
    expect(() => buildCourses([course('ai', { A: ['nope'] })], metas)).toThrow(/"nope", which does not exist/);
  });

  it('refuses two chapters with the same address in one course', () => {
    expect(() => buildCourses([course('x', { A: ['ai-setup', 'se-setup', 'python', 'maths', 'web'] })], metas)).toThrow(/two chapters with the address "setup"/);
  });

  it('refuses a chapter that no course uses', () => {
    expect(() => buildCourses(manifests, [...metas, meta('orphan')])).toThrow(/"orphan" is not listed in any course/);
  });

  it('refuses a prerequisite that does not exist', () => {
    const bad = metas.map((m) => (m.id === 'web' ? meta('web', { prerequisites: ['ghost'] }) : m));
    expect(() => buildCourses(manifests, bad)).toThrow(/prerequisite "ghost"/);
  });
});

describe('resolveRef', () => {
  const courses = buildCourses(manifests, metas);
  it('prefers the course being read, where numbering may differ', () => {
    expect(resolveRef(courses, 'se', 'python').course.id).toBe('se');
    expect(resolveRef(courses, 'ai', 'python').course.id).toBe('ai');
  });
  it('falls back to another course when the chapter is not in this one', () => {
    const r = resolveRef(courses, 'ai', 'web');
    expect([r.course.id, r.chapter.number]).toEqual(['se', 3]);
  });
  it('fails loudly on an unknown chapter', () => {
    expect(() => resolveRef(courses, 'ai', 'missing')).toThrow(/"missing"/);
  });
});
