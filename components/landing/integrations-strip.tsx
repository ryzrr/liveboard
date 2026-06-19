import { Reveal } from "@/components/landing/reveal";

const STACKS = ["Express", "Fastify", "FastAPI", "Django", "Flask", "Node.js", "Python"];
const LOOP = [...STACKS, ...STACKS];

export function IntegrationsStrip() {
  return (
    <Reveal className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-center text-[10px] font-mono uppercase tracking-[0.18em] text-[#444]">
        Instruments your stack
      </p>
      <div
        className="group relative mt-5 overflow-hidden"
        style={{ maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)" }}
      >
        <div className="flex w-max animate-marquee gap-12 group-hover:[animation-play-state:paused]">
          {LOOP.map((name, i) => (
            <span key={`${name}-${i}`} className="text-sm font-mono text-[#555] transition-colors hover:text-[#888]">
              {name}
            </span>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
