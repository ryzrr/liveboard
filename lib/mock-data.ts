import type {
  LogEntry,
  Incident,
  Endpoint,
  Trace,
  TraceSpan,
  AlertRule,
  ServiceStatus,
  ChartData,
  StatCard,
} from "./types";

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSparkline(base: number, points = 12): number[] {
  return Array.from({ length: points }, () =>
    Math.max(0, base + randomBetween(-base * 0.3, base * 0.3))
  );
}

export function getStatCards(): StatCard[] {
  return [
    {
      label: "Requests / min",
      value: "2.4k",
      delta: 12,
      deltaLabel: "vs yesterday",
      sparkline: generateSparkline(2400),
    },
    {
      label: "Error Rate",
      value: "1.8",
      unit: "%",
      delta: -0.3,
      deltaLabel: "vs yesterday",
      sparkline: generateSparkline(1.8),
    },
    {
      label: "p99 Latency",
      value: "284",
      unit: "ms",
      delta: 22,
      deltaLabel: "vs yesterday",
      sparkline: generateSparkline(284),
    },
    {
      label: "Active Users",
      value: "1.2k",
      delta: 5,
      deltaLabel: "vs yesterday",
      sparkline: generateSparkline(1200),
    },
  ];
}

export function generateChartData(hours: number): ChartData[] {
  const points = hours <= 6 ? hours * 12 : hours <= 24 ? hours * 4 : hours;
  const now = Date.now();
  const interval = (hours * 3600000) / points;

  return Array.from({ length: points }, (_, i) => {
    const t = new Date(now - (points - i) * interval);
    const hour = t.getHours();
    const base = 1800 + Math.sin((hour / 24) * Math.PI * 2) * 600;
    const requests = Math.max(0, base + randomBetween(-200, 200));
    const errorRate = Math.random() * 0.04;

    return {
      time: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      requests: Math.floor(requests),
      errors2xx: Math.floor(requests * (1 - errorRate) * 0.95),
      errors4xx: Math.floor(requests * errorRate * 0.7),
      errors5xx: Math.floor(requests * errorRate * 0.3),
      p99: randomBetween(180, 420),
    };
  });
}

const ROUTES = [
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/users",
  "/api/users/:id",
  "/api/products",
  "/api/products/:id",
  "/api/orders",
  "/api/orders/:id",
  "/api/checkout",
  "/api/payments",
  "/api/webhooks/stripe",
  "/api/search",
  "/api/analytics/events",
  "/health",
];

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
const STATUSES = [200, 201, 204, 400, 401, 403, 404, 422, 500, 502, 503];
const USER_IDS = [
  "user_892x",
  "user_110a",
  "user_4480",
  "anon_io",
  "user_7721",
  "sys_router",
  "user_3301",
  "user_9980",
];

export function generateLogEntries(count = 50): LogEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `log_${Date.now()}_${i}`,
    timestamp: new Date(Date.now() - i * 1200 - randomBetween(0, 800)),
    method: METHODS[randomBetween(0, METHODS.length - 1)],
    route: ROUTES[randomBetween(0, ROUTES.length - 1)],
    status: STATUSES[randomBetween(0, STATUSES.length - 1)],
    latency: randomBetween(12, 850),
    userId: USER_IDS[randomBetween(0, USER_IDS.length - 1)],
  }));
}

export function getIncidents(): Incident[] {
  return [
    {
      id: "inc_001",
      severity: "critical",
      title: "p99 Latency Spike on /api/checkout",
      summary:
        "p99 latency exceeded 2000ms for 8 minutes. Root cause: downstream payment service timeout. Affected ~340 requests. Auto-recovered after payment service restart.",
      endpoint: "/api/checkout",
      timestamp: new Date(Date.now() - 1800000),
      resolved: true,
    },
    {
      id: "inc_002",
      severity: "warning",
      title: "Elevated 4xx Rate on /api/auth",
      summary:
        "4xx error rate rose to 12% on the auth endpoints. Pattern matches credential-stuffing from 3 IP ranges. Rate limiting kicked in at 10:42 AM.",
      endpoint: "/api/auth/login",
      timestamp: new Date(Date.now() - 5400000),
      resolved: false,
    },
    {
      id: "inc_003",
      severity: "info",
      title: "Traffic Anomaly — /api/search",
      summary:
        "Unusual spike in search requests (3.2x normal). Likely a new feature release driving user activity. No error rate increase observed.",
      endpoint: "/api/search",
      timestamp: new Date(Date.now() - 10800000),
      resolved: true,
    },
  ];
}

