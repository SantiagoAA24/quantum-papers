import Link from "next/link";
import { cx } from "@/lib/cx";

export interface PaperRowProps {
  index: string;
  title: string;
  /** Tema sin el "#". */
  topic: string;
  /** Por defecto "[año]". */
  year?: string;
  /** Por defecto "[arXiv:id]". */
  arxiv?: string;
  href?: string;
  className?: string;
}

export function PaperRow({ index, title, topic, year, arxiv, href, className }: PaperRowProps) {
  return (
    <Link href={href || "#"} className={cx("qp-paper", className)}>
      <span className="qp-paper__index">{index}</span>
      <span className="qp-paper__title">{title}</span>
      <span className="qp-paper__topic">{"#" + topic}</span>
      <span className="qp-paper__year">{year || "[año]"}</span>
      <span className="qp-paper__arxiv">{arxiv || "[arXiv:id]"}</span>
    </Link>
  );
}
