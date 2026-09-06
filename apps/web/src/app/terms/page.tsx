"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LandingNavbar } from "@/components/landing-navbar";
import { LandingFooter } from "@/components/landing-footer";
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Ban,
  CreditCard,
  Lock,
  Clock,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function TermsPage() {
  const lastUpdated = "6 September 2026";
  const [activeId, setActiveId] = useState<string>("penerimaan");

  const sections = [
    { id: "penerimaan", title: "1. Penerimaan Ketentuan" },
    { id: "definisi", title: "2. Definisi & Ruang Lingkup Layanan" },
    { id: "akun", title: "3. Akun, Keamanan & Kredensial API" },
    { id: "aup", title: "4. Kebijakan Penggunaan yang Diizinkan (AUP)" },
    { id: "larangan", title: "5. Larangan & Aktivitas Ilegal" },
    { id: "antiban-disclaimer", title: "6. Batasan Tanggung Jawab & Banned WhatsApp" },
    { id: "pembayaran", title: "7. Langganan, Pembayaran & Refund" },
    { id: "sla", title: "8. Ketersediaan Layanan & Maintenance" },
    { id: "suspensi", title: "9. Penangguhan & Terminasi Akun" },
    { id: "perubahan", title: "10. Perubahan Ketentuan & Kontak" },
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
            <span className="text-slate-800 font-semibold">Syarat & Ketentuan (Terms of Service)</span>
          </div>

          {/* Header Banner */}
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200/90 shadow-sm mb-10 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="max-w-3xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                <Scale className="w-3.5 h-3.5" />
                Legal & Kebijakan Layanan
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Syarat & Ketentuan Layanan (Terms of Service)
              </h1>
              <p className="mt-3 text-slate-600 text-sm md:text-base leading-relaxed">
                Harap baca dengan saksama seluruh syarat dan ketentuan berikut sebelum menggunakan infrastruktur WhatsApp Gateway, REST API, dashboard, dan layanan Sendora.
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
                id="penerimaan"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "penerimaan" ? "ring-2 ring-primary/20 border-primary/30" : "border-slate-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Penerimaan Ketentuan</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>
                    Dengan mendaftar akun, mengakses, atau menggunakan layanan <strong>Sendora</strong> (selanjutnya disebut "Layanan", "Kami", atau "Platform"), Anda menyatakan bahwa Anda telah membaca, memahami, dan menyetujui untuk terikat oleh Syarat dan Ketentuan ini.
                  </p>
                  <p>
                    Jika Anda tidak menyetujui salah satu bagian dari ketentuan ini, Anda tidak diperkenankan untuk mengakses atau menggunakan layanan Sendora.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section
                id="definisi"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "definisi" ? "ring-2 ring-primary/20 border-primary/30" : "border-slate-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Definisi & Ruang Lingkup Layanan</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>
                    Sendora menyediakan infrastruktur perantara (Gateway) dan antarmuka pemrograman aplikasi (REST API) yang memungkinkan integrasi software aplikasi pengguna dengan protokol komunikasi WhatsApp Multi-Device.
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-700">
                    <li><strong>Gateway:</strong> Server perantara yang menjembatani request API pengguna ke sesi koneksi WhatsApp.</li>
                    <li><strong>API Key:</strong> Kunci otorisasi unik untuk mengirim pesan secara terprogram.</li>
                    <li><strong>Perangkat (Device):</strong> Sesi akun WhatsApp yang terhubung ke platform melalui pemindaian kode QR.</li>
                    <li><strong>Spintax:</strong> Fitur pembuat variasi teks otomatis untuk personalisasi pesan broadcast.</li>
                  </ul>
                </div>
              </section>

              {/* Section 3 */}
              <section
                id="akun"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "akun" ? "ring-2 ring-primary/20 border-primary/30" : "border-slate-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Akun, Keamanan & Kredensial API</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>
                    Anda bertanggung jawab penuh untuk menjaga kerahasiaan informasi akun, kata sandi, dan <strong>API Key</strong> Anda. Anda dilarang membagikan kredensial API Key kepada pihak ketiga yang tidak berwenang.
                  </p>
                  <p>
                    Segala aktivitas yang dilakukan menggunakan API Key atau akun Anda dianggap sebagai tindakan sah dari Anda, dan Anda menanggung seluruh tanggung jawab atas konsekuensi dari penggunaan tersebut.
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section
                id="aup"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "aup" ? "ring-2 ring-primary/20 border-primary/30" : "border-slate-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Kebijakan Penggunaan yang Diizinkan (AUP)</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>Layanan Sendora ditujukan untuk komunikasi bisnis yang sah dan etis, termasuk:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-xs font-medium text-emerald-900">
                      ✓ <strong>Pesan Transaksional:</strong> Kode OTP, verifikasi akun, invoice, resi pengiriman, konfirmasi order.
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-xs font-medium text-emerald-900">
                      ✓ <strong>Customer Support:</strong> Live chat dua arah dengan pelanggan melalui Webhook.
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-xs font-medium text-emerald-900">
                      ✓ <strong>Notifikasi Internal:</strong> Notifikasi server alert, absensi karyawan, reminder jadwal.
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-xs font-medium text-emerald-900">
                      ✓ <strong>Broadcast Resmi (Opt-in):</strong> Pesan edukasi/promosi kepada pelanggan yang telah memberikan persetujuan menerima pesan.
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section
                id="larangan"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "larangan" ? "ring-2 ring-rose-200 border-rose-300" : "border-rose-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm">
                    <Ban className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Larangan & Aktivitas Ilegal</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p className="font-semibold text-rose-900">
                    Pengguna DILARANG KERAS menggunakan Sendora untuk tujuan berikut:
                  </p>
                  <ul className="list-disc list-inside space-y-2 pl-2 text-slate-700">
                    <li><strong>Spam Massal Liar (Unsolicited Messages):</strong> Mengirim pesan promosi secara acak kepada nomor tanpa izin/persetujuan penerima (scraping database kontak).</li>
                    <li><strong>Penipuan & Phishing:</strong> Mengirim tautan palsu, impersonasi institusi bank/keuangan, atau penipuan berhadiah/undian.</li>
                    <li><strong>Konten Terlarang & Ilegal:</strong> Materi pornografi, perjudian online (judi slot/togel), perdagangan obat-obatan terlarang, senjata api, atau barang selundupan.</li>
                    <li><strong>Ujaran Kebencian & Pelecehan:</strong> Mengancam, memfitnah, mendiskriminasi SARA, atau melakukan tindakan intimidasi.</li>
                    <li><strong>Serangan Siber:</strong> Melakukan DoS/DDoS pada infrastruktur server Sendora atau menyalahgunakan endpoint API secara berlebihan.</li>
                  </ul>
                </div>
              </section>

              {/* Section 6 */}
              <section
                id="antiban-disclaimer"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "antiban-disclaimer" ? "ring-2 ring-amber-200 border-amber-300" : "border-amber-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Batasan Tanggung Jawab & Banned WhatsApp</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>
                    Sendora menyediakan serangkaian fitur proteksi (Anti-Ban, Smart Random Delay, Dynamic Typing presence, Spintax, dan Warmup limits) yang dirancang untuk mengoptimalkan keamanan pengiriman pesan.
                  </p>
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-2">
                    <p className="font-bold">Pernyataan Batasan Tanggung Jawab (Disclaimer):</p>
                    <p>
                      WhatsApp dan Meta memiliki algoritma dan kebijakan internal independen terkait deteksi aktivitas spam. Sendora <strong>tidak berafiliasi resmi dengan Meta/WhatsApp LLC</strong>. Sendora <strong>tidak bertanggung jawab</strong> atas segala bentuk penangguhan, pemblokiran (ban), atau penghapusan nomor WhatsApp yang dilakukan oleh pihak WhatsApp/Meta akibat pola broadcast atau laporan (report spam) dari penerima pesan pengguna.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 7 */}
              <section
                id="pembayaran"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "pembayaran" ? "ring-2 ring-blue-200 border-blue-300" : "border-slate-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Langganan, Pembayaran & Kebijakan Refund</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>
                    Layanan berbayar Sendora diproses melalui payment gateway terverifikasi (Midtrans) dengan mata uang Rupiah (IDR).
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-700">
                    <li>Paket langganan berlaku sesuai durasi yang dipilih (Harian, Bulanan, atau Tahunan).</li>
                    <li>Kuota pesan yang tidak terpakai dalam periode aktif tidak dapat diakumulasikan ke periode berikutnya kecuali dinyatakan lain pada paket.</li>
                    <li><strong>Kebijakan Pengembalian Dana (Refund):</strong> Karena sifat produk digital dan kuota server instan, pembayaran yang telah berhasil diproses <strong>tidak dapat dikembalikan (Non-Refundable)</strong>, kecuali terjadi kesalahan penagihan ganda (double charge) pada sistem pembayaran kami.</li>
                  </ul>
                </div>
              </section>

              {/* Section 8 */}
              <section
                id="sla"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "sla" ? "ring-2 ring-primary/20 border-primary/30" : "border-slate-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    8
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Ketersediaan Layanan & Maintenance</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>
                    Sendora berupaya menjaga ketersediaan layanan (Uptime) hingga target 99.9%. Namun, gangguan dapat terjadi sewaktu-waktu akibat pembaruan protokol dari pihak WhatsApp/Meta, gangguan jaringan pihak ketiga, atau bencana di luar kendali wajar kami (Force Majeure).
                  </p>
                  <p>
                    Pemeliharaan sistem terjadwal (Maintenance) akan diinformasikan sebelumnya melalui dashboard atau saluran resmi kami.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section
                id="suspensi"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "suspensi" ? "ring-2 ring-primary/20 border-primary/30" : "border-slate-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                    9
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Penangguhan & Terminasi Akun</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>
                    Sendora berhak secara mutlak untuk menangguhkan (suspend) sementara atau menghapus permanen akun pengguna tanpa pemberitahuan sebelumnya jika ditemukan indikasi kuat pelanggaran terhadap Syarat & Ketentuan ini atau hukum yang berlaku di Indonesia.
                  </p>
                  <p>
                    Akun yang diterminasi akibat pelanggaran berat tidak berhak atas kompensasi atau pengembalian sisa kuota.
                  </p>
                </div>
              </section>

              {/* Section 10 */}
              <section
                id="perubahan"
                className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-xs space-y-4 ${
                  activeId === "perubahan" ? "ring-2 ring-primary/20 border-primary/30" : "border-slate-200/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    10
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Perubahan Ketentuan & Kontak</h2>
                </div>
                <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>
                    Kami dapat memperbarui Syarat & Ketentuan ini dari waktu ke waktu. Perubahan akan berlaku segera setelah dipublikasikan pada halaman ini. Penggunaan berkelanjutan atas layanan setelah perubahan berarti Anda menerima ketentuan yang diperbarui.
                  </p>
                  <div className="pt-2">
                    <p className="font-semibold text-slate-800">Hubungi Tim Legal & Support Sendora:</p>
                    <p className="text-slate-600">Email: <a href="mailto:legal@sendora.id" className="text-primary font-bold hover:underline">legal@sendora.id</a> / <a href="mailto:support@sendora.id" className="text-primary font-bold hover:underline">support@sendora.id</a></p>
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
