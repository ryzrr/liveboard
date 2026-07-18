/**
 * Fetch a short-lived, project-scoped realtime token from the BFF.
 * Returns null if unauthenticated / not a member / backend unavailable —
 * callers fall back to demo mode.
 */
export async function fetchRealtimeToken(projectId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/realtime-token?project=${encodeURIComponent(projectId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string };
    return data.token ?? null;
  } catch {
    return null;
  }
}
