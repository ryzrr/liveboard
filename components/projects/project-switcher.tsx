"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { useProjects, type Project } from "@/components/providers/project-provider";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { cn } from "@/lib/utils";

function ProjectAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const dim = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const text = size === "sm" ? "text-[8px]" : "text-[9px]";
  return (
    <div className={cn(dim, "rounded-sm bg-blue/20 border border-blue/30 flex items-center justify-center flex-shrink-0")}>
      <span className={cn(text, "text-blue font-bold")}>{initials}</span>
    </div>
  );
}

export function ProjectSwitcher() {
  const { projects, activeProject, setActiveProject } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function handleCreateClick() {
    setDropdownOpen(false);
    setCreateOpen(true);
  }

  return (
    <>
      <DropdownMenu.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenu.Trigger asChild>
          <button className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-[#161616] border border-[#222] hover:border-[#2A2A2A] transition-colors group outline-none">
            <div className="flex items-center gap-2 min-w-0">
              <ProjectAvatar name={activeProject?.name ?? "P"} />
              <span className="text-xs text-[#F5F5F5] font-medium truncate">
                {activeProject?.name ?? "Select project"}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-[#555] group-hover:text-[#888] transition-colors flex-shrink-0" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 w-[200px] rounded-lg border border-[#1E1E1E] bg-[#111] p-1 shadow-2xl"
            side="bottom"
            align="start"
            sideOffset={4}
          >
            <p className="px-2 py-1 text-[10px] text-[#444] font-medium uppercase tracking-wider">
              Projects
            </p>

            {projects.map((project: Project) => (
              <DropdownMenu.Item
                key={project.id}
                onSelect={() => setActiveProject(project)}
                className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[#888] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] outline-none cursor-pointer transition-colors"
              >
                <ProjectAvatar name={project.name} />
                <span className="flex-1 truncate">{project.name}</span>
                {project.id === activeProject?.id && (
                  <Check className="h-3 w-3 text-blue flex-shrink-0" />
                )}
              </DropdownMenu.Item>
            ))}

            <DropdownMenu.Separator className="my-1 h-px bg-[#1E1E1E]" />

            <DropdownMenu.Item
              onSelect={handleCreateClick}
              className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[#888] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] outline-none cursor-pointer transition-colors"
            >
              <Plus className="h-3 w-3" />
              New project
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
