import * as React from 'react';

/** Botón de acción primaria. */
export interface ButtonProps {
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

/** Enlace de texto en acento, en mono (p. ej. "ver_todos →"). */
export interface TextLinkProps {
  href?: string;
  className?: string;
  children: React.ReactNode;
}

/** Panel de búsqueda con prompt, input y botón; opcionalmente lista resultados. */
export interface SearchPanelProps {
  id?: string;
  /** Texto de la etiqueta accesible del input. Por defecto "Consulta". */
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  buttonLabel?: string;
  /** Etiqueta sobre los resultados. Solo se muestra si hay children. */
  resultsLabel?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
  /** Filas ResultRow. */
  children?: React.ReactNode;
}

/** Fila de resultado de búsqueda (va dentro de SearchPanel). */
export interface ResultRowProps {
  rank: string;
  title: string;
  /** Tema sin el "#". */
  topic: string;
  /** Similitud de 0 a 1; solo dibuja la barra. */
  similarity: number;
}

/** Fila de la tabla de papers. */
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

/** Tag de tema, se muestra como "#label". */
export interface TopicTagProps {
  label: string;
  href?: string;
  className?: string;
}

/** Cabecera del sitio: wordmark, navegación y chip de atajo. */
export interface SiteHeaderProps {
  links?: { label: string; href: string }[];
  homeHref?: string;
  /** Fuerza la versión móvil: botón "menú" en lugar de la navegación. Por debajo de 640px se activa sola. */
  compact?: boolean;
  /** Menú abierto en la versión móvil. Sin esta prop, el componente lo gestiona solo. */
  open?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

export function Button(props: ButtonProps): JSX.Element;
export function TextLink(props: TextLinkProps): JSX.Element;
export function SearchPanel(props: SearchPanelProps): JSX.Element;
export function ResultRow(props: ResultRowProps): JSX.Element;
export function PaperRow(props: PaperRowProps): JSX.Element;
export function TopicTag(props: TopicTagProps): JSX.Element;
export function SiteHeader(props: SiteHeaderProps): JSX.Element;

/** Panel con borde y, opcionalmente, una etiqueta superior en mono. */
export interface PanelProps {
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

/** Lista de pares etiqueta/valor en mono (ficha de un paper, datos de render). */
export interface DataListProps {
  items: { label: string; value: string; /** Pinta el valor en acento. */ accent?: boolean }[];
  className?: string;
}

/** Migas de pan; el último elemento es la página actual y no lleva enlace. */
export interface BreadcrumbProps {
  items: { label: string; href?: string }[];
  className?: string;
}

/** Línea corta en mono con prefijo "// ". */
export interface KickerProps {
  className?: string;
  children: React.ReactNode;
}

/** Casilla de verificación con etiqueta. */
export interface CheckboxProps {
  name?: string;
  value?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  children: React.ReactNode;
}

/** Botón de opción con etiqueta; las opciones de un grupo comparten `name`. */
export type RadioProps = CheckboxProps;

/** Campo de texto con su etiqueta visible. */
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

/** Grupo de controles de filtro con leyenda en mayúsculas. */
export interface FilterGroupProps {
  legend: string;
  className?: string;
  children: React.ReactNode;
}

/** Paginación; cada elemento de `pages` es una página o un hueco ("…"). */
export interface PaginationProps {
  pages: { label?: string; href?: string; current?: boolean; /** Dibuja "…". */ gap?: boolean }[];
  prevHref?: string;
  nextHref?: string;
  className?: string;
}

/** Fila esqueleto de resultado, para el fallback de Suspense. */
export interface ResultRowSkeletonProps {
  /** Ancho máximo del título, por defecto "60%". Varíalo entre filas. */
  titleWidth?: string;
}

/** Pie de página en mono con una línea superior. */
export interface SiteFooterProps {
  /** Por defecto "datos: arXiv". */
  left?: string;
  /** Por defecto "proyecto de portafolio". */
  right?: string;
  className?: string;
}

export function Panel(props: PanelProps): JSX.Element;
export function DataList(props: DataListProps): JSX.Element;
export function Breadcrumb(props: BreadcrumbProps): JSX.Element;
export function Kicker(props: KickerProps): JSX.Element;
export function Checkbox(props: CheckboxProps): JSX.Element;
export function Radio(props: RadioProps): JSX.Element;
export function TextField(props: TextFieldProps): JSX.Element;
export function FilterGroup(props: FilterGroupProps): JSX.Element;
export function Pagination(props: PaginationProps): JSX.Element;
export function ResultRowSkeleton(props: ResultRowSkeletonProps): JSX.Element;
export function SiteFooter(props: SiteFooterProps): JSX.Element;

/** Paleta de comandos (⌘K): campo de búsqueda, resultados agrupados y pie con atajos. El fondo atenuado lo pone la página. */
export interface CommandPaletteProps {
  groups: { label: string; items: { label: string; /** Texto corto a la derecha (tipo o atajo). */ hint?: string; /** Elemento resaltado por el teclado. */ active?: boolean }[] }[];
  defaultValue?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Nombre accesible del diálogo. Por defecto "Paleta de comandos". */
  label?: string;
  className?: string;
}

export function CommandPalette(props: CommandPaletteProps): JSX.Element;
