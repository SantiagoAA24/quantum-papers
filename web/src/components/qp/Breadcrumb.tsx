import { Fragment } from "react";
import Link from "next/link";
import { cx } from "@/lib/cx";

export interface BreadcrumbProps {
  items: { label: string; href?: string }[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const list = items || [];
  return (
    <nav className={cx("qp-breadcrumb", className)} aria-label="Ruta">
      {list.map((it, i) => (
        <Fragment key={i}>
          {i > 0 ? <span aria-hidden="true">/</span> : null}
          {i === list.length - 1 ? (
            <span aria-current="page" className="qp-breadcrumb__current">
              {it.label}
            </span>
          ) : (
            <Link href={it.href || "#"}>{it.label}</Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
