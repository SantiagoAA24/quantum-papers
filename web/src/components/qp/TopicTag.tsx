import Link from "next/link";
import { cx } from "@/lib/cx";

export interface TopicTagProps {
  label: string;
  href?: string;
  className?: string;
}

export function TopicTag({ label, href, className }: TopicTagProps) {
  return (
    <Link href={href || "#"} className={cx("qp-tag", className)}>
      {"#" + label}
    </Link>
  );
}
