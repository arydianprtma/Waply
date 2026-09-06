import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-user";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Navbar } from "@/components/dashboard/Navbar";

export const metadata: Metadata = { title: "Admin Panel — Sendora" };

import { MobileNavProvider } from "@/lib/mobile-nav-context";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (user.role !== "admin") {
    redirect("/dashboard?error=forbidden");
  }

  return (
    <MobileNavProvider>
      <div className="h-screen flex overflow-hidden bg-slate-50/50">
        {/* Sidebar (Responsive) */}
        <AdminSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Navbar />
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto min-h-0 bg-slate-50/50">
            {children}
          </main>
        </div>
      </div>
    </MobileNavProvider>
  );
}
