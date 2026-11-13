import { Button, Panel, ResultRow, ResultRowSkeleton, TextLink } from "@/components/qp";
import { rowIndex } from "@/lib/format";
import { describeFilters, hasFilters, searchUrl, type SearchParams } from "@/lib/search-params";
import { SearchErrorState } from "./SearchErrorState";
import { loadResults } from "./loadResults";

const SKELETON_WIDTHS = ["62%", "48%", "68%", "54%", "58%", "50%"];

/** Fallback of the Suspense boundary: six skeleton rows. */
export function ResultsFallback({ fullHref }: { fullHref: string }) {
  return (
    <Panel label="buscando…">
      {/*
        React streams the results in a hidden <div> and an inline script swaps
        them in. Without JavaScript that never happens, so <noscript> sends the
        browser to the same search rendered in one piece (render=full). With
        JavaScript, <noscript> is inert and the swap discards this fallback.
      */}
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=${fullHref}`} />
        <p className="qp-note" style={{ padding: "0 20px" }}>
          <a href={fullHref}>ver resultados sin JavaScript →</a>
        </p>
      </noscript>
      <ol className="qp-results" aria-busy="true">
        {SKELETON_WIDTHS.map((w, i) => (
          <ResultRowSkeleton key={i} titleWidth={w} />
        ))}
      </ol>
    </Panel>
  );
}

export function StatusFallback() {
  return (
    <p role="status" className="qp-meta">
      buscando…
    </p>
  );
}

/**
 * `inline` is the no-JavaScript variant (render=full): there the route-level
 * error.tsx would only paint in the browser, so failures render in place.
 */
export async function ResultsStatus({ params, inline = false }: { params: SearchParams; inline?: boolean }) {
  const results = await loadResults(params).catch((e: unknown) => {
    if (inline) return null;
    throw e;
  });
  if (!results) return null;
  const filters = describeFilters(params);
  const count = `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`;
  return (
    <p role="status" className="qp-meta">
      {filters ? `${count} · ${filters}` : `${count} · ordenados por similitud`}
    </p>
  );
}

export async function SearchResults({ params, inline = false }: { params: SearchParams; inline?: boolean }) {
  const results = await loadResults(params).catch((e: unknown) => {
    if (inline) {
      console.error(e);
      return null;
    }
    throw e;
  });
  if (!results) {
    return (
      <SearchErrorState retry={<TextLink href={searchUrl(params, { render: "full" })}>reintentar →</TextLink>} />
    );
  }

  if (results.length === 0) {
    const filtered = hasFilters(params);
    return (
      <Panel label="sin_resultados">
        <div style={{ padding: "8px 20px 32px" }}>
          <h2 className="qp-state-title">Ningún paper se acerca lo suficiente a esa consulta</h2>
          <p className="body qp-state-text">
            {filtered
              ? "Los filtros activos dejan fuera casi todo el índice. Prueba quitarlos o describir la idea con otras palabras."
              : "Prueba describir la idea con otras palabras."}
          </p>
          <div className="qp-actions">
            {filtered ? (
              <form action="/search" method="get">
                <input type="hidden" name="q" value={params.q} />
                <Button type="submit">limpiar filtros</Button>
              </form>
            ) : null}
            <TextLink href="/papers/page/1">ver_todos_los_papers →</TextLink>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel label={`resultados · ${results.length} · ordenados por similitud`}>
      <ol className="qp-results">
        {results.map((r, i) => (
          <ResultRow
            key={r.arxivId}
            rank={rowIndex(i)}
            title={r.title}
            topic={r.topics[0]?.slug ?? r.primaryCategory}
            similarity={r.similarity}
            href={`/papers/${r.arxivId}`}
          />
        ))}
      </ol>
    </Panel>
  );
}
