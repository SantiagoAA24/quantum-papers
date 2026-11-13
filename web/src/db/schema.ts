import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  vector,
} from "drizzle-orm/pg-core";

export type AiSummary = {
  problema: string;
  metodo: string;
  resultado: string;
  modelo: string;
  fecha: string;
};

export const papers = pgTable(
  "papers",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    arxivId: text("arxiv_id").notNull(),
    title: text("title").notNull(),
    abstract: text("abstract").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    version: integer("version").notNull().default(1),
    primaryCategory: text("primary_category").notNull(),
    doi: text("doi"),
    pdfUrl: text("pdf_url").notNull(),
    aiSummary: jsonb("ai_summary").$type<AiSummary>(),
    embedding: vector("embedding", { dimensions: 1536 }),
    embeddingModel: text("embedding_model")
      .notNull()
      .default("text-embedding-3-small"),
  },
  (t) => [
    unique("papers_arxiv_id_unique").on(t.arxivId),
    index("papers_embedding_hnsw_idx").using(
      "hnsw",
      t.embedding.op("vector_cosine_ops"),
    ),
    index("papers_published_at_idx").using("btree", t.publishedAt),
  ],
);

export const authors = pgTable(
  "authors",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
  },
  (t) => [unique("authors_slug_unique").on(t.slug)],
);

export const topics = pgTable(
  "topics",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
  },
  (t) => [unique("topics_slug_unique").on(t.slug)],
);

export const paperAuthors = pgTable(
  "paper_authors",
  {
    paperId: integer("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.paperId, t.authorId] }),
    index("paper_authors_author_paper_idx").using(
      "btree",
      t.authorId,
      t.paperId,
    ),
  ],
);

export const paperTopics = pgTable(
  "paper_topics",
  {
    paperId: integer("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    topicId: integer("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.paperId, t.topicId] }),
    index("paper_topics_topic_paper_idx").using("btree", t.topicId, t.paperId),
  ],
);
