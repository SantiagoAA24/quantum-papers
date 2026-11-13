import "server-only";

import { cache } from "react";
import { searchPapers, type SearchResult } from "@/lib";
import type { SearchParams } from "@/lib/search-params";

/**
 * One searchPapers call per request, shared by the status line and the results
 * list (two Suspense boundaries). React.cache keys on the primitive argument.
 */
const run = cache((serialized: string): Promise<SearchResult[]> => {
  const p = JSON.parse(serialized) as SearchParams;
  return searchPapers({
    query: p.q,
    filters: {
      topics: p.topics.length ? p.topics : undefined,
      yearFrom: p.yearFrom,
      yearTo: p.yearTo,
      category: p.category,
    },
  });
});

export function loadResults(params: SearchParams): Promise<SearchResult[]> {
  return run(JSON.stringify(params));
}
