import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pilih Paket & Checkout Langganan",
  description:
    "Pilih paket langganan WhatsApp Gateway Waply yang sesuai kebutuhan bisnis Anda: Starter, Pro Business, atau Enterprise dengan pembayaran instan QRIS dan Virtual Account.",
  alternates: {
    canonical: "https://waply.web.id/order",
  },
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
