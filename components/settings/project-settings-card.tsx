"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { useProjects, type Project } from "@/components/providers/project-provider";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";

interface Props {
  project: Project;
}

/**
 * One project's real settings: API key + rotate, public status page toggle,
 * and a destructive delete — all backed by the existing ProjectProvider
 * actions (rotateKey/setStatusPageEnabled/deleteProject), which were already
 * fully wired to the backend but had no UI caller anywhere in the app.
 */
export function ProjectSettingsCard({ project }: Props) {
  const { rotateKey, deleteProject, setStatusPageEnabled } = useProjects();

  const [rotateConfirm, setRotateConfirm] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleRotate() {
    setRotating(true);
    try {
      const raw = await rotateKey(project.id);
      setNewKey(raw);
      setRotateConfirm(false);
    } catch {
      // leave rotateConfirm open so the user can retry
    } finally {
      setRotating(false);
    }
  }

  function copyNewKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey).then(() => {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    });
  }

  async function handleToggleStatusPage() {
    setStatusSaving(true);
    setStatusError("");
    try {
      await setStatusPageEnabled(project.id, !project.statusPageEnabled);
    } catch {
      setStatusError("Couldn't update the status page. Please try again.");
    } finally {
      setStatusSaving(false);
    }
  }

  const publicUrl = project.publicSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/status/${project.publicSlug}`
    : null;

  function copyLink() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteProject(project.id);
      // success: this project disappears from the list and the card unmounts
    } catch {
      setDeleteError("Couldn't delete the project. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-lg border border-[#1E1E1E] bg-[#111] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1E1E1E]">
        <p className="text-sm font-medium text-[#F5F5F5]">{project.name}</p>
        <p className="text-[10px] text-[#808080]">Created {timeAgo(new Date(project.createdAt))}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* API key */}
        <div>
          <p className="text-[10px] text-[#808080] uppercase tracking-wider mb-1.5">API key</p>
          {newKey ? (
            <div className="rounded border border-green/20 bg-green/5 p-3 space-y-2">
              <p className="text-[10px] text-green">New key generated — copy it now, it won&apos;t be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-[#F5F5F5] break-all">{newKey}</code>
                <button
                  onClick={copyNewKey}
                  className="flex-shrink-0 p-1.5 rounded border border-[#2A2A2A] hover:bg-[#1A1A1A] text-[#949494] hover:text-[#888] transition-colors"
                  title="Copy key"
                >
                  {copiedKey ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-[#0D0D0D] border border-[#2A2A2A] rounded px-2.5 py-1.5 text-xs text-[#949494] font-mono">
                {project.apiKeyMasked}
              </code>
              {rotateConfirm ? (
                <>
                  <Button variant="primary" size="sm" onClick={handleRotate} disabled={rotating}>
                    {rotating ? "Rotating…" : "Confirm rotate"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setRotateConfirm(false)} disabled={rotating}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setRotateConfirm(true)}>
                  <RefreshCw className="h-3 w-3" /> Rotate
                </Button>
              )}
            </div>
          )}
          {rotateConfirm && !newKey && (
            <p className="text-[10px] text-yellow mt-1.5">
              This immediately invalidates the current key — anything using it stops working until updated.
            </p>
          )}
        </div>

        {/* Public status page */}
        <div className="rounded-lg border border-[#1E1E1E] bg-[#0D0D0D] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#F5F5F5] font-medium">Public status page</p>
              <p className="text-[10px] text-[#808080] mt-0.5">
                Anyone with the link can view it — no account needed.
              </p>
            </div>
            <button
              onClick={handleToggleStatusPage}
              disabled={statusSaving}
              className={cn(
                "h-4 w-7 rounded-full transition-colors relative flex items-center flex-shrink-0",
                project.statusPageEnabled ? "bg-blue" : "bg-[#2A2A2A]"
              )}
            >
              <span
                className={cn(
                  "h-3 w-3 rounded-full bg-white absolute transition-all",
                  project.statusPageEnabled ? "left-[14px]" : "left-[2px]"
                )}
              />
            </button>
          </div>

          {project.statusPageEnabled && publicUrl && (
            <div className="flex items-center gap-2 pt-1">
              <input
                readOnly
                value={publicUrl}
                className="flex-1 bg-[#161616] border border-[#2A2A2A] rounded px-2.5 py-1.5 text-xs text-[#888] font-mono outline-none"
              />
              <button
                onClick={copyLink}
                className="flex-shrink-0 p-2 rounded border border-[#2A2A2A] hover:bg-[#1A1A1A] text-[#949494] hover:text-[#888] transition-colors"
                title="Copy link"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-shrink-0 p-2 rounded border border-[#2A2A2A] hover:bg-[#1A1A1A] text-[#949494] hover:text-[#888] transition-colors"
                title="Open"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
          {statusError && <p className="text-[10px] text-red">{statusError}</p>}
        </div>

        {/* Danger zone */}
        <div className="rounded-lg border border-red/20 bg-red-dim p-3 space-y-2">
          <p className="text-xs text-red font-medium">Danger zone</p>
          {!deleteOpen ? (
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-3 w-3" /> Delete project
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] text-[#949494]">
                This permanently deletes <span className="text-[#F5F5F5] font-medium">{project.name}</span> and
                all its events, traces, alert rules, and API keys. Type the project name to confirm.
              </p>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={project.name}
                className="w-full bg-[#0D0D0D] border border-red/30 rounded px-2.5 py-1.5 text-xs text-[#F5F5F5] placeholder-[#555] outline-none focus:border-red/60 transition-colors"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== project.name || deleting}
                >
                  {deleting ? "Deleting…" : "Delete permanently"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setDeleteOpen(false); setDeleteConfirmText(""); }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
              </div>
              {deleteError && <p className="text-[10px] text-red">{deleteError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
