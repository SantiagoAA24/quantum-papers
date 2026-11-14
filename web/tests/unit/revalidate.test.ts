import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath }));

const route = await import("@/app/api/revalidate/route");
const SECRET = "s3cret-value";

function post(body: unknown, headers: Record<string, string> = { "x-revalidate-secret": SECRET }) {
  return route.POST(
    new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  revalidatePath.mockClear();
  process.env.REVALIDATE_SECRET = SECRET;
});

describe("POST /api/revalidate", () => {
  describe("401", () => {
    it("without the header", async () => {
      const res = await post({ paths: ["/papers/1"] }, {});
      expect(res.status).toBe(401);
      expect(revalidatePath).not.toHaveBeenCalled();
    });
    it("with a wrong secret (also of a different length)", async () => {
      expect((await post({ paths: ["/papers/1"] }, { "x-revalidate-secret": "nope" })).status).toBe(401);
      expect((await post({ paths: ["/papers/1"] }, { "x-revalidate-secret": SECRET + "x" })).status).toBe(401);
    });
    it("when REVALIDATE_SECRET is not configured, even for an empty header", async () => {
      delete process.env.REVALIDATE_SECRET;
      expect((await post({ paths: ["/papers/1"] }, { "x-revalidate-secret": "" })).status).toBe(401);
      expect((await post({ paths: ["/papers/1"] })).status).toBe(401);
    });
    it("is checked before the body is parsed", async () => {
      expect((await post("not json", {})).status).toBe(401);
    });
  });

  describe("400", () => {
    it.each([
      ["malformed JSON", "{oops"],
      ["a JSON array", []],
      ["missing paths", {}],
      ["empty paths", { paths: [] }],
      ["paths not an array", { paths: "/papers/1" }],
      ["a non-string path", { paths: [1] }],
      ["a path outside the allowed prefixes", { paths: ["/search"] }],
      ["the root path", { paths: ["/"] }],
      ["a prefix lookalike", { paths: ["/papers-evil"] }],
      ["path traversal", { paths: ["/papers/../search"] }],
      ["a query string", { paths: ["/papers/1?x=1"] }],
      ["a protocol-relative URL", { paths: ["//evil.com/papers"] }],
      ["an absolute URL", { paths: ["https://evil.com/papers/1"] }],
      ["one bad path among good ones", { paths: ["/papers/1", "/admin"] }],
      ["too many paths", { paths: Array.from({ length: 101 }, (_, i) => `/papers/${i}`) }],
    ])("for %s", async (_name, body) => {
      const res = await post(body);
      expect(res.status).toBe(400);
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("200", () => {
    it("revalidates each path and returns the list", async () => {
      const paths = ["/papers/2501.07433", "/authors/ada-lovelace", "/topics/quantum-kernels", "/papers/page/1"];
      const res = await post({ paths });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ revalidated: paths });
      expect(revalidatePath.mock.calls.map((c) => c[0])).toEqual(paths);
    });
    it("accepts the bare section roots", async () => {
      const res = await post({ paths: ["/papers", "/authors", "/topics"] });
      expect(res.status).toBe(200);
    });
    it("deduplicates repeated paths", async () => {
      const res = await post({ paths: ["/papers/1", "/papers/1"] });
      expect(await res.json()).toEqual({ revalidated: ["/papers/1"] });
      expect(revalidatePath).toHaveBeenCalledTimes(1);
    });
  });

  describe("405", () => {
    it.each(["GET", "PUT", "PATCH", "DELETE"] as const)("for %s", async (method) => {
      const res = await route[method]();
      expect(res.status).toBe(405);
      expect(res.headers.get("Allow")).toBe("POST");
    });
  });
});
