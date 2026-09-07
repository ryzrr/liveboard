import type { EventPayload, IngestBatch } from "./types";
import { sendBatch } from "./client";

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
