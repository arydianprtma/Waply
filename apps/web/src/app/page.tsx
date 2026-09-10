import Link from "next/link";
import {
  MessageSquare,
  ShieldCheck,
  Zap,
  Cpu,
  Check,
  Flame,
  ArrowRight,
} from "lucide-react";
import { getAllPlans } from "@/lib/billing";
import LandingPricing from "@/components/landing-pricing";
import { LandingNavbar } from "@/components/landing-navbar";
import { LandingFaq } from "@/components/landing-faq";
import { LandingFooter } from "@/components/landing-footer";
import { LandingCodePreview } from "@/components/landing-code-preview";
import { LandingChatMockup } from "@/components/landing-chat-mockup";
import { LandingUseCases } from "@/components/landing-use-cases";
import { LandingPaymentTrust } from "@/components/landing-payment-trust";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  const allPlans = getAllPlans();
  const activePlans = Object.values(allPlans).filter((p) => p.isActive !== false);

  return (
    <div className="min-h-screen bg-base-100 flex flex-col justify-between overflow-x-hidden">
      {/* Dynamic Navbar with Mobile Drawer */}
      <LandingNavbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 sm:py-20 md:py-24 px-4 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Hero Pitch */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold text-xs sm:text-sm border border-emerald-500/20 max-w-full">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="truncate">Built-in Anti-Ban & Smart Warmup Technology</span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-base-content leading-tight">
                WhatsApp Gateway & Messaging API <br className="hidden sm:inline" />
                <span className="text-primary bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Simple Messaging, Powerful Automation
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-base-content/70 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Hubungkan nomor WhatsApp bisnis Anda via scan QR dalam hitungan detik. Kirim pesan transaksional, broadcast aman via Spintax, dan kelola automasi webhook tanpa ribet setup server.
              </p>

              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4 max-w-md mx-auto lg:mx-0">
                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-xl text-sm sm:text-base font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-colors flex items-center justify-center min-h-[48px] gap-2"
                >
                  <span>Mulai Sekarang (Free 100 Pesan)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="px-6 py-3.5 rounded-xl text-sm sm:text-base font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center min-h-[48px]"
                >
                  Buka Live Dashboard
                </Link>
              </div>

              {/* Quick Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-base-200">
                <div className="p-2">
                  <div className="text-2xl font-black text-primary">99.9%</div>
                  <div className="text-[11px] sm:text-xs text-base-content/60 mt-0.5">Uptime Gateway</div>
                </div>
                <div className="p-2">
                  <div className="text-2xl font-black text-primary">&lt; 2 Detik</div>
                  <div className="text-[11px] sm:text-xs text-base-content/60 mt-0.5">Kecepatan Kirim</div>
                </div>
                <div className="p-2">
                  <div className="text-2xl font-black text-primary">Spintax</div>
                  <div className="text-[11px] sm:text-xs text-base-content/60 mt-0.5">Anti-Banned Meta</div>
                </div>
                <div className="p-2">
                  <div className="text-2xl font-black text-primary">Zero Setup</div>
                  <div className="text-[11px] sm:text-xs text-base-content/60 mt-0.5">Tanpa Sewa VPS</div>
                </div>
              </div>
            </div>

            {/* Right Live WhatsApp Mockup (Point 2) */}
            <div className="lg:col-span-5 flex justify-center">
              <LandingChatMockup />
            </div>
          </div>
        </section>

        {/* Developer Code Preview Section (Point 1) */}
        <LandingCodePreview />

        {/* Use Cases Section (Point 3) */}
        <LandingUseCases />

        {/* Features Section */}
        <section id="features" className="py-12 sm:py-20 bg-base-200/50 px-4 md:px-12 border-t border-base-200">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Semua Fitur yang Anda Butuhkan</h2>
              <p className="text-base-content/70 mt-2 sm:mt-3 text-xs sm:text-sm">Arsitektur modern untuk reliabilitas pengiriman pesan tanpa kompromi.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
              <div className="card bg-base-100 border border-base-300 shadow-xs p-5 sm:p-6 rounded-2xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">High Performance REST API</h3>
                <p className="text-base-content/70 text-xs sm:text-sm leading-relaxed">
                  Kirim pesan teks, media (gambar/PDF), dan template dengan satu HTTP POST call. Dilengkapi API Key berstandar industri.
                </p>
              </div>

              <div className="card bg-base-100 border border-base-300 shadow-xs p-5 sm:p-6 rounded-2xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
                  <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">Anti-Ban & Smart Warmup</h3>
                <p className="text-base-content/70 text-xs sm:text-sm leading-relaxed">
                  Simulasi pengetikan alami (human typing), jeda acak (4–12 detik), dan penyesuaian kuota harian untuk nomor baru.
                </p>
              </div>

              <div className="card bg-base-100 border border-base-300 shadow-xs p-5 sm:p-6 rounded-2xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4">
                  <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">Realtime Inbound Webhook</h3>
                <p className="text-base-content/70 text-xs sm:text-sm leading-relaxed">
                  Tangkap pesan masuk dan laporan status pengiriman secara real-time dengan verifikasi HMAC SHA-256 signature.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Anti-Ban Details Section */}
        <section id="anti-ban" className="py-12 sm:py-20 bg-base-200/40 px-4 md:px-12 border-t border-base-200">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
              <div className="space-y-4 sm:space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Multi-Layer Anti-Ban Protection
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-snug">
                  Kirim Pesan Massal Tanpa Khawatir Terblokir
                </h2>
                <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">
                  Waply dirancang dengan protokol perlindungan nomor berlapis untuk menjaga reputasi dan umur nomor WhatsApp Anda.
                </p>

                <div className="space-y-3 sm:space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">Dynamic Human Delay & Cooldown</h4>
                      <p className="text-[11px] sm:text-xs text-base-content/60 mt-0.5">Jeda acak 4–12 detik antar pesan plus jeda otomatis antar batch pengiriman.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">Simulasi Status Typing</h4>
                      <p className="text-[11px] sm:text-xs text-base-content/60 mt-0.5">Menampilkan status 'mengetik' secara wajar sebelum pesan dikirim.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">Multi-Device Auto-Rotation</h4>
                      <p className="text-[11px] sm:text-xs text-base-content/60 mt-0.5">Membagi beban broadcast ke beberapa nomor terhubung secara bergantian.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">Otomasi DND & Blacklist</h4>
                      <p className="text-[11px] sm:text-xs text-base-content/60 mt-0.5">Nomor yang membalas 'STOP' otomatis masuk blacklist untuk mencegah report spam.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-base-100 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-base-300 shadow-md space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-base-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-xs sm:text-sm">Engine Status: Optimal</span>
                  </div>
                  <span className="badge badge-sm badge-success text-white font-bold text-[10px]">100% Health</span>
                </div>
                <div className="space-y-2 font-mono text-[11px] sm:text-xs text-base-content/80">
                  <div className="p-2.5 sm:p-3 bg-base-200/60 rounded-xl">
                    <span className="text-primary font-bold">[Warm-Up Protocol]</span> Stage 3 (Active) • 250 limit/day
                  </div>
                  <div className="p-2.5 sm:p-3 bg-base-200/60 rounded-xl">
                    <span className="text-primary font-bold">[Typing Presence]</span> Simulating natural composing...
                  </div>
                  <div className="p-2.5 sm:p-3 bg-base-200/60 rounded-xl">
                    <span className="text-primary font-bold">[Spintax Hash]</span> Unique hash generated for recipient
                  </div>
                  <div className="p-2.5 sm:p-3 bg-base-200/60 rounded-xl">
                    <span className="text-primary font-bold">[Circuit Breaker]</span> 0 abnormal disconnects detected
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Midtrans Automated Payment Trust Badge (Point 4) */}
        <LandingPaymentTrust />

        {/* Pricing Section */}
        <section id="pricing" className="py-12 sm:py-20 px-4 md:px-12 bg-base-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Pilihan Paket Langganan</h2>
              <p className="text-base-content/70 mt-2 sm:mt-3 text-xs sm:text-sm">Mulai gratis atau pilih paket harian, bulanan, dan tahunan sesuai kebutuhan bisnis Anda.</p>
            </div>

            <LandingPricing plans={activePlans} />
          </div>
        </section>

        {/* Interactive FAQ Section */}
        <LandingFaq />
      </main>

      {/* Modern Multi-Column Footer */}
      <LandingFooter />
    </div>
  );
}
