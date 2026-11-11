// The course model: pure functions, no Astro imports, so they can be unit-tested.

export interface CourseManifest {
  id: string;
  title: string;
  tagline: string;
  parts: { name: string; blurb: string; chapters: string[] }[];
}

export interface ChapterMeta {
  id: string;
  title: string;
  slug?: string;
  prerequisites: string[];
}

export interface CourseChapter {
  id: string; // unique across the whole project (the folder name)
  slug: string; // address within this course
  title: string;
  part: string;
  number: number; // 1-based position in this course
}

export interface Course {
  id: string;
  title: string;
  tagline: string;
  parts: { name: string; blurb: string; chapters: CourseChapter[] }[];
  chapters: CourseChapter[];
}

/** Builds the courses and checks everything that could silently go wrong. */
export function buildCourses(manifests: CourseManifest[], metas: ChapterMeta[]): Course[] {
  const byId = new Map(metas.map((m) => [m.id, m]));
  const used = new Set<string>();
  const courses = manifests.map((m) => {
    const chapters: CourseChapter[] = [];
    const slugs = new Set<string>();
    const parts = m.parts.map((p) => ({
      name: p.name,
      blurb: p.blurb,
      chapters: p.chapters.map((id) => {
        const meta = byId.get(id);
        if (!meta) throw new Error(`Course "${m.id}" lists chapter "${id}", which does not exist in content/chapters.`);
        const slug = meta.slug ?? meta.id;
        if (slugs.has(slug)) throw new Error(`Course "${m.id}" has two chapters with the address "${slug}".`);
        slugs.add(slug);
        used.add(id);
        const ch = { id, slug, title: meta.title, part: p.name, number: chapters.length + 1 };
        chapters.push(ch);
        return ch;
      }),
    }));
    return { id: m.id, title: m.title, tagline: m.tagline, parts, chapters };
  });
  for (const meta of metas) {
    if (!used.has(meta.id)) throw new Error(`Chapter "${meta.id}" is not listed in any course.`);
    for (const p of meta.prerequisites) {
      if (!byId.has(p)) throw new Error(`Chapter "${meta.id}" names a prerequisite "${p}" that does not exist.`);
    }
  }
  return courses;
}

export function findChapter(course: Course, id: string): CourseChapter | undefined {
  return course.chapters.find((c) => c.id === id);
}

/** Where a reference to chapter `id` should point, preferring the course being read. */
export function resolveRef(
  courses: Course[],
  currentCourseId: string | undefined,
  id: string,
): { course: Course; chapter: CourseChapter } {
  const ordered = [...courses].sort((a, b) => Number(b.id === currentCourseId) - Number(a.id === currentCourseId));
  for (const course of ordered) {
    const chapter = findChapter(course, id);
    if (chapter) return { course, chapter };
  }
  throw new Error(`Reference to chapter "${id}", which is not in any course.`);
}

/** Courses that contain a chapter (more than one means it is shared). */
export function coursesContaining(courses: Course[], id: string): Course[] {
  return courses.filter((c) => findChapter(c, id));
}
