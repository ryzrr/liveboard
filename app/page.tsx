import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LandingNavbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { IntegrationsStrip } from "@/components/landing/integrations-strip";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { InsightsBento } from "@/components/landing/insights-bento";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CtaSection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/footer";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/overview");

  return (
    <main className="bg-grain min-h-screen overflow-x-hidden bg-[#050505]">
      <div className="relative px-3 pt-3 sm:px-5 sm:pt-5">
        <div
          className="pointer-events-none absolute -top-16 -left-16 -z-10 h-64 w-64 rounded-full opacity-20 blur-[100px]"
          style={{ background: "#3B82F6" }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -right-16 -z-10 h-64 w-64 rounded-full opacity-20 blur-[100px]"
          style={{ background: "#A855F7" }}
        />

        <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px] border border-[#1A1A1A] bg-[#0A0A0A]">
          <LandingNavbar />
          <Hero />
        </div>
      </div>

      <IntegrationsStrip />
      <FeatureGrid />
      <InsightsBento />
      <HowItWorks />
      <CtaSection />
      <LandingFooter />
    </main>
  );
}
