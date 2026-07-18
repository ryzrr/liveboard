import { randomUUID } from "crypto";
import type { IncomingMessage, ServerResponse } from "http";
import type { LiveBoardConfig } from "./types";
import { resolveConfig, shouldIgnore, shouldSample } from "./config";
import { getRoute } from "./normalise";
import { EventBuffer, SpanBuffer } from "./buffer";
import { SDK_VERSION } from "./version";

// Minimal Express-compatible types — avoids a hard @types/express dependency
// while remaining compatible with any Express 4/5 installation.
type NextFunction = (err?: unknown) => void;
type Middleware = (req: IncomingMessage, res: ServerResponse, next: NextFunction) => void;

/**
 * Express middleware for LiveBoard observability.
 *
 * Usage:
 *   app.use(liveboard({ apiKey: 'lb_live_...' }));
 */
export function createExpressMiddleware(config: LiveBoardConfig): Middleware {
  const resolved = resolveConfig(config);
  const buffer = new EventBuffer(
    resolved.ingestUrl,
    resolved.apiKey,
    resolved.batchSize,
    resolved.flushInterval
  );
  const spanBuffer = resolved.tracing
    ? new SpanBuffer(resolved.ingestUrl, resolved.apiKey, resolved.batchSize, resolved.flushInterval)
    : null;

  return function liveboardMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: NextFunction
  ): void {
    const startMs = Date.now();
    // Propagate incoming trace ID from upstream service, or start a new trace
    const incoming = req.headers["x-trace-id"];
    const traceId = (typeof incoming === "string" && incoming) ? incoming : randomUUID();

    // If an upstream instrumented service passed its span id, parent to it.
    const incomingParent = req.headers["x-parent-span-id"];
    const parentId = typeof incomingParent === "string" && incomingParent ? incomingParent : undefined;

    // This request's root span id — propagated to downstream services so they
    // can attach their spans under it (enables cross-service traces).
    const spanId = randomUUID();

    res.setHeader("x-trace-id", traceId);
    res.setHeader("x-parent-span-id", spanId);

    res.on("finish", () => {
      const route = getRoute(req);

      if (shouldIgnore(route, resolved.ignoreRoutes)) return;
      if (!shouldSample(resolved.sampleRate)) return;

      const durationMs = Date.now() - startMs;
      const statusCode = res.statusCode;
      const method = (req.method ?? "GET").toUpperCase();

      buffer.add({
        method,
        route,
        status_code: statusCode,
        duration_ms: durationMs,
        trace_id: traceId,
        user_id: resolved.getUserId(req),
        timestamp: new Date().toISOString(),
        error_msg:
          statusCode >= 500
            ? String((req as any).__liveboardError ?? "").slice(0, 500) || undefined
            : undefined,
        sdk_version: SDK_VERSION,
      });

      // Emit a root span for this request → powers the trace / flame-graph view.
      if (spanBuffer) {
        spanBuffer.add({
          span_id: spanId,
          trace_id: traceId,
          parent_id: parentId,
          service_name: resolved.service,
          operation: `${method} ${route}`,
          start_time: new Date(startMs).toISOString(),
          duration_ms: durationMs,
          status_code: statusCode,
          tags: { method, route },
        });
      }
    });

    next();
  };
}
