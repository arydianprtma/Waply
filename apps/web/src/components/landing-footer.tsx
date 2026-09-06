"use client";

import Link from "next/link";
import { SendoraLogo } from "@/components/brand/SendoraLogo";
import { ShieldCheck, Heart, ArrowUpRight, Github, Twitter, CheckCircle2 } from "lucide-react";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-900 relative">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-900">
          {/* Col 1: Brand info & Concept */}
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-block bg-white/90 p-2 rounded-2xl">
              <SendoraLogo href="/" size="md" />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Infrastruktur WhatsApp Gateway & Multi-Device Messaging API berkecepatan tinggi dengan proteksi Anti-Ban cerdas untuk otomasi notifikasi, OTP, dan broadcast bisnis Anda.
            </p>
            
            {/* System Status Indicator */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Semua Sistem Normal (99.98% Uptime)</span>
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Produk & Fitur
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/#features" className="hover:text-white transition-colors">
                  WhatsApp Gateway API
                </Link>
              </li>
              <li>
                <Link href="/#anti-ban" className="hover:text-white transition-colors flex items-center gap-1.5">
                  Proteksi Anti-Ban
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Pro</span>
                </Link>
              </li>
              <li>
                <Link href="/#broadcast" className="hover:text-white transition-colors">
                  Multi-Device Broadcast
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-white transition-colors">
                  Real-time Webhook Dispatcher
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-white transition-colors">
                  Paket & Harga
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Developers */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Pengembang
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/docs" className="hover:text-white transition-colors flex items-center gap-1">
                  Dokumentasi API
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              </li>
              <li>
                <a href="/docs#send-text" className="hover:text-white transition-colors">
                  API Send Text & Media
                </a>
              </li>
              <li>
                <a href="/docs#webhooks" className="hover:text-white transition-colors">
                  Webhook Payload
                </a>
              </li>
              <li>
                <a href="/docs#sdks" className="hover:text-white transition-colors">
                  SDK & Code Examples
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  API Key & Sandbox
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Contact */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Legal & Dukungan
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/#faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/6281234567890?text=Halo%20Sendora%20Support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1 text-emerald-400 font-medium"
                >
                  WhatsApp Support
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>© {currentYear} Sendora API. Hak Cipta Dilindungi.</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-primary" />
              256-bit SSL Secured Encryption
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
