import type { Metadata } from "next";
import Link from "next/link";
import { DataList, Kicker, Panel } from "@/components/qp";
import { isSample, lighthouse } from "@/lib/metrics";

export const metadata: Metadata = { title: "Cómo funciona" };

const SSG = [
  { label: "/", value: "SSG" },
  { label: "/about", value: "SSG" },
  { label: "/how-it-works", value: "SSG", accent: true },
];
const ISR = [
  { label: "/papers", value: "ISR" },
  { label: "/papers/[id]", value: "ISR", accent: true },
  { label: "/authors/[slug]", value: "ISR" },
  { label: "/topics/[slug]", value: "ISR" },
];
const SSR = [{ label: "/search", value: "SSR + streaming", accent: true }];
const STACK = [
  { label: "framework", value: "Next.js · App Router" },
  { label: "datos", value: "Postgres + pgvector" },
  { label: "ORM", value: "Drizzle" },
  { label: "interfaz", value: "Tailwind + shadcn/ui" },
  { label: "despliegue", value: "Vercel + Neon" },
];
const STEPS = [
  ["01 · ingesta", "Un script en Python descarga los metadatos y abstracts nuevos de arXiv en la categoría de ML cuántico."],
  ["02 · embeddings", "Cada abstract se convierte en un vector con un modelo de embeddings y se genera un resumen con IA."],
  ["03 · almacenamiento", "Vectores, metadatos y resumen se guardan en Postgres con la extensión pgvector."],
  ["04 · consulta", "La consulta se convierte en un vector y se comparan distancias; la similitud se muestra en cada resultado."],
] as const;

export default function HowItWorksPage() {
  return (
    <main>
      <header className="qp-info-head">
        <Kicker>cómo_funciona</Kicker>
        <h1 className="qp-h1 qp-h1--md">Cada página elige cómo se renderiza</h1>
        <p className="qp-body">
          QuantumPapers es un buscador semántico de papers de ML cuántico y también una demostración de renderizado en el servidor. Esta página explica qué estrategia usa cada ruta, por qué, y cómo viaja un paper desde arXiv hasta un resultado de búsqueda.
        </p>
      </header>

      <section className="qp-info-section" aria-labelledby="estrategias-h">
        <h2 id="estrategias-h" className="qp-h2">Tres estrategias, según qué tan fresco debe ser el dato</h2>
        <div className="qp-grid qp-grid--300">
          <Panel label="ssg">
            <p className="qp-card-text">Se genera una vez al desplegar. Es la opción más rápida y sirve para páginas que no cambian con los datos.</p>
            <DataList items={SSG} />
          </Panel>
          <Panel label="isr">
            <p className="qp-card-text">Se genera al primer acceso y se revalida en segundo plano. Sirve para el catálogo, que cambia cuando entra un paper nuevo.</p>
            <DataList items={ISR} />
          </Panel>
          <Panel label="ssr_streaming">
            <p className="qp-card-text">Se genera en cada petición y envía el HTML por partes. La búsqueda depende de la consulta, así que no se puede pregenerar.</p>
            <DataList items={SSR} />
          </Panel>
        </div>
      </section>

      <section className="qp-info-section" aria-labelledby="flujo-h">
        <h2 id="flujo-h" className="qp-h2">Del paper al resultado</h2>
        <div className="qp-grid qp-grid--240">
          {STEPS.map(([label, text]) => (
            <Panel key={label} label={label}>
              <p className="qp-card-text qp-card-text--step">{text}</p>
            </Panel>
          ))}
        </div>
      </section>

      <section className="qp-info-section" aria-labelledby="medicion-h">
        <h2 id="medicion-h" className="qp-h2">Medición y stack</h2>
        <div className="qp-grid qp-grid--340">
          <Panel label={isSample ? "// lighthouse · ci · valores de ejemplo" : "// lighthouse · ci"}>
            <DataList items={[...lighthouse]} />
          </Panel>
          <Panel label="// stack">
            <DataList items={STACK} />
          </Panel>
        </div>
        <p className="qp-footnote">
          {isSample
            ? "// valores de ejemplo: las métricas se rellenan con la medición real al desplegar"
            : "// las métricas se rellenan con la medición real al desplegar"}
        </p>
      </section>

      <section className="qp-info-section" aria-label="Siguientes pasos">
        <div className="qp-actions" style={{ marginTop: 0 }}>
          <Link className="qp-button" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }} href="/search">
            probar la búsqueda
          </Link>
        </div>
      </section>
    </main>
  );
}
