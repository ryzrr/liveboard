import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
function internalToken(): string {
  return process.env.INTERNAL_SERVICE_TOKEN ?? process.env.API_SECRET_KEY ?? "";
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { enabled } = (await req.json()) as { enabled: boolean };
  const { id } = await ctx.params;
  const res = await fetch(
    `${API_URL}/v1/internal/projects/${encodeURIComponent(id)}/status-page`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-internal-token": internalToken() },
      body: JSON.stringify({ email, enabled }),
      cache: "no-store",
    }
  );
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
