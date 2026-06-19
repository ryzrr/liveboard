import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/landing/github-icon";
import { Reveal } from "@/components/landing/reveal";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden border-t border-[#1E1E1E]">
      <div
        className="animate-drift pointer-events-none absolute -bottom-32 left-1/2 -z-10 h-[420px] w-[700px] rounded-full opacity-[0.13] blur-[110px]"
        style={{ background: "conic-gradient(from 90deg, #06B6D4, #F59E0B, #F43F5E, #3B82F6, #A855F7, #06B6D4)", animationDirection: "reverse" }}
      />
      <Reveal className="mx-auto max-w-3xl px-6 py-28 text-center">
        <h2 className="text-3xl font-display font-bold tracking-tight text-[#F5F5F5] sm:text-4xl">
          Ship with confidence.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-[#888]">
          Open source, self-hostable, and free to start. Find out about the incident
          before your customers do.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/auth/signin">
            <Button variant="primary" size="lg" className="group gap-2 transition-transform hover:scale-[1.03] active:scale-[0.98]">
              Get started — it&apos;s free
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <a href="https://github.com/ryzrr/liveboard" target="_blank" rel="noreferrer">
            <Button variant="secondary" size="lg" className="gap-2 transition-transform hover:scale-[1.03] active:scale-[0.98]">
              <GithubIcon className="h-3.5 w-3.5" />
              Star on GitHub
            </Button>
          </a>
        </div>
      </Reveal>
    </section>
  );
}
