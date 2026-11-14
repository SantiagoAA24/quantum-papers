import { describe, expect, it } from "vitest";
import { buildScholarlyArticle, serializeJsonLd } from "@/lib/jsonld";
import type { PaperDetail } from "@/lib/types";

const SITE = "https://qp.example";
const paper: PaperDetail = {
  arxivId: "2501.07433",
  title: "Exponential concentration and barren plateaus",
  abstract: "We formalize a connection.",
  publishedAt: "2025-01-13T00:00:00.000Z",
  updatedAt: "2025-02-01T10:00:00.000Z",
  version: 2,
  primaryCategory: "quant-ph",
  doi: "10.1000/xyz123",
  pdfUrl: "https://arxiv.org/pdf/2501.07433",
  aiSummary: null,
  authors: [
    { slug: "ada-lovelace", name: "Ada Lovelace" },
    { slug: "alan-turing", name: "Alan Turing" },
  ],
  topics: [
    { slug: "barren-plateaus", label: "Barren plateaus" },
    { slug: "quantum-kernels", label: "Quantum kernels" },
  ],
};

describe("buildScholarlyArticle", () => {
  const ld = buildScholarlyArticle(paper, SITE);

  it("declares the schema.org type", () => {
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("ScholarlyArticle");
  });
  it("maps title, abstract and dates", () => {
    expect(ld).toMatchObject({
      headline: paper.title,
      name: paper.title,
      abstract: paper.abstract,
      datePublished: paper.publishedAt,
      dateModified: paper.updatedAt,
    });
  });
  it("lists authors as Person in order", () => {
    expect(ld.author).toEqual([
      { "@type": "Person", name: "Ada Lovelace", url: `${SITE}/authors/ada-lovelace` },
      { "@type": "Person", name: "Alan Turing", url: `${SITE}/authors/alan-turing` },
    ]);
  });
  it("uses arXiv and DOI as PropertyValue identifiers", () => {
    expect(ld.identifier).toEqual([
      { "@type": "PropertyValue", propertyID: "arXiv", value: "2501.07433" },
      { "@type": "PropertyValue", propertyID: "DOI", value: "10.1000/xyz123" },
    ]);
  });
  it("omits the DOI when there is none", () => {
    const out = buildScholarlyArticle({ ...paper, doi: null }, SITE);
    expect(out.identifier).toEqual([
      { "@type": "PropertyValue", propertyID: "arXiv", value: "2501.07433" },
    ]);
  });
  it("sets url, sameAs and keywords", () => {
    expect(ld.url).toBe(`${SITE}/papers/2501.07433`);
    expect(ld.sameAs).toEqual(["https://arxiv.org/abs/2501.07433"]);
    expect(ld.keywords).toEqual(["Barren plateaus", "Quantum kernels"]);
  });
  it("handles papers without authors or topics", () => {
    const out = buildScholarlyArticle({ ...paper, authors: [], topics: [] }, SITE);
    expect(out.author).toEqual([]);
    expect(out.keywords).toEqual([]);
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so a title cannot close the script tag", () => {
    const evil = buildScholarlyArticle({ ...paper, title: "</script><img src=x onerror=alert(1)>" }, SITE);
    const out = serializeJsonLd(evil);
    expect(out).not.toContain("<");
    expect(out).toContain("\\u003c/script>");
  });
  it("round-trips through JSON.parse", () => {
    const evil = buildScholarlyArticle({ ...paper, title: "a </script> b" }, SITE);
    expect(JSON.parse(serializeJsonLd(evil))).toEqual(evil);
  });
});
