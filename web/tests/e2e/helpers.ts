import type { APIRequestContext } from "@playwright/test";

/** Query used by the specs that need real results from /search. */
export const SEARCH_QUERY = "quantum";

/** Path of a real paper, read from the first listing page (no hardcoded ids). */
export async function firstPaperPath(request: APIRequestContext): Promise<string> {
  const html = await (await request.get("/papers/page/1")).text();
  const match = html.match(/href="(\/papers\/(?!page\/)[^"/]+)"/);
  const path = match?.[1];
  if (!path) throw new Error("No paper link found in /papers/page/1; is the database seeded?");
  return path;
}
