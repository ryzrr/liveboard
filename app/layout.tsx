import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiveBoard — API Monitoring",
  description: "Real-time API observability, distributed traces, and intelligent alerts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0A0A0A] text-[#F5F5F5] antialiased">
        {children}
      </body>
    </html>
  );
}
