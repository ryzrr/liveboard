import Link from "next/link";
import { LiveboardIcon } from "@/components/logo";
import { GithubIcon } from "@/components/landing/github-icon";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Status page", href: "/status" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "GitHub", href: "https://github.com/ryzrr/liveboard", external: true },
      { label: "JS SDK (npm)", href: "https://github.com/ryzrr/liveboard/tree/main/packages/sdk-js", external: true },
      { label: "Python SDK (PyPI)", href: "https://github.com/ryzrr/liveboard/tree/main/packages/sdk-python", external: true },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/auth/signin" },
      { label: "Dashboard", href: "/overview" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-[#1E1E1E] bg-[#0A0A0A]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <LiveboardIcon size={22} />
              <span className="font-display text-base font-bold text-[#F5F5F5]">Liveboard</span>
            </div>
            <p className="mt-3 text-sm text-[#555] max-w-[200px]">
              Open source API observability for teams who ship fast.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-medium uppercase tracking-wider text-[#555]">{col.title}</h4>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[#888] hover:text-[#F5F5F5] transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-sm text-[#888] hover:text-[#F5F5F5] transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#1A1A1A] pt-6 sm:flex-row">
          <p className="text-xs text-[#444]">© {new Date().getFullYear()} Liveboard. MIT licensed.</p>
          <a
            href="https://github.com/ryzrr/liveboard"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#555] hover:text-[#888] transition-colors"
          >
            <GithubIcon className="h-3.5 w-3.5" />
            ryzrr/liveboard
          </a>
        </div>
      </div>
    </footer>
  );
}
