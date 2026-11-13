import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Breadcrumb,
  Button,
  Checkbox,
  CommandPalette,
  DataList,
  FilterGroup,
  Kicker,
  Pagination,
  PaperRow,
  Panel,
  Radio,
  ResultRow,
  ResultRowSkeleton,
  SearchPanel,
  SiteFooter,
  SiteHeader,
  TextField,
  TextLink,
  TopicTag,
} from "@/components/qp";

export const metadata: Metadata = {
  title: "Galería de componentes · QuantumPapers",
  robots: { index: false, follow: false },
};

function Section({ name, note, children }: { name: string; note?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`g-${name}`} className="mt-20 first:mt-0">
      <h2 id={`g-${name}`} className="font-sans text-heading font-bold text-text">
        {name}
      </h2>
      {note ? <p className="mt-2 max-w-3xl font-mono text-mono-sm text-text-muted">{note}</p> : null}
      <div className="mt-6 flex flex-col gap-8">{children}</div>
    </section>
  );
}

function Variant({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-mono-xs uppercase text-text-muted">{label}</p>
      {children}
    </div>
  );
}

const LINKS = [
  { label: "papers", href: "#" },
  { label: "temas", href: "#" },
  { label: "autores", href: "#" },
  { label: "cómo_funciona", href: "#" },
];

const PAGES = [
  { label: "1", href: "#" },
  { label: "2", href: "#", current: true },
  { label: "3", href: "#" },
  { gap: true },
  { label: "12", href: "#" },
];

const GROUPS = [
  {
    label: "papers",
    items: [
      { label: "Variational quantum circuits for classification", hint: "paper", active: true },
      { label: "Barren plateaus in parametrized circuits", hint: "paper" },
    ],
  },
  { label: "ir a", items: [{ label: "cómo_funciona", hint: "g h" }, { label: "temas", hint: "g t" }] },
];

