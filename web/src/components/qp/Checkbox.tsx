import { Choice, type CheckboxProps } from "./_Choice";

export type { CheckboxProps };

export function Checkbox(props: CheckboxProps) {
  return <Choice type="checkbox" {...props} />;
}
