"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, User, X } from "lucide-react";
import { LiveboardIcon } from "@/components/logo";
import { GithubIcon } from "@/components/landing/github-icon";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "Insights", href: "#insights" },
  { label: "How it works", href: "#how-it-works" },
];

const GITHUB_URL = "https://github.com/ryzrr/liveboard";

export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-50 px-5 pt-5 sm:px-7">
      <nav className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-[1.04]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#161616] border border-[#262626]">
            <LiveboardIcon size={17} />
          </span>
          <span className="font-display text-[15px] font-bold tracking-tight text-[#F5F5F5]">
            Liveboard
          </span>
        </Link>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex items-center gap-1 rounded-full border border-[#1E1E1E] bg-[#121212] px-1.5 py-1.5">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-1.5 text-[13px] text-[#999] transition-colors hover:text-[#F5F5F5]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <a
            href="/status"
            className="flex items-center gap-1.5 rounded-full border border-[#1E1E1E] bg-[#121212] px-3.5 py-2 text-[13px] text-[#999] transition-colors hover:text-[#F5F5F5]"
          >
            Status
            <ArrowUpRight className="h-3 w-3" />
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1E1E1E] bg-[#121212] text-[#999] transition-colors hover:text-[#F5F5F5]"
            aria-label="View source on GitHub"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
        </div>

        <Link
          href="/auth/signin"
          className="hidden items-center gap-2 text-[13px] font-medium text-[#ddd] transition-colors hover:text-[#F5F5F5] lg:flex"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#262626] bg-[#161616]">
            <User className="h-3.5 w-3.5" />
          </span>
          Get started
        </Link>

        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 text-[#888] lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="mt-3 rounded-2xl border border-[#1E1E1E] bg-[#0D0D0D] px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-4">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm text-[#888] hover:text-[#F5F5F5] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/status" onClick={() => setOpen(false)} className="text-sm text-[#888] hover:text-[#F5F5F5] transition-colors">
              Status page
            </Link>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-sm text-[#888] hover:text-[#F5F5F5] transition-colors">
              GitHub
            </a>
            <Link
              href="/auth/signin"
              className="flex items-center justify-center gap-1.5 rounded-full bg-[#F5F5F5] py-2.5 text-[13px] font-medium text-[#0A0A0A]"
            >
              Get started
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
