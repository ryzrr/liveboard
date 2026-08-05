import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { SDK_FRAMEWORKS, TechMarkIcon } from "@/components/landing/tech-marks";

const LOOP = [...SDK_FRAMEWORKS, ...SDK_FRAMEWORKS];

export function MarqueeStrip() {
  return (
    <RevealOnScroll className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:gap-10">
        <p className="flex-shrink-0 text-[13px] text-muted">
          Two SDKs. Five framework adapters.
          <br className="hidden sm:block" />
          Drop in, don&apos;t rewrite.
        </p>
        <div
          className="group relative min-w-0 flex-1 overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          }}
        >
          <div className="marquee-track flex w-max items-center gap-10 group-hover:[animation-play-state:paused]">
            {LOOP.map((tech, i) => (
              <div
                key={`${tech.slug}-${i}`}
                className="flex flex-shrink-0 items-center gap-2 text-muted opacity-60 transition-opacity duration-300 hover:opacity-100"
              >
                <TechMarkIcon slug={tech.slug} label={tech.label} className="h-[17px] w-[17px]" />
                <span className="text-[14px] font-medium text-foreground">{tech.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes lb-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { animation: lb-marquee 26s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } }
      `}</style>
    </RevealOnScroll>
  );
}
