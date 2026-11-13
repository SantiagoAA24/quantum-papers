// @vitest-environment node
/**
 * Integration tests for src/lib against a dedicated Neon test branch.
 * Set DATABASE_URL_TEST to enable them; without it the suite is skipped.
 * WARNING: the suite TRUNCATES papers/authors/topics on that database.
 */
import { resolve } from "node:path";

import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { createDb } from "@/db";
import { authors, paperAuthors, paperTopics, papers, topics } from "@/db/schema";
import { fakeEmbedding } from "@/db/seed/fake-embedding";

const url = process.env.DATABASE_URL_TEST;
const TEST_MODEL = "test-embedding-model";

if (!url) {
  console.warn(
    "\n[integration] DATABASE_URL_TEST is not set: skipping src/lib integration tests.\n" +
      "              Point it at a dedicated Neon test branch to run them.\n",
  );
}

// The query embedding comes from a fixture instead of OpenAI.
const queryVectors = new Map<string, number[]>();
vi.mock("@/lib/embeddings", () => ({
  embedQuery: async (text: string) => {
    const v = queryVectors.get(text);
    if (!v) throw new Error(`No fixture vector for query "${text}"`);
    return v;
  },
}));

const CORE = 25;
const FILLERS = 400;
const STRICT = 8;
const TOTAL = CORE + FILLERS + STRICT;

