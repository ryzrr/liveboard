"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { TimeRangePicker } from "@/components/layout/time-range-picker";
import { PipelineArchitecture } from "@/components/dashboard/pipeline-architecture";
import { ActivePipeline } from "@/components/dashboard/active-pipeline";
import { StatCardComponent } from "@/components/dashboard/stat-card";
import { useTimeRange } from "@/hooks/use-time-range";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { StatCard } from "@/lib/types";

const PIPELINE_CARDS: StatCard[] = [
  { label: "Processed Prompts", value: "124", unit: "k", delta: 15, deltaLabel: "vs yesterday", sparkline: [80,90,95,110,100,115,120,124,118,122,119,124] },
  { label: "Avg. Latency", value: "850", unit: "ms", delta: 45, deltaLabel: "vs yesterday", sparkline: [700,720,800,810,790,830,845,850,840,855,848,850] },
  { label: "Total Cost", value: "$452", delta: -120, deltaLabel: "vs yesterday", sparkline: [580,560,540,510,490,480,465,460,455,452,454,452] },
  { label: "Blocked Requests", value: "2.4", unit: "k", delta: 4, deltaLabel: "vs yesterday", sparkline: [1.8,1.9,2.0,2.1,2.0,2.2,2.3,2.35,2.4,2.38,2.4,2.4] },
];

const PIPELINE_LIST = [
  { name: "Customer Support Bot", status: "healthy", requests: "124k", model: "GPT-4o / Claude" },
  { name: "Code Review Agent", status: "healthy", requests: "38k", model: "Claude Sonnet" },
  { name: "Document Summarizer", status: "warning", requests: "12k", model: "Gemini Flash" },
  { name: "Email Classifier", status: "healthy", requests: "89k", model: "GPT-4o Mini" },
];

export default function PipelinesPage() {
  const { range, setRange } = useTimeRange("24h");
  const [activePipeline, setActivePipeline] = useState(PIPELINE_LIST[0].name);

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        breadcrumb={[
          { label: "Pipelines" },
          { label: activePipeline },
        ]}
        actions={
          <>
            <TimeRangePicker value={range} onChange={setRange} />
            <Button variant="primary" size="sm">
              <Plus className="h-3 w-3" />
              New Flow
            </Button>
          </>
        }
      />

      {/* Overview/Metrics/Evaluations tabs */}
      <div className="flex items-center gap-0.5 px-5 pt-4 border-b border-[#1E1E1E]">
        {["Overview", "Metrics", "Evaluations"].map((tab, i) => (
          <button
            key={tab}
            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
              i === 0
                ? "border-blue text-[#F5F5F5]"
                : "border-transparent text-[#555] hover:text-[#888]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-1 gap-0">
        {/* Left: pipeline list */}
        <div className="w-[200px] flex-shrink-0 border-r border-[#1E1E1E] p-3 space-y-1">
          <p className="text-[10px] text-[#333] uppercase tracking-wider px-2 mb-2">Pipelines</p>
          {PIPELINE_LIST.map((p) => (
            <button
              key={p.name}
              onClick={() => setActivePipeline(p.name)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                activePipeline === p.name
                  ? "bg-blue-dim text-blue border border-blue-border"
                  : "text-[#888] hover:text-[#F5F5F5] hover:bg-[#161616] border border-transparent"
              }`}
            >
              <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${p.status === "healthy" ? "bg-green" : "bg-yellow"}`} />
              <span className="text-xs font-medium truncate">{p.name}</span>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-5 space-y-5 min-w-0">
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-3">
            {PIPELINE_CARDS.map((card, i) => {
              const COLORS = ["#378ADD", "#F59E0B", "#22C55E", "#EF4444"];
              return (
                <StatCardComponent
                  key={card.label}
                  card={card}
                  sparkColor={COLORS[i]}
                />
              );
            })}
          </div>

          <PipelineArchitecture />
        </div>

        {/* Right: Active pipeline architecture */}
        <div className="w-[320px] flex-shrink-0 border-l border-[#1E1E1E] overflow-y-auto no-scrollbar p-4">
          <ActivePipeline />
        </div>
      </div>
    </div>
  );
}
