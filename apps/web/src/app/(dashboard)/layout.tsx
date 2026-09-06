import { Suspense } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Navbar } from "@/components/dashboard/Navbar";
import { ForbiddenBanner } from "@/components/dashboard/ForbiddenBanner";
import { AccountStatusBanner } from "@/components/dashboard/AccountStatusBanner";
import { MaintenanceBanner } from "@/components/dashboard/MaintenanceBanner";
import { AnnouncementPopupModal } from "@/components/dashboard/AnnouncementPopupModal";

import { MobileNavProvider } from "@/lib/mobile-nav-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileNavProvider>
      <div className="h-screen flex overflow-hidden bg-base-200/60 dark:bg-slate-950">
        {/* Sidebar (Responsive: Permanent on Desktop, Drawer on Mobile) */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Navbar />
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto min-h-0 bg-base-200/40 dark:bg-slate-950/60">
            <MaintenanceBanner />
            <AccountStatusBanner />
            <Suspense fallback={null}>
              <ForbiddenBanner />
            </Suspense>
            <AnnouncementPopupModal />
            {children}
          </main>
        </div>
      </div>
    </MobileNavProvider>
  );
}

