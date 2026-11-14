import { expect, test } from "@playwright/test";

// The whole search flow must work as plain HTML: no client JavaScript at all.
test.use({ javaScriptEnabled: false });

// Results need an embeddings provider (real or a local stub); skip them otherwise.
const hasEmbeddings = !!(process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY);

test("estado inicial sin q y noindex", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByText("// empieza_aquí")).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
});

test("q demasiado corta muestra el mensaje sin buscar", async ({ page }) => {
  await page.goto("/search?q=a");
  await expect(page.getByRole("heading", { name: "La consulta es demasiado corta" })).toBeVisible();
  await expect(page.locator(".qp-result")).toHaveCount(0);
});

test("q demasiado larga muestra el mensaje sin buscar", async ({ page }) => {
  await page.goto(`/search?q=${"a".repeat(201)}`);
  await expect(page.getByRole("heading", { name: "La consulta es demasiado larga" })).toBeVisible();
});

test("el formulario de búsqueda envía q por GET", async ({ page }) => {
  await page.goto("/search");
  await page.getByLabel("Consulta").fill("variational quantum classifier");
  await page.getByRole("button", { name: "buscar ↵" }).click();
  await expect(page).toHaveURL(/\/search\?q=variational\+quantum\+classifier(&render=full)?$/);
});

test("los filtros se aplican por GET y quedan en la URL", async ({ page }) => {
  await page.goto("/search?q=variational+quantum+classifier");
  const topic = page.locator('input[name="topic"]').first();
  await expect(topic).toBeVisible(); // visible on desktop without JS
  const slug = await topic.getAttribute("value");
  await topic.check();
  await page.getByLabel("desde").fill("2020");
  await page.getByRole("button", { name: "aplicar" }).click();

  await expect(page).toHaveURL(new RegExp(`q=variational\\+quantum\\+classifier`));
  await expect(page).toHaveURL(new RegExp(`topic=${slug}`));
  await expect(page).toHaveURL(/year_from=2020/);
  await expect(page.locator(`input[name="topic"][value="${slug}"]`)).toBeChecked();
  await expect(page.getByLabel("desde")).toHaveValue("2020");
});

test.describe("con embeddings", () => {
  test.skip(!hasEmbeddings, "needs OPENAI_API_KEY or AZURE_OPENAI_API_KEY");

  test("el HTML inicial lleva el esqueleto antes que los resultados", async ({ request }) => {
    const html = await (await request.get("/search?q=variational+quantum+classifier")).text();
    const skeleton = html.indexOf('class="qp-result qp-skeleton"');
    const result = html.indexOf('class="qp-result"');
    expect(skeleton).toBeGreaterThan(-1);
    expect(result).toBeGreaterThan(skeleton);
  });

  test("la búsqueda devuelve resultados enlazados", async ({ page }) => {
    await page.goto("/search?q=variational+quantum+classifier");
    await expect(page.locator("li.qp-result:not(.qp-skeleton)").first()).toBeVisible();
    await expect(page.getByRole("status")).toContainText("resultados");
    await expect(page.locator(".qp-result__title a").first()).toHaveAttribute("href", /^\/papers\//);
  });

  test("sin resultados con filtros imposibles", async ({ page }) => {
    await page.goto("/search?q=variational+quantum+classifier&year_from=2026&category=nope-ph");
    await expect(page.getByText("sin_resultados")).toBeVisible();
    await page.getByRole("button", { name: "limpiar filtros" }).click();
    await expect(page).toHaveURL(/\/search\?q=variational\+quantum\+classifier(&render=full)?$/);
  });
});
