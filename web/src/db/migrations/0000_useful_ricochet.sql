CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "authors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "authors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "paper_authors" (
	"paper_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "paper_authors_paper_id_author_id_pk" PRIMARY KEY("paper_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "paper_topics" (
	"paper_id" integer NOT NULL,
	"topic_id" integer NOT NULL,
	CONSTRAINT "paper_topics_paper_id_topic_id_pk" PRIMARY KEY("paper_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "papers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "papers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"arxiv_id" text NOT NULL,
	"title" text NOT NULL,
	"abstract" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"primary_category" text NOT NULL,
	"doi" text,
	"pdf_url" text NOT NULL,
	"ai_summary" jsonb,
	"embedding" vector(1536),
	"embedding_model" text DEFAULT 'text-embedding-3-small' NOT NULL,
	CONSTRAINT "papers_arxiv_id_unique" UNIQUE("arxiv_id")
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "topics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "topics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "paper_authors" ADD CONSTRAINT "paper_authors_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_authors" ADD CONSTRAINT "paper_authors_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_topics" ADD CONSTRAINT "paper_topics_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_topics" ADD CONSTRAINT "paper_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "paper_authors_author_paper_idx" ON "paper_authors" USING btree ("author_id","paper_id");--> statement-breakpoint
CREATE INDEX "paper_topics_topic_paper_idx" ON "paper_topics" USING btree ("topic_id","paper_id");--> statement-breakpoint
CREATE INDEX "papers_embedding_hnsw_idx" ON "papers" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "papers_published_at_idx" ON "papers" USING btree ("published_at");