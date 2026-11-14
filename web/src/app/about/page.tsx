import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { DataList, Kicker, Panel, TextLink } from "@/components/qp";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: "Quién hizo QuantumPapers y por qué: un buscador semántico de papers de ML cuántico.",
  path: "/about",
});

const FICHA = [
  { label: "ubicación", value: "Bogotá, Colombia" },
  { label: "enfoque", value: "fullstack + IA/ML", accent: true },
  { label: "stack", value: "React · TypeScript · FastAPI" },
  { label: "idiomas", value: "español · inglés" },
];

// Design placeholders still without content (extra paragraph, published paper, contact links)
// are intentionally omitted until the real text and URLs exist.
export default function AboutPage() {
  return (
    <>
      <header className="qp-info-head">
        <Kicker>about</Kicker>
        <h1 className="qp-h1 qp-h1--md">Físico y desarrollador fullstack, en Bogotá</h1>
        <p className="qp-body">
          Soy Santiago. Construyo aplicaciones web con React, TypeScript y FastAPI, y las conecto con modelos de IA. Vengo de la investigación en aprendizaje automático cuántico, y de ahí salió este proyecto.
        </p>
      </header>

      <div className="qp-about">
        <main className="qp-about__main">
          <section aria-labelledby="por-que-h">
            <h2 id="por-que-h" className="qp-h2" style={{ marginBottom: 20 }}>Por qué QuantumPapers</h2>
            <p className="qp-body">
              Leer literatura de ML cuántico me hizo ver cuánto cuesta encontrar el paper correcto con palabras clave. Este buscador semántico resuelve ese problema y, a la vez, me sirve para mostrar cómo decido entre SSG, ISR y SSR en una aplicación real.
            </p>
          </section>

          <section aria-labelledby="busco-h">
            <h2 id="busco-h" className="qp-h2" style={{ marginBottom: 20 }}>Lo que busco</h2>
            <p className="qp-body">
              Roles fullstack con IA/ML, de preferencia remotos y con equipos fuera de Colombia.
            </p>
            <div className="qp-actions" style={{ marginTop: 24 }}>
              <TextLink href="/how-it-works">ver_cómo_funciona →</TextLink>
            </div>
          </section>
        </main>

        <aside className="qp-about__aside">
          <Panel label="// ficha">
            <DataList items={FICHA} />
          </Panel>
        </aside>
      </div>
    </>
  );
}
