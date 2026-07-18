"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, Copy, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useProjects, type CreateProjectResult } from "@/components/providers/project-provider";
import { Button } from "@/components/ui/button";

type Step = "form" | "apikey";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: Props) {
  const { createProject } = useProjects();
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateProjectResult | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function resetAndClose() {
    onOpenChange(false);
    // Delay reset so the closing animation doesn't show the form flash
    setTimeout(() => {
      setStep("form");
      setName("");
      setError("");
      setResult(null);
      setCopied(false);
      setSubmitting(false);
    }, 200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Project name is required.");
      return;
    }
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    if (trimmed.length > 60) {
      setError("Name must be 60 characters or less.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const created = await createProject(trimmed);
      setResult(created);
      setStep("apikey");
    } catch {
      setError("Couldn't create project. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const copyKey = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result.rawApiKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result]);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) resetAndClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl border border-[#1E1E1E] bg-[#111] shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">

          {/* Close button */}
          <Dialog.Close asChild>
            <button
              onClick={resetAndClose}
              className="absolute right-4 top-4 rounded p-1 text-[#555] hover:text-[#888] hover:bg-[#1A1A1A] transition-colors outline-none"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Dialog.Close>

          {step === "form" && (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <Dialog.Title className="text-base font-semibold text-[#F5F5F5]">
                  Create project
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-[#555]">
                  A project groups API keys, events, and alert rules.
                </Dialog.Description>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#888]" htmlFor="project-name">
                  Project name
                </label>
                <input
                  ref={inputRef}
                  id="project-name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  placeholder="My API"
                  autoFocus
                  maxLength={60}
                  className="w-full px-3 py-2 rounded border border-[#2A2A2A] bg-[#161616] text-sm text-[#F5F5F5] placeholder-[#333] outline-none focus:border-blue/50 transition-colors"
                />
                {error && (
                  <p className="text-xs text-red">{error}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" type="button" onClick={resetAndClose}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={!name.trim() || submitting}>
                  {submitting ? "Creating…" : "Create project"}
                </Button>
              </div>
            </form>
          )}

          {step === "apikey" && result && (
            <div className="p-6 space-y-5">
              <div>
                <Dialog.Title className="text-base font-semibold text-[#F5F5F5]">
                  API key created
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-[#555]">
                  Copy your API key now — it will not be shown again.
                </Dialog.Description>
              </div>

              <div className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-[10px] text-[#444] font-medium uppercase tracking-wider">
                      {result.project.name}
                    </p>
                    <p className="font-mono text-xs text-[#F5F5F5] break-all leading-relaxed">
                      {result.rawApiKey}
                    </p>
                  </div>
                  <button
                    onClick={copyKey}
                    className="flex-shrink-0 p-2 rounded border border-[#2A2A2A] hover:border-[#333] bg-[#161616] hover:bg-[#1A1A1A] text-[#555] hover:text-[#888] transition-colors"
                    title="Copy API key"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                <p className="text-xs text-amber-400 leading-relaxed">
                  <span className="font-semibold">Store this key securely.</span>{" "}
                  We store only a hash — you cannot retrieve the raw key again. If lost, generate a new one from project settings.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-[#555] font-medium">Quick start</p>
                <div className="rounded border border-[#1E1E1E] bg-[#0A0A0A] p-3 font-mono text-[11px] text-[#888] leading-relaxed space-y-1">
                  <p><span className="text-[#444]">npm install</span> liveboard</p>
                  <p><span className="text-[#444]">LIVEBOARD_API_KEY=</span><span className="text-blue">{result.project.apiKeyMasked}</span></p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyKey}
                  className="gap-1.5"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy key"}
                </Button>
                <Button variant="primary" size="sm" onClick={resetAndClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
