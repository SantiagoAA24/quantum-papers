/** Pure helpers for /papers/page/[n]; no data access, safe to unit test. */

/** Parses a route segment as a page number in [1, pageCount]; null if invalid. */
export function parsePageNumber(raw: string, pageCount: number): number | null {
  if (!/^[1-9]\d{0,6}$/.test(raw)) return null;
  const n = Number(raw);
  return n <= pageCount ? n : null;
}

export type PageItem = { label?: string; href?: string; current?: boolean; gap?: boolean };

export function pageHref(n: number): string {
  return `/papers/page/${n}`;
}

/** First, last and a window of one page around the current one, with gaps. */
export function buildPages(current: number, pageCount: number): PageItem[] {
  const wanted = new Set<number>([1, pageCount, current - 1, current, current + 1]);
  const nums = [...wanted].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
  const items: PageItem[] = [];
  let prev = 0;
  for (const n of nums) {
    if (prev && n - prev > 1) items.push({ gap: true });
    items.push({ label: String(n), href: pageHref(n), current: n === current });
    prev = n;
  }
  return items;
}
