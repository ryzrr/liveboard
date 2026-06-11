import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms}ms`;
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function getStatusColor(status: number): string {
  if (status >= 500) return "#EF4444";
  if (status >= 400) return "#F59E0B";
  if (status >= 300) return "#888888";
  return "#22C55E";
}

export function getMethodColor(method: string): string {
  switch (method.toUpperCase()) {
    case "GET": return "#378ADD";
    case "POST": return "#22C55E";
    case "PUT": return "#F59E0B";
    case "DELETE": return "#EF4444";
    case "PATCH": return "#A855F7";
    default: return "#888888";
  }
}

export function getHealthColor(score: number): string {
  if (score >= 80) return "#22C55E";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

export function getErrorRateColor(rate: number): string {
  if (rate < 1) return "#22C55E";
  if (rate < 5) return "#F59E0B";
  return "#EF4444";
}

export function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
