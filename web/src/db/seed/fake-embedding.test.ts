import { describe, expect, it } from "vitest";

import { EMBEDDING_DIMENSIONS, fakeEmbedding } from "./fake-embedding";

describe("fakeEmbedding", () => {
  it("is deterministic", () => {
    expect(fakeEmbedding("2401.00001")).toEqual(fakeEmbedding("2401.00001"));
  });

  it("differs between ids", () => {
    expect(fakeEmbedding("2401.00001")).not.toEqual(fakeEmbedding("2401.00002"));
  });

  it("has 1536 dimensions and unit length", () => {
    const v = fakeEmbedding("quant-ph/0000001");
    expect(v).toHaveLength(EMBEDDING_DIMENSIONS);
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 10);
  });
});
