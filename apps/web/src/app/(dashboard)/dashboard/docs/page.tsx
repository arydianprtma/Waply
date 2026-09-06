"use client";

import { useState, useEffect } from "react";
import {
  Code2,
  Copy,
  Check,
  Zap,
  Terminal,
  KeyRound,
  ShieldCheck,
  Send,
  Webhook,
  Smartphone,
  Play,
  Loader2,
  CheckCircle2,
} from "lucide-react";

type CodeLang = "curl" | "nodejs" | "python" | "php";

export default function ApiDocsPage() {
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

  const getSendSnippet = (lang: CodeLang) => {
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
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Code2 className="w-7 h-7 text-primary" />
            Developer API Reference
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Dokumentasi REST API Sendora untuk integrasi sistem pengiriman pesan WhatsApp, spintax, dan webhook.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
          <Zap className="w-4 h-4" /> API v1.0 • REST JSON
        </div>
      </div>

      {/* Authentication Info */}
      <div className="card bg-base-100 border border-base-200 shadow-sm p-6 rounded-2xl space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" /> Autentikasi API
        </h2>
        <p className="text-xs text-base-content/70 leading-relaxed">
          Semua request ke REST API Sendora wajib menyertakan <b>API Key</b> pada Header HTTP dengan format standar Bearer Token:
        </p>
        <div className="mockup-code bg-base-300 text-base-content text-xs rounded-xl p-4 font-mono">
          <pre><code>Authorization: Bearer snd_live_xxxxxxxxxxxxxxxxxxxxxxxx</code></pre>
        </div>
        <p className="text-[11px] text-base-content/50">
          * Dapatkan API Key Anda di menu <b>API Keys</b> pada dashboard. Jangan bagikan Secret Key Anda ke publik.
        </p>
      </div>

      {/* Endpoint: Send Message */}
      <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-base-200">
          <div className="flex items-center gap-3">
            <span className="badge badge-success font-bold text-white font-mono text-xs px-2.5 py-3">POST</span>
            <span className="font-mono font-bold text-sm text-base-content">/api/v1/messages/send</span>
          </div>
          <p className="text-xs text-base-content/60 mt-2">
            Mengirim pesan WhatsApp ke nomor tujuan dengan dukungan format Spintax unik dan placeholder dinamis.
          </p>
        </div>

        {/* Code Snippet Tabs */}
        <div className="bg-base-200/50 p-4 border-b border-base-200">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {(["curl", "nodejs", "python", "php"] as CodeLang[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`btn btn-xs uppercase font-mono rounded-lg ${
                    selectedLang === lang ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <button
              onClick={() => copyCode(getSendSnippet(selectedLang), "send-code")}
              className="btn btn-ghost btn-xs gap-1.5"
            >
              {copiedSection === "send-code" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-success" /> Disalin!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Salin Kode
                </>
              )}
            </button>
          </div>

          <div className="mt-3 bg-neutral text-neutral-content p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
            <pre>{getSendSnippet(selectedLang)}</pre>
          </div>
        </div>

        {/* Parameters Table */}
        <div className="p-6 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-base-content/50">Request Body Parameters</h3>
          <div className="overflow-x-auto">
            <table className="table table-xs">
              <thead>
                <tr className="bg-base-200/60 text-xs">
                  <th>Field</th>
                  <th>Tipe</th>
                  <th>Wajib</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200 font-mono text-xs">
                <tr>
                  <td className="font-bold text-primary">to</td>
                  <td>string</td>
                  <td><span className="badge badge-xs badge-error">Ya</span></td>
                  <td>Nomor WhatsApp tujuan (format: 62812xxx atau 0812xxx)</td>
                </tr>
                <tr>
                  <td className="font-bold text-primary">message</td>
                  <td>string</td>
                  <td><span className="badge badge-xs badge-error">Ya</span></td>
                  <td>Isi pesan teks. Mendukung format Spintax: <code className="bg-base-200 px-1 rounded">{`{Halo|Hai}`}</code></td>
                </tr>
                <tr>
                  <td className="font-bold text-primary">deviceId</td>
                  <td>string</td>
                  <td><span className="badge badge-xs badge-ghost">Opsional</span></td>
                  <td>ID device pengirim, atau gunakan <code className="bg-base-200 px-1 rounded">auto_rotate</code> untuk Round-Robin</td>
                </tr>
                <tr>
                  <td className="font-bold text-primary">variables</td>
                  <td>object</td>
                  <td><span className="badge badge-xs badge-ghost">Opsional</span></td>
                  <td>Key-value pasangan variabel dinamis seperti <code className="bg-base-200 px-1 rounded">{`{ name: "Budi" }`}</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Interactive API Playground */}
      <div className="card bg-base-100 border-2 border-primary/40 shadow-md p-6 rounded-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            Interactive API Sandbox Playground
          </h2>
          <span className="badge badge-sm badge-primary">Live Test</span>
        </div>
        <p className="text-xs text-base-content/60">
          Uji coba request langsung ke server API Sendora dan lihat response JSON secara instan.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text font-semibold text-xs">Authorization Bearer Key</span>
            </label>
            <input
              type="text"
              className="input input-bordered input-sm font-mono text-xs"
              value={testApiKey}
              onChange={(e) => setTestApiKey(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text font-semibold text-xs">Nomor Tujuan ('to')</span>
            </label>
            <input
              type="text"
              className="input input-bordered input-sm font-mono text-xs"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
            />
          </div>

          <div className="form-control md:col-span-2">
            <label className="label py-1">
              <span className="label-text font-semibold text-xs">Isi Pesan (Spintax didukung)</span>
            </label>
            <textarea
              className="textarea textarea-bordered textarea-sm font-mono text-xs h-20"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleRunPlayground}
          disabled={sendingTest}
          className="btn btn-primary btn-sm gap-2 w-full md:w-auto"
        >
          {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Kirim Request Uji Coba
        </button>

        {testResponse && (
          <div className="space-y-2 pt-2 border-t border-base-200">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Response HTTP Status:</span>
              <span
                className={`badge badge-sm ${
                  testResponse.ok ? "badge-success text-white" : "badge-error text-white"
                }`}
              >
                {testResponse.status}
              </span>
            </div>
            <div className="bg-neutral text-neutral-content p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
              <pre>{JSON.stringify(testResponse.data, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Webhook Events Reference */}
      <div className="card bg-base-100 border border-base-200 shadow-sm p-6 rounded-2xl space-y-4">
        <h2 className="font-bold text-base flex items-center gap-2">
          <Webhook className="w-4 h-4 text-primary" /> Webhook Events & HMAC Signature
        </h2>
        <p className="text-xs text-base-content/70">
          Saat event terjadi (pesan masuk, opt-out, device disconnected), server Sendora mengirimkan HTTP POST dengan Header signature:
        </p>
        <div className="mockup-code bg-base-300 text-base-content text-xs rounded-xl p-4 font-mono">
          <pre><code>X-Sendora-Signature: sha256_hmac_hex_hash</code></pre>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-base-200/50 rounded-xl">
            <span className="font-mono font-bold text-primary block mb-1">message.received</span>
            <span className="text-base-content/60">Pesan masuk dari pelanggan diterima</span>
          </div>
          <div className="p-3 bg-base-200/50 rounded-xl">
            <span className="font-mono font-bold text-primary block mb-1">message.opt_out</span>
            <span className="text-base-content/60">Pengirim mengirim kata kunci unsubscribe</span>
          </div>
          <div className="p-3 bg-base-200/50 rounded-xl">
            <span className="font-mono font-bold text-primary block mb-1">device.disconnected</span>
            <span className="text-base-content/60">Koneksi WhatsApp session terputus</span>
          </div>
        </div>
      </div>
    </div>
  );
}
