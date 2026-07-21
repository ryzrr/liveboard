import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const OVERALL_STATUS = {
  operational: {
    label: "All Systems Operational",
    color: "text-green",
    bg: "bg-green/10 border-green/20",
    icon: CheckCircle2,
  },
  degraded: {
    label: "Degraded Performance",
    color: "text-yellow",
    bg: "bg-yellow/10 border-yellow/20",
    icon: AlertTriangle,
  },
  partial_outage: {
    label: "Partial Outage",
    color: "text-red",
    bg: "bg-red/10 border-red/20",
    icon: XCircle,
  },
};

/** Top status banner — shared by the authed status preview and the public
 * /status/[slug] page. Server-renderable: no hooks, no client state. */
export function OverallBanner({ hasDegraded, lastChecked }: { hasDegraded: boolean; lastChecked: string | null }) {
  const key: keyof typeof OVERALL_STATUS = hasDegraded ? "degraded" : "operational";
  const overall = OVERALL_STATUS[key];
  const StatusIcon = overall.icon;

  return (
    <div className={`rounded-xl border ${overall.bg} p-6 flex items-center gap-4`}>
      <StatusIcon className={`h-8 w-8 ${overall.color} flex-shrink-0`} />
      <div>
        <h1 className={`text-xl font-semibold ${overall.color}`}>{overall.label}</h1>
        <p className="text-xs text-[#949494] mt-0.5">
          {lastChecked ? `Last checked: ${lastChecked} · ` : ""}Updates in real time
        </p>
      </div>
    </div>
  );
}
