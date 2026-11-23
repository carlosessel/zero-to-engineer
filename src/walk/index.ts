// Every walkthrough, by name. Use one in a chapter with <Walkthrough name="…" />.
import type { Lesson } from './types';
import { lesson as binarySearch } from './lessons/binary-search';
import { lesson as insertionSort } from './lessons/insertion-sort';
import { lesson as stackQueue } from './lessons/stack-queue';
import { lesson as hashTable } from './lessons/hash-table';
import { lesson as bfs } from './lessons/bfs';
import { lesson as sqlJoin } from './lessons/sql-join';

export const LESSONS: Record<string, Lesson> = Object.fromEntries(
  [binarySearch, insertionSort, stackQueue, hashTable, bfs, sqlJoin].map((l) => [l.id, l]),
);
