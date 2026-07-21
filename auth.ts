import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

interface ProvisionResult {
  user_id: string;
  org_id: string;
  projects: { id: string; name: string; org_id: string }[];
  new_api_key?: string | null;
}

/**
 * Server-only: ensure the user has a backend user + org + project.
 * Uses a trusted internal token (falls back to the master key in dev).
 * Never call from the browser — this runs only in NextAuth callbacks.
 */
async function provisionUser(email: string, name?: string): Promise<ProvisionResult | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const token = process.env.INTERNAL_SERVICE_TOKEN ?? process.env.API_SECRET_KEY;
  if (!token) {
    console.warn("[auth] No INTERNAL_SERVICE_TOKEN / API_SECRET_KEY set — skipping provisioning");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${apiUrl}/v1/internal/provision`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-token": token },
      body: JSON.stringify({ email, name }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error("[auth] provision returned", res.status);
      return null;
    }
    return (await res.json()) as ProvisionResult;
  } finally {
    clearTimeout(timeout);
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    ...(process.env.NODE_ENV !== "production"
      ? [
          Credentials({
            id: "dev-login",
            name: "Dev Login",
            credentials: {
              email: { label: "Email", type: "email" },
              name: { label: "Name", type: "text" },
            },
            authorize(credentials) {
              if (!credentials?.email) return null;
              const email = credentials.email as string;
              return {
                id: email,
                email,
                name: (credentials.name as string) || email.split("@")[0],
                image: null,
              };
            },
          }),
        ]
      : []),
  ],

  pages: { signIn: "/auth/signin" },
  session: { strategy: "jwt" },

  callbacks: {
    // Provision a real user + org + project in the backend on sign-in.
    // Never blocks login on failure.
    //
    // Deliberately NOT caching the project list on the token here: a JWT
    // session is only re-derived at sign-in, so a project created afterward
    // (by this route or a teammate) would look inaccessible — every
    // dashboard read and realtime connection 403ing — until the user signed
    // out and back in. Project access is instead checked fresh, per request,
    // against the backend (lib/project-access.ts).
    async jwt({ token, user }) {
      if (user?.email) {
        try {
          const result = await provisionUser(user.email, user.name ?? undefined);
          if (result) {
            token.userId = result.user_id;
            token.defaultProjectId = result.projects[0]?.id;
          }
        } catch (err) {
          console.error("[auth] provisionUser failed (non-fatal):", err);
        }
      }
      return token;
    },

    async signIn({ user }) {
      const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN?.trim();

      // No restrictions configured — allow all (open instance)
      if (allowedEmails.length === 0 && !allowedDomain) return true;

      const email = user.email ?? "";
      if (allowedEmails.length > 0 && allowedEmails.includes(email)) return true;
      if (allowedDomain && email.endsWith(`@${allowedDomain}`)) return true;

      return false;
    },

    async session({ session, token }) {
      const t = token as {
        userId?: string;
        defaultProjectId?: string;
        sub?: string;
      };
      if (session.user) {
        session.user.id = t.userId ?? t.sub ?? session.user.id;
      }
      session.defaultProjectId = t.defaultProjectId;
      return session;
    },
  },
});
