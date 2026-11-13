import { cx } from "@/lib/cx";

export interface KickerProps {
  className?: string;
  children: React.ReactNode;
}

export function Kicker({ className, children }: KickerProps) {
  return <p className={cx("qp-kicker", className)}>{"// "}{children}</p>;
}
