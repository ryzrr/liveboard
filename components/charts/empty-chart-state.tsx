import { BarChart3 } from "lucide-react";

/** Honest placeholder for a chart with no data — matches the 160px chart
 * height so swapping between the two doesn't shift the surrounding layout. */
export function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="h-[160px] flex flex-col items-center justify-center gap-1.5 text-center px-6">
      <BarChart3 className="h-4 w-4 text-[#555]" />
      <p className="text-xs text-[#808080]">{message}</p>
    </div>
  );
}
