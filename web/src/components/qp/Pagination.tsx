import Link from "next/link";
import { cx } from "@/lib/cx";
import { TextLink } from "./TextLink";

export interface PaginationProps {
  pages: { label?: string; href?: string; current?: boolean; /** Dibuja "…". */ gap?: boolean }[];
  prevHref?: string;
  nextHref?: string;
  className?: string;
}

export function Pagination({ pages, prevHref, nextHref, className }: PaginationProps) {
  return (
    <nav className={cx("qp-pagination", className)} aria-label="Paginación">
      <TextLink href={prevHref}>← anterior</TextLink>
      <div className="qp-pagination__pages">
        {(pages || []).map((pg, i) =>
          pg.gap ? (
            <span key={"g" + i} aria-hidden="true" className="qp-pagination__gap">
              …
            </span>
          ) : (
            <Link
              key={"p" + i}
              href={pg.href || "#"}
              aria-current={pg.current ? "page" : undefined}
              className={cx("qp-pagination__page", pg.current && "qp-pagination__page--current")}
            >
              {pg.label}
            </Link>
          ),
        )}
      </div>
      <TextLink href={nextHref}>siguiente →</TextLink>
    </nav>
  );
}
