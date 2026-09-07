"use client";

import { useState, useEffect } from "react";
import {
  Send,
  Sparkles,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { parseSpintax, generateSpintaxSamples } from "@/lib/spintax";

interface DeviceOption {
  id: string;
  name: string;
  phoneNumber?: string;
  status: string;
}

export default function SendMessageTesterPage() {
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");
  const [message, setMessage] = useState<string>(
    "{Halo|Hai|Selamat siang} Kak, ini adalah pesan uji coba dari Sendora WhatsApp Gateway."
  );
  const [loading, setLoading] = useState(false);
  const [previewSamples, setPreviewSamples] = useState<string[]>([]);
  const [result, setResult] = useState<{
    success: boolean;
    messageId?: string;
    sentContent?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    async function loadDevices() {
      try {
        const res = await fetch("/api/gateway/sessions");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDevices(json.data);
          const connected = json.data.find((d: DeviceOption) => d.status === "CONNECTED");
          if (connected) {
            setSelectedDevice(connected.id);
          } else if (json.data.length > 0) {
            setSelectedDevice(json.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load devices", err);
      }
    }
    loadDevices();
  }, []);

  // Update spintax samples whenever message changes
  useEffect(() => {
    if (message.includes("{") && message.includes("}")) {
      const samples = generateSpintaxSamples(message, { name: "Budi" }, 3);
      setPreviewSamples(samples);
    } else {
      setPreviewSamples([]);
    }
  }, [message]);

  const handleRefreshPreview = () => {
    const samples = generateSpintaxSamples(message, { name: "Budi" }, 3);
    setPreviewSamples(samples);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !recipient || !message) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/gateway/sessions/${selectedDevice}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient,
          message: message,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setResult({
          success: true,
          messageId: data.data?.messageId,
          sentContent: data.data?.sentContent,
        });
      } else {
        setResult({
          success: false,
          error: data.error || "Gagal mengirim pesan",
        });
      }
    } catch (err) {
      setResult({
        success: false,
        error: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Kirim Pesan Manual (Sandbox Tester)
        </h1>
        <p className="text-sm text-base-content/60 mt-1">
          Uji coba pengiriman pesan langsung dari dashboard dengan fitur Spintax parser dan proteksi anti-ban.
        </p>
      </div>

      {result && (
        <div
          className={`alert ${
            result.success ? "alert-success text-white" : "alert-error"
          } text-sm`}
        >
          {result.success ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <div className="space-y-1">
            <div className="font-bold">
              {result.success ? "Pesan Berhasil Terkirim!" : "Pengiriman Gagal"}
            </div>
            {result.success && result.sentContent && (
              <div className="text-xs bg-black/15 p-2 rounded-lg font-mono">
                <span className="font-semibold text-white/90">Teks yang diterima WhatsApp:</span> "{result.sentContent}"
              </div>
            )}
            <div className="text-xs opacity-90">
              {result.success
                ? `Message ID: ${result.messageId}`
                : result.error}
            </div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl p-6 md:p-8">
        <form onSubmit={handleSend} className="space-y-5">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Pilih Device WhatsApp</span>
            </label>
            {devices.length === 0 ? (
              <div className="alert alert-warning text-xs">
                <span>Belum ada device WhatsApp terhubung. Silakan hubungkan device terlebih dahulu di menu WhatsApp Devices.</span>
              </div>
            ) : (
              <select
                className="select select-bordered w-full font-medium"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                required
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.phoneNumber ? `+${d.phoneNumber}` : d.name} ({d.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">
                Nomor WhatsApp Penerima (dengan kode negara)
              </span>
            </label>
            <input
              type="text"
              placeholder="Contoh: 6281234567890"
              className="input input-bordered w-full"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
            />
            <label className="label">
              <span className="label-text-alt text-base-content/50">
                Gunakan format internasional tanpa spasi atau simbol plus (e.g. 62812...)
              </span>
            </label>
          </div>

          <div className="form-control">
            <div className="flex justify-between items-center mb-1">
              <label className="label p-0">
                <span className="label-text font-semibold">Isi Pesan (Mendukung Spintax)</span>
              </label>
              <span className="text-xs text-primary font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Contoh: {"{Halo|Hai|Selamat siang}"}
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="Ketik pesan Anda di sini..."
              className="textarea textarea-bordered w-full"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
          </div>

          {/* Live Spintax Preview Box */}
          {previewSamples.length > 0 && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-primary">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Pratinjau Variasi Spintax (Akan diacak otomatis saat dikirim):
                </div>
                <button
                  type="button"
                  onClick={handleRefreshPreview}
                  className="btn btn-ghost btn-xs text-primary gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Acak Ulang
                </button>
              </div>
              <div className="space-y-1.5">
                {previewSamples.map((sample, idx) => (
                  <div
                    key={idx}
                    className="text-xs bg-base-100 p-2.5 rounded-lg border border-base-200 text-base-content/80 font-medium"
                  >
                    <span className="badge badge-sm badge-ghost mr-2 text-[10px]">Variasi {idx + 1}</span>
                    {sample}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-base-200/50 border border-base-300 text-xs space-y-1.5 text-base-content/70">
            <div className="font-semibold text-base-content flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Proteksi Anti-Ban & Human-Like Sending:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>Spintax otomatis dirandomize menjadi variasi unik per pesan sebelum dikirim.</li>
              <li>Simulasi mengetik ("composing presence") proporsional dengan panjang teks.</li>
              <li>Pemeriksaan otomatis status koneksi Sendora WhatsApp Engine.</li>
            </ul>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block gap-2 shadow-md shadow-primary/25 mt-2"
            disabled={loading || !selectedDevice || !recipient.trim() || !message.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Mengirim Pesan (Simulating Typing)...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Kirim Pesan Sekarang
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
