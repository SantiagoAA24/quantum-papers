import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Checkbox, Radio } from "@/components/qp";

describe("Checkbox", () => {
  it("se alterna con la tecla Espacio tras tabular", async () => {
    const user = userEvent.setup();
    render(<Checkbox name="t" value="vqc">vqc</Checkbox>);
    const box = screen.getByRole("checkbox", { name: "vqc" }) as HTMLInputElement;
    await user.tab();
    expect(document.activeElement).toBe(box);
    await user.keyboard(" ");
    expect(box.checked).toBe(true);
    await user.keyboard(" ");
    expect(box.checked).toBe(false);
  });

  it("deshabilitado no recibe foco ni cambia", async () => {
    const user = userEvent.setup();
    render(<Checkbox disabled>x</Checkbox>);
    const box = screen.getByRole("checkbox") as HTMLInputElement;
    await user.tab();
    expect(document.activeElement).not.toBe(box);
    await user.click(box);
    expect(box.checked).toBe(false);
  });
});

describe("Radio", () => {
  it("las flechas cambian la opción dentro del grupo", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Radio name="orden" value="s" defaultChecked>similitud</Radio>
        <Radio name="orden" value="y">año</Radio>
      </>,
    );
    const a = screen.getByRole("radio", { name: "similitud" }) as HTMLInputElement;
    const b = screen.getByRole("radio", { name: "año" }) as HTMLInputElement;
    await user.tab();
    expect(document.activeElement).toBe(a);
    await user.keyboard("{ArrowDown}");
    expect(b.checked).toBe(true);
    expect(a.checked).toBe(false);
    await user.keyboard("{ArrowUp}");
    expect(a.checked).toBe(true);
  });
});
