import type { IncomingMessage } from "http";
import type { LiveBoardConfig, ResolvedConfig } from "./types";
import { extractUserId } from "./normalise";

const DEFAULTS = {
  ingestUrl: "http://localhost:8000",
  sampleRate: 1.0,
  ignoreRoutes: ["/health", "/healthz", "/ping", "/favicon.ico"],
  redactHeaders: ["authorization", "cookie"],
  flushInterval: 500,
  batchSize: 100,
  service: "api",
  tracing: true,
} as const;

export function resolveConfig(config: LiveBoardConfig): ResolvedConfig {
  if (!config.apiKey || typeof config.apiKey !== "string") {
    throw new Error("[liveboard-sdk] apiKey is required");
  }
  if (config.sampleRate !== undefined && (config.sampleRate < 0 || config.sampleRate > 1)) {
    throw new Error("[liveboard-sdk] sampleRate must be between 0 and 1");
  }

  return {
    apiKey: config.apiKey,
    ingestUrl: (config.ingestUrl ?? DEFAULTS.ingestUrl).replace(/\/$/, ""),
    sampleRate: config.sampleRate ?? DEFAULTS.sampleRate,
    ignoreRoutes: config.ignoreRoutes ?? [...DEFAULTS.ignoreRoutes],
    getUserId: config.getUserId ?? extractUserId,
    flushInterval: config.flushInterval ?? DEFAULTS.flushInterval,
    batchSize: config.batchSize ?? DEFAULTS.batchSize,
    service: config.service ?? DEFAULTS.service,
    tracing: config.tracing ?? DEFAULTS.tracing,
  };
}

export function shouldIgnore(
  path: string,
  ignoreRoutes: (string | RegExp)[]
): boolean {
  return ignoreRoutes.some((pattern) =>
    typeof pattern === "string" ? pattern === path : pattern.test(path)
  );
}

export function shouldSample(sampleRate: number): boolean {
  return sampleRate >= 1.0 || Math.random() < sampleRate;
}
