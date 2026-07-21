import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { verifyProjectAccess } from "@/lib/project-access";

/**
 * Session-scoped read/write proxy for dashboard telemetry.
 *
 *   browser (no key) → here (NextAuth session) → backend (internal token + project)
 *
 * Enforces that the requested `?project=<id>` belongs to the signed-in user
 * with a fresh membership check (see lib/project-access.ts — a cached
 * session-level list goes stale the moment a project is created after
 * login), then forwards to the FastAPI backend with the server-only internal
 * token and an explicit `x-project-id`. The browser never holds a project API
 * key or the internal token.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
function internalToken(): string {
  return process.env.INTERNAL_SERVICE_TOKEN ?? process.env.API_SECRET_KEY ?? "";
}

async function proxy(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const reqUrl = new URL(req.url);
  const project = reqUrl.searchParams.get("project");
  if (!project) return NextResponse.json({ error: "missing_project" }, { status: 400 });
  if (!(await verifyProjectAccess(email, project))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { path } = await ctx.params;
  reqUrl.searchParams.delete("project");
  const qs = reqUrl.searchParams.toString();
  const target = `${API_URL}/${path.join("/")}${qs ? `?${qs}` : ""}`;

  const init: RequestInit = {
    method: req.method,
    headers: {
      "x-internal-token": internalToken(),
      "x-project-id": project,
      "content-type": "application/json",
    },
    cache: "no-store",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.text();
    if (body) init.body = body;
  }

  const res = await fetch(target, init);
  const text = await res.text();
  return new NextResponse(text || null, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
