import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
function internalToken(): string {
  return process.env.INTERNAL_SERVICE_TOKEN ?? process.env.API_SECRET_KEY ?? "";
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await ctx.params;
  const res = await fetch(
    `${API_URL}/v1/internal/projects/${encodeURIComponent(id)}/rotate`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-token": internalToken() },
      body: JSON.stringify({ email }),
      cache: "no-store",
    }
  );
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
