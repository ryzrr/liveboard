import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "blue" | "green" | "yellow" | "red" | "purple" | "ghost";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-[#1E1E1E] text-[#888888] border border-[#2A2A2A]",
  blue: "bg-blue-dim text-blue border border-blue-border",
  green: "bg-green-dim text-green border border-green/20",
  yellow: "bg-yellow-dim text-yellow border border-yellow/20",
  red: "bg-red-dim text-red border border-red/20",
  purple: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  ghost: "text-[#888888]",
};

export function Badge({ children, variant = "default", size = "sm", className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-[10px] tracking-wide" : "px-2 py-1 text-xs",
        variants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", {
            "bg-blue": variant === "blue",
            "bg-green": variant === "green",
            "bg-yellow": variant === "yellow",
            "bg-red": variant === "red",
            "bg-purple-400": variant === "purple",
            "bg-[#555]": variant === "default",
          })}
        />
      )}
      {children}
    </span>
  );
}
