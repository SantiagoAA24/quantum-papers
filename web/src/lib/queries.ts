import "server-only";

import { count, desc, eq, inArray, max, sql } from "drizzle-orm";

import {
  authors,
  paperAuthors,
  paperTopics,
  papers,
  topics,
} from "@/db/schema";
import type { Db } from "@/db";

import { embeddingModel } from "./config";
import { withDb } from "./db";
import { embedQuery } from "./embeddings";
import {
  EmbeddingModelMismatchError,
  InvalidArgumentError,
  InvalidQueryError,
} from "./errors";
import type {
  AuthorRef,
  AuthorWithPapers,
  PaperDetail,
  PaperPage,
  PaperSummary,
  SearchFilters,
  SearchResult,
  TopicRef,
  TopicWithPapers,
} from "./types";

const MAX_ENTITY_PAPERS = 50;

type PaperRow = typeof papers.$inferSelect;
// Every column except the embedding.
const paperColumns = {
  id: papers.id,
  arxivId: papers.arxivId,
  title: papers.title,
  abstract: papers.abstract,
  publishedAt: papers.publishedAt,
  updatedAt: papers.updatedAt,
  version: papers.version,
  primaryCategory: papers.primaryCategory,
  doi: papers.doi,
  pdfUrl: papers.pdfUrl,
  aiSummary: papers.aiSummary,
} as const;
type PaperColumnsRow = Omit<PaperRow, "embedding" | "embeddingModel">;

function assertInt(name: string, value: number, min: number, max: number) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new InvalidArgumentError(`${name} must be an integer in [${min}, ${max}]`);
  }
}

async function loadRefs(db: Db, ids: number[]) {
  const authorsByPaper = new Map<number, AuthorRef[]>();
  const topicsByPaper = new Map<number, TopicRef[]>();
  if (ids.length === 0) return { authorsByPaper, topicsByPaper };

  const [authorRows, topicRows] = await Promise.all([
    db
      .select({ paperId: paperAuthors.paperId, slug: authors.slug, name: authors.name })
      .from(paperAuthors)
      .innerJoin(authors, eq(authors.id, paperAuthors.authorId))
      .where(inArray(paperAuthors.paperId, ids))
      .orderBy(paperAuthors.paperId, paperAuthors.position),
    db
      .select({ paperId: paperTopics.paperId, slug: topics.slug, label: topics.label })
      .from(paperTopics)
      .innerJoin(topics, eq(topics.id, paperTopics.topicId))
      .where(inArray(paperTopics.paperId, ids))
      .orderBy(paperTopics.paperId, topics.label),
  ]);
  for (const r of authorRows) {
    const list = authorsByPaper.get(r.paperId) ?? [];
    list.push({ slug: r.slug, name: r.name });
    authorsByPaper.set(r.paperId, list);
  }
  for (const r of topicRows) {
    const list = topicsByPaper.get(r.paperId) ?? [];
    list.push({ slug: r.slug, label: r.label });
    topicsByPaper.set(r.paperId, list);
  }
  return { authorsByPaper, topicsByPaper };
}

function toSummary(
  row: Pick<PaperColumnsRow, "arxivId" | "title" | "abstract" | "publishedAt" | "primaryCategory">,
  authorList: AuthorRef[] = [],
  topicList: TopicRef[] = [],
): PaperSummary {
  return {
    arxivId: row.arxivId,
    title: row.title,
    abstract: row.abstract,
    publishedAt: new Date(row.publishedAt).toISOString(),
    primaryCategory: row.primaryCategory,
    authors: authorList,
    topics: topicList,
  };
}

async function summarize(db: Db, rows: PaperColumnsRow[]): Promise<PaperSummary[]> {
  const { authorsByPaper, topicsByPaper } = await loadRefs(
    db,
    rows.map((r) => r.id),
  );
  return rows.map((r) =>
    toSummary(r, authorsByPaper.get(r.id), topicsByPaper.get(r.id)),
  );
}

