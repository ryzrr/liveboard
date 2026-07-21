const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
function internalToken(): string {
  return process.env.INTERNAL_SERVICE_TOKEN ?? process.env.API_SECRET_KEY ?? "";
}

/**
 * Fresh, per-request check that `email` may read `projectId` — queries org
 * membership straight from the backend rather than trusting a cached list.
 *
 * A project's membership can change after a session is issued (a new project
 * created, a team invite accepted), and NextAuth JWT sessions are not
 * re-derived on every request — only at sign-in. Caching this list in the
 * session (as `session.projectIds` used to) meant any project created after
 * login was invisible to every dashboard read and realtime connection until
 * the user signed out and back in. This mirrors the same "ask the backend,
 * not a stale cache" pattern already used by rotate/delete/status-page BFF
 * routes (`_require_member` on the backend side).
 */
export async function verifyProjectAccess(email: string, projectId: string): Promise<boolean> {
  const res = await fetch(
    `${API_URL}/v1/internal/access?email=${encodeURIComponent(email)}`,
    { headers: { "x-internal-token": internalToken() }, cache: "no-store" }
  );
  if (!res.ok) return false;
  const data = (await res.json()) as { projects?: { id: string }[] };
  return data.projects?.some((p) => p.id === projectId) ?? false;
}
