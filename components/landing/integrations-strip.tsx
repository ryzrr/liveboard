import { Reveal } from "@/components/landing/reveal";
import { TECH_LOGOS, TechMark } from "@/components/landing/tech-logos";

const LOOP = [...TECH_LOGOS, ...TECH_LOGOS];

export function IntegrationsStrip() {
  return (
    <Reveal className="mx-auto mt-4 max-w-6xl px-6">
      <div className="flex flex-col items-center gap-6 border-y border-white/[0.06] py-10 sm:flex-row sm:gap-10">
        <p className="flex-shrink-0 text-center text-[12px] font-medium uppercase tracking-[0.18em] text-[#6b6b74] sm:text-left">
          Instruments the stack
          <br className="hidden sm:block" /> you already run
        </p>
        <div
          className="group relative min-w-0 flex-1 overflow-hidden"
          style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}
        >
          <div className="flex w-max animate-marquee items-center gap-11 group-hover:[animation-play-state:paused]">
            {LOOP.map((icon, i) => (
              <div
                key={`${icon.key}-${i}`}
                className="flex flex-shrink-0 items-center gap-2.5 text-[#6a6a72] transition-colors duration-300 hover:text-white"
              >
                <TechMark icon={icon} className="h-[18px] w-[18px]" />
                <span className="text-[15px] font-medium">{icon.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
