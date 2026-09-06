import Link from "next/link";
import {
  MessageSquare,
  ShieldCheck,
  Zap,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Lock,
  Flame,
  X,
} from "lucide-react";
import { getAllPlans } from "@/lib/billing";
import LandingPricing from "@/components/landing-pricing";
import { LandingNavbar } from "@/components/landing-navbar";
import { LandingFaq } from "@/components/landing-faq";
import { LandingFooter } from "@/components/landing-footer";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  const allPlans = getAllPlans();
  const activePlans = Object.values(allPlans).filter((p) => p.isActive !== false);
  return (
    <div className="min-h-screen bg-base-100 flex flex-col justify-between">
      {/* Dynamic Navbar with Mobile Drawer */}
      <LandingNavbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 md:py-28 px-4 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-8 border border-primary/20">
            <ShieldCheck className="w-4 h-4" />
            <span>Built-in Anti-Ban & Smart Warmup Technology</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-base-content leading-tight">
            WhatsApp Gateway & Messaging API <br className="hidden md:inline" />
            <span className="text-primary bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Simple Messaging, Powerful Automation
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-base-content/70 max-w-3xl mx-auto">
            Hubungkan WhatsApp nomor bisnis Anda via QR Code dalam hitungan detik. Kirim pesan transaksional, broadcast aman via Spintax, dan kelola automasi webhook dengan mudah.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="btn btn-primary btn-lg shadow-xl shadow-primary/30 px-8 gap-2"
            >
              Mulai Sekarang (Free 100 Pesan)
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/dashboard" className="btn btn-outline btn-lg">
              Buka Live Dashboard
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 p-6 rounded-2xl bg-base-200 border border-base-300">
            <div>
              <div className="text-3xl font-black text-primary">99.9%</div>
              <div className="text-xs md:text-sm text-base-content/60 mt-1">Uptime Gateway</div>
            </div>
            <div>
              <div className="text-3xl font-black text-primary">&lt; 2 Detik</div>
              <div className="text-xs md:text-sm text-base-content/60 mt-1">Kecepatan Kirim</div>
            </div>
            <div>
              <div className="text-3xl font-black text-primary">Spintax</div>
              <div className="text-xs md:text-sm text-base-content/60 mt-1">Variasi Konten Unik</div>
            </div>
            <div>
              <div className="text-3xl font-black text-primary">QR Code</div>
              <div className="text-xs md:text-sm text-base-content/60 mt-1">Koneksi Instan</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-base-200/50 px-4 md:px-12 border-t border-base-200">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">Semua Fitur yang Anda Butuhkan</h2>
              <p className="text-base-content/70 mt-3">Arsitektur modern untuk reliabilitas pengiriman pesan tanpa kompromi.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="card bg-base-100 border border-base-300 shadow-sm p-6 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">High Performance REST API</h3>
                <p className="text-base-content/70 text-sm">
                  Kirim pesan teks, gambar, dan dokumen dengan satu request HTTP. Dilengkapi autentikasi API Key bertingkat.
                </p>
              </div>

              <div className="card bg-base-100 border border-base-300 shadow-sm p-6 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Anti-Ban & Smart Warmup</h3>
                <p className="text-base-content/70 text-sm">
                  Dilengkapi simulasi pengetikan (typing), jeda acak (4-12 detik), dan proteksi kuota harian untuk nomor baru.
                </p>
              </div>

              <div className="card bg-base-100 border border-base-300 shadow-sm p-6 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Realtime Webhooks</h3>
                <p className="text-base-content/70 text-sm">
                  Dengarkan pesan masuk dan update status pengiriman secara real-time dengan verifikasi HMAC SHA-256 signature.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Anti-Ban Section */}
        <section id="anti-ban" className="py-20 bg-base-200/40 px-4 md:px-12 border-t border-base-200">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4" /> Multi-Layer Anti-Ban Protection
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  Kirim Pesan Tanpa Khawatir Terblokir oleh Meta
                </h2>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  Sendora dirancang dari awal dengan protokol perlindungan nomor berstandar enterprise untuk meminimalkan risiko banned akun WhatsApp.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Dynamic Human Delay & Adaptive Throttling</h4>
                      <p className="text-xs text-base-content/60 mt-0.5">Jeda acak 4–12 detik antar pesan plus cooldown 2–5 menit setiap batch pengiriman.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Presence Simulation (Typing Indicator)</h4>
                      <p className="text-xs text-base-content/60 mt-0.5">Simulasi pengetikan otomatis sebelum pesan terkirim sesuai panjang karakter.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Multi-Device Auto-Rotation (Round-Robin)</h4>
                      <p className="text-xs text-base-content/60 mt-0.5">Distribusi beban blast bergantian ke beberapa device aktif agar tidak ada nomor yang overloaded.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Auto Opt-Out & Blacklist Automation</h4>
                      <p className="text-xs text-base-content/60 mt-0.5">Pesan `STOP`/`BERHENTI` otomatis di-blacklist untuk mencegah tombol report spam.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-base-100 p-6 rounded-3xl border border-base-300 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-base-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-sm">Engine Status: Optimal</span>
                  </div>
                  <span className="badge badge-sm badge-success text-white font-bold">100% Health</span>
                </div>
                <div className="space-y-2 font-mono text-xs text-base-content/80">
                  <div className="p-3 bg-base-200/60 rounded-xl">
                    <span className="text-primary font-bold">[Warm-Up Protocol]</span> Stage 3 (Active) • 250 limit/day
                  </div>
                  <div className="p-3 bg-base-200/60 rounded-xl">
                    <span className="text-primary font-bold">[Typing Presence]</span> Simulating natural composing...
                  </div>
                  <div className="p-3 bg-base-200/60 rounded-xl">
                    <span className="text-primary font-bold">[Spintax Hash]</span> Unique hash generated for recipient
                  </div>
                  <div className="p-3 bg-base-200/60 rounded-xl">
                    <span className="text-primary font-bold">[Circuit Breaker]</span> 0 abnormal disconnects detected
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-4 md:px-12 bg-base-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Pilihan Paket Langganan</h2>
              <p className="text-base-content/70 mt-3">Mulai gratis atau pilih paket harian, bulanan, dan tahunan sesuai kebutuhan bisnis Anda.</p>
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
