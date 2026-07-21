"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Zap,
  GitBranch,
  Bell,
  Globe,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveboardIcon } from "@/components/logo";
import { ProjectSwitcher } from "@/components/projects/project-switcher";
import { UserMenu } from "@/components/auth/user-menu";

const NAV_ITEMS = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/endpoints", label: "Endpoints", icon: Zap },
  { href: "/traces", label: "Traces", icon: GitBranch },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/status", label: "Status Page", icon: Globe },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] flex flex-col border-r border-[#1E1E1E] bg-[#0A0A0A] z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-[#1E1E1E]">
        <LiveboardIcon size={22} />
        <span className="text-sm font-bold tracking-tight text-[#F5F5F5] font-display">
          Liveboard
        </span>
      </div>

      {/* Project Selector */}
      <div className="px-3 py-3 border-b border-[#1E1E1E]">
        <ProjectSwitcher />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded text-sm transition-colors duration-100",
                active
                  ? "bg-blue-dim text-blue border border-blue-border"
                  : "text-[#888888] hover:text-[#F5F5F5] hover:bg-[#161616] border border-transparent"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", active ? "text-blue" : "")} />
              <span className="font-medium text-xs">{label}</span>
              {href === "/alerts" && (
                <span className="ml-auto h-4 w-4 rounded-full bg-red-dim border border-red/20 text-[9px] font-bold text-red flex items-center justify-center">
                  2
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-[#1E1E1E] space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-1.5 rounded transition-colors duration-100 border",
            pathname === "/settings" || pathname.startsWith("/settings/")
              ? "bg-blue-dim text-blue border-blue-border"
              : "text-[#888888] hover:text-[#F5F5F5] hover:bg-[#161616] border-transparent"
          )}
        >
          <Settings className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Settings</span>
        </Link>
        <UserMenu />
      </div>
    </aside>
  );
}
