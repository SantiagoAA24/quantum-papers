import { cx } from "@/lib/cx";

export interface DataListProps {
  items: { label: string; value: string; /** Pinta el valor en acento. */ accent?: boolean }[];
  className?: string;
}

export function DataList({ items, className }: DataListProps) {
  return (
    <dl className={cx("qp-datalist", className)}>
      {(items || []).map((it) => (
        <div key={it.label} className="qp-datalist__row">
          <dt>{it.label}</dt>
          <dd className={it.accent ? "qp-datalist__value qp-datalist__value--accent" : "qp-datalist__value"}>
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
