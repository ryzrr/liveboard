import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { ProjectProvider } from "@/components/providers/project-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Liveboard — API Observability",
  description: "Real-time API observability, distributed traces, and intelligent alerts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
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
