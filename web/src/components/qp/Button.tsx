import { cx } from "@/lib/cx";

export interface ButtonProps {
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function Button({ type = "button", disabled, onClick, className, children }: ButtonProps) {
  return (
    <button type={type} className={cx("qp-button", className)} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
