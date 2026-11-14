import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Breadcrumb,
  DataList,
  Kicker,
  PaperRow,
  Panel,
  TextLink,
  TopicTag,
} from "@/components/qp";
import { getPaper, getRelated, listPaperIds } from "@/lib";
import { isoDate, paperRowProps, yearOf } from "@/lib/format";
import { buildScholarlyArticle, serializeJsonLd } from "@/lib/jsonld";
import { pageMetadata, truncateAtWord } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ id: string }> };

const loadPaper = cache(getPaper);

export async function generateStaticParams() {
  const ids = await listPaperIds(100);
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const paper = await loadPaper(decodeURIComponent(id));
  if (!paper) return { title: "Paper no encontrado", robots: { index: false } };
  return pageMetadata({
    title: paper.title,
    description: truncateAtWord(paper.abstract, 155),
    path: `/papers/${paper.arxivId}`,
    type: "article",
  });
}

export default async function PaperPage({ params }: Props) {
  const { id } = await params;
  const paper = await loadPaper(decodeURIComponent(id));
  if (!paper) notFound();

  const related = await getRelated(paper.arxivId, 5);
  const firstTopic = paper.topics[0];
  const ai = paper.aiSummary;

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildScholarlyArticle(paper)) }}
      />
      <div style={{ paddingTop: 8 }}>
        <Breadcrumb
          items={[
            { label: "papers", href: "/papers/page/1" },
            ...(firstTopic ? [{ label: firstTopic.slug, href: `/topics/${firstTopic.slug}` }] : []),
            { label: `arXiv:${paper.arxivId}` },
          ]}
        />
      </div>

      <header style={{ padding: "var(--space-8) 0 var(--space-12)" }}>
        <Kicker>{`paper · ${paper.primaryCategory}`}</Kicker>
        <h1 className="qp-h1 qp-h1--md" style={{ marginTop: 20 }}>{paper.title}</h1>
        <p className="qp-meta">
          {paper.authors.map((a) => a.name).join(", ") || "[autores]"} · {yearOf(paper.publishedAt)} · arXiv:{paper.arxivId}
        </p>
        <div className="qp-actions">
          <a
            className="qp-button"
            style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
            href={`https://arxiv.org/abs/${paper.arxivId}`}
            rel="noopener noreferrer"
          >
            leer en arXiv →
          </a>
          <a className="qp-textlink" href={paper.pdfUrl} rel="noopener noreferrer">ver_pdf →</a>
        </div>
      </header>

      <div className="qp-detail">
        <div className="qp-detail__main">
          <section aria-labelledby="resumen-h">
            <h2 id="resumen-h" className="qp-h2 qp-h2--sm">Resumen</h2>
            <p className="qp-body">{paper.abstract}</p>
          </section>

          {ai ? (
            <section aria-labelledby="ia-h">
              <h2 id="ia-h" className="qp-h2 qp-h2--sm">Resumen con IA</h2>
              <Panel label={`resumen generado con IA · ${ai.modelo} · ${ai.fecha}`}>
                <div className="qp-ai">
                  {(
                    [
                      ["Problema", ai.problema],
                      ["Método", ai.metodo],
                      ["Resultado", ai.resultado],
                    ] as const
                  ).map(([label, text]) => (
                    <div key={label}>
                      <p className="qp-ai__label">{label}</p>
                      <p className="qp-body">{text}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>
          ) : null}

          {related.length > 0 ? (
            <section aria-labelledby="rel-h">
              <h2 id="rel-h" className="qp-h2 qp-h2--sm">Papers relacionados</h2>
              {related.map((p, i) => (
                <PaperRow key={p.arxivId} {...paperRowProps(p, i)} />
              ))}
            </section>
          ) : null}
        </div>

        <aside className="qp-detail__aside">
          <Panel label="// ficha">
            <DataList
              items={[
                { label: "arXiv", value: paper.arxivId },
                { label: "categoría", value: paper.primaryCategory },
                { label: "enviado", value: isoDate(paper.publishedAt) },
                { label: "versión", value: `v${paper.version}` },
                { label: "doi", value: paper.doi ?? "—" },
              ]}
            />
          </Panel>
          {paper.topics.length > 0 ? (
            <Panel label="// temas">
              <div className="qp-tags" style={{ padding: "8px 16px 16px" }}>
                {paper.topics.map((t) => (
                  <TopicTag key={t.slug} label={t.slug} href={`/topics/${t.slug}`} />
                ))}
              </div>
            </Panel>
          ) : null}
          {paper.authors.length > 0 ? (
            <Panel label="// autores">
              <div style={{ padding: "0 16px 12px", display: "flex", flexDirection: "column" }}>
                {paper.authors.map((a) => (
                  <TextLink key={a.slug} href={`/authors/${a.slug}`}>{a.name}</TextLink>
                ))}
              </div>
            </Panel>
          ) : null}
          <Panel label="// cómo se generó esta página">
            <DataList
              items={[
                { label: "estrategia", value: "ISR", accent: true },
                { label: "revalidate", value: "3600 s" },
                { label: "generada", value: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC" },
              ]}
            />
          </Panel>
        </aside>
      </div>
    </main>
  );
}
