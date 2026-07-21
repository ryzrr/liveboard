"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Public, unauthenticated subscribe form — posts straight to the FastAPI
 * public-status endpoint (CORS-allowed for this origin) rather than the
 * session-gated BFF, since a status-page visitor never has a session.
 * Shared by the public /status/[slug] page and the owner's authed preview.
 */
export function SubscribeForm({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubscribe() {
    if (!email.trim()) return;
    setState("sending");
    try {
      const res = await fetch(`${API_URL}/v1/public/status/${encodeURIComponent(slug)}/subscribe`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("sent");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="rounded-xl border border-[#1E1E1E] bg-[#111] p-6">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="h-4 w-4 text-[#949494]" />
        <h2 className="text-sm font-medium text-[#F5F5F5]">Get Incident Alerts</h2>
      </div>
      <p className="text-xs text-[#808080] mb-4">
        Subscribe to receive email notifications for incidents and status updates.
      </p>

      {state === "sent" ? (
        <p className="text-xs text-green">Check your email to confirm the subscription.</p>
      ) : (
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={state === "sending"}
            className="flex-1 bg-[#0D0D0D] border border-[#2A2A2A] rounded px-3 py-1.5 text-sm text-[#F5F5F5] placeholder-[#333] outline-none focus:border-blue transition-colors"
          />
          <Button variant="primary" size="md" onClick={handleSubscribe} disabled={!email.trim() || state === "sending"}>
            {state === "sending" ? "Subscribing…" : "Subscribe"}
          </Button>
        </div>
      )}
      {state === "error" && (
        <p className="text-xs text-red mt-2">Something went wrong — try again.</p>
      )}
    </section>
  );
}
