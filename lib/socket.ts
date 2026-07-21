"use client";

import { io, Socket } from "socket.io-client";

export interface MetricUpdate {
  requests: number;
  errorRate: number;  // 0–100
  p99: number;        // milliseconds
  avg: number;        // milliseconds
  req2xx?: number;
  req4xx?: number;
  req5xx?: number;
  bucket: string | null;
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let _socket: Socket | null = null;
let _token: string | null = null;

/**
 * Connect (or reuse) the Socket.io singleton using a short-lived, project-scoped
 * realtime token. When the token changes (e.g. project switch), the old socket
 * is torn down and a fresh one is created for the new project room.
 */
export function getSocket(token: string): Socket {
  if (_socket && _token === token) return _socket;
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
  _token = token;

  const url = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  _socket = io(url, {
    auth: { token },
    // Exponential back-off: 1 s → 2 s → 4 s → 8 s (capped)
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 8_000,
    reconnectionAttempts: Infinity,
    randomizationFactor: 0,   // pure doubling, no jitter
    transports: ["websocket"],
  });

  _socket.on("connect", () => {
    console.debug("[liveboard] Socket.io connected:", _socket?.id);
  });

  _socket.on("disconnect", (reason: string) => {
    console.debug("[liveboard] Socket.io disconnected:", reason);
  });

  _socket.on("connect_error", (err: Error) => {
    console.debug("[liveboard] Socket.io connect error:", err.message);
  });

  return _socket;
}

export function disconnectSocket(): void {
  _socket?.disconnect();
  _socket = null;
  _token = null;
}
