"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSession } from "next-auth/react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  /** Masked display-only key: lb_live_abcd1234...ef12 */
  apiKeyMasked: string;
  createdAt: string;
}

export interface CreateProjectResult {
  project: Project;
  /** Raw key shown exactly once — never stored after this. */
  rawApiKey: string;
}

interface ProjectContextValue {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project) => void;
  createProject: (name: string) => CreateProjectResult;
  deleteProject: (id: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateApiKey(): { raw: string; masked: string } {
  const hex = randomHex(32);
  return {
    raw: `lb_live_${hex}`,
    masked: `lb_live_${hex.slice(0, 8)}...${hex.slice(-4)}`,
  };
}

function generateId(): string {
  return randomHex(16);
}

function storageKey(userId: string) {
  return `lb_projects_${userId}`;
}

function activeKey(userId: string) {
  return `lb_active_${userId}`;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? session?.user?.email ?? null;

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Load from localStorage when userId becomes available
  useEffect(() => {
    if (!userId) return;

    const raw = localStorage.getItem(storageKey(userId));
    const stored: Project[] = raw ? (JSON.parse(raw) as Project[]) : [];

    if (stored.length === 0) {
      // Seed a default project on first sign-in
      const { raw: rawKey, masked } = generateApiKey();
      const defaultProject: Project = {
        id: generateId(),
        name: "My API",
        apiKeyMasked: masked,
        createdAt: new Date().toISOString(),
      };
      // We discard rawKey here — user would use "Create project" flow for new ones
      void rawKey;
      const seeded = [defaultProject];
      localStorage.setItem(storageKey(userId), JSON.stringify(seeded));
      setProjects(seeded);
      setActiveProjectId(defaultProject.id);
      localStorage.setItem(activeKey(userId), defaultProject.id);
      return;
    }

    setProjects(stored);

    const savedActive = localStorage.getItem(activeKey(userId));
    const validActive = stored.find((p) => p.id === savedActive);
    setActiveProjectId(validActive ? validActive.id : stored[0].id);
  }, [userId]);

  const persist = useCallback(
    (updated: Project[], newActiveId?: string) => {
      if (!userId) return;
      localStorage.setItem(storageKey(userId), JSON.stringify(updated));
      if (newActiveId !== undefined) {
        localStorage.setItem(activeKey(userId), newActiveId);
      }
    },
    [userId]
  );

  const setActiveProject = useCallback(
    (project: Project) => {
      setActiveProjectId(project.id);
      if (userId) localStorage.setItem(activeKey(userId), project.id);
    },
    [userId]
  );

  const createProject = useCallback(
    (name: string): CreateProjectResult => {
      const { raw, masked } = generateApiKey();
      const project: Project = {
        id: generateId(),
        name: name.trim(),
        apiKeyMasked: masked,
        createdAt: new Date().toISOString(),
      };
      setProjects((prev) => {
        const updated = [...prev, project];
        persist(updated, project.id);
        return updated;
      });
      setActiveProjectId(project.id);
      return { project, rawApiKey: raw };
    },
    [persist]
  );

  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        const newActive =
          activeProjectId === id ? (updated[0]?.id ?? null) : activeProjectId;
        persist(updated, newActive ?? undefined);
        if (newActive !== activeProjectId) setActiveProjectId(newActive);
        return updated;
      });
    },
    [activeProjectId, persist]
  );

  const activeProject =
    projects.find((p) => p.id === activeProjectId) ?? projects[0] ?? null;

  return (
    <ProjectContext.Provider
      value={{ projects, activeProject, setActiveProject, createProject, deleteProject }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectProvider");
  return ctx;
}
