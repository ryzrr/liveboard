"use client";

import { useState, useMemo } from "react";
import { Plus, ArrowRight } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { RuleList } from "@/components/alerts/rule-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAlertRules } from "@/lib/mock-data";
import { timeAgo } from "@/lib/utils";

const CHANNELS = [
  { name: "Slack #alerts", status: "connected", icon: "💬" },
  { name: "PagerDuty", status: "connected", icon: "📟" },
  { name: "Discord", status: "connected", icon: "🎮" },
  { name: "Email", status: "disconnected", icon: "📧" },
];

const HISTORY = [
  { rule: "p99 Latency Spike", time: new Date(Date.now() - 1800000), resolved: true, duration: "8 min" },
  { rule: "Auth 4xx Spike", time: new Date(Date.now() - 5400000), resolved: false, duration: "ongoing" },
  { rule: "High Error Rate", time: new Date(Date.now() - 86400000), resolved: true, duration: "3 min" },
];

export default function AlertsPage() {
  const rules = useMemo(() => getAlertRules(), []);
  const [activeTab, setActiveTab] = useState<"rules" | "channels" | "history">("rules");

  const firing = rules.filter((r) => r.status === "firing").length;

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        breadcrumb={[{ label: "Projects" }, { label: "My API" }, { label: "Alerts" }]}
        actions={
          <Button variant="primary" size="sm">
            <Plus className="h-3 w-3" />
            New Rule
          </Button>
        }
      />

      <div className="p-5 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active Rules", value: rules.filter((r) => r.enabled).length, color: "#F5F5F5" },
            { label: "Firing Now", value: firing, color: firing > 0 ? "#EF4444" : "#22C55E" },
            { label: "Triggered Today", value: 4, color: "#F59E0B" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-[#1E1E1E] bg-[#111] p-4">
              <p className="text-[10px] text-[#444] uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold tabular-nums" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 p-0.5 rounded bg-[#111] border border-[#1E1E1E] w-fit">
          {(["rules", "channels", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs rounded capitalize font-medium transition-colors ${
                activeTab === tab ? "bg-blue text-white" : "text-[#555] hover:text-[#888]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "rules" && <RuleList rules={rules} />}

        {activeTab === "channels" && (
          <div className="grid grid-cols-2 gap-3">
            {CHANNELS.map((ch) => (
              <div key={ch.name} className="rounded-lg border border-[#1E1E1E] bg-[#111] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ch.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-[#F5F5F5]">{ch.name}</p>
                    <Badge
                      variant={ch.status === "connected" ? "green" : "default"}
                      dot
                      size="sm"
                    >
                      {ch.status}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Configure <ArrowRight className="h-3 w-3" /></Button>
              </div>
            ))}
            <button className="rounded-lg border border-dashed border-[#2A2A2A] bg-transparent p-4 flex items-center justify-center gap-2 text-[#444] hover:text-[#888] hover:border-[#333] transition-colors col-span-2">
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add Channel</span>
            </button>
          </div>
        )}

        {activeTab === "history" && (
          <div className="rounded-lg border border-[#1E1E1E] bg-[#111] divide-y divide-[#161616]">
            {HISTORY.map((h, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${h.resolved ? "bg-green" : "bg-red animate-pulse"}`} />
                <div className="flex-1">
                  <p className="text-xs font-medium text-[#F5F5F5]">{h.rule}</p>
                  <p className="text-[10px] text-[#444] mt-0.5">{timeAgo(h.time)} · Duration: {h.duration}</p>
                </div>
                <Badge variant={h.resolved ? "green" : "red"} size="sm">
                  {h.resolved ? "Resolved" : "Active"}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Rule builder preview */}
        {activeTab === "rules" && (
          <div className="rounded-lg border border-dashed border-[#2A2A2A] bg-[#0D0D0D] p-4">
            <p className="text-xs font-medium text-[#444] mb-3 uppercase tracking-wider">Quick Rule Builder</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#555]">Alert when</span>
              <select className="bg-[#111] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-[#F5F5F5] outline-none">
                <option>Error Rate</option>
                <option>p99 Latency</option>
                <option>Requests/min</option>
              </select>
              <select className="bg-[#111] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-[#F5F5F5] outline-none">
                <option>exceeds</option>
                <option>drops below</option>
                <option>equals</option>
              </select>
              <input
                type="number"
                defaultValue={5}
                className="bg-[#111] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-[#F5F5F5] outline-none w-16"
              />
              <span className="text-xs text-[#555]">% for</span>
              <input
                type="number"
                defaultValue={5}
                className="bg-[#111] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-[#F5F5F5] outline-none w-16"
              />
              <span className="text-xs text-[#555]">minutes</span>
              <Button variant="primary" size="sm" className="ml-auto">
                <Plus className="h-3 w-3" />
                Create Rule
              </Button>
            </div>
            <p className="text-[10px] text-[#333] mt-2.5 font-mono">
              Preview: Alert when Error Rate exceeds 5% for 5 minutes → sends to Slack #alerts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
