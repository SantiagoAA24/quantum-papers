import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pagination } from "@/components/qp";

describe("Pagination", () => {
  it("marca aria-current solo en la página actual", () => {
    render(
      <Pagination
        pages={[{ label: "1", href: "/1" }, { label: "2", href: "/2", current: true }, { gap: true }, { label: "9", href: "/9" }]}
        prevHref="/1"
        nextHref="/3"
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Paginación" });
    const current = nav.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]?.textContent).toBe("2");
    expect(current[0]?.className).toContain("qp-pagination__page--current");
    expect(screen.getByRole("link", { name: "1" }).hasAttribute("aria-current")).toBe(false);
  });

  it("oculta los huecos a tecnologías de apoyo", () => {
    render(<Pagination pages={[{ label: "1" }, { gap: true }]} />);
    expect(screen.getByText("…").getAttribute("aria-hidden")).toBe("true");
  });
});