export default function ComponentsGallery() {
  if (process.env.VERCEL_ENV === "production") notFound();

  return (
    <div className="mx-auto w-full max-w-[1200px] px-[clamp(20px,4vw,40px)] py-12">
      <header className="mb-20">
        <Kicker>galería del sistema «Laboratorio»</Kicker>
        <h1 className="mt-4 font-sans text-display-md font-bold text-text" style={{ fontSize: "clamp(32px, 4.2vw, 56px)" }}>
          Componentes <span className="text-accent">qp</span>
        </h1>
        <p className="mt-4 max-w-[68ch] font-sans text-body text-text-muted">
          Cada componente con sus variantes y estados. Los estados :hover y :focus-visible no se pueden fijar sin tocar components.css; se
          describen bajo cada componente y se comprueban de forma interactiva.
        </p>
      </header>

      <Section name="Button" note="hover: brightness(1.08). foco: contorno de 2px en text, offset 2px. deshabilitado: opacity 0.5 y cursor not-allowed.">
        <Variant label="reposo">
          <div><Button>buscar ↵</Button></div>
        </Variant>
        <Variant label="deshabilitado">
          <div><Button disabled>buscar ↵</Button></div>
        </Variant>
      </Section>

      <Section name="TextLink" note="hover: subrayado. foco: contorno de 2px en text. Alto mínimo touch-min (44px).">
        <Variant label="reposo"><div><TextLink href="#">ver_todos →</TextLink></div></Variant>
      </Section>

      <Section name="TopicTag" note="hover: fondo bg-panel. foco: contorno de 2px en text.">
        <Variant label="reposo">
          <div className="flex flex-wrap gap-3">
            <TopicTag label="vqc" />
            <TopicTag label="barren-plateaus" />
            <TopicTag label="corrección-de-errores" />
          </div>
        </Variant>
      </Section>

      <Section name="Kicker">
        <Variant label="reposo"><Kicker>búsqueda semántica sobre papers de arXiv</Kicker></Variant>
      </Section>

      <Section name="Breadcrumb" note="El último elemento es la página actual (aria-current) y no lleva enlace. hover: subrayado.">
        <Variant label="reposo">
          <Breadcrumb items={[{ label: "inicio", href: "#" }, { label: "papers", href: "#" }, { label: "vqc para clasificación" }]} />
        </Variant>
      </Section>

      <Section name="SiteHeader" note="Por debajo de 640px pasa a botón de menú. compact fuerza esa versión; open la muestra desplegada.">
        <Variant label="escritorio"><SiteHeader links={LINKS} /></Variant>
        <Variant label="compact (menú cerrado, gestionado por el componente)"><SiteHeader links={LINKS} compact /></Variant>
        <Variant label="compact + open (controlado)"><SiteHeader links={LINKS} compact open /></Variant>
      </Section>

      <Section name="SearchPanel" note="El botón ocupa su propia fila por debajo de 640px.">
        <Variant label="vacío">
          <SearchPanel id="g-search-empty" placeholder="Pregunta con tus palabras…" />
        </Variant>
        <Variant label="con consulta y resultados">
          <SearchPanel id="g-search-results" defaultValue="circuitos variacionales para clasificación">
            <ResultRow rank="01" title="Variational quantum circuits for classification" topic="vqc" similarity={0.92} />
            <ResultRow rank="02" title="Barren plateaus in parametrized quantum circuits" topic="barren-plateaus" similarity={0.71} />
            <ResultRow rank="03" title="Quantum error correction with surface codes" topic="corrección-de-errores" similarity={0.48} />
          </SearchPanel>
        </Variant>
        <Variant label="cargando (ResultRowSkeleton)">
          <SearchPanel id="g-search-loading" defaultValue="circuitos variacionales">
            <ResultRowSkeleton titleWidth="70%" />
            <ResultRowSkeleton titleWidth="55%" />
            <ResultRowSkeleton titleWidth="62%" />
          </SearchPanel>
        </Variant>
      </Section>

      <Section name="PaperRow" note="hover: fondo bg-panel. foco: contorno de 2px en text. Sin año ni arXiv muestra los marcadores por defecto.">
        <Variant label="completa">
          <div>
            <PaperRow href="#" index="01" title="Variational quantum circuits for classification" topic="vqc" year="2024" arxiv="arXiv:2401.00001" />
          </div>
        </Variant>
        <Variant label="con valores por defecto">
          <div><PaperRow href="#" index="02" title="Barren plateaus in parametrized quantum circuits" topic="barren-plateaus" /></div>
        </Variant>
      </Section>

      <Section name="Panel" note="Panel fluido con etiqueta opcional.">
        <Variant label="con etiqueta"><Panel label="ficha del paper"><DataList items={[{ label: "tema", value: "#vqc", accent: true }, { label: "año", value: "[año]" }]} /></Panel></Variant>
        <Variant label="sin etiqueta"><Panel><p className="p-5 font-mono text-mono-sm text-text-muted">contenido libre</p></Panel></Variant>
      </Section>

      <Section name="DataList">
        <Variant label="con valor en acento">
          <DataList
            items={[
              { label: "arxiv", value: "[arXiv:id]" },
              { label: "render", value: "ISR", accent: true },
              { label: "revalidación", value: "24 h" },
            ]}
          />
        </Variant>
      </Section>

      <Section name="Checkbox" note="foco: contorno de 2px en text. El diseño no define estilo propio para el estado deshabilitado.">
        <Variant label="reposo / marcado / deshabilitado">
          <div className="flex flex-wrap gap-x-8">
            <Checkbox name="g-c1" value="a">sin marcar</Checkbox>
            <Checkbox name="g-c2" value="b" defaultChecked>marcado</Checkbox>
            <Checkbox name="g-c3" value="c" disabled>deshabilitado</Checkbox>
          </div>
        </Variant>
      </Section>

      <Section name="Radio">
        <Variant label="grupo (uno marcado, uno deshabilitado)">
          <div className="flex flex-wrap gap-x-8">
            <Radio name="g-r" value="a" defaultChecked>similitud</Radio>
            <Radio name="g-r" value="b">año</Radio>
            <Radio name="g-r" value="c" disabled>autor</Radio>
          </div>
        </Variant>
      </Section>

      <Section name="TextField" note="foco: contorno de 2px en text. El borde es decorativo; la etiqueta visible identifica el campo.">
        <Variant label="con placeholder">
          <div className="max-w-sm"><TextField id="g-tf-1" label="autor" placeholder="[autor]" /></div>
        </Variant>
        <Variant label="con valor">
          <div className="max-w-sm"><TextField id="g-tf-2" label="año desde" type="number" defaultValue="2020" /></div>
        </Variant>
      </Section>

      <Section name="FilterGroup">
        <Variant label="con casillas">
          <FilterGroup legend="tema">
            <div className="flex flex-col">
              <Checkbox name="g-f1" value="vqc" defaultChecked>vqc</Checkbox>
              <Checkbox name="g-f1" value="bp">barren-plateaus</Checkbox>
            </div>
          </FilterGroup>
        </Variant>
        <Variant label="con opciones en fila">
          <FilterGroup legend="orden">
            <div className="qp-filter__row">
              <Radio name="g-f2" value="s" defaultChecked>similitud</Radio>
              <Radio name="g-f2" value="y">año</Radio>
            </div>
          </FilterGroup>
        </Variant>
      </Section>

      <Section name="Pagination" note="La página actual lleva aria-current y borde en acento. hover: fondo bg-panel. foco: contorno de 2px en text.">
        <Variant label="con huecos"><Pagination pages={PAGES} prevHref="#" nextHref="#" /></Variant>
      </Section>

      <Section name="ResultRow / ResultRowSkeleton">
        <Variant label="resultados (similitud 1, 0.5, 0)">
          <ol className="qp-results" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            <ResultRow rank="01" title="Variational quantum circuits for classification" topic="vqc" similarity={1} />
            <ResultRow rank="02" title="Quantum kernels and feature maps" topic="kernels" similarity={0.5} />
            <ResultRow rank="03" title="Quantum error correction with surface codes" topic="corrección-de-errores" similarity={0} />
          </ol>
        </Variant>
        <Variant label="esqueletos">
          <ol className="qp-results" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            <ResultRowSkeleton />
            <ResultRowSkeleton titleWidth="45%" />
          </ol>
        </Variant>
      </Section>

      <Section name="CommandPalette" note="Teclado: flechas mueven la selección (estado activo), esc y ↵ se anuncian en el pie.">
        <Variant label="con resultados y elemento activo">
          <CommandPalette groups={GROUPS} defaultValue="circuitos" />
        </Variant>
        <Variant label="vacía">
          <CommandPalette groups={[]} placeholder="buscar o ir a…" label="Paleta vacía" />
        </Variant>
      </Section>

      <Section name="SiteFooter">
        <Variant label="por defecto"><SiteFooter /></Variant>
        <Variant label="personalizado"><SiteFooter left="datos: arXiv · 2026" right="[versión]" /></Variant>
      </Section>
    </div>
  );
}
