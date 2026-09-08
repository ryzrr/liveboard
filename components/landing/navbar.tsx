"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { LiveboardIcon } from "@/components/logo";
import { primaryButtonClass } from "@/components/landing/button-styles";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Detection", href: "#detection" },
];

const GITHUB_URL = "https://github.com/ryzrr/liveboard";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 8));

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <div className="relative w-full max-w-6xl">
        <div
          className={`flex h-16 items-center justify-between border border-border bg-background/95 px-6 backdrop-blur-md transition-shadow duration-200 ${
            scrolled ? "shadow-[0_12px_30px_-14px_rgba(0,0,0,0.6)]" : ""
          }`}
        >
          <Link href="/" className="flex items-center gap-2.5">
            <LiveboardIcon size={22} />
            <span className="text-[15px] font-semibold tracking-tight text-foreground">Liveboard</span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13px] text-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-foreground"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external brand mark, next/image needs SVG allow-listing for no benefit here */}
              <img src="https://cdn.simpleicons.org/github/ffffff" alt="" width={14} height={14} className="opacity-70" />
              GitHub
            </a>
            <Link href="/auth/signin" className={primaryButtonClass("sm")}>
              Start monitoring
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 text-foreground lg:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.19, 1, 0.22, 1] }}
              className="absolute inset-x-0 top-[calc(100%+8px)] border border-border bg-background/98 backdrop-blur-md lg:hidden"
            >
              <div className="flex flex-col gap-1 px-6 py-4">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="px-1 py-2.5 text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="px-1 py-2.5 text-sm text-muted transition-colors hover:text-foreground"
                >
                  GitHub
                </a>
                <Link
                  href="/auth/signin"
                  onClick={() => setMenuOpen(false)}
                  className={primaryButtonClass("sm", "mt-2 w-full")}
                >
                  Start monitoring
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
