"use client";

import { useEffect } from "react";
import { Button, DataList, Kicker, Panel, TextLink } from "@/components/qp";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <header style={{ padding: "96px 0 var(--space-8)" }}>
        <Kicker>503 · servicio no disponible</Kicker>
        <h1 className="qp-h1 qp-h1--md" style={{ marginTop: 20 }}>No pudimos cargar esta página</h1>
        <p className="qp-lead">
          El servicio de datos no respondió a tiempo. No has perdido nada: puedes reintentar o volver al inicio.
        </p>
        <div className="qp-actions" role="alert">
          <Button onClick={() => retry()}>reintentar</Button>
          <TextLink href="/">volver_al_inicio →</TextLink>
        </div>
      </header>
      <main style={{ maxWidth: 480 }}>
        <Panel label="// detalles técnicos">
          <DataList
            items={[
              { label: "código", value: "503", accent: true },
              { label: "solicitud", value: error.digest ?? "—" },
            ]}
          />
        </Panel>
      </main>
    </>
  );
}