describe.skipIf(!url)("src/lib (integration)", () => {
  let lib: typeof import("@/lib");
  let closeSetup: () => Promise<void>;
  let iterativeScan = false;

  beforeAll(async () => {
    if (url === process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL_TEST must not equal DATABASE_URL");
    }
    process.env.DATABASE_URL = url;
    process.env.EMBEDDING_MODEL = TEST_MODEL;

    const { db, close, migrate } = await createDb(url);
    closeSetup = close;
    await migrate(resolve(process.cwd(), "src/db/migrations"));
    await db.execute(
      sql`TRUNCATE papers, authors, topics, paper_authors, paper_topics RESTART IDENTITY CASCADE`,
    );

    const [author] = await db
      .insert(authors)
      .values({ slug: "ada-test", name: "Ada Test" })
      .returning({ id: authors.id });
    const [topicA, topicStrict] = await db
      .insert(topics)
      .values([
        { slug: "qml-test", label: "QML de prueba" },
        { slug: "strict-topic", label: "Tema estricto" },
      ])
      .returning({ id: topics.id });

    const row = (
      arxivId: string,
      published: string,
      category: string,
      extra: Partial<typeof papers.$inferInsert> = {},
    ): typeof papers.$inferInsert => ({
      arxivId,
      title: `Title ${arxivId}`,
      abstract: `Abstract ${arxivId}`,
      publishedAt: new Date(published),
      updatedAt: new Date(published),
      primaryCategory: category,
      pdfUrl: `https://arxiv.org/pdf/${arxivId}`,
      embedding: fakeEmbedding(arxivId),
      embeddingModel: TEST_MODEL,
      ...extra,
    });

    // Core: one per month from 2023-01, alternating categories.
    const core = Array.from({ length: CORE }, (_, i) => {
      const month = String((i % 12) + 1).padStart(2, "0");
      const year = 2023 + Math.floor(i / 12);
      return row(
        `core.${String(i + 1).padStart(4, "0")}`,
        `${year}-${month}-15T00:00:00Z`,
        i % 2 === 0 ? "quant-ph" : "cs.LG",
        i === 0
          ? {
              aiSummary: {
                problema: "p",
                metodo: "m",
                resultado: "r",
                modelo: "mo",
                fecha: "2023-01-15",
              },
            }
          : {},
      );
    });
    const fillers = Array.from({ length: FILLERS }, (_, i) =>
      row(`filler.${i}`, "2020-06-01T00:00:00Z", "filler"),
    );
    const strict = Array.from({ length: STRICT }, (_, i) =>
      row(`strict.${i}`, "2022-03-01T00:00:00Z", "strict-cat"),
    );

    const all = [...core, ...fillers, ...strict];
    for (let i = 0; i < all.length; i += 100) {
      await db.insert(papers).values(all.slice(i, i + 100));
    }
    const ids = await db
      .select({ id: papers.id, arxivId: papers.arxivId })
      .from(papers);
    const idOf = new Map(ids.map((r) => [r.arxivId, r.id]));

    await db.insert(paperAuthors).values(
      ["core.0001", "core.0002", "core.0003"].map((a, position) => ({
        paperId: idOf.get(a)!,
        authorId: author!.id,
        position,
      })),
    );
    await db.insert(paperTopics).values([
      ...core.slice(0, 12).map((p) => ({
        paperId: idOf.get(p.arxivId)!,
        topicId: topicA!.id,
      })),
      ...strict.map((p) => ({
        paperId: idOf.get(p.arxivId)!,
        topicId: topicStrict!.id,
      })),
    ]);

    // Is hnsw.iterative_scan available (pgvector >= 0.8)?
    try {
      await db.transaction(async (tx) => {
        await tx.execute(sql`SET LOCAL hnsw.iterative_scan = 'relaxed_order'`);
      });
      iterativeScan = true;
    } catch {
      iterativeScan = false;
    }

    lib = await import("@/lib");
  }, 120_000);

  afterAll(async () => {
    const { closeDb } = await import("@/lib/db");
    await closeDb();
    await closeSetup?.();
  });

  it("getPaper returns detail with ordered authors, topics and ai_summary", async () => {
    const paper = await lib.getPaper("core.0001");
    expect(paper?.title).toBe("Title core.0001");
    expect(paper?.aiSummary?.problema).toBe("p");
    expect(paper?.authors).toEqual([{ slug: "ada-test", name: "Ada Test" }]);
    expect(paper?.topics).toEqual([{ slug: "qml-test", label: "QML de prueba" }]);
    expect(paper).not.toHaveProperty("embedding");
  });

  it("getPaper returns null for an unknown id", async () => {
    expect(await lib.getPaper("does.not.exist")).toBeNull();
  });

  it("listPapers paginates with correct total and pageCount", async () => {
    const first = await lib.listPapers({ page: 1 });
    expect(first.total).toBe(TOTAL);
    expect(first.pageCount).toBe(Math.ceil(TOTAL / 20));
    expect(first.items).toHaveLength(20);

    const dates = first.items.map((p) => p.publishedAt);
    expect([...dates].sort().reverse()).toEqual(dates);

    const last = await lib.listPapers({ page: first.pageCount });
    expect(last.items).toHaveLength(TOTAL - 20 * (first.pageCount - 1));

    const beyond = await lib.listPapers({ page: first.pageCount + 1 });
    expect(beyond.items).toHaveLength(0);
    expect(beyond.total).toBe(TOTAL);

    const small = await lib.listPapers({ page: 1, pageSize: 100 });
    expect(small.pageCount).toBe(Math.ceil(TOTAL / 100));
  });

  it("listPaperIds honours the limit", async () => {
    expect(await lib.listPaperIds()).toHaveLength(TOTAL);
    expect(await lib.listPaperIds(5)).toHaveLength(5);
  });

  it("searchPapers ranks by similarity without filters", async () => {
    queryVectors.set("exact match", fakeEmbedding("core.0005"));
    const results = await lib.searchPapers({ query: "  exact match  " });
    expect(results).toHaveLength(20);
    expect(results[0]?.arxivId).toBe("core.0005");
    expect(results[0]?.similarity).toBeCloseTo(1, 5);
    const sims = results.map((r) => r.similarity);
    expect([...sims].sort((a, b) => b - a)).toEqual(sims);
    expect(results[0]?.authors).toEqual([]);
  });

  it("searchPapers applies year, category and topic filters", async () => {
    queryVectors.set("filtered", fakeEmbedding("query-filtered"));

    const byYear = await lib.searchPapers({
      query: "filtered",
      filters: { yearFrom: 2024, yearTo: 2024 },
      limit: 50,
    });
    expect(byYear.length).toBeGreaterThan(0);
    expect(byYear.every((r) => r.publishedAt.startsWith("2024"))).toBe(true);

    const byCategory = await lib.searchPapers({
      query: "filtered",
      filters: { category: "cs.LG" },
      limit: 50,
    });
    expect(byCategory.length).toBe(Math.floor(CORE / 2));
    expect(byCategory.every((r) => r.primaryCategory === "cs.LG")).toBe(true);

    const byTopic = await lib.searchPapers({
      query: "filtered",
      filters: { topics: ["qml-test"] },
      limit: 50,
    });
    expect(byTopic).toHaveLength(12);
    expect(byTopic.every((r) => r.topics.some((t) => t.slug === "qml-test"))).toBe(true);
  });

  it(
    "a strict filter still returns every available row up to the limit (HNSW)",
    async (ctx) => {
      if (!iterativeScan) {
        console.warn(
          "[integration] pgvector without hnsw.iterative_scan (< 0.8): skipping the strict-filter test.",
        );
        ctx.skip();
      }
      queryVectors.set("strict", fakeEmbedding("query-strict"));
      const results = await lib.searchPapers({
        query: "strict",
        filters: { category: "strict-cat" },
        limit: 20,
      });
      expect(results).toHaveLength(STRICT);
      const limited = await lib.searchPapers({
        query: "strict",
        filters: { category: "strict-cat" },
        limit: 5,
      });
      expect(limited).toHaveLength(5);
    },
  );

  it("searchPapers validates the query", async () => {
    for (const [query, reason] of [
      ["", "too_short"],
      [" a ", "too_short"],
      ["x".repeat(201), "too_long"],
    ] as const) {
      await expect(lib.searchPapers({ query })).rejects.toMatchObject({
        name: "InvalidQueryError",
        reason,
      });
    }
  });

  it("searchPapers refuses to mix embedding models", async () => {
    const { db, close } = await createDb(url);
    try {
      await db.execute(sql`UPDATE papers SET embedding_model = 'dev-fake' WHERE arxiv_id = 'filler.0'`);
      queryVectors.set("model check", fakeEmbedding("m"));
      await expect(lib.searchPapers({ query: "model check" })).rejects.toBeInstanceOf(
        lib.EmbeddingModelMismatchError,
      );
    } finally {
      await db.execute(sql`UPDATE papers SET embedding_model = ${TEST_MODEL} WHERE arxiv_id = 'filler.0'`);
      await close();
    }
  });

  it("getRelated excludes the paper itself", async () => {
    const related = await lib.getRelated("core.0003", 5);
    expect(related).toHaveLength(5);
    expect(related.map((r) => r.arxivId)).not.toContain("core.0003");
    const sims = related.map((r) => r.similarity);
    expect([...sims].sort((a, b) => b - a)).toEqual(sims);
    expect(await lib.getRelated("does.not.exist")).toEqual([]);
  });

  it("getAuthor and getTopic return the entity with its papers, newest first", async () => {
    const author = await lib.getAuthor("ada-test");
    expect(author?.author.name).toBe("Ada Test");
    expect(author?.papers.map((p) => p.arxivId)).toEqual(["core.0003", "core.0002", "core.0001"]);
    expect(await lib.getAuthor("nobody")).toBeNull();

    const topic = await lib.getTopic("qml-test");
    expect(topic?.papers).toHaveLength(12);
    expect(await lib.getTopic("nothing")).toBeNull();
  });

  it("caps entity papers at 50", async () => {
    const { db, close } = await createDb(url);
    try {
      const [author] = await db.insert(authors).values({ slug: "prolific", name: "Prolific" }).returning({ id: authors.id });
      const rows = await db.select({ id: papers.id }).from(papers).limit(60);
      await db.insert(paperAuthors).values(
        rows.map((r, position) => ({ paperId: r.id, authorId: author!.id, position })),
      );
      const result = await lib.getAuthor("prolific");
      expect(result?.papers).toHaveLength(50);
    } finally {
      await close();
    }
  });

  it("maps database failures to DataUnavailableError", async () => {
    const saved = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgres://nobody:nope@127.0.0.1:1/none";
    try {
      await expect(lib.getPaper("core.0001")).rejects.toBeInstanceOf(lib.DataUnavailableError);
    } finally {
      process.env.DATABASE_URL = saved;
    }
  });
});
