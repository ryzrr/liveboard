"use client";

import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, GitMerge, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ActivePipeline() {
  return (
    <div className="rounded-lg border border-[#1E1E1E] bg-[#111] p-4 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#888] uppercase tracking-wider">Active Pipeline Architecture</p>
        <Button variant="ghost" size="sm">
          <Zap className="h-3 w-3" />
          Edit Pipeline
        </Button>
      </div>

      {/* 1. INGRESS */}
      <div>
        <p className="text-[10px] font-semibold text-[#444] uppercase tracking-wider mb-2">
          1. INGRESS (ENTRY POINT)
        </p>
        <div className="rounded-lg border border-[#1E1E1E] bg-[#0D0D0D] p-3 space-y-2">
          {[
            { label: "Endpoint:", value: "/v1/chat/completions", badge: "POST" },
            { label: "Auth Protocol:", value: "Bearer Token (Strict)" },
            { label: "Rate Limit:", value: "req/min per IP", badge: "100" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-[10px] text-[#444]">{row.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#888] font-mono">{row.value}</span>
                {row.badge && (
                  <Badge variant="blue" size="sm">{row.badge}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. PRE-PROCESSING */}
      <div>
        <p className="text-[10px] font-semibold text-[#444] uppercase tracking-wider mb-2">
          2. PRE-PROCESSING (MIDDLEWARE)
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              title: "PII Redact",
              icon: Shield,
              fields: [{ k: "Mode:", v: "MASK" }, { k: "Engine:", v: "NER" }],
            },
            {
              title: "Injection",
              icon: GitMerge,
              fields: [{ k: "Heuristic:", v: "ON", green: true }, { k: "Vector:", v: "STRICT" }],
            },
            {
              title: "Toxicity Class.",
              icon: Zap,
              fields: [{ k: "Threshold:", v: "0.85" }, { k: "Action:", v: "DROP", red: true }],
            },
          ].map((block) => (
            <div key={block.title} className="rounded-lg border border-[#1E1E1E] bg-[#0D0D0D] p-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <block.icon className="h-3 w-3 text-[#444]" />
                <span className="text-[10px] font-medium text-[#888]">{block.title}</span>
              </div>
              {block.fields.map((f) => (
                <div key={f.k} className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-[#333]">{f.k}</span>
                  <span
                    className={`text-[9px] font-mono font-bold ${
                      "green" in f && f.green ? "text-green" : "red" in f && f.red ? "text-red" : "text-[#888]"
                    }`}
                  >
                    {f.v}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 3. DYNAMIC ROUTER */}
      <div>
        <p className="text-[10px] font-semibold text-[#444] uppercase tracking-wider mb-2">
          3. DYNAMIC ROUTER (DECISION MATRIX)
        </p>
        <div className="space-y-2">
          {[
            {
              num: "01",
              severity: "High",
              condition: ['IF', '[', 'Intent', ']', '==', '[', 'Billing', ',', 'Refund', ']'],
              route: "GPT-4o",
              temp: "0.2",
              maxTokens: "1024",
              badge: "red" as const,
            },
            {
              num: "02",
              severity: "Medium",
              condition: ['IF', '[', 'Intent', ']', '==', '[', 'General', ',', 'FAQ', ']'],
              route: "Claude Sonnet",
              temp: "0.7",
              maxTokens: "2048",
              badge: "yellow" as const,
            },
          ].map((rule) => (
            <div key={rule.num} className="rounded-lg border border-[#1E1E1E] bg-[#0D0D0D] p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#444]">Rule {rule.num}</span>
                  <Badge variant={rule.badge} size="sm">{rule.severity}</Badge>
                </div>
                <MoreHorizontal className="h-3.5 w-3.5 text-[#333]" />
              </div>
              <div className="font-mono text-[10px] text-[#555] mb-2.5 flex flex-wrap gap-1">
                {rule.condition.map((token, i) => (
                  <span
                    key={i}
                    className={
                      ["IF", "=="].includes(token) ? "text-blue" :
                      ["[", "]", ","].includes(token) ? "text-[#333]" :
                      ["Intent"].includes(token) ? "text-purple-400" :
                      "text-[#888]"
                    }
                  >
                    {token}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Route to:", value: rule.route },
                  { label: "Temp:", value: rule.temp },
                  { label: "Max Tokens:", value: rule.maxTokens },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[9px] text-[#333]">{f.label}</p>
                    <p className="text-[10px] font-mono text-[#888] font-medium">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
