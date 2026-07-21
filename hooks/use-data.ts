"use client";

/**
 * Typed REST data hooks — one per backend query endpoint.
 * Each hook:
 *   1. Fetches real data from the API.
 *   2. Transforms snake_case backend response to camelCase frontend types.
 *   3. Shows an honest empty result while loading or if the API is
 *      unreachable — never fabricated data (see EMPTY_LIST in use-api-query).
 */

import { useApiQuery, EMPTY_LIST } from "@/hooks/use-api-query";
import { apiMutate } from "@/lib/api-client";
import { useProjects } from "@/components/providers/project-provider";
import type {
  AlertRule,
  ChartData,
  Endpoint,
  Incident,
  ServiceStatus,
  Trace,
  TraceSpan,
} from "@/lib/types";

// ─── Raw API shapes (snake_case) ─────────────────────────────────────────────

interface ApiEndpoint {
  id: string;
  method: string;
  route: string;
  requests24h: number;
  error_rate: number;
  p50: number;
  p95: number;
  p99: number;
  last_called: string;
  health_score: number;
}

interface ApiIncident {
  id: string;
  severity: string;
  title: string;
  summary: string;
  endpoint: string;
  timestamp: string;
  resolved: boolean;
}

interface ApiSpan {
  id: string;
  trace_id: string;
  parent_id?: string;
  service: string;
  name: string;
  start_time: number;
  duration: number;
  status: string;
  tags: Record<string, string>;
}

interface ApiTrace {
  id: string;
  root_span: string;
  service: string;
  endpoint: string;
  total_duration: number;
  timestamp: string;
  status: string;
  spans: ApiSpan[];
}

interface ApiService {
  id: string;
  name: string;
  uptime90d: number;
  current_status: string;
  response_time: number;
  uptime_bars: string[];
}

// ─── Transforms ──────────────────────────────────────────────────────────────

function toEndpoints(raw: unknown): Endpoint[] {
  return (raw as ApiEndpoint[]).map((e) => ({
    id: e.id,
    method: e.method as Endpoint["method"],
    route: e.route,
    requests24h: e.requests24h,
    errorRate: e.error_rate,
    p50: e.p50,
    p95: e.p95,
    p99: e.p99,
    lastCalled: new Date(e.last_called),
    healthScore: e.health_score,
  }));
}

function toIncidents(raw: unknown): Incident[] {
  return (raw as ApiIncident[]).map((i) => ({
    id: i.id,
    severity: i.severity as Incident["severity"],
    title: i.title,
    summary: i.summary,
    endpoint: i.endpoint,
    timestamp: new Date(i.timestamp),
    resolved: i.resolved,
  }));
}

function toTraces(raw: unknown): Trace[] {
  return (raw as ApiTrace[]).map((t) => ({
    id: t.id,
    rootSpan: t.root_span,
    service: t.service,
    endpoint: t.endpoint,
    totalDuration: t.total_duration,
    timestamp: new Date(t.timestamp),
    status: t.status as Trace["status"],
    spans: t.spans.map(
      (s): TraceSpan => ({
        id: s.id,
        traceId: s.trace_id,
        parentId: s.parent_id,
        service: s.service,
        name: s.name,
        startTime: s.start_time,
        duration: s.duration,
        status: s.status as TraceSpan["status"],
        tags: s.tags,
      })
    ),
  }));
}

