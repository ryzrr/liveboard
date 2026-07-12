import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-sora",
});
import { SessionProvider } from "@/components/providers/session-provider";
import { ProjectProvider } from "@/components/providers/project-provider";

export const metadata: Metadata = {
  title: "Liveboard — API Observability",
  description: "Real-time API observability, distributed traces, and intelligent alerts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${sora.variable}`}>
      <body className="bg-[#0A0A0A] text-[#F5F5F5] antialiased font-sans">
        <SessionProvider>
          <ProjectProvider>
            {children}
          </ProjectProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
