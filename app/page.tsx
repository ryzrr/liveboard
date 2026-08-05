import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ScrollIndicator } from "@/components/landing/scroll-indicator";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { MarqueeStrip } from "@/components/landing/marquee-strip";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { IncidentSection } from "@/components/landing/incident-section";
import { StatusSection } from "@/components/landing/status-section";
import { StatsSection } from "@/components/landing/stats-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/overview");

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <ScrollIndicator />
      <Navbar />
      <Hero />
      <MarqueeStrip />
      <FeatureGrid />
      <IncidentSection />
      <StatusSection />
      <StatsSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
