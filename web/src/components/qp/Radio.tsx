import { Choice, type CheckboxProps } from "./_Choice";

/** Botón de opción con etiqueta; las opciones de un grupo comparten `name`. */
export type RadioProps = CheckboxProps;

export function Radio(props: RadioProps) {
  return <Choice type="radio" {...props} />;
}
