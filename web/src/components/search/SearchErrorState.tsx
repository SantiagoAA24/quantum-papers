import type { ReactNode } from "react";
import { DataList, Panel, TextLink } from "@/components/qp";

/** The «error · búsqueda» state. `retry` is a button in the client boundary and a link in the no-JS variant. */
export function SearchErrorState({ digest, retry }: { digest?: string; retry: ReactNode }) {
  return (
    <>
      <Panel label="error · búsqueda">
        <div role="alert" style={{ padding: "8px 20px 32px" }}>
          <h2 className="qp-state-title">No pudimos completar la búsqueda</h2>
          <p className="body qp-state-text">
            El servicio que convierte tu consulta en un vector no respondió a tiempo. Tu consulta y tus filtros siguen en la URL, así que puedes reintentar sin perder nada.
          </p>
          <div className="qp-actions">
            {retry}
            <TextLink href="/">volver_al_inicio →</TextLink>
          </div>
        </div>
      </Panel>
      <div style={{ marginTop: "var(--space-6)" }}>
        <Panel label="// detalles técnicos">
          <DataList
            items={[
              { label: "código", value: "503", accent: true },
              { label: "solicitud", value: digest ?? "—" },
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
