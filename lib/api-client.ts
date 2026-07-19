/**
 * Dashboard reads/writes go through the same-origin BFF (`/api/lb/*`), which
 * authenticates via the NextAuth session and scopes to the caller's project.
 * No API key or internal token ever ships to the browser.
 *
 * Callers pass the active project id as `params.project` (reads) or the
 * `project` argument (mutations).
 */

function bffUrl(path: string, params: Record<string, string> = {}): string {
  const qs = new URLSearchParams(params).toString();
  return `/api/lb${path}${qs ? `?${qs}` : ""}`;
}

/** Fetch JSON from a backend query endpoint via the BFF. */
export async function apiFetch<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const res = await fetch(bffUrl(path, params), { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

/** POST / PATCH / DELETE to a backend endpoint via the BFF, scoped to `project`. */
export async function apiMutate<T = void>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  project?: string,
): Promise<T> {
  const res = await fetch(bffUrl(path, project ? { project } : {}), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${method} ${path}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
