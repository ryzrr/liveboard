import { Check } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { ShowcaseImage } from "@/components/landing/showcase-image";

interface ShowcaseProps {
  id?: string;
  index?: string;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  image: { src: string; alt: string; url: string; width: number; height: number; live?: boolean };
  reversed?: boolean;
  glow?: string;
}

export function Showcase({ id, index, eyebrow, title, body, points, image, reversed, glow = "rgba(255,255,255,0.05)" }: ShowcaseProps) {
  return (
    <section id={id} className="relative mx-auto max-w-6xl px-6 py-14 lg:py-[4.5rem]">
      <div className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${reversed ? "lg:[&>*:first-child]:order-2" : ""}`}>
        {/* Copy */}
        <Reveal>
          <div className="flex items-center gap-3">
            {index && (
              <span className="font-mono text-[11px] tabular-nums text-[#3f3f47]">{index}</span>
            )}
            <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#8a8a94]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4B9AED] animate-live" />
              {eyebrow}
            </span>
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-[2.5rem] sm:leading-[1.1]">
            {title}
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#8a8a94]">{body}</p>
          <ul className="mt-7 space-y-3.5">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#4B9AED]/15">
                  <Check className="h-2.5 w-2.5 text-[#7bb4f2]" />
                </span>
                <span className="text-sm leading-relaxed text-[#b4b4bc]">{p}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Screenshot */}
        <ShowcaseImage image={image} reversed={reversed} glow={glow} />
      </div>
    </section>
  );
}
