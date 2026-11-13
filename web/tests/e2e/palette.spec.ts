import { expect, test } from "@playwright/test";

test("paleta: Ctrl+K abre, Escape cierra y el foco vuelve al disparador", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: /abrir paleta de comandos/ });
  await trigger.focus();
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Paleta de comandos" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("combobox")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("paleta: Meta+K también abre y el foco queda atrapado", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.keyboard.press("Meta+k");
  await expect(page.getByRole("dialog", { name: "Paleta de comandos" })).toBeVisible();
  for (let i = 0; i < 6; i++) await page.keyboard.press("Tab");
  const inside = await page.evaluate(() => !!document.activeElement?.closest("dialog"));
  expect(inside).toBe(true);
});

test("paleta: navega con el teclado a una ruta", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.keyboard.press("Control+k");
  await page.keyboard.type("papers");
  // The first option is the «buscar» action; the matching destination is next.
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("option", { name: /papers/ }).and(page.locator('[aria-selected="true"]'))).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/papers\/page\/1$/);
});

test("paleta: «buscar texto» navega a /search?q= sin llamar a la API", async ({ page }) => {
  const api: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/")) api.push(r.url());
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.keyboard.press("Control+k");
  await page.keyboard.type("barren plateaus");
  await expect(page.getByRole("option", { name: /buscar «barren plateaus»/ })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=barren%20plateaus/);
  expect(api).toEqual([]);
});

test("paleta: el chip ⌘K abre con el ratón", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /abrir paleta de comandos/ }).click();
  await expect(page.getByRole("dialog", { name: "Paleta de comandos" })).toBeVisible();
});
