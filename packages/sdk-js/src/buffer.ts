import type { EventPayload, IngestBatch, SpanPayload, SpanBatch } from "./types";
import { sendBatch, sendSpans } from "./client";

export class EventBuffer {
  private queue: EventPayload[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  constructor(
    private readonly ingestUrl: string,
    private readonly apiKey: string,
    private readonly batchSize: number,
    flushIntervalMs: number
  ) {
    this.timer = setInterval(() => this.flush(), flushIntervalMs);
    // .unref() so the timer doesn't keep the Node process alive
    if (this.timer.unref) this.timer.unref();

    const shutdown = () => this.flushSync();
    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
  }

  add(event: EventPayload): void {
    this.queue.push(event);
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  flush(): void {
    if (this.flushing || this.queue.length === 0) return;
    this.flushing = true;

    const batch: IngestBatch = { events: this.queue.splice(0) };
    sendBatch(this.ingestUrl, this.apiKey, batch);

    this.flushing = false;
  }

  /** Best-effort synchronous drain on process exit. */
  private flushSync(): void {
    this.flush();
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush();
  }
}

/** Batches spans and flushes them to /v1/spans on an interval or when full. */
export class SpanBuffer {
  private queue: SpanPayload[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  constructor(
    private readonly ingestUrl: string,
    private readonly apiKey: string,
    private readonly batchSize: number,
    flushIntervalMs: number
  ) {
    this.timer = setInterval(() => this.flush(), flushIntervalMs);
    if (this.timer.unref) this.timer.unref();

    const shutdown = () => this.flush();
    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
  }

  add(span: SpanPayload): void {
    this.queue.push(span);
    // Backend accepts up to 500 spans per batch.
    if (this.queue.length >= Math.min(this.batchSize, 500)) {
      this.flush();
    }
  }

  flush(): void {
    if (this.flushing || this.queue.length === 0) return;
    this.flushing = true;
    const batch: SpanBatch = { spans: this.queue.splice(0) };
    sendSpans(this.ingestUrl, this.apiKey, batch);
    this.flushing = false;
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush();
  }
}
