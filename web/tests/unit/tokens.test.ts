import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../..");
const tokens = JSON.parse(readFileSync(resolve(root, "docs/design/tokens.json"), "utf8"));
const css = readFileSync(resolve(__dirname, "../../src/styles/tokens.css"), "utf8");

interface Named {
  name: string;
  value?: string | { dark: string };
  fontSize?: string;
  lineHeight?: string;
  fontWeight?: number;
  letterSpacing?: string;
}

const decl = (prop: string, value: string) => css.includes(`${prop}: ${value};`);

describe("tokens.css refleja tokens.json", () => {
  it.each(tokens.color.tokens as Named[])("color $name", ({ name, value }) => {
    const v = (value as { dark: string }).dark;
    expect(decl(`--color-${name}`, v), `--color-${name}: ${v}`).toBe(true);
    expect(css.includes(`--${name}: var(--color-${name});`), `--${name}`).toBe(true);
  });

  it.each(
    (tokens.type.groups as { styles: Named[] }[]).flatMap((g) => g.styles),
  )("texto $name", (s) => {
    expect(decl(`--text-${s.name}`, s.fontSize!), "tamaño").toBe(true);
    expect(decl(`--text-${s.name}--line-height`, s.lineHeight!), "interlineado").toBe(true);
    expect(decl(`--text-${s.name}--font-weight`, String(s.fontWeight)), "peso").toBe(true);
    if (s.letterSpacing) expect(decl(`--text-${s.name}--letter-spacing`, s.letterSpacing), "tracking").toBe(true);
  });

  it.each(Object.keys(tokens.type.families))("familia %s", (f) => {
    expect(css).toContain(`--font-${f}:`);
  });

  it.each([...tokens.spacing.tokens, ...tokens.size.tokens] as Named[])("$name", ({ name, value }) => {
    expect(decl(`--${name}`, value as string)).toBe(true);
  });

  it.each(tokens.radius.tokens as Named[])("$name", ({ name, value }) => {
    expect(decl(`--${name}`, value as string)).toBe(true);
  });
});

describe("components.css", () => {
  it("copia bundle.css sin cambios de reglas", () => {
    const bundle = readFileSync(resolve(root, "docs/design/components/bundle.css"), "utf8");
    const comp = readFileSync(resolve(__dirname, "../../src/styles/components.css"), "utf8");
    expect(comp.replace(/^\/\*[^]*?\*\/\n/, "")).toBe(bundle);
  });
});
