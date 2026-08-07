"use client";

import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Check, Copy } from "lucide-react";

interface CodeToken {
  text: string;
  accent?: boolean;
}

interface SdkSnippet {
  key: string;
  label: string;
  install: string;
  filename: string;
  lines: CodeToken[][];
}

const SNIPPETS: SdkSnippet[] = [
  {
    key: "js",
    label: "JavaScript",
    install: "npm install liveboard-sdk",
    filename: "server.js",
    lines: [
      [{ text: "import liveboard from " }, { text: '"liveboard-sdk"', accent: true }, { text: ";" }],
      [],
      [{ text: "app.use(liveboard.middleware({ apiKey }));" }],
    ],
  },
  {
    key: "python",
    label: "Python",
    install: "pip install liveboard-sdk",
    filename: "main.py",
    lines: [
      [{ text: "from " }, { text: "liveboard.asgi", accent: true }, { text: " import LiveBoardMiddleware" }],
      [],
      [{ text: "app.add_middleware(LiveBoardMiddleware, api_key=key)" }],
    ],
  },
];

export function InstallSnippet() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function handleCopy(snippet: SdkSnippet) {
    navigator.clipboard.writeText(snippet.install).catch(() => {});
    setCopiedKey(snippet.key);
    setTimeout(() => setCopiedKey((k) => (k === snippet.key ? null : k)), 1800);
  }

  return (
    <Tabs.Root defaultValue="js" className="w-full border border-border bg-surface text-left">
      <Tabs.List className="flex border-b border-border">
        {SNIPPETS.map((snippet) => (
          <Tabs.Trigger
            key={snippet.key}
            value={snippet.key}
            className="border-r border-border px-4 py-2.5 text-[12.5px] font-medium text-muted transition-colors last:border-r-0 hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-blue data-[state=active]:text-foreground"
          >
            {snippet.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {SNIPPETS.map((snippet) => (
        <Tabs.Content key={snippet.key} value={snippet.key} className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <div className="border-b border-border p-5 md:border-b-0 md:border-r">
            <p className="text-[10.5px] font-medium uppercase tracking-wider text-muted-dark">Install</p>
            <div className="mt-3 flex items-center justify-between gap-3 border border-border-subtle bg-background px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2 overflow-x-auto font-mono text-[13px] text-foreground">
                <span className="select-none text-blue">$</span>
                <span className="whitespace-nowrap">{snippet.install}</span>
              </div>
              <button
                onClick={() => handleCopy(snippet)}
                aria-label="Copy install command"
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center border border-border-subtle text-muted transition-colors hover:border-muted hover:text-foreground"
              >
                {copiedKey === snippet.key ? <Check className="h-3.5 w-3.5 text-blue" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-muted">
              Works with your existing {snippet.key === "js" ? "Express or Fastify" : "FastAPI, Django, or Flask"} app. No agents, no sidecars.
            </p>
          </div>

          <div className="p-5">
            <p className="text-[10.5px] font-medium uppercase tracking-wider text-muted-dark">{snippet.filename}</p>
            <div className="mt-3 flex border border-border-subtle bg-background">
              <div className="select-none border-r border-border-subtle px-2.5 py-2.5 font-mono text-[12.5px] leading-relaxed text-muted-dark">
                {snippet.lines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <pre className="min-w-0 flex-1 overflow-x-auto px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-muted">
                {snippet.lines.map((line, i) => (
                  <div key={i} className="whitespace-pre">
                    {line.length === 0
                      ? " "
                      : line.map((token, j) => (
                          <span key={j} className={token.accent ? "text-blue" : undefined}>
                            {token.text}
                          </span>
                        ))}
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
