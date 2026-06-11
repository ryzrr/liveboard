"use client";

import { useState } from "react";
import { Zap, Bell, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { timeAgo, cn } from "@/lib/utils";
import type { AlertRule } from "@/lib/types";

interface RuleListProps {
  rules: AlertRule[];
}

const METRIC_LABELS: Record<string, string> = {
  error_rate: "Error Rate",
  p99_latency: "p99 Latency",
  requests_per_min: "Requests/min",
  auth_4xx_rate: "Auth 4xx Rate",
  payment_error_rate: "Payment Errors",
};

const OPERATOR_LABELS: Record<string, string> = {
  ">": "exceeds",
  "<": "drops below",
  "=": "equals",
  "!=": "differs from",
};

const SEVERITY_ICONS = {
  critical: Zap,
  warning: Bell,
  info: Info,
};

export function RuleList({ rules }: RuleListProps) {
  const [localRules, setLocalRules] = useState(rules);

  const toggle = (id: string) => {
    setLocalRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  return (
    <div className="rounded-lg border border-[#1E1E1E] bg-[#111] overflow-hidden">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px_40px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E]">
        {["Rule", "Condition", "Channel", "Last Triggered", "Status", ""].map((h) => (
          <span key={h} className="text-[10px] font-medium text-[#444] uppercase tracking-wider">
            {h}
          </span>
        ))}
      </div>

      <div className="divide-y divide-[#161616]">
        {localRules.map((rule) => {
          const Icon = SEVERITY_ICONS[rule.severity];
          const thresholdUnit = rule.metric.includes("latency") ? "ms" : rule.metric.includes("rate") ? "%" : "";

          return (
            <div
              key={rule.id}
              className={cn(
                "grid grid-cols-[2fr_1fr_1fr_1fr_80px_40px] gap-3 px-4 py-3 items-center",
                !rule.enabled && "opacity-40",
                rule.status === "firing" && "bg-red/5"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    "h-5 w-5 rounded flex items-center justify-center flex-shrink-0",
                    rule.severity === "critical" ? "bg-red-dim" : rule.severity === "warning" ? "bg-yellow-dim" : "bg-blue-dim"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-2.5 w-2.5",
                      rule.severity === "critical" ? "text-red" : rule.severity === "warning" ? "text-yellow" : "text-blue"
                    )}
                  />
                </div>
                <span className="text-xs font-medium text-[#F5F5F5] truncate">{rule.name}</span>
              </div>

              <span className="text-[10px] text-[#555] font-mono leading-tight">
                {METRIC_LABELS[rule.metric]} {OPERATOR_LABELS[rule.operator]} {rule.threshold}{thresholdUnit} / {rule.window}min
              </span>

              <span className="text-xs text-[#555]">{rule.channel}</span>

              <span className="text-xs text-[#444]">
                {rule.lastTriggered ? timeAgo(rule.lastTriggered) : "—"}
              </span>

              <div>
                {rule.status === "firing" ? (
                  <Badge variant="red" dot>Firing</Badge>
                ) : rule.status === "pending" ? (
                  <Badge variant="yellow" dot>Pending</Badge>
                ) : (
                  <Badge variant="green" dot>OK</Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggle(rule.id)}
                  className={cn(
                    "h-4 w-7 rounded-full transition-colors relative flex items-center",
                    rule.enabled ? "bg-blue" : "bg-[#2A2A2A]"
                  )}
                >
                  <span
                    className={cn(
                      "h-3 w-3 rounded-full bg-white absolute transition-all",
                      rule.enabled ? "left-[14px]" : "left-[2px]"
                    )}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
