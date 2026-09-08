"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw, Trash2 } from "lucide-react";
import { useProjects, type Project } from "@/components/providers/project-provider";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";

interface Props {
  project: Project;
}

/**
 * One project's real settings: API key + rotate and a destructive delete —
 * both backed by the existing ProjectProvider actions (rotateKey /
 * deleteProject), which were already fully wired to the backend but had no
 * UI caller anywhere in the app.
 */
export function ProjectSettingsCard({ project }: Props) {
  const { rotateKey, deleteProject } = useProjects();

  const [rotateConfirm, setRotateConfirm] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

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
                all its events, incidents, and API keys. Type the project name to confirm.
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
