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
  /** Masked display-only key hint: lb_live_abcd•••• */
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
  loading: boolean;
  setActiveProject: (project: Project) => void;
  createProject: (name: string) => Promise<CreateProjectResult>;
  deleteProject: (id: string) => Promise<void>;
  rotateKey: (id: string) => Promise<string>;
  refresh: () => Promise<void>;
}

// Backend `ProjectDetail` shape (snake_case) returned by the BFF.
interface ProjectDetailDTO {
  id: string;
  name: string;
  org_id: string;
  api_key_masked: string;
  created_at: string;
}

function fromDTO(d: ProjectDetailDTO): Project {
  return { id: d.id, name: d.name, apiKeyMasked: d.api_key_masked, createdAt: d.created_at };
}

function maskRaw(raw: string): string {
  return `${raw.slice(0, 12)}${"•".repeat(20)}`;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ProjectContext = createContext<ProjectContextValue | null>(null);

function activeStorageKey(userId: string) {
  return `lb_active_${userId}`;
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id ?? session?.user?.email ?? null;

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as ProjectDetailDTO[];
      const mapped = data.map(fromDTO);
      setProjects(mapped);
      setActiveProjectId((prev) => {
        if (prev && mapped.some((p) => p.id === prev)) return prev;
        const saved = localStorage.getItem(activeStorageKey(userId));
        if (saved && mapped.some((p) => p.id === saved)) return saved;
        return mapped[0]?.id ?? null;
      });
    } catch {
      // network/backend down — leave projects as-is
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load once the session is known.
  useEffect(() => {
    if (status === "loading") return;
    if (userId) {
      void refresh();
    } else {
      setProjects([]);
      setActiveProjectId(null);
      setLoading(false);
    }
  }, [status, userId, refresh]);

  const setActiveProject = useCallback(
    (project: Project) => {
      setActiveProjectId(project.id);
      if (userId) localStorage.setItem(activeStorageKey(userId), project.id);
    },
    [userId]
  );

  const createProject = useCallback(
    async (name: string): Promise<CreateProjectResult> => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const data = (await res.json()) as {
        project: { id: string; name: string; org_id: string };
        new_api_key: string;
      };
      await refresh();
      setActiveProjectId(data.project.id);
      if (userId) localStorage.setItem(activeStorageKey(userId), data.project.id);
      const project: Project = {
        id: data.project.id,
        name: data.project.name,
        apiKeyMasked: maskRaw(data.new_api_key),
        createdAt: new Date().toISOString(),
      };
      return { project, rawApiKey: data.new_api_key };
    },
    [refresh, userId]
  );

  const deleteProject = useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete project");
      setActiveProjectId((prev) => (prev === id ? null : prev));
      await refresh();
    },
    [refresh]
  );

  const rotateKey = useCallback(async (id: string): Promise<string> => {
    const res = await fetch(`/api/projects/${id}/rotate`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to rotate key");
    const data = (await res.json()) as { new_api_key: string };
    await refresh();
    return data.new_api_key;
  }, [refresh]);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) ?? projects[0] ?? null;

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        loading,
        setActiveProject,
        createProject,
        deleteProject,
        rotateKey,
        refresh,
      }}
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
