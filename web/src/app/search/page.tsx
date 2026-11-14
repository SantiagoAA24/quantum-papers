import type { Metadata } from "next";
import { Suspense } from "react";
import { Kicker, SearchPanel } from "@/components/qp";
import { FilterForm } from "@/components/search/FilterForm";
import { InitialState, InvalidQueryState } from "@/components/search/SearchMessage";
import {
  ResultsFallback,
  ResultsStatus,
  SearchResults,
  StatusFallback,
} from "@/components/search/SearchResults";
import { normalizeSearchParams, searchKey, searchUrl } from "@/lib/search-params";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, problem } = normalizeSearchParams(await searchParams);
  return {
    title: q && !problem ? `Búsqueda: ${q}` : "Búsqueda",
    robots: { index: false, follow: false },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const raw = await searchParams;
  const params = normalizeSearchParams(raw);
  // render=full is the no-JavaScript variant: same page, no Suspense swap (see ResultsFallback).
  const full = raw.render === "full";
  const key = searchKey(params);
  const canSearch = params.q !== "" && !params.problem;

  return (
    <>
      <header className="qp-search-head">
        <h1 className="qp-sr-only">Búsqueda semántica de papers</h1>
        <Kicker>búsqueda semántica</Kicker>
        <SearchPanel action="/search" method="get" name="q" defaultValue={params.q} />
        {canSearch ? (
          full ? (
            <ResultsStatus params={params} inline />
          ) : (
            <Suspense key={key} fallback={<StatusFallback />}>
              <ResultsStatus params={params} />
            </Suspense>
          )
        ) : null}
      </header>
      <div className="qp-search-layout">
        <aside className="qp-search-aside">
          <FilterForm params={params} full={full} />
        </aside>
        <main className="qp-search-main">
          {params.problem ? (
            <InvalidQueryState problem={params.problem} />
          ) : canSearch && full ? (
            <SearchResults params={params} inline />
          ) : canSearch ? (
            <Suspense key={key} fallback={<ResultsFallback fullHref={searchUrl(params, { render: "full" })} />}>
              <SearchResults params={params} />
            </Suspense>
          ) : (
            <InitialState />
          )}
        </main>
      </div>
    </>
  );
}
