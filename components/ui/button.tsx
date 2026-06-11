import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-blue text-white hover:bg-blue-hover border border-transparent",
  secondary: "bg-[#1A1A1A] text-[#F5F5F5] hover:bg-[#222] border border-[#2A2A2A]",
  ghost: "bg-transparent text-[#888888] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] border border-transparent",
  danger: "bg-red-dim text-red hover:bg-red/20 border border-red/20",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-xs rounded gap-1.5",
  md: "px-3 py-1.5 text-sm rounded gap-2",
  lg: "px-4 py-2 text-sm rounded gap-2",
};

export function Button({ variant = "secondary", size = "md", children, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center font-medium transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
