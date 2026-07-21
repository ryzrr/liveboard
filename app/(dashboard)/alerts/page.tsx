"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowRight, Send, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { RuleList } from "@/components/alerts/rule-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAlertRules, useAlertHistory, useChannels } from "@/hooks/use-data";
import type { CreateAlertRulePayload, AlertChannel, CreateChannelPayload } from "@/hooks/use-data";
import { useProjects } from "@/components/providers/project-provider";
import { timeAgo } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChannelType = "slack" | "discord" | "pagerduty" | "webhook";

const CHANNEL_ICON: Record<ChannelType, string> = {
  slack: "💬",
  discord: "🎮",
  pagerduty: "📟",
  webhook: "🔗",
};

const CHANNEL_TYPES: { value: ChannelType; label: string }[] = [
  { value: "slack", label: "Slack" },
  { value: "discord", label: "Discord" },
  { value: "pagerduty", label: "PagerDuty" },
  { value: "webhook", label: "Webhook" },
];


const SEVERITIES = [
  { value: "critical", label: "Critical", color: "#EF4444" },
  { value: "warning", label: "Warning", color: "#F59E0B" },
  { value: "info", label: "Info", color: "#378ADD" },
] as const;

type Severity = "critical" | "warning" | "info";

// ─── Channel config form ──────────────────────────────────────────────────────

const CHANNEL_PLACEHOLDER: Record<ChannelType, string> = {
  slack: "https://hooks.slack.com/services/T.../B.../...",
  discord: "https://discord.com/api/webhooks/...",
  pagerduty: "PagerDuty Events v2 routing key",
  webhook: "https://your-server.com/webhook",
};

