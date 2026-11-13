"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Kicker, SearchPanel } from "@/components/qp";
import { SearchErrorState } from "@/components/search/SearchErrorState";

/**
 * Error boundary of /search. The shell is already streamed with a 200 by the
 * time a result fails, so this is the visual 503 state; the HTTP status stays 200.
 */
export default function SearchError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <header className="qp-search-head">
        <Kicker>búsqueda semántica</Kicker>
        <SearchPanel action="/search" method="get" name="q" defaultValue={q} />
      </header>
      <main className="qp-search-main" style={{ maxWidth: 960 }}>
        <SearchErrorState digest={error.digest} retry={<Button onClick={() => retry()}>reintentar</Button>} />
      </main>
    </>
  );
}