function toServices(raw: unknown): ServiceStatus[] {
  return (raw as ApiService[]).map((s) => ({
    id: s.id,
    name: s.name,
    uptime90d: s.uptime90d,
    currentStatus: s.current_status as ServiceStatus["currentStatus"],
    responseTime: s.response_time,
    uptimeBars: s.uptime_bars as ServiceStatus["uptimeBars"],
  }));
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/** Request-volume and status-code breakdown for the overview charts. Polls every 30 s. */
export function useChartData(hours: number) {
  return useApiQuery<ChartData[]>(
    "/v1/metrics/timeseries",
    { hours: String(hours) },
    EMPTY_LIST as unknown as ChartData[],
    undefined,
    30_000,
  );
}

/** AI-detected incidents — polls every 60 s (matches anomaly worker cadence). */
export function useIncidents() {
  return useApiQuery<Incident[]>("/v1/incidents", {}, EMPTY_LIST as unknown as Incident[], toIncidents, 60_000);
}

/** Per-route aggregate stats for the endpoints explorer. */
export function useEndpoints(hours = 24) {
  return useApiQuery<Endpoint[]>(
    "/v1/endpoints",
    { hours: String(hours) },
    EMPTY_LIST as unknown as Endpoint[],
    toEndpoints,
  );
}

/** Distributed traces from the spans table. */
export function useTraces(hours = 24) {
  return useApiQuery<Trace[]>(
    "/v1/traces",
    { hours: String(hours) },
    EMPTY_LIST as unknown as Trace[],
    toTraces,
  );
}

/** Service health derived from route-prefix groups — used by the status page. */
export function useServices() {
  return useApiQuery<ServiceStatus[]>("/v1/services", {}, EMPTY_LIST as unknown as ServiceStatus[], toServices, 30_000);
}

// ─── Alert rules ─────────────────────────────────────────────────────────────

interface ApiAlertRule {
  id: string;
  name: string;
  metric: string;
  operator: string;
  threshold: number;
  window: number;
  severity: string;
  channel: string;
  status: string;
  enabled: boolean;
  last_triggered: string | null;
}

interface ApiAlertHistory {
  id: string;
  rule_name: string;
  fired_at: string;
  resolved_at: string | null;
  channel: string;
  resolved: boolean;
  duration: string;
}

export interface AlertHistoryEntry {
  id: string;
  ruleName: string;
  firedAt: Date;
  resolvedAt: Date | null;
  channel: string;
  resolved: boolean;
  duration: string;
}

export interface CreateAlertRulePayload {
  name: string;
  metric: string;
  operator: ">" | "<" | "=" | "!=";
  threshold: number;
  window: number;
  severity: "critical" | "warning" | "info";
  channel: string;
}

function toAlertRule(r: ApiAlertRule): AlertRule {
  return {
    id: r.id,
    name: r.name,
    metric: r.metric,
    operator: r.operator as AlertRule["operator"],
    threshold: r.threshold,
    window: r.window,
    severity: r.severity as AlertRule["severity"],
    channel: r.channel,
    status: r.status as AlertRule["status"],
    enabled: r.enabled,
    lastTriggered: r.last_triggered ? new Date(r.last_triggered) : undefined,
  };
}

function toAlertRules(raw: unknown): AlertRule[] {
  return (raw as ApiAlertRule[]).map(toAlertRule);
}

function toAlertHistory(raw: unknown): AlertHistoryEntry[] {
  return (raw as ApiAlertHistory[]).map((h) => ({
    id: h.id,
    ruleName: h.rule_name,
    firedAt: new Date(h.fired_at),
    resolvedAt: h.resolved_at ? new Date(h.resolved_at) : null,
    channel: h.channel,
    resolved: h.resolved,
    duration: h.duration,
  }));
}

/** Alert rules for the current project — with create/toggle helpers. */
export function useAlertRules() {
  const { activeProject } = useProjects();
  const project = activeProject?.id;
  // Poll so a rule flipping to "firing" (by the evaluation worker) shows up live.
  const query = useApiQuery<AlertRule[]>(
    "/v1/alert-rules", {}, EMPTY_LIST as unknown as AlertRule[], toAlertRules, 15_000,
  );

  async function createRule(payload: CreateAlertRulePayload): Promise<AlertRule> {
    const raw = await apiMutate<ApiAlertRule>("POST", "/v1/alert-rules", payload, project);
    return toAlertRule(raw);
  }

  async function toggleRule(id: string, enabled: boolean): Promise<void> {
    await apiMutate("PATCH", `/v1/alert-rules/${id}`, { enabled }, project);
  }

  async function deleteRule(id: string): Promise<void> {
    await apiMutate("DELETE", `/v1/alert-rules/${id}`, undefined, project);
  }

  return { ...query, createRule, toggleRule, deleteRule };
}

/** Alert firing history for the current project. */
export function useAlertHistory() {
  return useApiQuery<AlertHistoryEntry[]>(
    "/v1/alert-history", {}, EMPTY_LIST as unknown as AlertHistoryEntry[], toAlertHistory, 15_000,
  );
}

// ─── Alert channels (real delivery targets) ──────────────────────────────────

export interface AlertChannel {
  id: string;
  type: "slack" | "discord" | "pagerduty" | "webhook";
  name: string;
  webhookUrl: string | null;
  enabled: boolean;
  lastDeliveryAt: Date | null;
  lastDeliveryOk: boolean | null;
}

interface ApiChannel {
  id: string;
  type: string;
  name: string;
  webhook_url: string | null;
  enabled: boolean;
  last_delivery_at: string | null;
  last_delivery_ok: boolean | null;
}

function toChannel(r: ApiChannel): AlertChannel {
  return {
    id: r.id,
    type: r.type as AlertChannel["type"],
    name: r.name,
    webhookUrl: r.webhook_url,
    enabled: r.enabled,
    lastDeliveryAt: r.last_delivery_at ? new Date(r.last_delivery_at) : null,
    lastDeliveryOk: r.last_delivery_ok,
  };
}

export interface CreateChannelPayload {
  type: AlertChannel["type"];
  name: string;
  webhook_url: string;
  enabled?: boolean;
}

/** Real alert delivery channels for the current project. */
export function useChannels() {
  const { activeProject } = useProjects();
  const project = activeProject?.id;
  const query = useApiQuery<AlertChannel[]>(
    "/v1/channels",
    {},
    EMPTY_LIST as unknown as AlertChannel[],
    (raw) => (raw as ApiChannel[]).map(toChannel),
    15_000,
  );

  async function createChannel(input: CreateChannelPayload): Promise<AlertChannel> {
    const raw = await apiMutate<ApiChannel>("POST", "/v1/channels", input, project);
    query.refetch();
    return toChannel(raw);
  }
  async function updateChannel(id: string, patch: Partial<CreateChannelPayload>): Promise<void> {
    await apiMutate("PATCH", `/v1/channels/${id}`, patch, project);
    query.refetch();
  }
  async function deleteChannel(id: string): Promise<void> {
    await apiMutate("DELETE", `/v1/channels/${id}`, undefined, project);
    query.refetch();
  }
  async function testChannel(id: string): Promise<{ ok: boolean; detail: string }> {
    const res = await apiMutate<{ ok: boolean; detail: string }>("POST", `/v1/channels/${id}/test`, {}, project);
    query.refetch();
    return res;
  }

  return { ...query, createChannel, updateChannel, deleteChannel, testChannel };
}
