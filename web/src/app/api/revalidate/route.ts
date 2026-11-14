import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";

const MAX_PATHS = 100;
const ALLOWED_PREFIXES = ["/papers", "/authors", "/topics"];

function json(body: unknown, status: number, headers?: Record<string, string>): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

/** Constant-time comparison. Hashing first equalises lengths, which timingSafeEqual requires. */
function secretMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** "/papers", "/papers/..." and the same for authors and topics; nothing else. */
function isAllowedPath(path: unknown): path is string {
  if (typeof path !== "string" || path.length > 512) return false;
  if (!path.startsWith("/") || /[?#\\\s]|\/\/|\/\.\.?(\/|$)/u.test(path)) return false;
  return ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function parsePaths(body: unknown): string[] | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const { paths } = body as { paths?: unknown };
  if (!Array.isArray(paths) || paths.length === 0 || paths.length > MAX_PATHS) return null;
  return paths.every(isAllowedPath) ? [...new Set(paths as string[])] : null;
}

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !secretMatches(request.headers.get("x-revalidate-secret"), expected)) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  const paths = parsePaths(body);
  if (!paths) {
    return json(
      {
        error: "invalid_body",
        detail: `Expected { "paths": string[] } with 1-${MAX_PATHS} paths starting with /papers, /authors or /topics.`,
      },
      400,
    );
  }

  for (const path of paths) revalidatePath(path);
  return json({ revalidated: paths }, 200);
}

function methodNotAllowed(): Response {
  return json({ error: "method_not_allowed" }, 405, { Allow: "POST" });
}

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
