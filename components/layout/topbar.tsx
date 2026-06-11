"use client";

import { Search, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}

export function Topbar({ breadcrumb, actions }: TopbarProps) {
  return (
    <header className="h-12 flex items-center gap-4 px-4 border-b border-[#1E1E1E] bg-[#0A0A0A] sticky top-0 z-30">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs flex-1 min-w-0">
        {breadcrumb?.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-[#333]">/</span>}
            <span
              className={
                i === breadcrumb.length - 1
                  ? "text-[#F5F5F5] font-medium"
                  : "text-[#555] hover:text-[#888] cursor-pointer transition-colors"
              }
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#1E1E1E] bg-[#111] w-48 hover:border-[#2A2A2A] transition-colors">
        <Search className="h-3 w-3 text-[#444] flex-shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent text-xs text-[#F5F5F5] placeholder-[#444] outline-none flex-1 w-full"
        />
        <kbd className="text-[10px] text-[#444] font-mono">⌘K</kbd>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {actions}
        <button className="relative p-1.5 rounded hover:bg-[#161616] text-[#555] hover:text-[#888] transition-colors">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red" />
        </button>
        <Button variant="primary" size="sm">
          <Plus className="h-3 w-3" />
          New Project
        </Button>
      </div>
    </header>
  );
}
