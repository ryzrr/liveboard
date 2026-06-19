const ICONS: Record<string, React.ReactNode> = {
  gateway: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1l5.5 3v6L7 13l-5.5-3V4L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
  auth: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="5" r="2.3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 12.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  orders: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 7h5M4.5 9.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  payments: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5v11M3 4.5h5.5a1.8 1.8 0 0 1 0 3.6H4.5a1.8 1.8 0 0 0 0 3.6H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
};

const NODES = [
  { id: "gateway", label: "gateway", stat: "12.4k req", x: 13, y: 24 },
  { id: "auth", label: "auth-service", stat: "3.2k req", x: 87, y: 20 },
  { id: "orders", label: "orders-api", stat: "41ms p99", x: 10, y: 76 },
  { id: "payments", label: "payments", stat: "0.42% err", x: 90, y: 72 },
];

export function NetworkGraph() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {NODES.map((node) => (
          <path
            key={node.id}
            d={`M ${node.x} ${node.y} Q ${(node.x + 50) / 2} ${node.y < 50 ? node.y + 16 : node.y - 16}, 50 46`}
            fill="none"
            stroke="#ffffff"
            strokeOpacity={0.07}
            strokeWidth={0.15}
          />
        ))}
      </svg>

      {NODES.map((node) => (
        <div
          key={node.id}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-start gap-2 animate-pulse-slow"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#262626] bg-[#0D0D0D] text-[#888]">
            {ICONS[node.id]}
          </span>
          <div className="leading-tight">
            <p className="text-[12px] font-medium text-[#ccc]">{node.label}</p>
            <p className="text-[11px] font-mono text-[#555]">{node.stat}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
