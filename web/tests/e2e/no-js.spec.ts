import { expect, test } from "@playwright/test";
import { SEARCH_QUERY, firstPaperPath } from "./helpers";

// Everything here must work as plain HTML: no client JavaScript at all.
test.use({ javaScriptEnabled: false });

test("home: h1 y el formulario lleva a /search con resultados", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);

  await page.getByLabel("Consulta").first().fill(SEARCH_QUERY);
  await page.getByRole("button", { name: /buscar/ }).first().click();

  await expect(page).toHaveURL(new RegExp(`/search\\?q=${SEARCH_QUERY}`));
  await expect(page.locator("li.qp-result:not(.qp-skeleton)").first()).toBeVisible();
});

test("detalle: h1, JSON-LD ScholarlyArticle, og:title y canonical", async ({ page, request }) => {
  const response = await page.goto(await firstPaperPath(request));
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveCount(1);

  const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(raw ?? "")["@type"]).toBe("ScholarlyArticle");

  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /\S/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/papers\//);
});

test("/search con consulta: 200 y al menos una fila", async ({ page }) => {
  const response = await page.goto(`/search?q=${SEARCH_QUERY}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("li.qp-result:not(.qp-skeleton)").first()).toBeVisible();
});

test("/papers/no-existe devuelve 404", async ({ page }) => {
  const response = await page.goto("/papers/no-existe");
  expect(response?.status()).toBe(404);
});
