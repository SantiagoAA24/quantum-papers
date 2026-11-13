/**
 * Validation and normalisation of the /search query string. Pure and free of
 * server-only imports so it can be unit tested and shared with client code.
 */

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 200;
export const MIN_YEAR = 1990;
export const MAX_TOPICS = 10;

export type RawSearchParams = Record<string, string | string[] | undefined>;

export type QueryProblem = "too_short" | "too_long";

export type SearchParams = {
  /** Trimmed query. Empty when absent. */
  q: string;
  /** Set when `q` is non-empty but outside the allowed length. */
  problem?: QueryProblem;
  topics: string[];
  yearFrom?: number;
  yearTo?: number;
  category?: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATEGORY = /^[a-z]+(?:-[a-z]+)*(?:\.[A-Za-z]+(?:-[A-Za-z]+)*)?$/;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function many(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function parseYear(value: string | string[] | undefined, maxYear: number): number | undefined {
  const raw = first(value)?.trim();
  if (!raw || !/^\d{4}$/.test(raw)) return undefined;
  const year = Number(raw);
  return year >= MIN_YEAR && year <= maxYear ? year : undefined;
}

export function normalizeSearchParams(
  raw: RawSearchParams,
  now: Date = new Date(),
): SearchParams {
  const maxYear = now.getUTCFullYear();
  const q = (first(raw.q) ?? "").trim();

  let problem: QueryProblem | undefined;
  if (q.length > MAX_QUERY_LENGTH) problem = "too_long";
  else if (q.length > 0 && q.length < MIN_QUERY_LENGTH) problem = "too_short";

  const topics = [
    ...new Set(
      many(raw.topic)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length <= 64 && SLUG.test(t)),
    ),
  ]
    .sort()
    .slice(0, MAX_TOPICS);

  let yearFrom = parseYear(raw.year_from, maxYear);
  let yearTo = parseYear(raw.year_to, maxYear);
  if (yearFrom !== undefined && yearTo !== undefined && yearFrom > yearTo) {
    [yearFrom, yearTo] = [yearTo, yearFrom];
  }

  const categoryRaw = first(raw.category)?.trim();
  const category =
    categoryRaw && categoryRaw.length <= 32 && CATEGORY.test(categoryRaw)
      ? categoryRaw
      : undefined;

  const result: SearchParams = { q, topics };
  if (problem) result.problem = problem;
  if (yearFrom !== undefined) result.yearFrom = yearFrom;
  if (yearTo !== undefined) result.yearTo = yearTo;
  if (category) result.category = category;
  return result;
}

/** Stable string for Suspense keys: equal parameters always give the same key. */
export function searchKey(params: SearchParams): string {
  return JSON.stringify([
    params.q,
    params.topics,
    params.yearFrom ?? null,
    params.yearTo ?? null,
    params.category ?? null,
  ]);
}

export function hasFilters(params: SearchParams): boolean {
  return (
    params.topics.length > 0 ||
    params.yearFrom !== undefined ||
    params.yearTo !== undefined ||
    params.category !== undefined
  );
}

/** Human-readable summary of the active filters, for the status line. */
export function describeFilters(params: SearchParams): string {
  const parts: string[] = [];
  if (params.topics.length) parts.push(`tema ${params.topics.map((t) => `#${t}`).join(", ")}`);
  if (params.yearFrom !== undefined && params.yearTo !== undefined) {
    parts.push(`años ${params.yearFrom}–${params.yearTo}`);
  } else if (params.yearFrom !== undefined) parts.push(`año desde ${params.yearFrom}`);
  else if (params.yearTo !== undefined) parts.push(`año hasta ${params.yearTo}`);
  if (params.category) parts.push(`categoría ${params.category}`);
  return parts.join(" · ");
}

/** Canonical query string for normalised params, plus optional extra fields. */
export function searchUrl(params: SearchParams, extra: Record<string, string> = {}): string {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  for (const t of params.topics) qs.append("topic", t);
  if (params.yearFrom !== undefined) qs.set("year_from", String(params.yearFrom));
  if (params.yearTo !== undefined) qs.set("year_to", String(params.yearTo));
  if (params.category) qs.set("category", params.category);
  for (const [k, v] of Object.entries(extra)) qs.set(k, v);
  const s = qs.toString();
  return s ? `/search?${s}` : "/search";
}

export function searchHref(q: string): string {
  return `/search?q=${encodeURIComponent(q)}`;
}
