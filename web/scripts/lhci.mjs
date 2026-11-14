// Runs Lighthouse CI against an already running `next start` (default http://localhost:3000).
// The paper URL is read from the listing page so no id is hardcoded.
import { spawnSync } from "node:child_process";

const base = process.env.LHCI_BASE_URL ?? "http://localhost:3000";
if (base !== "http://localhost:3000") {
  console.error("lighthouserc.json matches http://localhost:3000; start the server there.");
  process.exit(2);
}

const html = await (await fetch(`${base}/papers/page/1`)).text();
const paper = html.match(/href="(\/papers\/(?!page\/)[^"/]+)"/)?.[1];
if (!paper) {
  console.error("No paper link in /papers/page/1; is the database seeded?");
  process.exit(2);
}

const paths = ["/", paper, "/search?q=quantum", "/papers/page/1", "/about", "/how-it-works"];
const args = ["lhci", "autorun", ...paths.map((p) => `--collect.url=${base}${p}`)];
const result = spawnSync("pnpm", ["exec", ...args], { stdio: "inherit" });
process.exit(result.status ?? 1);
