"use client";

import { useState } from "react";
import {
  CheckCheck,
  FileText,
  Sparkles,
  Smartphone,
  Send,
  MoreVertical,
  Phone,
  Video,
  Download,
  RotateCw,
} from "lucide-react";

export function LandingChatMockup() {
  const spintaxGreetings = ["Halo", "Hai", "Selamat Siang", "Halo Kak"];
  const [greetingIdx, setGreetingIdx] = useState(0);

  const currentGreeting = spintaxGreetings[greetingIdx];

  const handleShuffle = () => {
    setGreetingIdx((prev) => (prev + 1) % spintaxGreetings.length);
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900 flex flex-col font-sans">
      {/* WhatsApp Header */}
      <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-sm border-2 border-white/20">
              W
            </div>
            <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#075E54] absolute bottom-0 right-0"></span>
          </div>
          <div>
            <div className="font-bold text-sm leading-tight flex items-center gap-1.5">
              <span>Waply Store Gateway</span>
              <span className="badge badge-xs bg-emerald-400 text-emerald-950 font-extrabold text-[9px] px-1 py-0 border-none">
                VERIFIED
              </span>
            </div>
            <div className="text-[11px] text-emerald-100/80">Online • Auto-Reply Active</div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-white/90">
          <button className="p-1 hover:bg-white/10 rounded-full transition-colors" aria-label="Call">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-white/10 rounded-full transition-colors" aria-label="Video">
            <Video className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-white/10 rounded-full transition-colors" aria-label="Menu">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Area (WhatsApp Doodle Background) */}
      <div className="p-4 space-y-3 bg-[#0b141a] bg-opacity-95 min-h-[360px] flex flex-col justify-between">
        {/* Date Pill */}
        <div className="text-center my-1">
          <span className="px-2.5 py-1 rounded-md bg-[#182229] text-[10px] font-semibold text-slate-400 shadow-xs">
            HARI INI
          </span>
        </div>

        <div className="space-y-3">
          {/* 1. Customer / User Message (Outgoing from user perspective - Right) */}
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-[#005c4b] text-white p-3 shadow-xs space-y-1">
              <p className="text-xs leading-relaxed">
                Halo admin, tolong kirim rincian order <span className="font-mono text-emerald-200 font-semibold">#INV-2026-9812</span> dan bukti pembayarannya ya.
              </p>
              <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-200/80">
                <span>10:42</span>
                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
              </div>
            </div>
          </div>

          {/* 2. System / Bot Auto-Reply with Spintax & Invoice PDF (Incoming to user - Left) */}
          <div className="flex justify-start">
            <div className="max-w-[88%] rounded-2xl rounded-tl-xs bg-[#202c33] text-slate-100 p-3 shadow-xs space-y-2">
              <div className="text-xs leading-relaxed">
                <span className="font-bold text-amber-400 transition-all">{currentGreeting}</span> Kak <strong className="text-emerald-400">Budi Santoso</strong>.
                <br /><br />
                Terima kasih, pembayaran sebesar <strong>Rp 350.000</strong> telah berhasil kami terima.
                Pesanan Anda sedang dipersiapkan oleh tim logistik.
              </div>

              {/* PDF Invoice Document Box */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] font-bold text-slate-100 truncate">
                      Invoice-INV-9812.pdf
                    </div>
                    <div className="text-[10px] text-slate-400">1 lembar • 142 KB • PDF</div>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white shrink-0">
                  <Download className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="text-right text-[10px] text-slate-400 pt-0.5">
                10:42 • Auto-Reply
              </div>
            </div>
          </div>
        </div>

        {/* Live Interactive Spintax Control Button */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Spintax: <strong className="text-emerald-400 font-mono">{`{${spintaxGreetings.join("|")}}`}</strong></span>
          </div>
          <button
            onClick={handleShuffle}
            className="btn btn-xs bg-emerald-600 hover:bg-emerald-500 text-white border-none rounded-lg text-[10px] gap-1 px-2.5"
            title="Klik untuk simulasi variasi kata Spintax"
          >
            <RotateCw className="w-3 h-3" />
            Variasi Lain
          </button>
        </div>
      </div>
    </div>
  );
}
