import "server-only";

export type AiSummary = {
  problema: string;
  metodo: string;
  resultado: string;
  modelo: string;
  fecha: string;
};

export type AuthorRef = { slug: string; name: string };
export type TopicRef = { slug: string; label: string };

/** Paper row without the embedding. Dates are ISO 8601 strings. */
export type Paper = {
  arxivId: string;
  title: string;
  abstract: string;
  publishedAt: string;
  updatedAt: string;
  version: number;
  primaryCategory: string;
  doi: string | null;
  pdfUrl: string;
  aiSummary: AiSummary | null;
};

/** What listings and result rows need: no embedding, no AI summary. */
export type PaperSummary = Pick<
  Paper,
  "arxivId" | "title" | "abstract" | "publishedAt" | "primaryCategory"
> & {
  authors: AuthorRef[];
  topics: TopicRef[];
};

export type PaperDetail = Paper & {
  authors: AuthorRef[];
  topics: TopicRef[];
};

export type SearchFilters = {
  topics?: string[];
  yearFrom?: number;
  yearTo?: number;
  category?: string;
};

export type SearchResult = PaperSummary & {
  /** 1 - cosine distance. */
  similarity: number;
};

export type PaperPage = {
  items: PaperSummary[];
  total: number;
  pageCount: number;
};

export type AuthorWithPapers = { author: AuthorRef; papers: PaperSummary[] };
export type TopicWithPapers = { topic: TopicRef; papers: PaperSummary[] };
