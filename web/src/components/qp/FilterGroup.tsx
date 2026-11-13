import { cx } from "@/lib/cx";

export interface FilterGroupProps {
  legend: string;
  className?: string;
  children: React.ReactNode;
}

export function FilterGroup({ legend, className, children }: FilterGroupProps) {
  return (
    <fieldset className={cx("qp-filter", className)}>
      <legend className="qp-filter__legend">{legend}</legend>
      {children}
    </fieldset>
  );
}
