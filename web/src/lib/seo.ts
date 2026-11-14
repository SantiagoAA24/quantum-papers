import type { Metadata } from "next";
import { SITE_URL } from "./format";

/** Absolute URL for a site path. `path` must start with "/". */
export function absoluteUrl(path: string, siteUrl: string = SITE_URL): string {
  return new URL(path, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString();
}

/**
 * Cuts `text` to at most `max` characters without splitting a word, appending
 * an ellipsis when something was removed. Whitespace is collapsed first.
 */
export function truncateAtWord(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  // If the character right after the window is a space, the window ends on a whole word.
  const wholeWord = clean[max] === " ";
  const window = clean.slice(0, max);
  const lastSpace = window.lastIndexOf(" ");
  const cut = wholeWord ? window : lastSpace > 0 ? window.slice(0, lastSpace) : "";
  // A single word longer than the window: hard cut, nothing better to do.
  const base = (cut || window).replace(/[\s.,;:!?\-–—]+$/u, "");
  return `${base}…`;
}

type PageMetadataInput = {
  /** Page title without the site suffix; the layout template adds it. */
  title: string;
  description: string;
  /** Site-relative path, used for the canonical URL and og:url. */
  path: string;
  type?: "website" | "article";
  siteUrl?: string;
};

/**
 * Metadata shared by every public route: canonical, Open Graph and Twitter card.
 * The OG/Twitter image is inherited from the nearest opengraph-image file.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  siteUrl = SITE_URL,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path, siteUrl);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type, url, title, description, siteName: "QuantumPapers", locale: "es_ES" },
    twitter: { card: "summary_large_image", title, description },
  };
}
