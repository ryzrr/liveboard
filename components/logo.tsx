import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
}

// ─── Icon only (spinner/mark) ─────────────────────────────────────────────────
export function LiveboardIcon({ size = 24, className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={cn("flex-shrink-0", className)}
      aria-label="Liveboard"
    >
      <path d="M53.49,10.15 A40,40 0 0,1 86.82,34.37 L64.73,43.75 A16,16 0 0,0 51.39,34.06 Z" fill="#06B6D4"/>
      <path d="M88.97,41.00 A40,40 0 0,1 76.24,80.19 L60.50,62.08 A16,16 0 0,0 65.59,46.40 Z" fill="#F59E0B"/>
      <path d="M70.60,84.29 A40,40 0 0,1 29.40,84.29 L41.76,63.71 A16,16 0 0,0 58.24,63.71 Z" fill="#F43F5E"/>
      <path d="M23.76,80.19 A40,40 0 0,1 11.03,41.00 L34.41,46.40 A16,16 0 0,0 39.50,62.08 Z" fill="#3B82F6"/>
      <path d="M13.18,34.37 A40,40 0 0,1 46.51,10.15 L48.61,34.06 A16,16 0 0,0 35.27,43.75 Z" fill="#A855F7"/>
    </svg>
  );
}

// ─── Horizontal lockup (icon + "Liveboard" wordmark) ──────────────────────────
export function LiveboardWordmark({ height = 36, className }: { height?: number; className?: string }) {
  const scale = height / 72;
  const w = Math.round(270 * scale);
  return (
    <svg
      viewBox="0 0 270 72"
      xmlns="http://www.w3.org/2000/svg"
      width={w}
      height={height}
      className={cn("flex-shrink-0", className)}
      aria-label="Liveboard"
    >
      <g transform="translate(6,6) scale(0.60)">
        <path d="M53.49,10.15 A40,40 0 0,1 86.82,34.37 L64.73,43.75 A16,16 0 0,0 51.39,34.06 Z" fill="#06B6D4"/>
        <path d="M88.97,41.00 A40,40 0 0,1 76.24,80.19 L60.50,62.08 A16,16 0 0,0 65.59,46.40 Z" fill="#F59E0B"/>
        <path d="M70.60,84.29 A40,40 0 0,1 29.40,84.29 L41.76,63.71 A16,16 0 0,0 58.24,63.71 Z" fill="#F43F5E"/>
        <path d="M23.76,80.19 A40,40 0 0,1 11.03,41.00 L34.41,46.40 A16,16 0 0,0 39.50,62.08 Z" fill="#3B82F6"/>
        <path d="M13.18,34.37 A40,40 0 0,1 46.51,10.15 L48.61,34.06 A16,16 0 0,0 35.27,43.75 Z" fill="#A855F7"/>
      </g>
      <text
        x="80"
        y="36"
        fontFamily="var(--font-sora),var(--font-geist-sans),system-ui,sans-serif"
        fontWeight="600"
        fontSize="34"
        fill="white"
        dominantBaseline="central"
        letterSpacing="-1.2"
      >
        Liveboard
      </text>
    </svg>
  );
}
