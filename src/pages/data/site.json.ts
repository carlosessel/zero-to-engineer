// Everything the review page and the planner need, as one file they fetch.
import { getEntry } from 'astro:content';
import { getCourses, getQuiz, chapterHref } from '../../lib/load';

export async function GET() {
  const courses = await getCourses();
  const quiz: Record<string, unknown> = {};
  const chapters: Record<string, { title: string; href: string; course: string }> = {};
  const out = [];
  for (const course of courses) {
    const list = [];
    for (const c of course.chapters) {
      const entry = (await getEntry('chapters', c.id))!;
      const href = chapterHref(course, c.slug);
      list.push({ id: c.id, title: c.title, number: c.number, minutes: entry.data.estimated_minutes, href });
      chapters[c.id] ??= { title: c.title, href, course: course.title };
      const q = getQuiz(c.id);
      if (q.length) quiz[c.id] = q;
    }
    out.push({ id: course.id, title: course.title, chapters: list });
  }
  return new Response(JSON.stringify({ courses: out, chapters, quiz }), { headers: { 'Content-Type': 'application/json' } });
}
