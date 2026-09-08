export type TimeRange = "live" | "1h" | "6h" | "24h" | "7d";

export interface StatCard {
  label: string;
  value: string | number;
  unit?: string;
  delta: number;
  deltaLabel: string;
  sparkline: number[];
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  route: string;
  status: number;
  latency: number;
  userId: string;
}

export interface Incident {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  summary: string;
  endpoint: string;
  timestamp: Date;
  resolved: boolean;
}

export interface Endpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  route: string;
  requests24h: number;
  errorRate: number;
  p50: number;
  p95: number;
  p99: number;
  lastCalled: Date;
  healthScore: number;
}

export interface MetricPoint {
  time: string;
  value: number;
}

export interface ChartData {
  time: string;
  requests: number;
  errors2xx: number;
  errors4xx: number;
  errors5xx: number;
  p99: number;
}
