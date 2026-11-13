import { describe, expect, it } from "vitest";
import { buildPages, parsePageNumber } from "@/lib/pagination";

describe("parsePageNumber", () => {
  it("accepts integers within range", () => {
    expect(parsePageNumber("1", 3)).toBe(1);
    expect(parsePageNumber("3", 3)).toBe(3);
  });
  it.each(["0", "4", "-1", "1.5", "abc", "", "01", "1e2", "99999999"])("rejects %j", (raw) => {
    expect(parsePageNumber(raw, 3)).toBeNull();
  });
});

describe("buildPages", () => {
  it("lists every page when few", () => {
    expect(buildPages(2, 3).map((p) => p.label)).toEqual(["1", "2", "3"]);
  });
  it("adds gaps and marks the current page", () => {
    const pages = buildPages(5, 10);
    expect(pages.map((p) => (p.gap ? "…" : p.label))).toEqual(["1", "…", "4", "5", "6", "…", "10"]);
    expect(pages.find((p) => p.current)?.href).toBe("/papers/page/5");
  });
});
