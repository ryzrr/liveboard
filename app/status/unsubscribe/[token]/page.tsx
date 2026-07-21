import { CheckCircle2, XCircle } from "lucide-react";
import { LiveboardIcon } from "@/components/logo";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const res = await fetch(
    `${API_URL}/v1/public/status/subscriptions/${encodeURIComponent(token)}/unsubscribe`,
    { cache: "no-store" },
  );
  const data = (await res.json()) as { ok: boolean; detail: string };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <div className="max-w-sm text-center space-y-4">
        <LiveboardIcon size={28} />
        {data.ok ? (
          <CheckCircle2 className="h-8 w-8 text-green mx-auto" />
        ) : (
          <XCircle className="h-8 w-8 text-red mx-auto" />
        )}
        <p className={`text-sm ${data.ok ? "text-[#F5F5F5]" : "text-red"}`}>{data.detail}</p>
      </div>
    </div>
  );
}
