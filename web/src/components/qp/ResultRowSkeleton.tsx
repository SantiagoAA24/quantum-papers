export interface ResultRowSkeletonProps {
  /** Ancho máximo del título, por defecto "60%". Varíalo entre filas. */
  titleWidth?: string;
}

export function ResultRowSkeleton({ titleWidth }: ResultRowSkeletonProps) {
  return (
    <li className="qp-result qp-skeleton" aria-hidden="true">
      <span className="qp-skeleton__block" style={{ flex: "0 0 28px", height: "13px" }} />
      <span className="qp-skeleton__block" style={{ flex: "1 1 300px", maxWidth: titleWidth || "60%", height: "18px" }} />
      <span className="qp-skeleton__block" style={{ flex: "0 0 56px", height: "12px" }} />
      <span className="qp-result__bar" />
    </li>
  );
}
