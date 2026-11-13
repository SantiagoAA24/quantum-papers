/**
 * Idempotent dev seed. Reads papers.json and upserts by arxiv_id.
 *
 * !!! The embeddings written here are FAKE (see fake-embedding.ts, tagged
 * !!! embedding_model = 'dev-fake'). Phase 4 replaces them with real vectors.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { sql } from "drizzle-orm";

import { createDb } from "../index.ts";
import {
  authors,
  paperAuthors,
  paperTopics,
  papers,
  topics,
} from "../schema.ts";
import { FAKE_EMBEDDING_MODEL, fakeEmbedding } from "./fake-embedding.ts";

type SeedPaper = {
  arxiv_id: string;
  title: string;
  abstract: string;
  authors: string[];
  categories: string[];
  primary_category: string;
  published_at: string;
  updated_at: string;
  version?: number;
  doi?: string | null;
  pdf_url?: string;
};

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const file = fileURLToPath(new URL("./papers.json", import.meta.url));
  const data = JSON.parse(readFileSync(file, "utf8")) as SeedPaper[];
  const { db, close } = await createDb();

  try {
    for (const p of data) {
      await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(papers)
          .values({
            arxivId: p.arxiv_id,
            title: p.title,
            abstract: p.abstract,
            publishedAt: new Date(p.published_at),
            updatedAt: new Date(p.updated_at),
            version: p.version ?? 1,
            primaryCategory: p.primary_category,
            doi: p.doi ?? null,
            pdfUrl: p.pdf_url ?? `https://arxiv.org/pdf/${p.arxiv_id}`,
            embedding: fakeEmbedding(p.arxiv_id),
            embeddingModel: FAKE_EMBEDDING_MODEL,
          })
          .onConflictDoUpdate({
            target: papers.arxivId,
            set: {
              title: sql`excluded.title`,
              abstract: sql`excluded.abstract`,
              publishedAt: sql`excluded.published_at`,
              updatedAt: sql`excluded.updated_at`,
              version: sql`excluded.version`,
              primaryCategory: sql`excluded.primary_category`,
              doi: sql`excluded.doi`,
              pdfUrl: sql`excluded.pdf_url`,
              embedding: sql`excluded.embedding`,
              embeddingModel: sql`excluded.embedding_model`,
            },
          })
          .returning({ id: papers.id });
        if (!row) throw new Error(`Upsert returned no row for ${p.arxiv_id}`);
        const paperId = row.id;

        for (const [position, name] of p.authors.entries()) {
          const slug = slugify(name);
          await tx
            .insert(authors)
            .values({ slug, name })
            .onConflictDoNothing({ target: authors.slug });
          const [a] = await tx
            .select({ id: authors.id })
            .from(authors)
            .where(sql`${authors.slug} = ${slug}`);
          if (!a) throw new Error(`Author not found: ${slug}`);
          await tx
            .insert(paperAuthors)
            .values({ paperId, authorId: a.id, position })
            .onConflictDoUpdate({
              target: [paperAuthors.paperId, paperAuthors.authorId],
              set: { position },
            });
        }

        for (const category of new Set(p.categories)) {
          const slug = slugify(category);
          await tx
            .insert(topics)
            .values({ slug, label: category })
            .onConflictDoNothing({ target: topics.slug });
          const [t] = await tx
            .select({ id: topics.id })
            .from(topics)
            .where(sql`${topics.slug} = ${slug}`);
          if (!t) throw new Error(`Topic not found: ${slug}`);
          await tx
            .insert(paperTopics)
            .values({ paperId, topicId: t.id })
            .onConflictDoNothing();
        }
      });
    }
    console.log(`Seeded ${data.length} papers (embeddings are dev-fake).`);
  } finally {
    await close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
