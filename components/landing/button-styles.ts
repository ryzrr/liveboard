// Shared hover treatment for every button-shaped CTA on the landing page:
// a flat blue fill sweeps in from the left on hover (the same blue used in
// the Liveboard mark), text flips to white for contrast. Kept out of plain
// text links (nav items, footer links) — this is for buttons only.
const BASE =
  "group relative isolate inline-flex items-center justify-center gap-1.5 overflow-hidden border font-medium transition-colors duration-300 before:absolute before:inset-0 before:-z-10 before:origin-left before:scale-x-0 before:bg-blue before:transition-transform before:duration-300 before:content-['']";

const SIZES = {
  sm: "px-4 py-2 text-[13px]",
  md: "px-5 py-2.5 text-sm",
} as const;

type Size = keyof typeof SIZES;

export function primaryButtonClass(size: Size = "md", extra = "") {
  return `${BASE} ${SIZES[size]} border-foreground bg-foreground text-background hover:text-white hover:before:scale-x-100 ${extra}`;
}

export function secondaryButtonClass(size: Size = "md", extra = "") {
  return `${BASE} ${SIZES[size]} border-border text-foreground hover:border-blue hover:text-white hover:before:scale-x-100 ${extra}`;
}
