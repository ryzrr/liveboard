import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      <Sidebar />
      <div className="flex-1 ml-[220px] min-w-0">
        {children}
      </div>
    </div>
  );
}