export function getEndpoints(): Endpoint[] {
  return [
    { id: "ep_01", method: "POST", route: "/api/auth/login", requests24h: 48200, errorRate: 11.2, p50: 89, p95: 210, p99: 380, lastCalled: new Date(Date.now() - 2000), healthScore: 42 },
    { id: "ep_02", method: "GET", route: "/api/products", requests24h: 124000, errorRate: 0.4, p50: 45, p95: 120, p99: 195, lastCalled: new Date(Date.now() - 800), healthScore: 96 },
    { id: "ep_03", method: "GET", route: "/api/users/:id", requests24h: 88000, errorRate: 0.9, p50: 38, p95: 95, p99: 145, lastCalled: new Date(Date.now() - 1200), healthScore: 91 },
    { id: "ep_04", method: "POST", route: "/api/checkout", requests24h: 12400, errorRate: 3.1, p50: 320, p95: 890, p99: 1840, lastCalled: new Date(Date.now() - 4000), healthScore: 58 },
    { id: "ep_05", method: "POST", route: "/api/payments", requests24h: 11800, errorRate: 0.8, p50: 410, p95: 980, p99: 1200, lastCalled: new Date(Date.now() - 5000), healthScore: 84 },
    { id: "ep_06", method: "GET", route: "/api/orders", requests24h: 34000, errorRate: 0.2, p50: 52, p95: 130, p99: 200, lastCalled: new Date(Date.now() - 900), healthScore: 97 },
    { id: "ep_07", method: "POST", route: "/api/webhooks/stripe", requests24h: 8900, errorRate: 0.0, p50: 28, p95: 72, p99: 110, lastCalled: new Date(Date.now() - 3000), healthScore: 100 },
    { id: "ep_08", method: "GET", route: "/api/search", requests24h: 56000, errorRate: 0.6, p50: 85, p95: 240, p99: 420, lastCalled: new Date(Date.now() - 600), healthScore: 89 },
    { id: "ep_09", method: "PUT", route: "/api/users/:id", requests24h: 9200, errorRate: 1.4, p50: 95, p95: 280, p99: 520, lastCalled: new Date(Date.now() - 8000), healthScore: 75 },
    { id: "ep_10", method: "DELETE", route: "/api/products/:id", requests24h: 1200, errorRate: 0.0, p50: 65, p95: 140, p99: 210, lastCalled: new Date(Date.now() - 60000), healthScore: 99 },
    { id: "ep_11", method: "GET", route: "/api/analytics/events", requests24h: 22000, errorRate: 2.8, p50: 180, p95: 540, p99: 980, lastCalled: new Date(Date.now() - 2400), healthScore: 63 },
    { id: "ep_12", method: "GET", route: "/health", requests24h: 288000, errorRate: 0.0, p50: 4, p95: 8, p99: 12, lastCalled: new Date(Date.now() - 100), healthScore: 100 },
  ];
}

