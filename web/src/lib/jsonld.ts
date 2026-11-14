import type { PaperDetail } from "./types";
import { absoluteUrl } from "./seo";

type JsonLd = Record<string, unknown>;

/** schema.org ScholarlyArticle for a paper. Pure: same input, same output. */
export function buildScholarlyArticle(
  paper: PaperDetail,
  siteUrl?: string,
): JsonLd {
  const identifier: JsonLd[] = [
    { "@type": "PropertyValue", propertyID: "arXiv", value: paper.arxivId },
  ];
  if (paper.doi) {
    identifier.push({ "@type": "PropertyValue", propertyID: "DOI", value: paper.doi });
  }
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: paper.title,
    name: paper.title,
    abstract: paper.abstract,
    author: paper.authors.map((a) => ({
      "@type": "Person",
      name: a.name,
      url: absoluteUrl(`/authors/${a.slug}`, siteUrl),
    })),
    datePublished: paper.publishedAt,
    dateModified: paper.updatedAt,
    identifier,
    url: absoluteUrl(`/papers/${paper.arxivId}`, siteUrl),
    sameAs: [`https://arxiv.org/abs/${paper.arxivId}`],
    keywords: paper.topics.map((t) => t.label),
  };
}

/**
 * Serialises JSON-LD for an inline <script>. "<" is escaped as < so that
 * text such as "</script>" in a title cannot close the tag (JSON stays valid).
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