export function getPaper(arxivId: string): Promise<PaperDetail | null> {
  return withDb(async (db) => {
    const [row] = await db
      .select(paperColumns)
      .from(papers)
      .where(eq(papers.arxivId, arxivId.trim()))
      .limit(1);
    if (!row) return null;
    const { authorsByPaper, topicsByPaper } = await loadRefs(db, [row.id]);
    return {
      arxivId: row.arxivId,
      title: row.title,
      abstract: row.abstract,
      publishedAt: new Date(row.publishedAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
      version: row.version,
      primaryCategory: row.primaryCategory,
      doi: row.doi,
      pdfUrl: row.pdfUrl,
      aiSummary: row.aiSummary,
      authors: authorsByPaper.get(row.id) ?? [],
      topics: topicsByPaper.get(row.id) ?? [],
    };
  });
}

export function listPapers({
  page,
  pageSize = 20,
}: {
  page: number;
  pageSize?: number;
}): Promise<PaperPage> {
  assertInt("page", page, 1, 1_000_000);
  assertInt("pageSize", pageSize, 1, 100);
  return withDb(async (db) => {
    const [totalRow] = await db.select({ total: count() }).from(papers);
    const total = totalRow?.total ?? 0;
    const rows = await db
      .select(paperColumns)
      .from(papers)
      .orderBy(desc(papers.publishedAt), desc(papers.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    return {
      items: await summarize(db, rows),
      total,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  });
}

const OPTIONS_TTL_MS = 60 * 60 * 1000;
const optionsCache = new Map<string, { at: number; value: unknown }>();

/** Small per-instance cache for filter options, which change only on ingest. */
async function cachedOptions<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = optionsCache.get(key);
  if (hit && Date.now() - hit.at < OPTIONS_TTL_MS) return hit.value as T;
  const value = await load();
  optionsCache.set(key, { at: Date.now(), value });
  return value;
}

/** Topics that have at least one paper, for the search filters. */
export function listTopics(): Promise<TopicRef[]> {
  return cachedOptions("topics", () =>
    withDb(async (db) => {
      const rows = await db
        .selectDistinct({ slug: topics.slug, label: topics.label })
        .from(topics)
        .innerJoin(paperTopics, eq(paperTopics.topicId, topics.id))
        .orderBy(topics.label);
      return rows;
    }),
  );
}

/** Distinct primary categories, for the search filters. */
export function listCategories(): Promise<string[]> {
  return cachedOptions("categories", () =>
    withDb(async (db) => {
      const rows = await db
        .selectDistinct({ category: papers.primaryCategory })
        .from(papers)
        .orderBy(papers.primaryCategory);
      return rows.map((r) => r.category);
    }),
  );
}

/** Slugs of authors with at least one paper, most prolific first, for generateStaticParams. */
export function listAuthorSlugs(limit = 200): Promise<string[]> {
  assertInt("limit", limit, 1, 100_000);
  return withDb(async (db) => {
    const rows = await db
      .select({ slug: authors.slug })
      .from(authors)
      .innerJoin(paperAuthors, eq(paperAuthors.authorId, authors.id))
      .groupBy(authors.id, authors.slug)
      .orderBy(desc(count()), authors.slug)
      .limit(limit);
    return rows.map((r) => r.slug);
  });
}

/** Slugs of topics with at least one paper, for generateStaticParams. */
export async function listTopicSlugs(): Promise<string[]> {
  return (await listTopics()).map((t) => t.slug);
}

export function listPaperIds(limit?: number): Promise<string[]> {
  if (limit !== undefined) assertInt("limit", limit, 1, 100_000);
  return withDb(async (db) => {
    const query = db
      .select({ arxivId: papers.arxivId })
      .from(papers)
      .orderBy(desc(papers.publishedAt), desc(papers.id));
    const rows = limit === undefined ? await query : await query.limit(limit);
    return rows.map((r) => r.arxivId);
  });
}

export type SitemapEntry = { id: string; updatedAt: string };

/** Every paper with its updated_at, newest first. No limit: the sitemap lists them all. */
export function listPaperSitemapEntries(): Promise<SitemapEntry[]> {
  return withDb(async (db) => {
    const rows = await db
      .select({ id: papers.arxivId, updatedAt: papers.updatedAt })
      .from(papers)
      .orderBy(desc(papers.updatedAt), desc(papers.id));
    return rows.map((r) => ({ id: r.id, updatedAt: new Date(r.updatedAt).toISOString() }));
  });
}

/** Authors and topics have no date of their own: use the newest updated_at of their papers. */
export function listAuthorSitemapEntries(): Promise<SitemapEntry[]> {
  return withDb(async (db) => {
    const rows = await db
      .select({ id: authors.slug, updatedAt: max(papers.updatedAt) })
      .from(authors)
      .innerJoin(paperAuthors, eq(paperAuthors.authorId, authors.id))
      .innerJoin(papers, eq(papers.id, paperAuthors.paperId))
      .groupBy(authors.id, authors.slug)
      .orderBy(authors.slug);
    return rows.flatMap((r) =>
      r.updatedAt ? [{ id: r.id, updatedAt: new Date(r.updatedAt).toISOString() }] : [],
    );
  });
}

export function listTopicSitemapEntries(): Promise<SitemapEntry[]> {
  return withDb(async (db) => {
    const rows = await db
      .select({ id: topics.slug, updatedAt: max(papers.updatedAt) })
      .from(topics)
      .innerJoin(paperTopics, eq(paperTopics.topicId, topics.id))
      .innerJoin(papers, eq(papers.id, paperTopics.paperId))
      .groupBy(topics.id, topics.slug)
      .orderBy(topics.slug);
    return rows.flatMap((r) =>
      r.updatedAt ? [{ id: r.id, updatedAt: new Date(r.updatedAt).toISOString() }] : [],
    );
  });
}

type RawSearchRow = {
  id: number;
  arxiv_id: string;
  title: string;
  abstract: string;
  published_at: string | Date;
  primary_category: string;
  similarity: number | string;
};

function vectorLiteral(vector: number[]): string {
  return `[${vector.join(",")}]`;
}

/** Nearest-neighbour query shared by searchPapers and getRelated. Must run inside a transaction. */
async function vectorSearch(
  tx: Pick<Db, "execute" | "transaction">,
  vector: string,
  opts: { filters?: SearchFilters; limit: number; excludeId?: number },
): Promise<RawSearchRow[]> {
  const { filters = {}, limit, excludeId } = opts;

  await tx.execute(sql`SET LOCAL hnsw.ef_search = 100`);
  try {
    // Needs pgvector >= 0.8. A savepoint keeps the transaction usable if the
    // parameter does not exist.
    await tx.transaction(async (sp) => {
      await sp.execute(sql`SET LOCAL hnsw.iterative_scan = 'relaxed_order'`);
    });
  } catch {
    // Older pgvector: fall back to ef_search only.
  }

  const conditions = [sql`p.embedding IS NOT NULL`];
  if (excludeId !== undefined) conditions.push(sql`p.id <> ${excludeId}`);
  if (filters.yearFrom !== undefined) {
    conditions.push(sql`extract(year FROM p.published_at) >= ${filters.yearFrom}`);
  }
  if (filters.yearTo !== undefined) {
    conditions.push(sql`extract(year FROM p.published_at) <= ${filters.yearTo}`);
  }
  if (filters.category) {
    conditions.push(sql`p.primary_category = ${filters.category}`);
  }
  if (filters.topics && filters.topics.length > 0) {
    const slugs = sql.join(
      filters.topics.map((t) => sql`${t}`),
      sql`, `,
    );
    conditions.push(sql`EXISTS (
      SELECT 1 FROM paper_topics pt
      JOIN topics t ON t.id = pt.topic_id
      WHERE pt.paper_id = p.id AND t.slug IN (${slugs})
    )`);
  }
  const where = sql.join(conditions, sql` AND `);
  const v = sql`${vector}::vector`;

  // relaxed_order can return rows slightly out of order, so re-sort the page.
  const result = await tx.execute(sql`
    SELECT * FROM (
      SELECT p.id, p.arxiv_id, p.title, p.abstract, p.published_at,
             p.primary_category,
             1 - (p.embedding <=> ${v}) AS similarity
      FROM papers p
      WHERE ${where}
      ORDER BY p.embedding <=> ${v}
      LIMIT ${limit}
    ) hits
    ORDER BY similarity DESC, id
  `);
  return (result as unknown as { rows: RawSearchRow[] }).rows;
}

async function toResults(db: Db, raw: RawSearchRow[]): Promise<SearchResult[]> {
  const { authorsByPaper, topicsByPaper } = await loadRefs(
    db,
    raw.map((r) => r.id),
  );
  return raw.map((r) => ({
    ...toSummary(
      {
        arxivId: r.arxiv_id,
        title: r.title,
        abstract: r.abstract,
        publishedAt: new Date(r.published_at),
        primaryCategory: r.primary_category,
      },
      authorsByPaper.get(r.id),
      topicsByPaper.get(r.id),
    ),
    similarity: Number(r.similarity),
  }));
}

export async function searchPapers({
  query,
  filters,
  limit = 20,
}: {
  query: string;
  filters?: SearchFilters;
  limit?: number;
}): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) {
    throw new InvalidQueryError("too_short", "La consulta debe tener al menos 2 caracteres.");
  }
  if (q.length > 200) {
    throw new InvalidQueryError("too_long", "La consulta no puede superar los 200 caracteres.");
  }
  assertInt("limit", limit, 1, 100);

  return withDb(async (db) => {
    const expected = embeddingModel();
    const [stale] = await db
      .select({ model: papers.embeddingModel })
      .from(papers)
      .where(sql`${papers.embeddingModel} <> ${expected}`)
      .limit(1);
    if (stale) throw new EmbeddingModelMismatchError(expected, stale.model);

    const vector = vectorLiteral(await embedQuery(q));
    const raw = await db.transaction((tx) =>
      vectorSearch(tx, vector, { filters, limit }),
    );
    return toResults(db, raw);
  });
}

export function getRelated(arxivId: string, limit = 5): Promise<SearchResult[]> {
  assertInt("limit", limit, 1, 50);
  return withDb(async (db) => {
    const [source] = await db
      .select({ id: papers.id, embedding: sql<string | null>`${papers.embedding}::text` })
      .from(papers)
      .where(eq(papers.arxivId, arxivId.trim()))
      .limit(1);
    if (!source?.embedding) return [];
    const embedding = source.embedding;
    const raw = await db.transaction((tx) =>
      vectorSearch(tx, embedding, { limit, excludeId: source.id }),
    );
    return toResults(db, raw);
  });
}

async function countFor(db: Db, link: "author" | "topic", entityId: number): Promise<number> {
  const [row] =
    link === "author"
      ? await db.select({ n: count() }).from(paperAuthors).where(eq(paperAuthors.authorId, entityId))
      : await db.select({ n: count() }).from(paperTopics).where(eq(paperTopics.topicId, entityId));
  return Number(row?.n ?? 0);
}

async function papersFor(
  db: Db,
  link: "author" | "topic",
  entityId: number,
): Promise<PaperSummary[]> {
  const rows =
    link === "author"
      ? await db
          .select(paperColumns)
          .from(paperAuthors)
          .innerJoin(papers, eq(papers.id, paperAuthors.paperId))
          .where(eq(paperAuthors.authorId, entityId))
          .orderBy(desc(papers.publishedAt), desc(papers.id))
          .limit(MAX_ENTITY_PAPERS)
      : await db
          .select(paperColumns)
          .from(paperTopics)
          .innerJoin(papers, eq(papers.id, paperTopics.paperId))
          .where(eq(paperTopics.topicId, entityId))
          .orderBy(desc(papers.publishedAt), desc(papers.id))
          .limit(MAX_ENTITY_PAPERS);
  return summarize(db, rows);
}

export function getAuthor(slug: string): Promise<AuthorWithPapers | null> {
  return withDb(async (db) => {
    const [row] = await db
      .select({ id: authors.id, slug: authors.slug, name: authors.name })
      .from(authors)
      .where(eq(authors.slug, slug))
      .limit(1);
    if (!row) return null;
    return {
      author: { slug: row.slug, name: row.name },
      total: await countFor(db, "author", row.id),
      papers: await papersFor(db, "author", row.id),
    };
  });
}

export function getTopic(slug: string): Promise<TopicWithPapers | null> {
  return withDb(async (db) => {
    const [row] = await db
      .select({ id: topics.id, slug: topics.slug, label: topics.label })
      .from(topics)
      .where(eq(topics.slug, slug))
      .limit(1);
    if (!row) return null;
    return {
      topic: { slug: row.slug, label: row.label },
      total: await countFor(db, "topic", row.id),
      papers: await papersFor(db, "topic", row.id),
    };
  });
}
