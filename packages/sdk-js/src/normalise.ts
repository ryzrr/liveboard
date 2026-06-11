import type { IncomingMessage } from "http";

// ─── Route normalisation ─────────────────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;
const INTEGER_RE = /^\d+$/;
// Alphanumeric IDs: 6+ chars, contains at least one digit, no spaces
const MIXED_ID_RE = /^[a-zA-Z0-9_-]{6,}$/;

function isIdSegment(segment: string): boolean {
  if (INTEGER_RE.test(segment)) return true;
  if (UUID_RE.test(segment)) return true;
  if (OBJECT_ID_RE.test(segment)) return true;
  // Mixed: must contain a digit to distinguish IDs from route names like "users"
  if (MIXED_ID_RE.test(segment) && /\d/.test(segment)) return true;
  return false;
}

/** Convert /users/12345/posts/abc-123 → /users/:id/posts/:id */
export function normaliseUrl(rawUrl: string): string {
  const path = rawUrl.split("?")[0] ?? rawUrl;
  return path
    .split("/")
    .map((seg) => (seg && isIdSegment(seg) ? ":id" : seg))
    .join("/");
}

/**
 * Get the route pattern from a request.
 * Prefers the framework's own route pattern (Express: req.route.path,
 * Fastify: req.routerPath) — falls back to regex normalisation.
 */
export function getRoute(req: IncomingMessage): string {
  // Express attaches matched route pattern to req.route
  const expressBase: string = (req as any).baseUrl ?? "";
  const expressRoute: string = (req as any).route?.path ?? "";
  if (expressRoute) return expressBase + expressRoute;

  // Fastify attaches routerPath
  const fastifyPath: string = (req as any).routerPath ?? "";
  if (fastifyPath) return fastifyPath;

  // Fallback: normalise the raw URL
  return normaliseUrl(req.url ?? "/");
}

// ─── JWT user ID extraction ───────────────────────────────────────────────────

/**
 * Extract the `sub` claim from a Bearer JWT without verifying the signature.
 * We only need the user identifier — never the full token.
 */
export function extractUserId(req: IncomingMessage): string | undefined {
  const auth = (req.headers?.authorization as string | undefined) ?? "";
  if (!auth.startsWith("Bearer ")) return undefined;

  const token = auth.slice(7);
  const parts = token.split(".");
  if (parts.length !== 3) return undefined;

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1]!, "base64url").toString("utf-8")
    ) as Record<string, unknown>;
    const sub = payload["sub"];
    return sub !== undefined ? String(sub) : undefined;
  } catch {
    return undefined;
  }
}
