import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const widths = [
  { name: "1280", width: 1280, height: 900 },
  { name: "390", width: 390, height: 844 },
];

for (const { name, width, height } of widths) {
  test(`galería sin violaciones serious/critical a ${name}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const response = await page.goto("/dev/components");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      blocking.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(" ")) })),
    ).toEqual([]);

    await page.screenshot({ path: `test-results/gallery-${name}.png`, fullPage: true, scale: "css" });
  });
}

test("el foco de teclado es visible en un botón de la galería", async ({ page }) => {
  await page.goto("/dev/components");
  const button = page.locator(".qp-button:not([disabled])").first();
  await button.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(button).toBeFocused();
  await expect(button).toHaveCSS("outline-style", "solid");
  await expect(button).toHaveCSS("outline-width", "2px");
});
