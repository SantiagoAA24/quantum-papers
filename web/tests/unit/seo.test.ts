import { describe, expect, it } from "vitest";
import { absoluteUrl, pageMetadata, truncateAtWord } from "@/lib/seo";

describe("truncateAtWord", () => {
  it("returns short text untouched, collapsing whitespace", () => {
    expect(truncateAtWord("  hola \n  mundo ", 155)).toBe("hola mundo");
  });
  it("cuts at a word boundary and adds an ellipsis", () => {
    const out = truncateAtWord("uno dos tres cuatro cinco", 10);
    expect(out).toBe("uno dos…");
    expect(out.length).toBeLessThanOrEqual(11);
  });
  it("keeps the last word when the window ends exactly on it", () => {
    expect(truncateAtWord("uno dos tres cuatro", 7)).toBe("uno dos…");
    expect(truncateAtWord("uno dos tres cuatro", 12)).toBe("uno dos tres…");
  });
  it("never ends with dangling punctuation before the ellipsis", () => {
    expect(truncateAtWord("uno, dos, tres, cuatro", 9)).toBe("uno, dos…");
  });
  it("hard-cuts a single word longer than the window", () => {
    expect(truncateAtWord("a".repeat(40), 10)).toBe(`${"a".repeat(10)}…`);
  });
  it("does not cut inside words for a realistic abstract", () => {
    const text = "We formalize a rigorous connection between barren plateaus (BP) in variational quantum algorithms and exponential concentration of quantum kernels for machine learning.";
    const out = truncateAtWord(text, 155).replace(/…$/, "");
    expect(text.startsWith(out)).toBe(true);
    expect(text[out.length]).toBe(" ");
  });
});

describe("pageMetadata", () => {
  const meta = pageMetadata({
    title: "T",
    description: "D",
    path: "/papers/1234.5678",
    type: "article",
    siteUrl: "https://qp.example",
  });
  it("sets the absolute canonical URL", () => {
    expect(meta.alternates?.canonical).toBe("https://qp.example/papers/1234.5678");
  });
  it("sets Open Graph and Twitter card", () => {
    expect(meta.openGraph).toMatchObject({ type: "article", url: "https://qp.example/papers/1234.5678" });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });
  it("defaults to website", () => {
    expect(pageMetadata({ title: "T", description: "D", path: "/" }).openGraph).toMatchObject({ type: "website" });
  });
});

describe("absoluteUrl", () => {
  it("joins origin and path", () => {
    expect(absoluteUrl("/about", "https://qp.example")).toBe("https://qp.example/about");
    expect(absoluteUrl("/", "https://qp.example/")).toBe("https://qp.example/");
  });
});
