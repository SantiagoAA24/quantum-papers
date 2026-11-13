import { Panel, TextLink } from "@/components/qp";
import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH, type QueryProblem } from "@/lib/search-params";

const EXAMPLES = [
  "circuitos variacionales para clasificación",
  "barren plateaus en redes cuánticas",
  "kernels cuánticos con pocos datos",
];

/** Initial state, shown when there is no `q`. */
export function InitialState() {
  return (
    <Panel label="// empieza_aquí">
      <div style={{ padding: "8px 20px 32px" }}>
        <h2 className="qp-state-title">Describe lo que buscas con tus palabras</h2>
        <p className="body qp-state-text">
          La búsqueda es semántica: compara el significado de tu consulta con el de los resúmenes de arXiv, no solo las palabras exactas.
        </p>
        <ul className="qp-examples">
          {EXAMPLES.map((e) => (
            <li key={e}>
              <TextLink href={`/search?q=${encodeURIComponent(e)}`}>{e} →</TextLink>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

/** `q` is non-empty but outside the allowed length. No embedding is requested. */
export function InvalidQueryState({ problem }: { problem: QueryProblem }) {
  const short = problem === "too_short";
  return (
    <Panel label="consulta_no_válida">
      <div role="alert" style={{ padding: "8px 20px 32px" }}>
        <h2 className="qp-state-title">{short ? "La consulta es demasiado corta" : "La consulta es demasiado larga"}</h2>
        <p className="body qp-state-text">
          {short
            ? `Escribe al menos ${MIN_QUERY_LENGTH} caracteres para que la búsqueda tenga algo con lo que comparar.`
            : `La consulta no puede superar los ${MAX_QUERY_LENGTH} caracteres. Resume la idea en una o dos frases.`}
        </p>
      </div>
    </Panel>
  );
}