export function getTraces(): Trace[] {
  return Array.from({ length: 20 }, (_, i) => {
    const traceId = `trace_${(i + 1).toString().padStart(4, "0")}`;
    const hasError = i % 7 === 0;
    const totalDuration = randomBetween(80, 1800);

    const spans: TraceSpan[] = [
      {
        id: `${traceId}_s1`,
        traceId,
        service: "api-gateway",
        name: "HTTP POST /api/checkout",
        startTime: 0,
        duration: totalDuration,
        status: hasError ? "error" : "ok",
        tags: { "http.method": "POST", "http.url": "/api/checkout", "http.status_code": hasError ? "500" : "200" },
      },
      {
        id: `${traceId}_s2`,
        traceId,
        parentId: `${traceId}_s1`,
        service: "auth-service",
        name: "ValidateToken",
        startTime: 5,
        duration: randomBetween(10, 40),
        status: "ok",
        tags: { "user.id": "user_892x" },
      },
      {
        id: `${traceId}_s3`,
        traceId,
        parentId: `${traceId}_s1`,
        service: "product-service",
        name: "GetCartItems",
        startTime: 45,
        duration: randomBetween(20, 80),
        status: "ok",
        tags: { "db.type": "postgres" },
      },
      {
        id: `${traceId}_s4`,
        traceId,
        parentId: `${traceId}_s1`,
        service: "payment-service",
        name: "ChargeCard",
        startTime: 130,
        duration: randomBetween(100, 800),
        status: hasError ? "error" : "ok",
        tags: { "payment.provider": "stripe" },
      },
    ];

    return {
      id: traceId,
      rootSpan: `${traceId}_s1`,
      service: "api-gateway",
      endpoint: "/api/checkout",
      totalDuration,
      timestamp: new Date(Date.now() - i * 180000),
      status: hasError ? "error" : "ok",
      spans,
    };
  });
}

export function getAlertRules(): AlertRule[] {
  return [
    {
      id: "rule_01",
      name: "High Error Rate",
      metric: "error_rate",
      operator: ">",
      threshold: 5,
      window: 5,
      severity: "critical",
      channel: "Slack #alerts",
      status: "ok",
      enabled: true,
    },
    {
      id: "rule_02",
      name: "p99 Latency Spike",
      metric: "p99_latency",
      operator: ">",
      threshold: 2000,
      window: 3,
      severity: "critical",
      channel: "PagerDuty",
      status: "firing",
      lastTriggered: new Date(Date.now() - 1800000),
      enabled: true,
    },
    {
      id: "rule_03",
      name: "Low Traffic Warning",
      metric: "requests_per_min",
      operator: "<",
      threshold: 100,
      window: 10,
      severity: "warning",
      channel: "Slack #warnings",
      status: "ok",
      enabled: true,
    },
    {
      id: "rule_04",
      name: "Auth 4xx Spike",
      metric: "auth_4xx_rate",
      operator: ">",
      threshold: 10,
      window: 2,
      severity: "warning",
      channel: "Discord",
      status: "firing",
      lastTriggered: new Date(Date.now() - 5400000),
      enabled: true,
    },
    {
      id: "rule_05",
      name: "Payment Errors",
      metric: "payment_error_rate",
      operator: ">",
      threshold: 2,
      window: 5,
      severity: "critical",
      channel: "PagerDuty",
      status: "ok",
      enabled: false,
    },
  ];
}

export function getServiceStatuses(): ServiceStatus[] {
  return [
    {
      id: "svc_01",
      name: "API Gateway",
      uptime90d: 99.98,
      currentStatus: "operational",
      responseTime: 45,
      uptimeBars: Array.from({ length: 90 }, (_, i) => (i === 12 || i === 45 ? "degraded" : "up")),
    },
    {
      id: "svc_02",
      name: "Authentication",
      uptime90d: 99.91,
      currentStatus: "degraded",
      responseTime: 120,
      uptimeBars: Array.from({ length: 90 }, (_, i) =>
        i === 88 || i === 89 ? "degraded" : i === 30 ? "down" : "up"
      ),
    },
    {
      id: "svc_03",
      name: "Product Catalog",
      uptime90d: 100,
      currentStatus: "operational",
      responseTime: 38,
      uptimeBars: Array.from({ length: 90 }, () => "up" as const),
    },
    {
      id: "svc_04",
      name: "Payments",
      uptime90d: 99.99,
      currentStatus: "operational",
      responseTime: 410,
      uptimeBars: Array.from({ length: 90 }, (_, i) => (i === 60 ? "down" : "up")),
    },
    {
      id: "svc_05",
      name: "Search",
      uptime90d: 99.85,
      currentStatus: "operational",
      responseTime: 85,
      uptimeBars: Array.from({ length: 90 }, (_, i) =>
        [20, 21, 55].includes(i) ? "degraded" : "up"
      ),
    },
  ];
}
