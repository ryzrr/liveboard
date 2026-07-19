import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    /** Project IDs the signed-in user is authorized to read (org membership scope). */
    projectIds?: string[];
    /** The project shown by default in the dashboard. */
    defaultProjectId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    projectIds?: string[];
    defaultProjectId?: string;
  }
}
