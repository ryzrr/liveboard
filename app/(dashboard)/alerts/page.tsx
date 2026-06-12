"use client";

import { useState, useMemo } from "react";
import { Plus, ArrowRight, Send, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { RuleList } from "@/components/alerts/rule-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAlertRules } from "@/lib/mock-data";
import { timeAgo } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChannelType = "slack" | "discord" | "pagerduty" | "webhook";

interface Channel {
  id: string;
  type: ChannelType;
  name: string;
  status: "connected" | "disconnected" | "testing";
  webhookUrl?: string;
  lastDelivery?: Date;
  lastDeliveryOk?: boolean;
  icon: string;
}

// ─── Mock channel state ───────────────────────────────────────────────────────

const INITIAL_CHANNELS: Channel[] = [
  { id: "ch1", type: "slack", name: "Slack #alerts", status: "connected", webhookUrl: "https://hooks.slack.com/...", lastDelivery: new Date(Date.now() - 3600000), lastDeliveryOk: true, icon: "💬" },
  { id: "ch2", type: "pagerduty", name: "PagerDuty", status: "connected", webhookUrl: "https://events.pagerduty.com/...", lastDelivery: new Date(Date.now() - 7200000), lastDeliveryOk: true, icon: "📟" },
  { id: "ch3", type: "discord", name: "Discord #ops", status: "disconnected", icon: "🎮" },
  { id: "ch4", type: "webhook", name: "Custom Webhook", status: "disconnected", icon: "🔗" },
];

const HISTORY = [
  { rule: "p99 Latency Spike", time: new Date(Date.now() - 1800000), resolved: true, duration: "8 min", channel: "Slack #alerts" },
  { rule: "Auth 4xx Spike", time: new Date(Date.now() - 5400000), resolved: false, duration: "ongoing", channel: "PagerDuty" },
  { rule: "High Error Rate", time: new Date(Date.now() - 86400000), resolved: true, duration: "3 min", channel: "Slack #alerts" },
];

const SEVERITIES = [
  { value: "critical", label: "Critical", color: "#EF4444" },
  { value: "warning", label: "Warning", color: "#F59E0B" },
  { value: "info", label: "Info", color: "#378ADD" },
] as const;

type Severity = "critical" | "warning" | "info";

// ─── Channel config form ──────────────────────────────────────────────────────

function ChannelConfigForm({ channel, onSave, onClose }: {
  channel: Channel;
  onSave: (ch: Channel) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(channel.webhookUrl ?? "");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);

  const placeholder: Record<ChannelType, string> = {
    slack: "https://hooks.slack.com/services/T.../B.../...",
    discord: "https://discord.com/api/webhooks/...",
    pagerduty: "https://events.pagerduty.com/v2/enqueue",
    webhook: "https://your-server.com/webhook",
  };

  function handleTest() {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult("ok");
    }, 1400);
  }

  function handleSave() {
    onSave({ ...channel, webhookUrl: url, status: url ? "connected" : "disconnected" });
    onClose();
  }

  return (
    <div className="rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{channel.icon}</span>
          <span className="text-sm font-medium text-[#F5F5F5]">{channel.name}</span>
        </div>
        <button onClick={onClose} className="text-[#333] hover:text-[#666] text-xs">✕</button>
      </div>

      <div>
        <label className="text-[10px] text-[#444] uppercase tracking-wider">Webhook URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setTestResult(null); }}
          placeholder={placeholder[channel.type]}
          className="mt-1 w-full bg-[#111] border border-[#2A2A2A] rounded px-3 py-1.5 text-xs text-[#F5F5F5] placeholder-[#333] outline-none focus:border-blue transition-colors font-mono"
        />
      </div>

      {testResult && (
        <div className={cn(
          "flex items-center gap-1.5 text-xs rounded px-2 py-1",
          testResult === "ok" ? "bg-green/10 text-green border border-green/20" : "bg-red/10 text-red border border-red/20"
        )}>
          {testResult === "ok" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {testResult === "ok" ? "Test message delivered successfully" : "Delivery failed — check URL"}
        </div>
      )}

      {channel.lastDelivery && (
        <p className="text-[10px] text-[#333]">
          Last delivery: {timeAgo(channel.lastDelivery)} ·{" "}
          <span className={channel.lastDeliveryOk ? "text-green" : "text-red"}>
            {channel.lastDeliveryOk ? "OK" : "Failed"}
          </span>
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleTest} disabled={!url || testing}>
          {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          {testing ? "Sending…" : "Send Test"}
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={!url}>
          Save
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const rules = useMemo(() => getAlertRules(), []);
  const [activeTab, setActiveTab] = useState<"rules" | "channels" | "history">("rules");
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [configuringId, setConfiguringId] = useState<string | null>(null);

  // Rule builder state
  const [metric, setMetric] = useState("Error Rate");
  const [operator, setOperator] = useState("exceeds");
  const [threshold, setThreshold] = useState("5");
  const [window, setWindow] = useState("5");
  const [severity, setSeverity] = useState<Severity>("warning");
  const [channel, setChannel] = useState("ch1");

  const firing = rules.filter((r) => r.status === "firing").length;
  const selectedChannel = channels.find((c) => c.id === channel);

  const preview = `Alert when ${metric} ${operator} ${threshold}${metric === "Error Rate" ? "%" : "ms"} for ${window} min → ${selectedChannel?.name ?? "—"} [${severity}]`;

  function handleSaveChannel(updated: Channel) {
    setChannels((prev) => prev.map((c) => c.id === updated.id ? updated : c));
  }

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

        {/* ── Rules tab ── */}
        {activeTab === "rules" && (
          <>
            <RuleList rules={rules} />

            {/* Enhanced rule builder */}
            <div className="rounded-lg border border-dashed border-[#2A2A2A] bg-[#0D0D0D] p-4 space-y-3">
              <p className="text-xs font-medium text-[#444] uppercase tracking-wider">Rule Builder</p>

              {/* Main condition row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#555]">Alert when</span>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  className="bg-[#111] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-[#F5F5F5] outline-none focus:border-blue transition-colors"
                >
                  <option>Error Rate</option>
                  <option>p99 Latency</option>
                  <option>Requests/min</option>
                  <option>Apdex Score</option>
                </select>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="bg-[#111] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-[#F5F5F5] outline-none focus:border-blue transition-colors"
                >
                  <option>exceeds</option>
                  <option>drops below</option>
                  <option>equals</option>
                </select>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="bg-[#111] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-[#F5F5F5] outline-none w-16 focus:border-blue transition-colors"
                />
                <span className="text-xs text-[#555]">{metric === "Error Rate" ? "%" : "ms"} for</span>
                <input
                  type="number"
                  value={window}
                  onChange={(e) => setWindow(e.target.value)}
                  className="bg-[#111] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-[#F5F5F5] outline-none w-14 focus:border-blue transition-colors"
                />
                <span className="text-xs text-[#555]">min</span>
              </div>

              {/* Severity + channel row */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-[#555]">Severity</span>
                <div className="flex items-center gap-1">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSeverity(s.value)}
                      className={cn(
                        "px-2.5 py-1 rounded text-[10px] font-semibold border transition-colors",
                        severity === s.value
                          ? "border-current"
                          : "border-[#1E1E1E] text-[#555] hover:text-[#888]"
                      )}
                      style={severity === s.value ? { color: s.color, borderColor: s.color, backgroundColor: `${s.color}18` } : {}}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-[#555]">Send to</span>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="bg-[#111] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-[#F5F5F5] outline-none focus:border-blue transition-colors"
                >
                  {channels.filter((c) => c.status === "connected").map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <Button variant="primary" size="sm" className="ml-auto">
                  <Plus className="h-3 w-3" />
                  Create Rule
                </Button>
              </div>

              {/* Preview */}
              <p className="text-[10px] text-[#333] font-mono bg-[#0A0A0A] rounded px-3 py-2 border border-[#161616]">
                {preview}
              </p>
            </div>
          </>
        )}

        {/* ── Channels tab ── */}
        {activeTab === "channels" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {channels.map((ch) => (
                <div key={ch.id} className="space-y-0">
                  <div className="rounded-lg border border-[#1E1E1E] bg-[#111] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{ch.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-[#F5F5F5]">{ch.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={ch.status === "connected" ? "green" : "default"} dot size="sm">
                            {ch.status === "testing" ? "testing…" : ch.status}
                          </Badge>
                          {ch.lastDelivery && (
                            <span className="text-[10px] text-[#333]">
                              {timeAgo(ch.lastDelivery)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfiguringId(configuringId === ch.id ? null : ch.id)}
                    >
                      Configure <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                  {configuringId === ch.id && (
                    <ChannelConfigForm
                      channel={ch}
                      onSave={handleSaveChannel}
                      onClose={() => setConfiguringId(null)}
                    />
                  )}
                </div>
              ))}
            </div>
            <button className="rounded-lg border border-dashed border-[#2A2A2A] bg-transparent p-4 flex items-center justify-center gap-2 text-[#444] hover:text-[#888] hover:border-[#333] transition-colors w-full">
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add Channel</span>
            </button>
          </div>
        )}

        {/* ── History tab ── */}
        {activeTab === "history" && (
          <div className="rounded-lg border border-[#1E1E1E] bg-[#111] divide-y divide-[#161616]">
            {HISTORY.map((h, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-[#151515] transition-colors cursor-pointer">
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${h.resolved ? "bg-green" : "bg-red animate-pulse"}`} />
                <div className="flex-1">
                  <p className="text-xs font-medium text-[#F5F5F5]">{h.rule}</p>
                  <p className="text-[10px] text-[#444] mt-0.5">
                    {timeAgo(h.time)} · {h.duration} · via {h.channel}
                  </p>
                </div>
                <Badge variant={h.resolved ? "green" : "red"} size="sm">
                  {h.resolved ? "Resolved" : "Active"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
