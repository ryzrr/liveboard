"use client";

import { useEffect, useState } from "react";
import { Sparkline } from "@/components/charts/sparkline";
import { Reveal } from "@/components/landing/reveal";
import { SpotlightCard } from "@/components/landing/spotlight-card";

const UPTIME_TREND = [99.91, 99.93, 99.95, 99.9, 99.96, 99.97, 99.94, 99.97, 99.98, 99.97];

const LATENCY_BARS = [
  { route: "/checkout", ms: 86, color: "#3B82F6" },
  { route: "/orders", ms: 41, color: "#06B6D4" },
  { route: "/users/:id", ms: 18, color: "#A855F7" },
  { route: "/auth", ms: 12, color: "#F59E0B" },
  { route: "/cart/:id", ms: 24, color: "#F43F5E" },
];

const TOP_ENDPOINTS = [
  { route: "/api/checkout", pct: 92, color: "#3B82F6" },
  { route: "/api/orders", pct: 74, color: "#06B6D4" },
  { route: "/api/users/:id", pct: 58, color: "#A855F7" },
  { route: "/api/cart/:id", pct: 35, color: "#F59E0B" },
  { route: "/api/auth", pct: 22, color: "#F43F5E" },
];

function jitter(value: number, spread: number): number {
  return Math.max(0, value + (Math.random() - 0.5) * spread);
}

export function InsightsBento() {
  const [requests, setRequests] = useState(8204);
  const [errorRate, setErrorRate] = useState(0.42);

  useEffect(() => {
    const interval = setInterval(() => {
      setRequests((r) => Math.round(jitter(r, 600)));
      setErrorRate((e) => Math.round(jitter(e, 0.3) * 100) / 100);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="insights" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal className="text-center max-w-xl mx-auto">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-blue">Insights</span>
        <h2 className="mt-3 text-3xl font-display font-bold tracking-tight text-[#F5F5F5] sm:text-4xl">
          Meet your traffic copilot
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-[#888]">
          Real numbers from a live Liveboard project — every panel below updates on its own,
          the same way your dashboard would.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Uptime — tall panel */}
        <SpotlightCard className="rounded-xl sm:row-span-2">
          <div className="h-full rounded-xl border border-[#1E1E1E] bg-[#111111] p-6 flex flex-col">
            <p className="text-[10px] font-medium text-[#555] uppercase tracking-wider">Uptime</p>
            <div className="mt-4 flex items-center justify-center">
              <div className="relative h-32 w-32">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1E1E1E" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none"
                    stroke="#22C55E" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray="97.4 97.4"
                    strokeDashoffset="2"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold text-[#F5F5F5] tabular-nums">99.97%</span>
                  <span className="text-[10px] text-[#555]">30 days</span>
                </div>
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-[10px] text-[#555] mb-1.5">Successful requests</p>
              <div className="h-9">
                <Sparkline data={UPTIME_TREND} color="#22C55E" />
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* Latency by endpoint — wide panel */}
        <SpotlightCard className="rounded-xl sm:col-span-2">
          <div className="h-full rounded-xl border border-[#1E1E1E] bg-[#111111] p-6">
            <p className="text-[10px] font-medium text-[#555] uppercase tracking-wider">Latency by endpoint</p>
            <div className="mt-5 flex items-end justify-between gap-3 h-28">
              {LATENCY_BARS.map((bar) => (
                <div key={bar.route} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-mono text-[#777]">{bar.ms}ms</span>
                  <div
                    className="w-full rounded-t-sm transition-[height] duration-700"
                    style={{ height: `${Math.min(96, bar.ms)}px`, backgroundColor: bar.color, opacity: 0.85 }}
                  />
                  <span className="text-[10px] font-mono text-[#555] truncate">{bar.route}</span>
                </div>
              ))}
            </div>
          </div>
        </SpotlightCard>

        {/* Live counters */}
        <SpotlightCard className="rounded-xl">
          <div className="h-full rounded-xl border border-[#1E1E1E] bg-[#111111] p-6 space-y-5">
            <div>
              <p className="text-[10px] font-medium text-[#555] uppercase tracking-wider">Requests / min</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-xl font-semibold text-[#F5F5F5] tabular-nums">{requests.toLocaleString()}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-[#555] uppercase tracking-wider">Error rate</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-xl font-semibold text-[#F5F5F5] tabular-nums">{errorRate.toFixed(2)}%</span>
                <span className="text-[10px] text-green">within budget</span>
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* Top endpoints by volume */}
        <SpotlightCard className="rounded-xl">
          <div className="h-full rounded-xl border border-[#1E1E1E] bg-[#111111] p-6">
            <p className="text-[10px] font-medium text-[#555] uppercase tracking-wider">Top endpoints by volume</p>
            <div className="mt-4 space-y-2.5">
              {TOP_ENDPOINTS.map((ep) => (
                <div key={ep.route} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#777] w-24 truncate flex-shrink-0">{ep.route}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${ep.pct}%`, backgroundColor: ep.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SpotlightCard>
      </Reveal>
    </section>
  );
}
