"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Sparkline } from "@/components/charts/sparkline";
import { cn } from "@/lib/utils";
import type { StatCard } from "@/lib/types";

interface StatCardProps {
  card: StatCard;
  sparkColor?: string;
}

export function StatCardComponent({ card, sparkColor = "#378ADD" }: StatCardProps) {
  const isPositive = card.delta > 0;
  const isGood = (card.label === "Error Rate" || card.label === "p99 Latency")
    ? !isPositive
    : isPositive;

  return (
    <div className="rounded-lg border border-[#1E1E1E] bg-[#111111] p-4 flex flex-col gap-3 hover:border-[#2A2A2A] transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-medium text-[#555] uppercase tracking-wider mb-1">
            {card.label}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-[#F5F5F5] tracking-tight tabular-nums">
              {card.value}
            </span>
            {card.unit && (
              <span className="text-sm text-[#555] font-medium">{card.unit}</span>
            )}
          </div>
        </div>
        <div className="w-24 h-9">
          <Sparkline data={card.sparkline} color={sparkColor} />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            "flex items-center gap-0.5 text-[10px] font-medium",
            isGood ? "text-green" : "text-red"
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-2.5 w-2.5" />
          ) : (
            <TrendingDown className="h-2.5 w-2.5" />
          )}
          <span>
            {isPositive ? "+" : ""}
            {card.delta}
            {card.unit === "%" ? "pp" : card.unit === "ms" ? "ms" : "%"}
          </span>
        </div>
        <span className="text-[10px] text-[#444]">{card.deltaLabel}</span>
      </div>
    </div>
  );
}
