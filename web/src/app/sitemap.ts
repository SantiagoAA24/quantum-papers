import type { MetadataRoute } from "next";
import {
  listAuthorSitemapEntries,
  listPaperSitemapEntries,
  listTopicSitemapEntries,
} from "@/lib";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

const PAGE_SIZE = 20; // keep in sync with app/papers/page/[n]/page.tsx

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = ["/", "/about", "/how-it-works"].map((path) => ({
    url: absoluteUrl(path),
  }));

  let papers, authors, topics;
  try {
    [papers, authors, topics] = await Promise.all([
      listPaperSitemapEntries(),
      listAuthorSitemapEntries(),
      listTopicSitemapEntries(),
    ]);
  } catch {
    // Database unavailable: still serve a valid sitemap with the static routes.
    return staticRoutes;
  }

  const pageCount = Math.max(1, Math.ceil(papers.length / PAGE_SIZE));
  const listing = Array.from({ length: pageCount }, (_, i) => ({
    url: absoluteUrl(`/papers/page/${i + 1}`),
    lastModified: papers[0]?.updatedAt,
  }));
  const entity = (prefix: string, rows: typeof papers) =>
    rows.map((r) => ({
      url: absoluteUrl(`/${prefix}/${encodeURIComponent(r.id)}`),
      lastModified: r.updatedAt,
    }));

  return [
    ...staticRoutes,
    ...listing,
    ...entity("papers", papers),
    ...entity("authors", authors),
    ...entity("topics", topics),
  ];
}
