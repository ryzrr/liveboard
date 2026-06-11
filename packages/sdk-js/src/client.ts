import type { IngestBatch } from "./types";
import * as https from "https";
import * as http from "http";

const REQUEST_TIMEOUT_MS = 5_000;

/**
 * Fire-and-forget POST to /v1/ingest.
 * Silently drops errors — observability must never crash the host app.
 */
export function sendBatch(
  ingestUrl: string,
  apiKey: string,
  batch: IngestBatch
): void {
  const body = Buffer.from(JSON.stringify(batch), "utf-8");
  const url = new URL(`${ingestUrl}/v1/ingest`);
  const isHttps = url.protocol === "https:";
  const port = url.port
    ? parseInt(url.port, 10)
    : isHttps
    ? 443
    : 80;

  const options: http.RequestOptions = {
    hostname: url.hostname,
    port,
    path: url.pathname + url.search,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": body.byteLength,
      "x-api-key": apiKey,
    },
  };

  const transport = isHttps ? https : http;

  try {
    const req = transport.request(options, (res) => {
      // Drain the response body so the socket is released
      res.resume();
    });

    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy();
    });

    req.on("error", () => {
      // Silently drop — network failures are not SDK failures
    });

    req.write(body);
    req.end();
  } catch {
    // Silently drop
  }
}
