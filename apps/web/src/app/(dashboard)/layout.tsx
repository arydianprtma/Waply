import { Suspense } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Navbar } from "@/components/dashboard/Navbar";
import { ForbiddenBanner } from "@/components/dashboard/ForbiddenBanner";
import { AccountStatusBanner } from "@/components/dashboard/AccountStatusBanner";
import { MaintenanceBanner } from "@/components/dashboard/MaintenanceBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex overflow-hidden bg-slate-50/50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto min-h-0 bg-slate-50/50">
          <MaintenanceBanner />
          <AccountStatusBanner />
          <Suspense fallback={null}>
            <ForbiddenBanner />
          </Suspense>
          {children}
        </main>
      </div>
    </div>
  );
}

