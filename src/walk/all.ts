// Every walkthrough on the site, for use when the site is built (not in the
// browser): the coded ones from src/walk/lessons/ and the data ones from
// content/chapters/*/walkthrough.yaml.
import { LESSONS } from './index';
import { parseLessons, type DataLesson } from './data';
import type { Lesson } from './types';

const files = import.meta.glob('../../content/chapters/*/walkthrough.yaml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const errors: string[] = [];
const fromData: DataLesson[] = Object.entries(files).flatMap(([file, raw]) => parseLessons(raw, file.split('/').at(-2)!, errors));
if (errors.length) throw new Error(`Problems in walkthrough.yaml files:\n${errors.join('\n')}`);

export const ALL_LESSONS: Record<string, Lesson | DataLesson> = { ...LESSONS };
for (const l of fromData) {
  if (ALL_LESSONS[l.id]) throw new Error(`Two walkthroughs are called "${l.id}" (one is in ${l.chapter}/walkthrough.yaml).`);
  ALL_LESSONS[l.id] = l;
}

export const isData = (l: Lesson | DataLesson): l is DataLesson => 'data' in l;
