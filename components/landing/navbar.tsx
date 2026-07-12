"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { LiveboardIcon } from "@/components/logo";
import { GithubIcon } from "@/components/landing/github-icon";

const LINKS = [
  { label: "Tracing", href: "#tracing" },
  { label: "Endpoints", href: "#endpoints" },
  { label: "Alerts", href: "#alerts" },
  { label: "Features", href: "#features" },
  { label: "Setup", href: "#how-it-works" },
];

const GITHUB_URL = "https://github.com/ryzrr/liveboard";

export function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:pt-4">
      <nav
        className={`flex w-full max-w-5xl items-center justify-between rounded-full px-2 py-2 pl-4 transition-all duration-300 ${
          scrolled
            ? "border border-white/10 bg-[#0A0A0B]/80 backdrop-blur-xl"
            : "border border-transparent bg-transparent"
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <LiveboardIcon size={20} />
          <span className="font-display text-[15px] font-bold tracking-tight text-white">
            Liveboard
          </span>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-[13px] text-[#9a9aa4] transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-1.5 lg:flex">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#9a9aa4] transition-colors hover:text-white"
            aria-label="View source on GitHub"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
          <Link
            href="/status"
            className="rounded-full px-3 py-1.5 text-[13px] text-[#9a9aa4] transition-colors hover:text-white"
          >
            Status
          </Link>
          <Link
            href="/auth/signin"
            className="group ml-1 flex items-center gap-1.5 rounded-full bg-white py-1.5 pl-4 pr-3.5 text-[13px] font-medium text-[#0A0A0A] transition-transform hover:scale-[1.03] active:scale-95"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 text-[#9a9aa4] lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="absolute inset-x-3 top-[70px] rounded-2xl border border-white/10 bg-[#0A0A0B]/95 p-5 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm text-[#c4c4cc] transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/status"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2.5 text-sm text-[#c4c4cc] hover:bg-white/5 hover:text-white"
            >
              Status page
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg px-2 py-2.5 text-sm text-[#c4c4cc] hover:bg-white/5 hover:text-white"
            >
              GitHub
            </a>
            <Link
              href="/auth/signin"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-[13px] font-medium text-[#0A0A0A]"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
