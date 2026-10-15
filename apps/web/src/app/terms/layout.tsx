import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syarat dan Ketentuan Layanan",
  description:
    "Syarat dan ketentuan penggunaan layanan platform WhatsApp Gateway Waply.",
  alternates: {
    canonical: "https://waply.web.id/terms",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
