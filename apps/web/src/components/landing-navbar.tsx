"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SendoraLogo } from "@/components/brand/SendoraLogo";
import { Menu, X, ShieldCheck, Zap, BookOpen, CreditCard, HelpCircle } from "lucide-react";

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: "Fitur", href: "/#features", icon: Zap },
    { name: "Anti-Ban Protection", href: "/#anti-ban", icon: ShieldCheck },
    { name: "Harga", href: "/#pricing", icon: CreditCard },
    { name: "FAQ", href: "/#faq", icon: HelpCircle },
    { name: "API Docs", href: "/docs", icon: BookOpen },
  ];

  return (
    <>
      <header className="navbar bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 px-4 md:px-12 transition-all">
        {/* Brand Logo */}
        <div className="navbar-start">
          <SendoraLogo href="/" size="md" />
        </div>

        {/* Desktop Menu */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 font-medium gap-1 text-sm">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className="hover:text-primary hover:bg-slate-100 rounded-lg transition-colors font-semibold text-slate-700"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Desktop Auth Buttons & Mobile Hamburger Button */}
        <div className="navbar-end gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <Link
              href="/login"
              className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-xs transition-colors"
            >
              Daftar Gratis
            </Link>
          </div>

          {/* Hamburger Button (Visible on mobile/tablet) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Slide-over Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] lg:hidden flex justify-end">
          {/* Backdrop Dim */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content Panel */}
          <div className="relative w-full max-w-xs sm:max-w-sm h-full bg-white shadow-2xl flex flex-col justify-between z-10 border-l border-slate-200 animate-in slide-in-from-right duration-250 ease-out">
            {/* Drawer Top Header */}
            <div>
              <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between shrink-0">
                <SendoraLogo href="/" size="sm" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                  aria-label="Tutup menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links (Minimum 44px tap target) */}
              <div className="p-4 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                  Navigasi
                </div>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[44px]"
                    >
                      <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-5 border-t border-slate-200 space-y-2.5 bg-slate-50/50">
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center h-11 px-4 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-xs transition-colors"
              >
                Daftar Gratis Sekarang
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center h-11 px-4 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Masuk ke Akun
              </Link>

              <p className="text-center text-[11px] text-slate-500 font-medium pt-1">
                Free 100 Pesan • Tanpa Kartu Kredit
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
