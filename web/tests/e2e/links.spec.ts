import { expect, test, type Page } from "@playwright/test";

async function internalHrefs(page: Page): Promise<string[]> {
  const hrefs = await page.locator("a[href]").evaluateAll((els) =>
    els.map((el) => el.getAttribute("href") ?? ""),
  );
  const unique = new Set<string>();
  for (const h of hrefs) {
    if (!h.startsWith("/") || h.startsWith("//")) continue; // external, mailto, bare "#"
    unique.add(h.split("#")[0] || "/");
  }
  return [...unique];
}

test("every internal link on the home page resolves (no 404)", async ({ page, request }) => {
  await page.goto("/");
  const hrefs = await internalHrefs(page);
  expect(hrefs).toEqual(expect.arrayContaining(["/papers/page/1", "/how-it-works"]));

  const failures: string[] = [];
  for (const href of hrefs) {
    const res = await request.get(href);
    if (res.status() >= 400) failures.push(`${href} -> ${res.status()}`);
  }
  expect(failures, failures.join("\n")).toEqual([]);
});

test("header, about and how-it-works links resolve", async ({ page, request }) => {
  const failures: string[] = [];
  for (const path of ["/about", "/how-it-works", "/papers/page/1"]) {
    await page.goto(path);
    for (const href of await internalHrefs(page)) {
      const res = await request.get(href);
      if (res.status() >= 400) failures.push(`${path}: ${href} -> ${res.status()}`);
    }
  }
  expect(failures, failures.join("\n")).toEqual([]);
});

test("paper detail links its topic and author pages", async ({ page, request }) => {
  await page.goto("/");
  const first = await page.locator('a[href^="/papers/"]:not([href^="/papers/page"])').first().getAttribute("href");
  expect(first).toBeTruthy();
  await page.goto(first!);
  const targets = await page.locator('a[href^="/topics/"], a[href^="/authors/"]').evaluateAll((els) =>
    [...new Set(els.map((el) => el.getAttribute("href") ?? ""))],
  );
  expect(targets.length).toBeGreaterThan(0);
  for (const href of targets) {
    const res = await request.get(href);
    expect(res.status(), href).toBe(200);
  }
});

test("unknown author and topic slugs return 404", async ({ request }) => {
  expect((await request.get("/authors/no-such-author-zzz")).status()).toBe(404);
  expect((await request.get("/topics/no-such-topic-zzz")).status()).toBe(404);
});

test("about and how-it-works render with their h1", async ({ page }) => {
  for (const path of ["/about", "/how-it-works"]) {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
  }
  await expect(page.getByText("valores de ejemplo").first()).toBeVisible();
});
