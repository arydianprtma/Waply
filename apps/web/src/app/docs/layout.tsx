import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dokumentasi REST API & Integrasi SDK",
  description:
    "Panduan lengkap integrasi REST API Waply WhatsApp Gateway untuk Node.js, Laravel/PHP, Python, Flutter/Dart, Golang, dan Webhook real-time.",
  alternates: {
    canonical: "https://waply.web.id/docs",
  },
  openGraph: {
    title: "Dokumentasi REST API & SDK Waply WhatsApp Gateway",
    description:
      "Kirim pesan, broadcast, dan terima webhook WhatsApp secara real-time dengan REST API Waply.",
    url: "https://waply.web.id/docs",
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
