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
import type {
  ChartData,
  Endpoint,
  Incident,
  ServiceStatus,
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

/** Service health derived from route-prefix groups — used by the status page. */
export function useServices() {
  return useApiQuery<ServiceStatus[]>("/v1/services", {}, EMPTY_LIST as unknown as ServiceStatus[], toServices, 30_000);
}
