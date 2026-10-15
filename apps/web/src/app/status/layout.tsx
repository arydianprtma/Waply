import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Status Sistem & Uptime Layanan",
  description:
    "Status ketersediaan real-time server WhatsApp Gateway, Worker Session, Database, dan API Waply.",
  alternates: {
    canonical: "https://waply.web.id/status",
  },
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
