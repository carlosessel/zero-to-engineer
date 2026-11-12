import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One folder per chapter: content/chapters/<id>/index.mdx
const chapters = defineCollection({
  loader: glob({
    pattern: '*/index.mdx',
    base: './content/chapters',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.object({
    title: z.string().min(1),
    // Address within a course. Defaults to the folder name. Two chapters may
    // share a slug only if they are never in the same course.
    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
    summary: z.string().min(1),
    prerequisites: z.array(z.string()).default([]),
    estimated_minutes: z.number().int().positive(),
    status: z.enum(['migrated', 'corrected', 'deepened', 'code-verified', 'resources-verified']),
  }),
});

export const collections = { chapters };
