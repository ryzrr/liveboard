"use client";

import { useMemo } from "react";
import type { Trace } from "@/lib/types";

interface ServiceMapProps {
  trace: Trace;
}

interface Node {
  service: string;
  x: number;
  y: number;
  callCount: number;
  hasError: boolean;
}

interface Edge {
  from: string;
  to: string;
  count: number;
}

const SERVICE_COLORS: Record<string, string> = {
  "api-gateway": "#378ADD",
  "auth-service": "#A855F7",
  "product-service": "#22C55E",
  "payment-service": "#F59E0B",
  "db-postgres": "#6366F1",
  "cache-redis": "#EF4444",
};

const W = 480;
const H = 240;
const CX = W / 2;
const CY = H / 2;
const R = 88;
const NODE_R = 28;

function buildGraph(trace: Trace): { nodes: Node[]; edges: Edge[] } {
  const spanById = new Map(trace.spans.map((s) => [s.id, s]));

  // Collect service→service edges from parent-child relationships
  const edgeMap = new Map<string, number>();
  for (const span of trace.spans) {
    if (!span.parentId) continue;
    const parent = spanById.get(span.parentId);
    if (!parent || parent.service === span.service) continue;
    const key = `${parent.service}→${span.service}`;
    edgeMap.set(key, (edgeMap.get(key) ?? 0) + 1);
  }

  // Build unique services
  const serviceSet = new Set(trace.spans.map((s) => s.service));
  const services = Array.from(serviceSet);

  // Find root service (span with no parentId)
  const rootSpan = trace.spans.find((s) => !s.parentId);
  const rootService = rootSpan?.service ?? services[0]!;

  // Layout: root at center, others in a circle
  const others = services.filter((s) => s !== rootService);
  const angleStep = others.length > 0 ? (2 * Math.PI) / others.length : 0;

  const posMap = new Map<string, { x: number; y: number }>();
  posMap.set(rootService, { x: CX, y: CY });
  others.forEach((svc, i) => {
    const angle = i * angleStep - Math.PI / 2;
    posMap.set(svc, {
      x: CX + R * Math.cos(angle),
      y: CY + R * Math.sin(angle),
    });
  });

  const nodes: Node[] = services.map((svc) => ({
    service: svc,
    x: posMap.get(svc)!.x,
    y: posMap.get(svc)!.y,
    callCount: trace.spans.filter((s) => s.service === svc).length,
    hasError: trace.spans.some((s) => s.service === svc && s.status === "error"),
  }));

  const edges: Edge[] = Array.from(edgeMap.entries()).map(([key, count]) => {
    const [from, to] = key.split("→") as [string, string];
    return { from, to, count };
  });

  return { nodes, edges };
}

function arrowPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return "";
  const ux = dx / dist;
  const uy = dy / dist;
  const sx = x1 + ux * NODE_R;
  const sy = y1 + uy * NODE_R;
  const ex = x2 - ux * NODE_R;
  const ey = y2 - uy * NODE_R;
  return `M ${sx} ${sy} L ${ex} ${ey}`;
}

export function ServiceMap({ trace }: ServiceMapProps) {
  const { nodes, edges } = useMemo(() => buildGraph(trace), [trace]);

  return (
    <div className="rounded-lg border border-[#1E1E1E] bg-[#111] p-4">
      <p className="text-[10px] text-[#444] uppercase tracking-wider mb-3">Service Map</p>
      <div className="flex items-center justify-center">
        <svg width={W} height={H} className="overflow-visible">
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 Z" fill="#333" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((edge) => {
            const fromNode = nodes.find((n) => n.service === edge.from);
            const toNode = nodes.find((n) => n.service === edge.to);
            if (!fromNode || !toNode) return null;
            return (
              <g key={`${edge.from}→${edge.to}`}>
                <path
                  d={arrowPath(fromNode.x, fromNode.y, toNode.x, toNode.y)}
                  stroke="#2A2A2A"
                  strokeWidth={1.5}
                  fill="none"
                  markerEnd="url(#arrow)"
                />
                {edge.count > 1 && (
                  <text
                    x={(fromNode.x + toNode.x) / 2}
                    y={(fromNode.y + toNode.y) / 2 - 6}
                    textAnchor="middle"
                    fontSize={8}
                    fill="#333"
                    className="font-mono"
                  >
                    ×{edge.count}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const color = SERVICE_COLORS[node.service] ?? "#888";
            const isRoot = !trace.spans.find((s) => s.service === node.service && s.parentId);
            return (
              <g key={node.service}>
                {/* Outer ring for root */}
                {isRoot && (
                  <circle cx={node.x} cy={node.y} r={NODE_R + 4} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.3} strokeDasharray="3 2" />
                )}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_R}
                  fill={`${color}18`}
                  stroke={node.hasError ? "#EF4444" : color}
                  strokeWidth={node.hasError ? 1.5 : 1}
                />
                {/* Service name — shortened */}
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={8}
                  fill={color}
                  className="font-mono select-none"
                >
                  {node.service.split("-").map((part, i) => (
                    <tspan key={i} x={node.x} dy={i === 0 ? 0 : "1.1em"}>
                      {part}
                    </tspan>
                  ))}
                </text>
                {/* Call count badge */}
                {node.callCount > 1 && (
                  <text
                    x={node.x + NODE_R - 4}
                    y={node.y - NODE_R + 6}
                    textAnchor="middle"
                    fontSize={7}
                    fill="#888"
                  >
                    {node.callCount}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {nodes.map((node) => {
          const color = SERVICE_COLORS[node.service] ?? "#888";
          return (
            <div key={node.service} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-[#444] font-mono">{node.service}</span>
              {node.hasError && <span className="text-[10px] text-red">!</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
