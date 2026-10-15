import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan privasi dan perlindungan data pengguna platform Waply WhatsApp Gateway.",
  alternates: {
    canonical: "https://waply.web.id/privacy",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
