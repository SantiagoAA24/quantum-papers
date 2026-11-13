import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "@/components/qp";

describe("SiteHeader", () => {
  it("abre y cierra el menú móvil", async () => {
    const { container } = render(<SiteHeader compact />);
    const header = container.querySelector("header")!;
    const menu = screen.getByRole("button", { name: "menú" });
    expect(menu.getAttribute("aria-expanded")).toBe("false");
    expect(header.className).not.toContain("qp-header--open");

    await userEvent.click(menu);
    const close = screen.getByRole("button", { name: "cerrar" });
    expect(close.getAttribute("aria-expanded")).toBe("true");
    expect(header.className).toContain("qp-header--open");

    await userEvent.click(close);
    expect(screen.getByRole("button", { name: "menú" }).getAttribute("aria-expanded")).toBe("false");
    expect(header.className).not.toContain("qp-header--open");
  });

  it("aria-controls apunta al nav", () => {
    render(<SiteHeader compact />);
    const id = screen.getByRole("button", { name: "menú" }).getAttribute("aria-controls")!;
    expect(document.getElementById(id)?.tagName).toBe("NAV");
  });

  it("modo controlado: open manda y onMenuClick se invoca", async () => {
    const onMenuClick = vi.fn();
    render(<SiteHeader compact open onMenuClick={onMenuClick} />);
    await userEvent.click(screen.getByRole("button", { name: "cerrar" }));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "cerrar" })).toBeTruthy();
  });
});
