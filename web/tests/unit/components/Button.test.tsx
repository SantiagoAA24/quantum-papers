import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/qp";

describe("Button", () => {
  it("dispara onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>buscar</Button>);
    await userEvent.click(screen.getByRole("button", { name: "buscar" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("deshabilitado no dispara onClick", async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>buscar</Button>);
    const btn = screen.getByRole("button", { name: "buscar" });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("usa type=button por defecto y conserva las clases qp", () => {
    render(<Button className="extra">x</Button>);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("type")).toBe("button");
    expect(btn.className).toBe("qp-button extra");
  });
});
