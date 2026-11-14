import type { Metadata } from "next";
import { Kicker, PaperRow, SearchPanel, TextLink, TopicTag } from "@/components/qp";
import { paperRowProps } from "@/lib/format";
import { listPapers } from "@/lib";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "QuantumPapers",
    description: "Buscador semántico de papers de machine learning cuántico: pregunta con tus palabras y obtén los papers de arXiv más cercanos.",
    path: "/",
  }),
  title: { absolute: "QuantumPapers · búsqueda semántica de papers de ML cuántico" },
};

export default async function Home() {
  const { items } = await listPapers({ page: 1, pageSize: 8 });
  const topics = [
    ...new Map(items.flatMap((p) => p.topics).map((t) => [t.slug, t])).values(),
  ];

  return (
    <main>
      <section className="qp-hero">
        <Kicker>búsqueda semántica sobre papers de arXiv</Kicker>
        <h1 className="qp-h1">
          Pregunta con tus palabras. <em>Obtén los papers más cercanos.</em>
        </h1>
        <SearchPanel
          action="/search"
          method="get"
          name="q"
          placeholder="circuitos variacionales para clasificación"
        />
      </section>

      <section id="destacados" className="qp-section" aria-labelledby="destacados-h">
        <div className="qp-section__head">
          <h2 id="destacados-h" className="qp-h2">Papers destacados</h2>
          <TextLink href="/papers/page/1">ver_todos →</TextLink>
        </div>
        <div className="qp-thead" aria-hidden="true">
          <span style={{ flex: "0 0 32px" }}>#</span>
          <span style={{ flex: "1 1 340px" }}>título</span>
          <span style={{ flex: "0 0 150px" }}>tema</span>
          <span style={{ flex: "0 0 64px" }}>año</span>
          <span style={{ flex: "0 0 120px" }}>arXiv</span>
        </div>
        {items.map((p, i) => (
          <PaperRow key={p.arxivId} {...paperRowProps(p, i)} />
        ))}
      </section>

      {topics.length > 0 ? (
        <section id="temas" className="qp-section" aria-labelledby="temas-h">
          <h2 id="temas-h" className="qp-h2" style={{ marginBottom: 16 }}>Temas</h2>
          <div className="qp-tags">
            {topics.map((t) => (
              <TopicTag key={t.slug} label={t.slug} href={`/topics/${t.slug}`} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
