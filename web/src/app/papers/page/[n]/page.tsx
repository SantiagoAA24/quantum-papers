import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Kicker, Pagination, PaperRow } from "@/components/qp";
import { listPapers } from "@/lib";
import { paperRowProps } from "@/lib/format";
import { buildPages, pageHref, parsePageNumber } from "@/lib/pagination";

export const revalidate = 3600;
export const dynamicParams = true;

const PAGE_SIZE = 20;
const PREBUILT_PAGES = 5;

type Props = { params: Promise<{ n: string }> };

export async function generateStaticParams() {
  const { pageCount } = await listPapers({ page: 1, pageSize: PAGE_SIZE });
  return Array.from({ length: Math.min(pageCount, PREBUILT_PAGES) }, (_, i) => ({
    n: String(i + 1),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { n } = await params;
  return { title: `Papers · página ${n}` };
}

export default async function PapersPage({ params }: Props) {
  const { n: raw } = await params;
  // Cheap syntactic check before touching the database.
  if (parsePageNumber(raw, Number.MAX_SAFE_INTEGER) === null) notFound();
  const page = Number(raw);

  const { items, total, pageCount } = await listPapers({ page, pageSize: PAGE_SIZE });
  if (parsePageNumber(raw, pageCount) === null) notFound();

  const offset = (page - 1) * PAGE_SIZE;

  return (
    <main>
      <header style={{ padding: "var(--space-12) 0 var(--space-8)" }}>
        <Kicker>catálogo</Kicker>
        <h1 className="qp-h1 qp-h1--md" style={{ marginTop: 20 }}>Todos los papers</h1>
        <p className="qp-meta">
          {total} papers · página {page} de {pageCount}
        </p>
      </header>
      <section aria-label="Listado de papers">
        <div className="qp-thead" aria-hidden="true">
          <span style={{ flex: "0 0 32px" }}>#</span>
          <span style={{ flex: "1 1 340px" }}>título</span>
          <span style={{ flex: "0 0 150px" }}>tema</span>
          <span style={{ flex: "0 0 64px" }}>año</span>
          <span style={{ flex: "0 0 120px" }}>arXiv</span>
        </div>
        {items.map((p, i) => (
          <PaperRow key={p.arxivId} {...paperRowProps(p, offset + i)} />
        ))}
      </section>
      <Pagination
        className="qp-pager"
        pages={buildPages(page, pageCount)}
        prevHref={page > 1 ? pageHref(page - 1) : undefined}
        nextHref={page < pageCount ? pageHref(page + 1) : undefined}
      />
    </main>
  );
}
