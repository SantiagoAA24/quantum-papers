import AxeBuilder from "@axe-core/playwright";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { SEARCH_QUERY, firstPaperPath } from "./helpers";

const widths = [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
];

const routes: { name: string; path: string | ((r: APIRequestContext) => Promise<string>) }[] = [
  { name: "home", path: "/" },
  { name: "detalle", path: firstPaperPath },
  { name: "búsqueda", path: `/search?q=${SEARCH_QUERY}` },
  { name: "listado", path: "/papers/page/1" },
  { name: "about", path: "/about" },
  { name: "how-it-works", path: "/how-it-works" },
];

for (const { width, height } of widths) {
  for (const route of routes) {
    test(`axe sin violaciones serious/critical: ${route.name} a ${width}px`, async ({ page, request }, testInfo) => {
      await page.setViewportSize({ width, height });
      const path = typeof route.path === "string" ? route.path : await route.path(request);
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await page.locator("h1").first().waitFor();

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      await testInfo.attach("axe-violations.json", {
        body: JSON.stringify(results.violations, null, 2),
        contentType: "application/json",
      });

      const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(
        blocking.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(" ")) })),
      ).toEqual([]);
    });
  }
}
