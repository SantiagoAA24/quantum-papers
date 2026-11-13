import { cx } from "@/lib/cx";

export interface SiteFooterProps {
  /** Por defecto "datos: arXiv". */
  left?: string;
  /** Por defecto "proyecto de portafolio". */
  right?: string;
  className?: string;
}

export function SiteFooter({ left, right, className }: SiteFooterProps) {
  return (
    <footer className={cx("qp-footer", className)}>
      <span>{left || "datos: arXiv"}</span>
      <span>{right || "proyecto de portafolio"}</span>
    </footer>
  );
}
