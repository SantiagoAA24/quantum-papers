import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as Qp from "@/components/qp";

// Ejecuta el bundle.js original del diseño y compara su HTML con el de los componentes TSX.
type Dc = Record<string, (p: Record<string, unknown>) => React.ReactElement>;
// El bundle usa su propio React; se sustituye useState por un stub para renderizar en servidor.
const win: { React: typeof React; QuantumPapers?: Dc } = {
  React: { ...React, useState: ((v: unknown) => [v, () => {}]) as unknown as typeof React.useState },
};
new Function("window", readFileSync(resolve(__dirname, "../../../docs/design/components/bundle.js"), "utf8"))(win);
const Dc = win.QuantumPapers as Dc;

// useId() produce ids distintos a los fijos del bundle; se normalizan.
// El orden de los atributos no importa: se ordenan dentro de cada etiqueta.
const sortAttrs = (html: string) =>
  html.replace(/<([a-z0-9]+)((?:\s+[a-z-]+(?:="[^"]*")?)+)\s*(\/?)>/g, (_m, tag: string, attrs: string, close: string) => {
    const list = attrs.match(/[a-z-]+(?:="[^"]*")?/g) ?? [];
    return `<${tag} ${list.sort().join(" ")}${close}>`;
  });
const norm = (html: string) => sortAttrs(html).replace(/(id|aria-controls)="(?:qp-nav|[^"]*_R_[^"]*|«[^"]*»|:[^"]*:)"/g, '$1="NAV"');
const dc = (name: string, props: Record<string, unknown>) => norm(renderToStaticMarkup(Dc[name]!(props)));
const tsx = (name: string, props: Record<string, unknown>) => {
  const C = (Qp as unknown as Record<string, React.ComponentType<Record<string, unknown>>>)[name]!;
  return norm(renderToStaticMarkup(<C {...props} />));
};

const cases: [string, Record<string, unknown>][] = [
  ["Button", { children: "x" }],
  ["Button", { children: "x", disabled: true, type: "submit", className: "c" }],
  ["TextLink", { children: "x", href: "/a" }],
  ["TextLink", { children: "x" }],
  ["TopicTag", { label: "vqc", href: "/t" }],
  ["ResultRow", { rank: "01", title: "T", topic: "vqc", similarity: 0.5 }],
  ["ResultRow", { rank: "02", title: "T", topic: "vqc", similarity: 7 }],
  ["PaperRow", { index: "01", title: "T", topic: "vqc" }],
  ["PaperRow", { index: "01", title: "T", topic: "vqc", year: "2024", arxiv: "x", href: "/p" }],
  ["SiteHeader", {}],
  ["SiteHeader", { compact: true, open: true, className: "k", homeHref: "/", links: [{ label: "a", href: "/a" }] }],
  ["Panel", { label: "L", children: "x" }],
  ["Panel", { children: "x" }],
  ["DataList", { items: [{ label: "a", value: "b" }, { label: "c", value: "d", accent: true }] }],
  ["Breadcrumb", { items: [{ label: "a", href: "/a" }, { label: "b", href: "/b" }, { label: "c" }] }],
  ["Kicker", { children: "x" }],
  ["Checkbox", { children: "x", name: "n", value: "v", defaultChecked: true, disabled: true }],
  ["Radio", { children: "x", name: "n", value: "v" }],
  ["TextField", { label: "Año desde" }],
  ["TextField", { label: "a", id: "i", type: "number", name: "n", defaultValue: "1", placeholder: "p" }],
  ["FilterGroup", { legend: "tema", children: "x" }],
  ["Pagination", { pages: [{ label: "1", href: "/1" }, { label: "2", current: true }, { gap: true }], prevHref: "/p", nextHref: "/n" }],
  ["ResultRowSkeleton", {}],
  ["ResultRowSkeleton", { titleWidth: "40%" }],
  ["SiteFooter", {}],
  ["SiteFooter", { left: "l", right: "r", className: "c" }],
  ["SearchPanel", { defaultValue: "q", placeholder: "p" }],
  ["SearchPanel", { id: "s", label: "L", buttonLabel: "go", resultsLabel: "R", children: React.createElement("li", null, "x") }],
];

describe("paridad de marcado con bundle.js", () => {
  it.each(cases)("%s %j", (name, props) => {
    expect(tsx(name, props)).toBe(dc(name, props));
  });

  it("CommandPalette conserva el conjunto de clases qp-cmd*", () => {
    const props = { groups: [{ label: "g", items: [{ label: "a", hint: "h", active: true }, { label: "b" }] }] };
    const classes = (h: string) => [...new Set([...h.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1]!.split(" ")))].filter((c) => c.startsWith("qp-")).sort();
    const got = classes(tsx("CommandPalette", props));
    const want = classes(dc("CommandPalette", props));
    // cmdk usa div con role en lugar de ul/li, así que qp-cmd__items no existe.
    expect(want.filter((c) => !got.includes(c))).toEqual(["qp-cmd__items"]);
    expect(got.filter((c) => !want.includes(c))).toEqual([]);
  });
});
