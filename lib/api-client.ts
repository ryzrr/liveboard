const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_KEY = process.env.NEXT_PUBLIC_LIVEBOARD_API_KEY ?? "";

/**
 * Fetch JSON from the LiveBoard API with x-api-key auth.
 * Throws if the key is missing or the response is not ok.
 */
export async function apiFetch<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  if (!API_KEY) throw new Error("NEXT_PUBLIC_LIVEBOARD_API_KEY is not configured");

  const url = new URL(`${API_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { "x-api-key": API_KEY },
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);

  return res.json() as Promise<T>;
}

/**
 * POST / PATCH / DELETE to the LiveBoard API.
 * Returns parsed JSON for 2xx responses with a body; undefined for 204.
 */
export async function apiMutate<T = void>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  if (!API_KEY) throw new Error("NEXT_PUBLIC_LIVEBOARD_API_KEY is not configured");

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${method} ${path}`);

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
