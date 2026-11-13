import { cx } from "@/lib/cx";

export interface CheckboxProps {
  name?: string;
  value?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  children: React.ReactNode;
}

export function Choice({ type, className, children, ...input }: CheckboxProps & { type: "checkbox" | "radio" }) {
  return (
    <label className={cx("qp-choice", className)}>
      <input type={type} {...input} />
      {children}
    </label>
  );
}
