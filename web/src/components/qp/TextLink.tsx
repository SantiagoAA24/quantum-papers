import Link from "next/link";
import { cx } from "@/lib/cx";

export interface TextLinkProps {
  href?: string;
  className?: string;
  children: React.ReactNode;
}

export function TextLink({ href, className, children }: TextLinkProps) {
  return (
    <Link href={href || "#"} className={cx("qp-textlink", className)}>
      {children}
    </Link>
  );
}
