import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { SendoraLogo } from "@/components/brand/SendoraLogo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col justify-center items-center p-4">
      <div className="mb-6 text-center">
        <SendoraLogo href="/" size="lg" />
        <p className="text-xs text-base-content/60 mt-2 flex items-center justify-center gap-1 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          Safe, Automated & Anti-Ban WhatsApp Gateway
        </p>
      </div>

      <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
        <div className="card-body p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}
