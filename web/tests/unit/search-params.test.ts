import { describe, expect, it } from "vitest";
import {
  describeFilters,
  normalizeSearchParams,
  searchKey,
  searchHref,
  searchUrl,
} from "@/lib/search-params";

const NOW = new Date("2026-06-01T00:00:00Z");
const n = (raw: Parameters<typeof normalizeSearchParams>[0]) => normalizeSearchParams(raw, NOW);

describe("q", () => {
  it("trims and accepts a normal query", () => {
    expect(n({ q: "  variational circuits  " })).toMatchObject({ q: "variational circuits" });
    expect(n({ q: "  variational circuits  " }).problem).toBeUndefined();
  });
  it("treats missing or blank q as empty without a problem", () => {
    expect(n({})).toEqual({ q: "", topics: [] });
    expect(n({ q: "   " })).toEqual({ q: "", topics: [] });
  });
  it("flags a single character as too short", () => {
    expect(n({ q: " a " }).problem).toBe("too_short");
  });
  it("accepts exactly 2 and exactly 200 characters", () => {
    expect(n({ q: "ab" }).problem).toBeUndefined();
    expect(n({ q: "a".repeat(200) }).problem).toBeUndefined();
  });
  it("flags 201 characters as too long", () => {
    expect(n({ q: "a".repeat(201) }).problem).toBe("too_long");
  });
  it("uses the first value when q is repeated", () => {
    expect(n({ q: ["uno", "dos"] }).q).toBe("uno");
  });
});

describe("years", () => {
  it("accepts reasonable integers", () => {
    expect(n({ year_from: "2020", year_to: "2024" })).toMatchObject({ yearFrom: 2020, yearTo: 2024 });
  });
  it.each(["abc", "20.5", "1989", "2027", "-2020", "", "99999", "2e3"])("ignores %j", (v) => {
    const r = n({ year_from: v, year_to: v });
    expect(r.yearFrom).toBeUndefined();
    expect(r.yearTo).toBeUndefined();
  });
  it("accepts the current year", () => {
    expect(n({ year_to: "2026" }).yearTo).toBe(2026);
  });
  it("swaps an inverted range", () => {
    expect(n({ year_from: "2024", year_to: "2020" })).toMatchObject({ yearFrom: 2020, yearTo: 2024 });
  });
});

describe("topic", () => {
  it("accepts one value or a repeated parameter, sorted and deduplicated", () => {
    expect(n({ topic: "vqc" }).topics).toEqual(["vqc"]);
    expect(n({ topic: ["qnn", "vqc", "qnn"] }).topics).toEqual(["qnn", "vqc"]);
  });
  it("ignores invalid slugs", () => {
    expect(n({ topic: ["ok-1", "No Válido", "a;b", "", "-x", "x'--"] }).topics).toEqual(["ok-1"]);
  });
  it("caps the number of topics", () => {
    const many = Array.from({ length: 30 }, (_, i) => `t${i}`);
    expect(n({ topic: many }).topics).toHaveLength(10);
  });
});

describe("category", () => {
  it("accepts arXiv-style categories", () => {
    expect(n({ category: "quant-ph" }).category).toBe("quant-ph");
    expect(n({ category: "cs.LG" }).category).toBe("cs.LG");
  });
  it("ignores anything else", () => {
    expect(n({ category: "x; DROP TABLE" }).category).toBeUndefined();
    expect(n({ category: "a".repeat(40) }).category).toBeUndefined();
  });
});

describe("unknown parameters", () => {
  it("are ignored", () => {
    expect(n({ q: "hola mundo", foo: "bar", page: "3" })).toEqual({ q: "hola mundo", topics: [] });
  });
});

describe("searchKey", () => {
  it("is the same for equivalent input and differs otherwise", () => {
    expect(searchKey(n({ q: " a b ", topic: ["y", "x"] }))).toBe(searchKey(n({ q: "a b", topic: ["x", "y", "x"] })));
    expect(searchKey(n({ q: "a b" }))).not.toBe(searchKey(n({ q: "a b", year_from: "2020" })));
  });
});

describe("helpers", () => {
  it("describes active filters", () => {
    expect(describeFilters(n({ year_from: "2026" }))).toBe("año desde 2026");
    expect(describeFilters(n({ topic: ["vqc"], category: "quant-ph" }))).toBe("tema #vqc · categoría quant-ph");
  });
  it("builds an encoded search href", () => {
    expect(searchHref("a b&c")).toBe("/search?q=a%20b%26c");
  });
});

describe("searchUrl", () => {
  it("rebuilds a canonical URL and adds extras", () => {
    const p = n({ q: " a b ", topic: ["y", "x"], year_from: "2020", category: "quant-ph", junk: "1" });
    expect(searchUrl(p)).toBe("/search?q=a+b&topic=x&topic=y&year_from=2020&category=quant-ph");
    expect(searchUrl(p, { render: "full" })).toContain("&render=full");
    expect(searchUrl(n({}))).toBe("/search");
  });
});
