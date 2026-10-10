'use server';

import { performGlobalSearch } from '@/lib/platform/searchEngine';

export async function getGlobalSearch(query: string) {
  return performGlobalSearch(query);
}
