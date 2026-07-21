"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/components/providers/project-provider";
import { ProjectSettingsCard } from "@/components/settings/project-settings-card";

function Avatar({ name, image }: { name?: string | null; image?: string | null }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name ?? "User"} className="h-10 w-10 rounded-full" />;
  }
  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  return (
    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue to-blue-hover flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-white">{initials}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { projects, loading } = useProjects();

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar breadcrumb={[{ label: "Settings" }]} />

      <main className="max-w-2xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Account */}
        <section>
          <h2 className="text-xs font-medium text-[#808080] uppercase tracking-wider mb-3">Account</h2>
          <div className="rounded-lg border border-[#1E1E1E] bg-[#111] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={session?.user?.name} image={session?.user?.image} />
              <div>
                <p className="text-sm font-medium text-[#F5F5F5]">{session?.user?.name ?? "—"}</p>
                <p className="text-xs text-[#949494]">{session?.user?.email ?? "—"}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
              <LogOut className="h-3 w-3" /> Sign out
            </Button>
          </div>
        </section>

        {/* Projects */}
        <section>
          <h2 className="text-xs font-medium text-[#808080] uppercase tracking-wider mb-3">Projects</h2>
          {projects.length > 0 ? (
            // Once there's something to show, keep showing it — every mutation
            // (rotate/toggle/delete) triggers a background refresh() that flips
            // `loading` true, and gating on that here would unmount every card
            // (losing e.g. the just-rotated-key display) on every single action.
            <div className="space-y-3">
              {projects.map((project) => (
                <ProjectSettingsCard key={project.id} project={project} />
              ))}
            </div>
          ) : loading ? (
            <div className="rounded-lg border border-[#1E1E1E] bg-[#111] p-4">
              <p className="text-xs text-[#808080]">Loading…</p>
            </div>
          ) : (
            <div className="rounded-lg border border-[#1E1E1E] bg-[#111] p-4">
              <p className="text-xs text-[#808080]">No projects yet.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
