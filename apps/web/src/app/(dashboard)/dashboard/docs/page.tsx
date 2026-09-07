"use client";

import { useState, useEffect } from "react";
import {
  Code2,
  Copy,
  Check,
  Terminal,
  KeyRound,
  Send,
  Webhook,
  Play,
  Loader2,
  CheckCircle2,
  Info,
  Radio,
  Users,
  FileText,
  Bot,
  Ban,
  ShieldCheck,
  Sparkles,
  Layers,
} from "lucide-react";

type CodeLang = "curl" | "nodejs" | "python" | "php";
type EndpointTab = "send" | "broadcast" | "contacts" | "templates" | "autoreply" | "blacklist" | "webhooks";

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState<EndpointTab>("send");
  const [selectedLang, setSelectedLang] = useState<CodeLang>("curl");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [originUrl, setOriginUrl] = useState<string>("http://localhost:3001");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setOriginUrl(window.location.origin);
    }
  }, []);

  // Playground state
  const [testApiKey, setTestApiKey] = useState("snd_live_sendora_demo_key");
  const [testTo, setTestTo] = useState("6281234567890");
  const [testMessage, setTestMessage] = useState("{Halo|Hai} {{name}}, pesanan Anda telah dikonfirmasi!");
  const [testDevice, setTestDevice] = useState("auto_rotate");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const getEndpointSnippet = (tab: EndpointTab, lang: CodeLang) => {
    switch (tab) {
      case "send":
        switch (lang) {
          case "curl":
            return `curl -X POST ${originUrl}/api/v1/messages/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "to": "6281234567890",
    "message": "{Halo|Hai} {{name}}, terima kasih telah menghubungi kami!",
    "deviceId": "auto_rotate",
    "variables": {
      "name": "Budi Santoso",
      "order_id": "INV-10928"
    }
  }'`;
          case "nodejs":
            return `const response = await fetch("${originUrl}/api/v1/messages/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY",
  },
  body: JSON.stringify({
    to: "6281234567890",
    message: "{Halo|Hai} {{name}}, terima kasih telah menghubungi kami!",
    deviceId: "auto_rotate",
    variables: {
      name: "Budi Santoso",
      order_id: "INV-10928",
    },
  }),
});

const data = await response.json();
console.log(data);`;
          case "python":
            return `import requests

url = "${originUrl}/api/v1/messages/send"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY",
}
payload = {
    "to": "6281234567890",
    "message": "{Halo|Hai} {{name}}, terima kasih telah menghubungi kami!",
    "deviceId": "auto_rotate",
    "variables": {
        "name": "Budi Santoso",
        "order_id": "INV-10928"
    }
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
          case "php":
            return `<?php
$curl = curl_init();

$payload = [
    "to" => "6281234567890",
    "message" => "{Halo|Hai} {{name}}, terima kasih telah menghubungi kami!",
    "deviceId" => "auto_rotate",
    "variables" => [
        "name" => "Budi Santoso",
        "order_id" => "INV-10928"
    ]
];

curl_setopt_array($curl, [
    CURLOPT_URL => "${originUrl}/api/v1/messages/send",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => "POST",
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "Authorization: Bearer YOUR_API_KEY"
    ],
]);

$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>`;
        }
        break;

      case "broadcast":
        switch (lang) {
          case "curl":
            return `curl -X POST ${originUrl}/api/broadcast \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "name": "Promo Weekend Diskon 30%",
    "messageTemplate": "{Halo|Hai} {{name}}, dapatkan diskon 30% hari ini!",
    "batchSize": 10,
    "batchDelaySec": 60,
    "minDelaySec": 4,
    "maxDelaySec": 8,
    "recipients": [
      { "phoneNumber": "6281234567890", "name": "Budi Santoso" },
      { "phoneNumber": "6285712345678", "name": "Siti Rahma" }
    ]
  }'`;
          case "nodejs":
            return `// 1. Buat Kampanye Broadcast
const createRes = await fetch("${originUrl}/api/broadcast", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY",
  },
  body: JSON.stringify({
    name: "Promo Weekend Diskon 30%",
    messageTemplate: "{Halo|Hai} {{name}}, nikmati promo diskon spesial!",
    batchSize: 10,
    batchDelaySec: 60,
    minDelaySec: 4,
    maxDelaySec: 8,
    recipients: [
      { phoneNumber: "6281234567890", name: "Budi Santoso" },
      { phoneNumber: "6285712345678", name: "Siti Rahma" },
    ],
  }),
});
const campaign = await createRes.json();

// 2. Jalankan Antrean Broadcast di Background
await fetch(\`${originUrl}/api/broadcast/\${campaign.data.id}/start\`, {
  method: "POST",
  headers: { "Authorization": "Bearer YOUR_API_KEY" },
});`;
          case "python":
            return `import requests

headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY",
}
payload = {
    "name": "Promo Weekend Diskon 30%",
    "messageTemplate": "{Halo|Hai} {{name}}, nikmati promo diskon spesial!",
    "batchSize": 10,
    "batchDelaySec": 60,
    "minDelaySec": 4,
    "maxDelaySec": 8,
    "recipients": [
        {"phoneNumber": "6281234567890", "name": "Budi Santoso"},
        {"phoneNumber": "6285712345678", "name": "Siti Rahma"}
    ]
}

res = requests.post("${originUrl}/api/broadcast", json=payload, headers=headers)
campaign_id = res.json()["data"]["id"]

# Jalankan pengiriman
requests.post(f"${originUrl}/api/broadcast/{campaign_id}/start", headers=headers)`;
          case "php":
            return `<?php
$headers = [
    "Content-Type: application/json",
    "Authorization: Bearer YOUR_API_KEY"
];

$curl = curl_init("${originUrl}/api/broadcast");
curl_setopt($curl, CURLOPT_POST, true);
curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode([
    "name" => "Promo Weekend Diskon 30%",
    "messageTemplate" => "{Halo|Hai} {{name}}, nikmati promo diskon spesial!",
    "batchSize" => 10,
    "batchDelaySec" => 60,
    "minDelaySec" => 4,
    "maxDelaySec" => 8,
    "recipients" => [
        ["phoneNumber" => "6281234567890", "name" => "Budi Santoso"],
        ["phoneNumber" => "6285712345678", "name" => "Siti Rahma"]
    ]
]));

$res = json_decode(curl_exec($curl), true);
$campaignId = $res['data']['id'];
curl_close($curl);

// Start
$curlStart = curl_init("${originUrl}/api/broadcast/" . $campaignId . "/start");
curl_setopt($curlStart, CURLOPT_POST, true);
curl_setopt($curlStart, CURLOPT_HTTPHEADER, $headers);
curl_setopt($curlStart, CURLOPT_RETURNTRANSFER, true);
curl_exec($curlStart);
curl_close($curlStart);
?>`;
        }
        break;

      case "contacts":
        return `// Import Bulk Kontak
curl -X POST ${originUrl}/api/contacts/import \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "contacts": [
      {
        "name": "Budi Santoso",
        "phoneNumber": "6281234567890",
        "groupName": "Pelanggan VIP",
        "customVariables": { "kota": "Jakarta", "saldo": 500000 }
      },
      {
        "name": "Siti Rahma",
        "phoneNumber": "6285712345678",
        "groupName": "Leads Baru",
        "customVariables": { "kota": "Surabaya", "minat": "Paket Pro" }
      }
    ]
  }'`;

      case "templates":
        return `// Buat Template Pesan Baru
curl -X POST ${originUrl}/api/templates \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "name": "Konfirmasi Pembayaran",
    "shortcode": "tpl_payment_ok",
    "category": "NOTIFIKASI",
    "content": "{Halo|Hai} {{name}}, pembayaran order #{{order_id}} sebesar Rp{{total}} telah berhasil diverifikasi!"
  }'`;

      case "autoreply":
        return `// Buat Aturan Auto Reply Baru
curl -X POST ${originUrl}/api/autoreply \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "name": "Info Harga & Paket",
    "matchType": "CONTAINS",
    "keywords": ["harga", "pricelist", "biaya"],
    "replyMessage": "{Halo|Hai} {{pushName}}! Paket layanan Sendora mulai dari Rp99.000/bln.",
    "delaySec": 2,
    "isActive": true
  }'`;

      case "blacklist":
        return `// Tambah Nomor ke Blacklist (DND)
curl -X POST ${originUrl}/api/blacklist \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "phoneNumber": "6281234567890",
    "reason": "MANUAL_BLOCK",
    "notes": "Pelanggan meminta jangan dihubungi via WA"
  }'`;

      case "webhooks":
        return `// Registrasi Webhook Endpoint
curl -X POST ${originUrl}/api/webhooks \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "name": "Production CRM Inbound Webhook",
    "url": "https://api.crm-anda.com/webhooks/whatsapp",
    "events": ["message.received", "message.delivered", "device.connected"],
    "isActive": true
  }'`;
    }
  };

  const handleRunPlayground = async () => {
    setSendingTest(true);
    setTestResponse(null);
    try {
      const res = await fetch("/api/v1/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          to: testTo,
          message: testMessage,
          deviceId: testDevice,
          variables: { name: "User Test" },
        }),
      });
      const json = await res.json();
      setTestResponse({ status: res.status, ok: res.ok, data: json });
    } catch (err: any) {
      setTestResponse({ status: 500, ok: false, data: { error: err.message } });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Code2 className="w-6 h-6 text-emerald-600" />
            Developer API & Features Reference
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Panduan lengkap REST API untuk integrasi pengiriman pesan, broadcast massal, kontak, template, dan webhook real-time.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          API v1.2 • REST JSON
        </div>
      </div>

      {/* Authentication Info */}
      <div className="bg-white border border-slate-200/90 shadow-xs p-5 sm:p-6 rounded-2xl space-y-3">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-600" /> Autentikasi API
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Semua request ke REST API Sendora wajib menyertakan <b className="text-slate-900">API Key</b> pada Header HTTP dengan format standar Bearer Token:
        </p>
        <div className="bg-slate-900 text-emerald-400 text-xs rounded-xl p-3.5 font-mono overflow-x-auto border border-slate-800">
          <code>Authorization: Bearer snd_live_xxxxxxxxxxxxxxxxxxxxxxxx</code>
        </div>
        <p className="text-[11px] text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          Kelola API Key Anda di menu <b className="text-slate-700 font-semibold">API Keys</b> pada dashboard. Jangan publikasikan secret key Anda di repositori publik.
        </p>
      </div>

      {/* Endpoints Tab Switcher */}
      <div className="flex overflow-x-auto gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
        {[
          { id: "send", label: "Direct Send API", icon: Send },
          { id: "broadcast", label: "Broadcast Campaigns", icon: Radio },
          { id: "contacts", label: "Contacts & Groups", icon: Users },
          { id: "templates", label: "Message Templates", icon: FileText },
          { id: "autoreply", label: "Auto Reply Rules", icon: Bot },
          { id: "blacklist", label: "Blacklist (DND)", icon: Ban },
          { id: "webhooks", label: "Webhooks Dispatcher", icon: Webhook },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as EndpointTab)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Endpoint Details Card */}
      <div className="bg-white border border-slate-200/90 shadow-xs rounded-2xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="bg-emerald-600 text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg">POST</span>
            <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
              {activeTab === "send" && "/api/v1/messages/send"}
              {activeTab === "broadcast" && "/api/broadcast"}
              {activeTab === "contacts" && "/api/contacts/import"}
              {activeTab === "templates" && "/api/templates"}
              {activeTab === "autoreply" && "/api/autoreply"}
              {activeTab === "blacklist" && "/api/blacklist"}
              {activeTab === "webhooks" && "/api/webhooks"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            {activeTab === "send" && "Mengirim pesan WhatsApp ke nomor tujuan dengan dukungan format Spintax dinamis dan substitusi variabel."}
            {activeTab === "broadcast" && "Membuat dan menjalankan antrean kampanye broadcast massal dengan safety throttling dan batch delay anti-ban."}
            {activeTab === "contacts" && "Mengimpor kontak massal (CSV/JSON), menetapkan grup segmentasi, dan menyimpan custom variables."}
            {activeTab === "templates" && "Membuat dan mengelola format template pesan (OTP, Promo, Notifikasi) siap pakai."}
            {activeTab === "autoreply" && "Mengonfigurasi respon chat instan otomatis dengan metode pencocokan EXACT, CONTAINS, STARTS_WITH, atau REGEX."}
            {activeTab === "blacklist" && "Menambahkan nomor ke daftar blokir DND untuk mencegah pesan spam dan menghormati privasi pelanggan."}
            {activeTab === "webhooks" && "Mendaftarkan URL endpoint webhook server Anda untuk menerima event WhatsApp secara real-time."}
          </p>
        </div>

        {/* Code Snippet Tabs */}
        <div className="bg-slate-50 p-4 sm:p-5 border-b border-slate-100">
          {activeTab === "send" && (
            <div className="mb-3.5 p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs text-slate-700 flex items-start gap-2 shadow-2xs">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <b className="text-slate-900">Tips Integrasi:</b> Nomor pengirim otomatis dihandle oleh gateway (<code className="bg-white px-1.5 py-0.5 rounded border border-emerald-200 font-mono font-bold text-slate-900">"deviceId": "auto_rotate"</code>). Nilai parameter <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-200 font-mono font-bold text-slate-900">"to"</code> adalah nomor WhatsApp penerima (pelanggan Anda) yang diisi dinamis dari aplikasi.
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex flex-wrap gap-1">
              {(["curl", "nodejs", "python", "php"] as CodeLang[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`px-3 py-1 text-xs uppercase font-mono rounded-lg font-semibold transition-all cursor-pointer border ${
                    selectedLang === lang
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <button
              onClick={() => copyCode(getEndpointSnippet(activeTab, selectedLang), `snippet-${activeTab}`)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {copiedSection === `snippet-${activeTab}` ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Disalin
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Salin Kode
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800 shadow-inner">
            <pre>{getEndpointSnippet(activeTab, selectedLang)}</pre>
          </div>
        </div>
      </div>

      {/* Interactive API Playground */}
      <div className="bg-white border border-slate-200/90 shadow-xs p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-600" />
            Interactive API Tester Playground
          </h2>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            Live Sandbox
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Uji coba kirim request langsung ke server API Sendora dan pantau respons JSON secara instan.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Authorization Bearer Key
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-emerald-500"
              value={testApiKey}
              onChange={(e) => setTestApiKey(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor WhatsApp Tujuan ('to')
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-emerald-500"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Isi Pesan (Spintax & Variabel Didukung)
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-emerald-500"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleRunPlayground}
          disabled={sendingTest}
          className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-semibold px-4 h-9 text-xs gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {sendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          Kirim Request Uji Coba
        </button>

        {testResponse && (
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">Response Status:</span>
              <span
                className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                  testResponse.ok
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                HTTP {testResponse.status}
              </span>
            </div>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
              <pre>{JSON.stringify(testResponse.data, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Webhook Events Reference */}
      <div className="bg-white border border-slate-200/90 shadow-xs p-5 sm:p-6 rounded-2xl space-y-4">
        <h2 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
          <Webhook className="w-4 h-4 text-emerald-600" /> Webhook Events & HMAC Signature
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Saat event terjadi di WhatsApp (pesan masuk, opt-out, device disconnected), server Sendora mengirimkan HTTP POST dengan Header signature:
        </p>
        <div className="bg-slate-900 text-emerald-400 text-xs rounded-xl p-3.5 font-mono overflow-x-auto border border-slate-800">
          <code>X-Sendora-Signature: sha256_hmac_hex_hash</code>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
            <span className="font-mono font-bold text-emerald-700 block mb-1">message.received</span>
            <span className="text-slate-500">Pesan masuk dari pelanggan diterima</span>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
            <span className="font-mono font-bold text-emerald-700 block mb-1">message.opt_out</span>
            <span className="text-slate-500">Pelanggan mengirim kata kunci unsubscribe</span>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
            <span className="font-mono font-bold text-emerald-700 block mb-1">device.disconnected</span>
            <span className="text-slate-500">Koneksi WhatsApp session terputus</span>
          </div>
        </div>
      </div>
    </div>
  );
}
