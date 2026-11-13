import { Button, DataList, Kicker, Panel, TextLink } from "@/components/qp";

export default function NotFound() {
  return (
    <>
      <header style={{ padding: "96px 0 var(--space-12)" }}>
        <Kicker>404 · papers/[id]</Kicker>
        <h1 className="qp-h1 qp-h1--md" style={{ marginTop: 20 }}>Este paper no está en el índice</h1>
        <p className="qp-lead">
          No hay ningún registro para ese identificador. Puede que esté mal escrito o que el paper aún no se haya ingerido.
        </p>
        <div className="qp-actions">
          <form action="/search" method="get">
            <Button type="submit">buscar en el índice</Button>
          </form>
          <TextLink href="/papers/page/1">ver_todos_los_papers →</TextLink>
        </div>
      </header>
      <main style={{ maxWidth: 480 }}>
        <Panel label="// petición">
          <DataList
            items={[
              { label: "estado", value: "404", accent: true },
              { label: "respuesta", value: "notFound()" },
              { label: "indexable", value: "noindex" },
            ]}
          />
        </Panel>
      </main>
    </>
  );
}
