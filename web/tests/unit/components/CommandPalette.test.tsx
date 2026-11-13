import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CommandPalette } from "@/components/qp";

const groups = [{ label: "papers", items: [{ label: "uno", active: true }, { label: "dos", hint: "paper" }] }];

describe("CommandPalette", () => {
  it("marca como activo el ítem inicial y lo mueve con el teclado", async () => {
    const user = userEvent.setup();
    render(<CommandPalette groups={groups} />);
    const [uno, dos] = screen.getAllByRole("option");
    expect(uno?.className).toContain("qp-cmd__item--active");
    expect(dos?.className).not.toContain("qp-cmd__item--active");
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("option")[1]?.className).toContain("qp-cmd__item--active");
  });

  it("aplica defaultValue al input y sigue siendo editable", async () => {
    render(<CommandPalette groups={groups} defaultValue="circ" />);
    const input = screen.getByRole("combobox") as HTMLInputElement;
    expect(input.value).toBe("circ");
    await userEvent.type(input, "u");
    expect(input.value).toBe("circu");
  });

  it("expone el diálogo con nombre accesible", () => {
    render(<CommandPalette groups={groups} />);
    expect(screen.getByRole("dialog", { name: "Paleta de comandos" })).toBeTruthy();
  });
});
