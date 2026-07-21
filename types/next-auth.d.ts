import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    /** The project shown by default in the dashboard. */
    defaultProjectId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    defaultProjectId?: string;
  }
}
