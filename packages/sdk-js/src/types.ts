import type { IncomingMessage } from "http";

// ─── Public config ────────────────────────────────────────────────────────────

export interface LiveBoardConfig {
  /** Project API key — starts with lb_live_ */
  apiKey: string;
  /** Base URL of your LiveBoard ingest API. Default: http://localhost:8000 */
  ingestUrl?: string;
  /** Fraction of requests to capture (0–1). Default: 1.0 */
  sampleRate?: number;
  /**
   * Routes to skip entirely.
   * Strings are exact-matched against the normalised path.
   * RegExps are tested against the raw URL.
   * Default: ['/health', '/ping', '/favicon.ico']
   */
  ignoreRoutes?: (string | RegExp)[];
  /** Header names whose values are replaced with [redacted]. Default: ['authorization', 'cookie'] */
  redactHeaders?: string[];
  /**
   * Extract a user identifier from the request.
   * Default: reads the `sub` claim from a Bearer JWT in the Authorization header.
   */
  getUserId?: (req: IncomingMessage) => string | undefined;
  /** How often to flush the event buffer (ms). Default: 500 */
  flushInterval?: number;
  /** Flush early when the buffer reaches this many events. Default: 100 */
  batchSize?: number;
  /**
   * Service name attached to emitted spans (shown in the trace/flame view).
   * Default: 'api'
   */
  service?: string;
  /**
   * Emit a distributed-tracing span per request. Default: true.
   * Set false to send only request events (no spans).
   */
  tracing?: boolean;
}

// ─── Internal resolved config (all fields required + defaults applied) ────────

export interface ResolvedConfig {
  apiKey: string;
  ingestUrl: string;
  sampleRate: number;
  ignoreRoutes: (string | RegExp)[];
  getUserId: (req: IncomingMessage) => string | undefined;
  flushInterval: number;
  batchSize: number;
  service: string;
  tracing: boolean;
}

// ─── Wire format — must match apps/api/api/schemas.py EventPayload exactly ───

export interface EventPayload {
  method: string;
  route: string;
  status_code: number;
  duration_ms: number;
  trace_id: string;
  user_id?: string;
  timestamp: string;       // ISO 8601 UTC
  error_msg?: string;      // max 500 chars, only when status ≥ 500
  sdk_version: string;
}

export interface IngestBatch {
  events: EventPayload[];
}

// ─── Span wire format — must match apps/api/api/schemas.py SpanIn exactly ─────

export interface SpanPayload {
  span_id: string;
  trace_id: string;
  parent_id?: string;
  service_name: string;
  operation: string;
  start_time: string;      // ISO 8601 UTC
  duration_ms: number;
  status_code: number;
  tags: Record<string, string>;
}

export interface SpanBatch {
  spans: SpanPayload[];
}
