"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LandingNavbar } from "@/components/landing-navbar";
import { LandingFooter } from "@/components/landing-footer";
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  Server,
  Share2,
  Clock,
  ChevronRight,
  KeyRound,
  FileText,
} from "lucide-react";

export default function PrivacyPage() {
  const lastUpdated = "6 September 2026";
  const [activeId, setActiveId] = useState<string>("ikhtisar");

  const sections = [
    { id: "ikhtisar", title: "1. Ikhtisar & Komitmen Privasi" },
    { id: "data-dikumpulkan", title: "2. Data yang Kami Kumpulkan" },
    { id: "penggunaan-data", title: "3. Bagaimana Kami Menggunakan Data" },
    { id: "keamanan-data", title: "4. Keamanan & Enkripsi Data" },
    { id: "sesi-whatsapp", title: "5. Penanganan Sesi Akun WhatsApp" },
    { id: "pihak-ketiga", title: "6. Pembagian Data ke Pihak Ketiga" },
    { id: "hak-pengguna", title: "7. Hak & Kontrol Privasi Anda" },
    { id: "kontak-dpo", title: "8. Kontak Perlindungan Data" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveId(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveId(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <LandingNavbar />

      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
            <Link href="/" className="hover:text-primary transition-colors">
              Beranda
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 font-semibold">Kebijakan Privasi (Privacy Policy)</span>
          </div>

          {/* Header Banner */}
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200/90 shadow-sm mb-10 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="max-w-3xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                <ShieldCheck className="w-3.5 h-3.5" />
                Perlindungan Data & Privasi
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Kebijakan Privasi (Privacy Policy)
              </h1>
              <p className="mt-3 text-slate-600 text-sm md:text-base leading-relaxed">
                Di Waply, kami berkomitmen untuk melindungi privasi, kerahasiaan payload pesan, dan keamanan data Anda sesuai dengan standar keamanan industri dan Undang-Undang Perlindungan Data Pribadi (UU PDP).
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                <Clock className="w-3.5 h-3.5" /> Terakhir Diperbarui: {lastUpdated}
              </div>
            </div>
          </div>

          {/* Main Grid: Sidebar + Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sticky Table of Contents */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2">
                <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
                  <span>Daftar Isi</span>
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <nav className="space-y-1 text-xs">
                  {sections.map((sec) => {
                    const isActive = activeId === sec.id;
                    return (
                      <a
                        key={sec.id}
                        href={`#${sec.id}`}
                        onClick={(e) => scrollToSection(e, sec.id)}
                        className={`block px-3 py-2.5 rounded-xl transition-all duration-200 border-l-4 ${
                          isActive
                            ? "bg-primary/10 text-primary font-extrabold border-primary shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border-transparent font-medium"
                        }`}
                      >
                        {sec.title}
                      </a>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Content Body */}
            <div className="lg:col-span-3 space-y-8">
              {/* Section 1 */}
              <section
                id="ikhtisar"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "ikhtisar" ? "ring-2 ring-primary/20 border-primary/30" : "border-slate-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Ikhtisar & Komitmen Privasi</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>
                    Kebijakan Privasi ini menjelaskan bagaimana <strong>Waply</strong> mengumpulkan, mengelola, memproses, dan melindungi data pribadi Anda saat menggunakan platform web, dashboard, dan REST API kami.
                  </p>
                  <p>
                    Kami <strong>tidak pernah menjual, menyewakan, atau memperdagangkan data kontak atau isi pesan Anda</strong> kepada pihak pengiklan atau pihak ketiga manapun.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section
                id="data-dikumpulkan"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "data-dikumpulkan" ? "ring-2 ring-primary/20 border-primary/30" : "border-slate-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Data yang Kami Kumpulkan</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>Informasi yang kami proses meliputi:</p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-700">
                    <li><strong>Data Akun:</strong> Nama, alamat email, nomor telepon, dan password yang di-hash dengan aman (Bcrypt).</li>
                    <li><strong>Kredensial API:</strong> API Key unik dan Webhook Secret Key untuk autentikasi sistem.</li>
                    <li><strong>Log Metadata Pesan:</strong> Nomor tujuan pengiriman, timestamp, status pengiriman (queued, sent, delivered, read, failed), dan kode error.</li>
                    <li><strong>Informasi Transaksi:</strong> ID order, paket langganan, dan status pembayaran dari payment gateway (kami tidak menyimpan nomor kartu kredit Anda secara langsung).</li>
                  </ul>
                </div>
              </section>

              {/* Section 3 */}
              <section
                id="penggunaan-data"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "penggunaan-data" ? "ring-2 ring-primary/20 border-primary/30" : "border-slate-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Bagaimana Kami Menggunakan Data</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>Data yang dikumpulkan digunakan secara eksklusif untuk keperluan operasional teknis:</p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-700">
                    <li>Memproses dan meneruskan pengiriman pesan WhatsApp sesuai instruksi API Anda.</li>
                    <li>Mengirimkan webhook event secara real-time ke URL server endpoint Anda.</li>
                    <li>Menghitung pemakaian kuota pesan dan masa aktif langganan.</li>
                    <li>Mendeteksi anomali server, pencegahan fraud, dan monitoring stabilitas gateway.</li>
                  </ul>
                </div>
              </section>

              {/* Section 4 */}
              <section
                id="keamanan-data"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "keamanan-data" ? "ring-2 ring-emerald-200 border-emerald-300" : "border-slate-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Keamanan & Enkripsi Data</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>
                    Kami menerapkan standar keamanan berlapis untuk menjamin keamanan seluruh data:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-medium text-slate-800 flex items-start gap-2.5">
                      <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Enkripsi Transit (SSL/TLS 1.3):</strong> Seluruh komunikasi antara server Anda dan Waply dienkripsi dengan standar 256-bit SSL.
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-medium text-slate-800 flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>HMAC Webhook Signatures:</strong> Setiap event webhook ditandatangani secara kriptografis untuk mencegah tampering payload.
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-medium text-slate-800 flex items-start gap-2.5">
                      <KeyRound className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Hashed API Keys:</strong> API Key disimpan dengan proteksi hash yang tidak dapat dibaca mentah oleh siapapun.
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-medium text-slate-800 flex items-start gap-2.5">
                      <Server className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Automated Session Isolation:</strong> Sesi multidevice setiap nomor diisolasi secara ketat dalam memory terpisah.
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section
                id="sesi-whatsapp"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "sesi-whatsapp" ? "ring-2 ring-primary/20 border-primary/30" : "border-slate-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    5
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Penanganan Sesi Akun WhatsApp</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>
                    Saat Anda melakukan scan QR code, kredensial sesi WhatsApp Multi-Device disimpan dalam bentuk auth state terenkripsi pada server kami hanya untuk menjaga konektivitas gateway Anda.
                  </p>
                  <p>
                    Anda dapat memutus (disconnect/logout) sesi WhatsApp Anda kapan saja melalui dashboard Waply atau langsung dari aplikasi WhatsApp di smartphone Anda (Linked Devices). Saat disconnect dilakukan, token sesi langsung dihapus secara permanen dari server.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section
                id="pihak-ketiga"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "pihak-ketiga" ? "ring-2 ring-primary/20 border-primary/30" : "border-slate-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    6
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Pembagian Data ke Pihak Ketiga</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>
                    Kami hanya membagikan data kepada mitra infrastruktur terpercaya yang esensial untuk penyediaan layanan:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-700">
                    <li><strong>Payment Gateway (Midtrans):</strong> Untuk pemrosesan verifikasi transaksi dan aktivasi langganan.</li>
                    <li><strong>Infrastruktur Cloud & Server Hosting:</strong> Penyedia server cloud dengan standar kepatuhan SOC-2 dan ISO-27001.</li>
                    <li><strong>Kewajiban Hukum:</strong> Kami hanya akan membuka data jika diwajibkan oleh perintah pengadilan atau aparat penegak hukum resmi Republik Indonesia sesuai perundang-undangan.</li>
                  </ul>
                </div>
              </section>

              {/* Section 7 */}
              <section
                id="hak-pengguna"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "hak-pengguna" ? "ring-2 ring-primary/20 border-primary/30" : "border-slate-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    7
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Hak & Kontrol Privasi Anda</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>Sesuai UU PDP, Anda memiliki hak penuh untuk:</p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-700">
                    <li>Mengakses dan memperbarui profil akun Anda kapan saja melalui dashboard.</li>
                    <li>Meregenerasi atau menghapus API Key secara instan jika terjadi indikasi kebocoran.</li>
                    <li>Meminta penghapusan permanen akun beserta seluruh riwayat log pesan terkait dari server kami.</li>
                  </ul>
                </div>
              </section>

              {/* Section 8 */}
              <section
                id="kontak-dpo"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "kontak-dpo" ? "ring-2 ring-primary/20 border-primary/30" : "border-slate-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    8
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Kontak Perlindungan Data</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>
                    Jika Anda memiliki pertanyaan mengenai kebijakan privasi ini atau ingin mengajukan permintaan terkait data pribadi Anda, silakan hubungi tim kami di:
                  </p>
                  <div className="pt-2">
                    <p className="font-semibold text-slate-800">Waply Data Protection Officer (DPO):</p>
                    <p className="text-slate-600">Email: <a href="mailto:privacy@waply.id" className="text-primary font-bold hover:underline">privacy@waply.id</a></p>
                    <p className="text-slate-600">WhatsApp Support: <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold hover:underline">+62 812-3456-7890</a></p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
