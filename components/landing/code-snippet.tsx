import { cn } from "@/lib/utils";

/* Lightweight, hand-tokenized syntax highlighting for the handful of code
   snippets on the landing page. Palette tuned to the dark theme. */

export const tok = {
  fn: "text-[#6aa9f0]", // functions / methods / commands
  str: "text-[#5ac98a]", // strings, packages, urls
  prop: "text-[#c795f0]", // properties / identifiers of note
  txt: "text-[#d4d4dc]", // plain identifiers
  punc: "text-[#5f5f68]", // punctuation / brackets
  prompt: "text-[#4a4a52] select-none", // shell prompt / arrow
};

export function CodeSnippet({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <code className={cn("font-mono text-[11.5px] leading-relaxed", className)}>{children}</code>
  );
}

// ── Prebuilt, reused snippets ────────────────────────────────────────────────

export function InstallSnippet({ prompt = true }: { prompt?: boolean }) {
  return (
    <CodeSnippet>
      {prompt && <span className={tok.prompt}>$ </span>}
      <span className={tok.fn}>npm</span>
      <span className={tok.txt}> install </span>
      <span className={tok.str}>liveboard-sdk</span>
    </CodeSnippet>
  );
}

export function MiddlewareSnippet() {
  return (
    <CodeSnippet>
      <span className={tok.txt}>app</span>
      <span className={tok.fn}>.use</span>
      <span className={tok.punc}>(</span>
      <span className={tok.txt}>liveboard</span>
      <span className={tok.fn}>.middleware</span>
      <span className={tok.punc}>({"{ "}</span>
      <span className={tok.prop}>apiKey</span>
      <span className={tok.punc}>{" }"})</span>
      <span className={tok.punc}>)</span>
    </CodeSnippet>
  );
}

export function DashboardUrlSnippet() {
  return (
    <CodeSnippet>
      <span className={tok.prompt}>→ </span>
      <span className={tok.str}>liveboard.dev/overview</span>
    </CodeSnippet>
  );
}
