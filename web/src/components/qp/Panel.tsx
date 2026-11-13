import { cx } from "@/lib/cx";

export interface PanelProps {
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Panel({ label, className, children }: PanelProps) {
  return (
    <div className={cx("qp-panel qp-panel--fluid", className)}>
      {label ? <div className="qp-panel__label">{label}</div> : null}
      {children}
    </div>
  );
}
