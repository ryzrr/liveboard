import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
function internalToken(): string {
  return process.env.INTERNAL_SERVICE_TOKEN ?? process.env.API_SECRET_KEY ?? "";
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await ctx.params;
  const res = await fetch(
    `${API_URL}/v1/internal/projects/${encodeURIComponent(id)}?email=${encodeURIComponent(email)}`,
    { method: "DELETE", headers: { "x-internal-token": internalToken() }, cache: "no-store" }
  );
  return new NextResponse(null, { status: res.ok ? 204 : res.status });
}
