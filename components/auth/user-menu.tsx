"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function Avatar({ name, image }: { name?: string | null; image?: string | null }) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? "User"}
        width={20}
        height={20}
        className="rounded-full"
      />
    );
  }
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";
  return (
    <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue to-blue-hover flex items-center justify-center flex-shrink-0">
      <span className="text-[9px] font-bold text-white">{initials}</span>
    </div>
  );
}

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2.5 px-2.5 py-1.5">
        <div className="h-5 w-5 rounded-full bg-[#1E1E1E] animate-pulse" />
        <div className="space-y-1">
          <div className="h-2.5 w-16 bg-[#1E1E1E] rounded animate-pulse" />
          <div className="h-2 w-20 bg-[#1E1E1E] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/auth/signin"
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded hover:bg-[#161616] transition-colors"
      >
        <div className="h-5 w-5 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] flex items-center justify-center">
          <span className="text-[9px] text-[#949494]">?</span>
        </div>
        <span className="text-xs font-medium text-[#949494]">Sign in</span>
      </Link>
    );
  }

  const { name, email, image } = session.user;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2.5 px-2.5 py-1.5 rounded hover:bg-[#161616] transition-colors w-full text-left outline-none">
          <Avatar name={name} image={image} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#F5F5F5] truncate">{name ?? "User"}</p>
            <p className="text-[10px] text-[#949494] truncate">{email}</p>
          </div>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[200px] rounded-lg border border-[#1E1E1E] bg-[#111] p-1 shadow-2xl"
          side="top"
          align="start"
          sideOffset={4}
        >
          {/* User info header */}
          <div className="px-2 py-2 mb-1 border-b border-[#1E1E1E]">
            <p className="text-xs font-semibold text-[#F5F5F5] truncate">{name}</p>
            <p className="text-[10px] text-[#808080] truncate">{email}</p>
          </div>

          <DropdownMenu.Item asChild>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[#888] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] outline-none cursor-pointer transition-colors"
            >
              <Settings className="h-3 w-3" />
              Settings
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-[#1E1E1E]" />

          <DropdownMenu.Item
            onSelect={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[#888] hover:text-red hover:bg-red-dim outline-none cursor-pointer transition-colors"
          >
            <LogOut className="h-3 w-3" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
