import type { PaperSummary } from "./types";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function rowIndex(i: number): string {
  return String(i + 1).padStart(2, "0");
}

export function yearOf(iso: string): string {
  return String(new Date(iso).getUTCFullYear());
}

export function isoDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/** Props shared by every PaperRow built from a PaperSummary. */
export function paperRowProps(p: PaperSummary, i: number) {
  return {
    index: rowIndex(i),
    title: p.title,
    topic: p.topics[0]?.slug ?? p.primaryCategory,
    year: yearOf(p.publishedAt),
    arxiv: `arXiv:${p.arxivId}`,
    href: `/papers/${p.arxivId}`,
  };
}
