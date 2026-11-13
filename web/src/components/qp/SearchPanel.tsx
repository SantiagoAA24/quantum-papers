import { cx } from "@/lib/cx";
import { Button } from "./Button";

export interface SearchPanelProps {
  id?: string;
  /** Texto de la etiqueta accesible del input. Por defecto "Consulta". */
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  buttonLabel?: string;
  /** Etiqueta sobre los resultados. Solo se muestra si hay children. */
  resultsLabel?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  /** Destino del formulario; con `action` funciona sin JavaScript. */
  action?: string;
  method?: "get" | "post";
  /** Nombre del campo enviado (p. ej. "q"). */
  name?: string;
  className?: string;
  /** Filas ResultRow. */
  children?: React.ReactNode;
}

export function SearchPanel({
  id = "qp-search",
  label,
  defaultValue,
  placeholder,
  buttonLabel,
  resultsLabel,
  onChange,
  onSubmit,
  action,
  method,
  name,
  className,
  children,
}: SearchPanelProps) {
  return (
    <div className={cx("qp-panel", className)}>
      <form className="qp-searchbar" action={action} method={method} onSubmit={onSubmit}>
        <label htmlFor={id} className="qp-sr-only">
          {label || "Consulta"}
        </label>
        <span className="qp-searchbar__prompt" aria-hidden="true">
          $
        </span>
        <input
          id={id}
          name={name}
          type="search"
          className="qp-searchbar__input"
          defaultValue={defaultValue}
          placeholder={placeholder}
          onChange={onChange}
        />
        <Button type="submit">{buttonLabel || "buscar ↵"}</Button>
      </form>
      {children ? (
        <div className="qp-panel__label">{resultsLabel || "resultados · ordenados por similitud"}</div>
      ) : null}
      {children ? <ol className="qp-results">{children}</ol> : null}
    </div>
  );
}
