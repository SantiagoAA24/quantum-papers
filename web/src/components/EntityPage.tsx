import { Breadcrumb, Kicker, PaperRow } from "@/components/qp";
import { paperRowProps } from "@/lib/format";
import type { PaperSummary } from "@/lib/types";

type Props = {
  kind: "autor" | "tema";
  /** Plural segment shown first in the breadcrumb, e.g. "autores". */
  crumb: { label: string; href: string };
  name: string;
  total: number;
  papers: PaperSummary[];
};

/** Shared layout of /authors/[slug] and /topics/[slug]. */
export function EntityPage({ kind, crumb, name, total, papers }: Props) {
  return (
    <main>
      <div style={{ paddingTop: 8 }}>
        <Breadcrumb items={[crumb, { label: name }]} />
      </div>
      <header style={{ padding: "var(--space-8) 0 var(--space-8)" }}>
        <Kicker>{kind}</Kicker>
        <h1 className="qp-h1 qp-h1--md" style={{ marginTop: 20 }}>{name}</h1>
        <p className="qp-meta">{total} {total === 1 ? "paper" : "papers"}</p>
      </header>
      <section aria-label={`Papers de ${name}`}>
        <div className="qp-thead" aria-hidden="true">
          <span style={{ flex: "0 0 32px" }}>#</span>
          <span style={{ flex: "1 1 340px" }}>título</span>
          <span style={{ flex: "0 0 150px" }}>tema</span>
          <span style={{ flex: "0 0 64px" }}>año</span>
          <span style={{ flex: "0 0 120px" }}>arXiv</span>
        </div>
        {papers.map((p, i) => (
          <PaperRow key={p.arxivId} {...paperRowProps(p, i)} />
        ))}
      </section>
      {total > papers.length ? (
        <p className="qp-note" role="note">
          {`// mostrando los ${papers.length} más recientes de ${total} papers`}
        </p>
      ) : null}
    </main>
  );
}
