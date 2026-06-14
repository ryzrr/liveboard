import { randomUUID } from "crypto";
import type { IncomingMessage, ServerResponse } from "http";
import type { LiveBoardConfig } from "./types";
import { resolveConfig, shouldIgnore, shouldSample } from "./config";
import { getRoute } from "./normalise";
import { EventBuffer } from "./buffer";
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

  return function liveboardMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: NextFunction
  ): void {
    const startMs = Date.now();
    // Propagate incoming trace ID from upstream service, or start a new trace
    const incoming = req.headers["x-trace-id"];
    const traceId = (typeof incoming === "string" && incoming) ? incoming : randomUUID();

    res.setHeader("x-trace-id", traceId);

    res.on("finish", () => {
      const route = getRoute(req);

      if (shouldIgnore(route, resolved.ignoreRoutes)) return;
      if (!shouldSample(resolved.sampleRate)) return;

      const durationMs = Date.now() - startMs;
      const statusCode = res.statusCode;

      buffer.add({
        method: (req.method ?? "GET").toUpperCase(),
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
    });

    next();
  };
}
