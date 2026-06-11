"use client";

import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

interface PipelineNode {
  id: string;
  label: string;
  sublabel?: string;
  status: "healthy" | "warning" | "error";
  traffic?: number;
  latency?: number;
}

const NODES: PipelineNode[] = [
  { id: "gateway", label: "API Gateway", sublabel: "/v1/chat/completions", status: "healthy", traffic: 100 },
  { id: "gpt4o", label: "GPT-4o", status: "healthy", traffic: 68, latency: 120 },
  { id: "claude", label: "Claude Sonnet", status: "healthy", traffic: 22, latency: 145 },
  { id: "gemini", label: "Gemini Flash", status: "warning", traffic: 10, latency: 850 },
];

const GUARDRAIL_ROWS = [
  { time: "10:42 AM", client: "user_892x", rule: "PII_Detector_v2 (Credit Card Info)", prompt: '"payment with 4532 1121"', action: "Blocked" as const },
  { time: "10:15 AM", client: "user_110a", rule: "Prompt Injection Attempt", prompt: '"Ignore previous instructions"', action: "Fallback" as const },
  { time: "09:30 AM", client: "sys_router", rule: "Upstream Timeout (GPT-4o > 5000ms)", prompt: '"Summarize the attached 50…"', action: "Blocked" as const },
  { time: "09:12 AM", client: "user_4480", rule: "Output Parsing: Invalid JSON Schema", prompt: "user_name: John Doe...", action: "Retried" as const },
  { time: "08:45 AM", client: "anon_io", rule: "Rate Limit: 50 requests / minute", prompt: '"What is the capital of E…"', action: "Fallback" as const },
];

const ACTION_VARIANTS = {
  Blocked: "red" as const,
  Fallback: "yellow" as const,
  Retried: "blue" as const,
};

export function PipelineArchitecture() {
  return (
    <div className="space-y-4">
      {/* Flow diagram */}
      <div className="rounded-lg border border-[#1E1E1E] bg-[#111] p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-[#888] uppercase tracking-wider">Endpoint Traffic & Health</p>
          <div className="flex items-center gap-1.5 text-[10px] text-[#444]">
            <div className="h-1.5 w-1.5 rounded-full bg-green" />
            Live
          </div>
        </div>

        {/* Gateway node */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-lg border border-[#2A2A2A] bg-[#161616] px-5 py-3 text-center">
            <p className="text-xs font-semibold text-[#F5F5F5] mb-0.5">API Gateway</p>
            <p className="text-[10px] text-[#444] font-mono">/v1/chat/completions</p>
            <p className="text-[10px] text-blue mt-1">124k Reqs</p>
          </div>

          {/* Connectors */}
          <div className="flex items-start gap-4 w-full">
            {NODES.slice(1).map((node) => (
              <div key={node.id} className="flex-1 flex flex-col items-center gap-2">
                <div className="h-4 w-px bg-[#2A2A2A]" />
                <div
                  className={`w-full rounded-lg border px-3 py-2 ${
                    node.status === "healthy"
                      ? "border-green/20 bg-green/5"
                      : "border-yellow/20 bg-yellow/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-[#F5F5F5]">{node.label}</span>
                    <Badge variant={node.status === "healthy" ? "green" : "yellow"} size="sm">
                      {node.status === "healthy" ? "Healthy" : "Warning"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#444]">
                    <span>Traffic</span>
                    <span className="text-[#888] font-mono">{node.traffic}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#444]">
                    <span>Avg</span>
                    <span className="font-mono" style={{ color: node.latency && node.latency > 500 ? "#F59E0B" : "#888" }}>
                      {node.latency}ms
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guardrail exceptions */}
      <div className="rounded-lg border border-[#1E1E1E] bg-[#111] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E1E1E]">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-[#555]" />
            <span className="text-xs font-medium text-[#888] uppercase tracking-wider">Guardrail Exceptions</span>
          </div>
          <button className="text-[10px] text-[#444] hover:text-[#888] transition-colors flex items-center gap-1">
            Filter
          </button>
        </div>

        <div className="grid grid-cols-[80px_90px_1fr_160px_70px] gap-2 px-4 py-2 border-b border-[#161616]">
          {["Time", "Client ID", "Violation / Rule", "Prompt Snippet", "Action"].map((h) => (
            <span key={h} className="text-[10px] font-medium text-[#444] uppercase tracking-wider">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-[#161616]">
          {GUARDRAIL_ROWS.map((row, i) => (
            <div key={i} className="grid grid-cols-[80px_90px_1fr_160px_70px] gap-2 px-4 py-2 items-center hover:bg-[#151515] transition-colors">
              <span className="text-[10px] text-[#444] font-mono">{row.time}</span>
              <span className="text-[10px] text-blue font-mono">{row.client}</span>
              <span className="text-xs text-[#555] truncate">{row.rule}</span>
              <span className="text-[10px] text-[#444] font-mono truncate">{row.prompt}</span>
              <Badge variant={ACTION_VARIANTS[row.action]}>{row.action}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
