import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

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
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
