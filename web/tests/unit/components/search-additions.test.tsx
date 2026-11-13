import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CommandPalette, ResultRow, SiteHeader } from "@/components/qp";

describe("props opcionales añadidos para la búsqueda", () => {
  it("ResultRow: con href el título es un enlace; sin href sigue siendo texto", () => {
    const { rerender } = render(<ResultRow rank="01" title="T" topic="vqc" similarity={0.5} href="/papers/1" />);
    expect(screen.getByRole("link", { name: "T" }).getAttribute("href")).toBe("/papers/1");
    rerender(<ResultRow rank="01" title="T" topic="vqc" similarity={0.5} />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("SiteHeader: con onPaletteClick el chip ⌘K es un botón accesible", async () => {
    const onPaletteClick = vi.fn();
    render(<SiteHeader onPaletteClick={onPaletteClick} />);
    await userEvent.click(screen.getByRole("button", { name: /abrir paleta de comandos/ }));
    expect(onPaletteClick).toHaveBeenCalledOnce();
  });

  it("SiteHeader: sin onPaletteClick el chip sigue siendo decorativo", () => {
    render(<SiteHeader />);
    expect(screen.queryByRole("button", { name: /abrir paleta de comandos/ })).toBeNull();
  });

  it("CommandPalette: Enter dispara onSelect del ítem activo", async () => {
    const onSelect = vi.fn();
    render(<CommandPalette groups={[{ label: "g", items: [{ label: "uno", active: true, onSelect }] }]} />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
