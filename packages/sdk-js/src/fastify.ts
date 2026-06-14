import { randomUUID } from "crypto";
import type { LiveBoardConfig } from "./types";
import { resolveConfig, shouldIgnore, shouldSample } from "./config";
import { EventBuffer } from "./buffer";
import { SDK_VERSION } from "./version";

// Minimal Fastify types to avoid a hard peer-dep import at runtime
type FastifyInstance = {
  addHook: (event: string, fn: (...args: any[]) => any) => void;
};
type FastifyRequest = {
  method: string;
  url: string;
  routerPath?: string;
  headers: Record<string, string | string[] | undefined>;
  raw: import("http").IncomingMessage;
};
type FastifyReply = {
  statusCode: number;
  header: (name: string, value: string) => void;
};

/** Symbol used to stash per-request timing data on the request object. */
const kStart = Symbol("liveboard.start");
const kTraceId = Symbol("liveboard.traceId");

/**
 * Fastify plugin for LiveBoard observability.
 *
 * Usage:
 *   await fastify.register(liveboardPlugin, { apiKey: 'lb_live_...' });
 */
export function createFastifyPlugin(config: LiveBoardConfig) {
  const resolved = resolveConfig(config);
  const buffer = new EventBuffer(
    resolved.ingestUrl,
    resolved.apiKey,
    resolved.batchSize,
    resolved.flushInterval
  );

  return async function liveboardPlugin(
    fastify: FastifyInstance,
    _opts: unknown
  ): Promise<void> {
    fastify.addHook("onRequest", (request: any, reply: any, done: () => void) => {
      request[kStart] = Date.now();
      // Propagate incoming trace ID from upstream service, or start a new trace
      const incoming = request.headers["x-trace-id"];
      request[kTraceId] = (typeof incoming === "string" && incoming) ? incoming : randomUUID();
      reply.header("x-trace-id", request[kTraceId]);
      done();
    });

    fastify.addHook(
      "onResponse",
      (request: any, reply: any, done: () => void) => {
        const route: string = request.routerPath ?? request.url ?? "/";

        if (!shouldIgnore(route, resolved.ignoreRoutes) && shouldSample(resolved.sampleRate)) {
          const durationMs = Date.now() - (request[kStart] as number ?? Date.now());

          buffer.add({
            method: (request.method as string).toUpperCase(),
            route,
            status_code: reply.statusCode as number,
            duration_ms: durationMs,
            trace_id: request[kTraceId] as string,
            user_id: resolved.getUserId(request.raw),
            timestamp: new Date().toISOString(),
            error_msg:
              reply.statusCode >= 500
                ? String(request.__liveboardError ?? "").slice(0, 500) || undefined
                : undefined,
            sdk_version: SDK_VERSION,
          });
        }

        done();
      }
    );
  };
}
