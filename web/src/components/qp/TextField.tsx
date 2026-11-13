import { cx } from "@/lib/cx";

export interface TextFieldProps {
  id?: string;
  label: string;
  type?: string;
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function TextField({ id, label, type, name, defaultValue, placeholder, onChange, className }: TextFieldProps) {
  const fieldId = id || "qp-field-" + String(label).replace(/\W+/g, "-");
  return (
    <div className={cx("qp-field", className)}>
      <label htmlFor={fieldId} className="qp-field__label">
        {label}
      </label>
      <input
        id={fieldId}
        type={type || "text"}
        className="qp-field__input"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  );
}
