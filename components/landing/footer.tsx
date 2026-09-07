import Link from "next/link";
import { LiveboardIcon } from "@/components/logo";

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
      { label: "Anomaly detection", href: "#detection" },
      { label: "Self-hosting", href: "https://github.com/ryzrr/liveboard#quick-start", external: true },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "GitHub", href: "https://github.com/ryzrr/liveboard", external: true },
      { label: "JS SDK", href: "https://github.com/ryzrr/liveboard/tree/main/packages/sdk-js", external: true },
      { label: "Python SDK", href: "https://github.com/ryzrr/liveboard/tree/main/packages/sdk-python", external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-2">
            <div className="flex items-center gap-2">
              <LiveboardIcon size={20} />
              <span className="text-[15px] font-semibold text-foreground">Liveboard</span>
            </div>
            <p className="mt-3 max-w-[240px] text-[13px] leading-relaxed text-muted">
              Open source API observability. Live metrics, error tracking, and AI incident summaries from one line of middleware.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-medium uppercase tracking-wider text-muted-dark">{col.title}</h4>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[13px] text-muted transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <a href={link.href} className="text-[13px] text-muted transition-colors hover:text-foreground">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-[12px] text-muted-dark">
            &copy; {new Date().getFullYear()} Liveboard. Open source.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/auth/signin" className="text-[12px] text-muted-dark transition-colors hover:text-muted">
              Sign in
            </Link>
            <a
              href="https://github.com/ryzrr/liveboard"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[12px] text-muted-dark transition-colors hover:text-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external brand mark, next/image needs SVG allow-listing for no benefit here */}
              <img src="https://cdn.simpleicons.org/github/ffffff" alt="" width={13} height={13} className="opacity-70" />
              ryzrr/liveboard
            </a>
          </div>
        </div>
      </div>

      <div aria-hidden className="flex items-center justify-center overflow-hidden border-t border-border pt-6 -mb-[2.4vw] select-none whitespace-nowrap">
        <span className="text-[15vw] font-black leading-[0.8] tracking-tighter text-foreground/[0.05]">
          LIVEB
        </span>
        <LiveboardIcon className="w-[10.5vw] h-[10.5vw] opacity-[0.08]" />
        <span className="text-[15vw] font-black leading-[0.8] tracking-tighter text-foreground/[0.05]">
          ARD
        </span>
      </div>
    </footer>
  );
}
