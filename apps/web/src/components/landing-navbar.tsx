"use client";

import { useState } from "react";
import Link from "next/link";
import { SendoraLogo } from "@/components/brand/SendoraLogo";
import { Menu, X, ArrowRight, ShieldCheck, Zap, BookOpen, CreditCard, HelpCircle } from "lucide-react";

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Fitur", href: "/#features", icon: Zap },
    { name: "Anti-Ban Protection", href: "/#anti-ban", icon: ShieldCheck },
    { name: "Harga", href: "/#pricing", icon: CreditCard },
    { name: "FAQ", href: "/#faq", icon: HelpCircle },
    { name: "API Docs", href: "/docs", icon: BookOpen },
  ];

  return (
    <>
      <header className="navbar bg-base-100/90 backdrop-blur-md sticky top-0 z-50 border-b border-base-200 px-4 md:px-12 transition-all">
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
                  className="hover:text-primary hover:bg-base-200/60 rounded-xl transition-colors font-semibold text-slate-700"
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
              className="btn btn-ghost btn-sm font-bold text-slate-700 hover:text-slate-900 rounded-xl"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="btn btn-primary btn-sm shadow-md shadow-primary/25 rounded-xl font-bold gap-1.5"
            >
              Daftar Gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Hamburger Button (Visible on mobile/tablet) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-ghost btn-circle btn-sm lg:hidden text-slate-700"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Slide-over Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content Panel */}
          <div className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-base-100 p-6 shadow-2xl flex flex-col justify-between z-50 border-l border-base-200 animate-in slide-in-from-right duration-300">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-5 border-b border-base-200">
                <SendoraLogo href="/" size="sm" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-ghost btn-circle btn-sm text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="py-6 space-y-1">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-2">
                  Navigasi
                </div>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold text-slate-800 hover:bg-slate-100 hover:text-primary transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-6 border-t border-base-200 space-y-3">
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary w-full shadow-lg shadow-primary/25 rounded-2xl font-bold gap-2"
              >
                Daftar Gratis Sekarang
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-outline w-full rounded-2xl font-bold text-slate-700"
              >
                Masuk ke Akun
              </Link>

              <div className="pt-2 text-center text-[11px] text-slate-400 font-medium">
                Free 100 Pesan • Tanpa Kartu Kredit
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