function ChannelConfigForm({ channel, onSave, onTest, onDelete, onClose }: {
  channel: AlertChannel;
  onSave: (id: string, patch: { webhook_url: string; enabled: boolean }) => Promise<void>;
  onTest: (id: string) => Promise<{ ok: boolean; detail: string }>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(channel.webhookUrl ?? "");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; detail: string } | null>(null);

  async function handleTest() {
    setSaving(true);
    // Persist the URL first so the backend test uses the latest value.
    try { await onSave(channel.id, { webhook_url: url, enabled: true }); } finally { setSaving(false); }
    setTesting(true);
    setTestResult(null);
    try { setTestResult(await onTest(channel.id)); }
    catch { setTestResult({ ok: false, detail: "request failed" }); }
    finally { setTesting(false); }
  }

  async function handleSave() {
    setSaving(true);
    try { await onSave(channel.id, { webhook_url: url, enabled: true }); onClose(); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{CHANNEL_ICON[channel.type]}</span>
          <span className="text-sm font-medium text-[#F5F5F5]">{channel.name}</span>
        </div>
        <button onClick={onClose} className="text-[#808080] hover:text-[#949494] text-xs">✕</button>
      </div>

      <div>
        <label className="text-[10px] text-[#808080] uppercase tracking-wider">
          {channel.type === "pagerduty" ? "Routing key" : "Webhook URL"}
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setTestResult(null); }}
          placeholder={CHANNEL_PLACEHOLDER[channel.type]}
          className="mt-1 w-full bg-[#111] border border-[#2A2A2A] rounded px-3 py-1.5 text-xs text-[#F5F5F5] placeholder-[#333] outline-none focus:border-blue transition-colors font-mono"
        />
      </div>

      {testResult && (
        <div className={cn(
          "flex items-center gap-1.5 text-xs rounded px-2 py-1",
          testResult.ok ? "bg-green/10 text-green border border-green/20" : "bg-red/10 text-red border border-red/20"
        )}>
          {testResult.ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {testResult.ok ? `Test message delivered (${testResult.detail})` : `Delivery failed — ${testResult.detail}`}
        </div>
      )}

      {channel.lastDeliveryAt && (
        <p className="text-[10px] text-[#808080]">
          Last delivery: {timeAgo(channel.lastDeliveryAt)} ·{" "}
          <span className={channel.lastDeliveryOk ? "text-green" : "text-red"}>
            {channel.lastDeliveryOk ? "OK" : "Failed"}
          </span>
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleTest} disabled={!url || testing || saving}>
          {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          {testing ? "Sending…" : "Send Test"}
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={!url || saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <button
          onClick={() => onDelete(channel.id)}
          className="ml-auto text-[10px] text-[#949494] hover:text-red transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function AddChannelForm({ onCreate, onClose }: {
  onCreate: (input: CreateChannelPayload) => Promise<void>;
  onClose: () => void;
}) {
  const [type, setType] = useState<ChannelType>("slack");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim() || !url.trim()) return;
    setSaving(true);
    try { await onCreate({ type, name: name.trim(), webhook_url: url.trim(), enabled: true }); onClose(); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-dashed border-[#2A2A2A] bg-[#0D0D0D] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#888] uppercase tracking-wider">New channel</span>
        <button onClick={onClose} className="text-[#808080] hover:text-[#949494] text-xs">✕</button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ChannelType)}
          className="bg-[#111] border border-[#2A2A2A] rounded px-2 py-1.5 text-xs text-[#F5F5F5] outline-none focus:border-blue"
        >
          {CHANNEL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (e.g. Slack #alerts)"
          className="bg-[#111] border border-[#2A2A2A] rounded px-3 py-1.5 text-xs text-[#F5F5F5] placeholder-[#333] outline-none focus:border-blue flex-1 min-w-[160px]"
        />
      </div>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={CHANNEL_PLACEHOLDER[type]}
        className="w-full bg-[#111] border border-[#2A2A2A] rounded px-3 py-1.5 text-xs text-[#F5F5F5] placeholder-[#333] outline-none focus:border-blue font-mono"
      />
      <Button variant="primary" size="sm" onClick={handleCreate} disabled={!name.trim() || !url.trim() || saving}>
        {saving ? "Adding…" : "Add channel"}
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const METRIC_TO_KEY: Record<string, string> = {
  "Error Rate": "error_rate",
  "p99 Latency": "p99_latency",
  "Requests/min": "requests_per_min",
  "Apdex Score": "apdex_score",
};

const OPERATOR_TO_SYM: Record<string, ">" | "<" | "=" | "!="> = {
  exceeds: ">",
  "drops below": "<",
  equals: "=",
};

export default function AlertsPage() {
  const { activeProject } = useProjects();
  const { data: fetchedRules, createRule, toggleRule } = useAlertRules();
  const { data: historyEntries } = useAlertHistory();
  const { data: channels, createChannel, updateChannel, deleteChannel, testChannel } = useChannels();

  // Local rules state — seeded from API, updated optimistically on create
  const [localRules, setLocalRules] = useState(fetchedRules);
  // Sync when real data arrives (replaces mock fallback)
  useEffect(() => { setLocalRules(fetchedRules); }, [fetchedRules]);

  const [activeTab, setActiveTab] = useState<"rules" | "channels" | "history">("rules");
  const [configuringId, setConfiguringId] = useState<string | null>(null);
  const [addingChannel, setAddingChannel] = useState(false);
  const [creating, setCreating] = useState(false);

  // Rule builder state
  const [metric, setMetric] = useState("Error Rate");
  const [operator, setOperator] = useState("exceeds");
  const [threshold, setThreshold] = useState("5");
  const [window, setWindow] = useState("5");
  const [severity, setSeverity] = useState<Severity>("warning");
  // Rule "send to" holds the channel NAME (matched by the evaluation worker).
  const [channelName, setChannelName] = useState("");

  // Default the rule-builder channel to the first enabled channel once loaded.
  useEffect(() => {
    if (!channelName && channels.length > 0) {
      setChannelName(channels.find((c) => c.enabled)?.name ?? channels[0].name);
    }
  }, [channels, channelName]);

  const firing = localRules.filter((r) => r.status === "firing").length;
  const triggeredToday = historyEntries.filter((h) => {
    const d = h.firedAt;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
  }).length;

  const preview = `Alert when ${metric} ${operator} ${threshold}${metric === "Error Rate" ? "%" : "ms"} for ${window} min → ${channelName || "no channel"} [${severity}]`;

  async function handleCreateRule() {
    const payload: CreateAlertRulePayload = {
      name: `${metric} ${operator} ${threshold}`,
      metric: METRIC_TO_KEY[metric] ?? metric.toLowerCase().replace(/\s+/g, "_"),
      operator: OPERATOR_TO_SYM[operator] ?? ">",
      threshold: parseFloat(threshold) || 0,
      window: parseInt(window, 10) || 5,
      severity,
      channel: channelName,
    };
    setCreating(true);
    try {
      const newRule = await createRule(payload);
      setLocalRules((prev) => [...prev, newRule]);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    try {
      await toggleRule(id, enabled);
    } catch {
      // Optimistic update already applied in RuleList; silently ignore API errors
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        breadcrumb={[{ label: "Projects" }, { label: activeProject?.name ?? "—" }, { label: "Alerts" }]}
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
            { label: "Active Rules", value: localRules.filter((r) => r.enabled).length, color: "#F5F5F5" },
            { label: "Firing Now", value: firing, color: firing > 0 ? "#EF4444" : "#22C55E" },
            { label: "Triggered Today", value: triggeredToday, color: "#F59E0B" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-[#1E1E1E] bg-[#111] p-4">
              <p className="text-[10px] text-[#808080] uppercase tracking-wider mb-1">{stat.label}</p>
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
                activeTab === tab ? "bg-blue text-white" : "text-[#949494] hover:text-[#888]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Rules tab ── */}
        {activeTab === "rules" && (
          <>
            <RuleList rules={localRules} onToggle={handleToggle} />

            {/* Enhanced rule builder */}
            <div className="rounded-lg border border-dashed border-[#2A2A2A] bg-[#0D0D0D] p-4 space-y-3">
              <p className="text-xs font-medium text-[#808080] uppercase tracking-wider">Rule Builder</p>

              {/* Main condition row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#949494]">Alert when</span>
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
                <span className="text-xs text-[#949494]">{metric === "Error Rate" ? "%" : "ms"} for</span>
                <input
                  type="number"
                  value={window}
                  onChange={(e) => setWindow(e.target.value)}
                  className="bg-[#111] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-[#F5F5F5] outline-none w-14 focus:border-blue transition-colors"
                />
                <span className="text-xs text-[#949494]">min</span>
              </div>

              {/* Severity + channel row */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-[#949494]">Severity</span>
                <div className="flex items-center gap-1">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSeverity(s.value)}
                      className={cn(
                        "px-2.5 py-1 rounded text-[10px] font-semibold border transition-colors",
                        severity === s.value
                          ? "border-current"
                          : "border-[#1E1E1E] text-[#949494] hover:text-[#888]"
                      )}
                      style={severity === s.value ? { color: s.color, borderColor: s.color, backgroundColor: `${s.color}18` } : {}}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-[#949494]">Send to</span>
                <select
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="bg-[#111] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-[#F5F5F5] outline-none focus:border-blue transition-colors"
                >
                  {channels.filter((c) => c.enabled).length === 0 && (
                    <option value="">No channels — add one first</option>
                  )}
                  {channels.filter((c) => c.enabled).map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <Button variant="primary" size="sm" className="ml-auto" onClick={handleCreateRule} disabled={creating || !channelName}>
                  {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  {creating ? "Creating…" : "Create Rule"}
                </Button>
              </div>

              {/* Preview */}
              <p className="text-[10px] text-[#808080] font-mono bg-[#0A0A0A] rounded px-3 py-2 border border-[#161616]">
                {preview}
              </p>
            </div>
          </>
        )}

        {/* ── Channels tab ── */}
        {activeTab === "channels" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {channels.map((ch) => {
                const connected = Boolean(ch.webhookUrl) && ch.enabled;
                return (
                  <div key={ch.id} className="space-y-0">
                    <div className="rounded-lg border border-[#1E1E1E] bg-[#111] p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{CHANNEL_ICON[ch.type]}</span>
                        <div>
                          <p className="text-sm font-medium text-[#F5F5F5]">{ch.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant={connected ? "green" : "default"} dot size="sm">
                              {connected ? "connected" : "not configured"}
                            </Badge>
                            {ch.lastDeliveryAt && (
                              <span className="text-[10px] text-[#808080]">
                                {timeAgo(ch.lastDeliveryAt)} · {ch.lastDeliveryOk ? "OK" : "failed"}
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
                        onSave={updateChannel}
                        onTest={testChannel}
                        onDelete={async (id) => { await deleteChannel(id); setConfiguringId(null); }}
                        onClose={() => setConfiguringId(null)}
                      />
                    )}
                  </div>
                );
              })}
              {channels.length === 0 && !addingChannel && (
                <p className="col-span-2 text-xs text-[#808080] text-center py-6">
                  No channels yet. Add one to receive alert notifications.
                </p>
              )}
            </div>
            {addingChannel ? (
              <AddChannelForm onCreate={async (i) => { await createChannel(i); }} onClose={() => setAddingChannel(false)} />
            ) : (
              <button
                onClick={() => setAddingChannel(true)}
                className="rounded-lg border border-dashed border-[#2A2A2A] bg-transparent p-4 flex items-center justify-center gap-2 text-[#808080] hover:text-[#888] hover:border-[#333] transition-colors w-full"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add Channel</span>
              </button>
            )}
          </div>
        )}

        {/* ── History tab ── */}
        {activeTab === "history" && (
          <div className="rounded-lg border border-[#1E1E1E] bg-[#111] divide-y divide-[#161616]">
            {historyEntries.length === 0 && (
              <p className="text-xs text-[#808080] px-4 py-6 text-center">No alert history yet.</p>
            )}
            {historyEntries.map((h) => (
              <div key={h.id} className="flex items-center gap-4 px-4 py-3 hover:bg-[#151515] transition-colors cursor-pointer">
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${h.resolved ? "bg-green" : "bg-red animate-pulse"}`} />
                <div className="flex-1">
                  <p className="text-xs font-medium text-[#F5F5F5]">{h.ruleName}</p>
                  <p className="text-[10px] text-[#808080] mt-0.5">
                    {timeAgo(h.firedAt)} · {h.duration} · via {h.channel}
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
