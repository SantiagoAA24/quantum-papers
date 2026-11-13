/**
 * Comprueba en tiempo de compilación que las props de cada componente son
 * idénticas a las interfaces de docs/design/components/index.d.ts.
 */
import type * as Design from "../../../docs/design/components/index";
import type * as Qp from "@/components/qp";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

export type Contract = [
  Assert<Equal<Qp.ButtonProps, Design.ButtonProps>>,
  Assert<Equal<Qp.TextLinkProps, Design.TextLinkProps>>,
  Assert<Equal<Qp.SearchPanelProps, Design.SearchPanelProps>>,
  Assert<Equal<Qp.ResultRowProps, Design.ResultRowProps>>,
  Assert<Equal<Qp.PaperRowProps, Design.PaperRowProps>>,
  Assert<Equal<Qp.TopicTagProps, Design.TopicTagProps>>,
  Assert<Equal<Qp.SiteHeaderProps, Design.SiteHeaderProps>>,
  Assert<Equal<Qp.PanelProps, Design.PanelProps>>,
  Assert<Equal<Qp.DataListProps, Design.DataListProps>>,
  Assert<Equal<Qp.BreadcrumbProps, Design.BreadcrumbProps>>,
  Assert<Equal<Qp.KickerProps, Design.KickerProps>>,
  Assert<Equal<Qp.CheckboxProps, Design.CheckboxProps>>,
  Assert<Equal<Qp.RadioProps, Design.RadioProps>>,
  Assert<Equal<Qp.TextFieldProps, Design.TextFieldProps>>,
  Assert<Equal<Qp.FilterGroupProps, Design.FilterGroupProps>>,
  Assert<Equal<Qp.PaginationProps, Design.PaginationProps>>,
  Assert<Equal<Qp.ResultRowSkeletonProps, Design.ResultRowSkeletonProps>>,
  Assert<Equal<Qp.SiteFooterProps, Design.SiteFooterProps>>,
  Assert<Equal<Qp.CommandPaletteProps, Design.CommandPaletteProps>>,
];
