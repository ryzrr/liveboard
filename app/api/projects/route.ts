import { NextResponse } from "next/server";
import { auth } from "@/auth";

// BFF: dashboard → here (session-authed) → backend internal endpoints (token-authed).
// The browser never sees the internal token or a project API key.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
function internalToken(): string {
  return process.env.INTERNAL_SERVICE_TOKEN ?? process.env.API_SECRET_KEY ?? "";
}

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const res = await fetch(
    `${API_URL}/v1/internal/projects?email=${encodeURIComponent(email)}`,
    { headers: { "x-internal-token": internalToken() }, cache: "no-store" }
  );
  if (!res.ok) return NextResponse.json({ error: "backend_error" }, { status: 502 });
  return NextResponse.json(await res.json());
}

export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (name.length < 2) {
    return NextResponse.json({ error: "invalid_name" }, { status: 422 });
  }

  const res = await fetch(`${API_URL}/v1/internal/projects`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-internal-token": internalToken() },
    body: JSON.stringify({ email, name }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
