import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Mints a short-lived, project-scoped realtime token for the browser's
// Socket.io / SSE connections — only after verifying the signed-in user is a
// member of the requested project. The browser never holds an API key.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
function internalToken(): string {
  return process.env.INTERNAL_SERVICE_TOKEN ?? process.env.API_SECRET_KEY ?? "";
}

export async function GET(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const project = new URL(req.url).searchParams.get("project");
  if (!project) return NextResponse.json({ error: "missing_project" }, { status: 400 });
  if (!session.projectIds?.includes(project)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const res = await fetch(`${API_URL}/v1/internal/realtime-token`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-internal-token": internalToken() },
    body: JSON.stringify({ project_id: project }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
