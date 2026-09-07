"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LandingNavbar } from "@/components/landing-navbar";
import { LandingFooter } from "@/components/landing-footer";
import {
  MessageSquare,
  Code2,
  KeyRound,
  Zap,
  Send,
  Webhook,
  Smartphone,
  ShieldCheck,
  Check,
  Copy,
  Terminal,
  BookOpen,
  ArrowRight,
  AlertCircle,
  Clock,
  Activity,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Info,
} from "lucide-react";

type CodeLang = "curl" | "nodejs" | "python" | "php";

export default function PublicDocsPage() {
  const [selectedLang, setSelectedLang] = useState<CodeLang>("curl");
  const [selectedWebhookLang, setSelectedWebhookLang] = useState<"nodejs" | "php" | "python">("nodejs");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState<string>("intro");
  const [originUrl, setOriginUrl] = useState<string>("http://localhost:3001");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setOriginUrl(window.location.origin);
    }
  }, []);

  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const navItems = [
    { id: "intro", label: "1. Pengenalan & Quickstart", icon: BookOpen },
    { id: "auth", label: "2. Autentikasi & API Key", icon: KeyRound },
    { id: "send-message", label: "3. Kirim Pesan (Send API)", icon: Send },
    { id: "auto-rotate", label: "4. Multi-Device Auto-Rotate", icon: RotateCcw },
    { id: "spintax", label: "5. Spintax & Dynamic Vars", icon: ShieldCheck },
    { id: "devices-api", label: "6. Manajemen Device API", icon: Smartphone },
    { id: "messages-status", label: "7. Siklus Status Pesan", icon: Activity },
    { id: "webhooks", label: "8. Webhooks & Signature", icon: Webhook },
    { id: "rate-limits", label: "9. Rate Limits & Kuota", icon: Clock },
    { id: "errors", label: "10. Error Codes & Troubleshooting", icon: AlertCircle },
  ];

  // ScrollSpy using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveNav(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-15% 0px -65% 0px",
        threshold: 0.1,
      }
    );

    navItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) {
        sectionsRef.current[item.id] = el;
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    setActiveNav(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const snippets = {
    send: {
      curl: `curl -X POST ${originUrl}/api/v1/messages/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer snd_live_YOUR_API_KEY" \\
  -d '{
    "to": "6281234567890",
    "message": "{Halo|Hai|Selamat siang} {{name}}, pesanan Anda {{order_id}} sedang diproses!",
    "deviceId": "auto_rotate",
    "variables": {
      "name": "Budi Santoso",
      "order_id": "INV-2026-9812"
    }
  }'`,
      nodejs: `import axios from "axios";

const response = await axios.post(
  "${originUrl}/api/v1/messages/send",
  {
    to: "6281234567890",
    message: "{Halo|Hai|Selamat siang} {{name}}, pesanan Anda {{order_id}} sedang diproses!",
    deviceId: "auto_rotate",
    variables: {
      name: "Budi Santoso",
      order_id: "INV-2026-9812",
    },
  },
  {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer snd_live_YOUR_API_KEY",
    },
  }
);

console.log(response.data);`,
      python: `import requests

url = "${originUrl}/api/v1/messages/send"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer snd_live_YOUR_API_KEY",
}
payload = {
    "to": "6281234567890",
    "message": "{Halo|Hai|Selamat siang} {{name}}, pesanan Anda {{order_id}} sedang diproses!",
    "deviceId": "auto_rotate",
    "variables": {
        "name": "Budi Santoso",
        "order_id": "INV-2026-9812"
    }
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
      php: `<?php
$curl = curl_init();

$payload = [
    "to" => "6281234567890",
    "message" => "{Halo|Hai|Selamat siang} {{name}}, pesanan Anda {{order_id}} sedang diproses!",
    "deviceId" => "auto_rotate",
    "variables" => [
        "name" => "Budi Santoso",
        "order_id" => "INV-2026-9812"
    ]
];

curl_setopt_array($curl, [
    CURLOPT_URL => "${originUrl}/api/v1/messages/send",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => "POST",
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "Authorization: Bearer snd_live_YOUR_API_KEY"
    ],
]);

$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>`,
    },
    webhookVerify: {
      nodejs: `import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

app.post("/webhook/sendora", (req, res) => {
  const signature = req.headers["x-sendora-signature"];
  const webhookSecret = process.env.SENDORA_WEBHOOK_SECRET;

  // 1. Verifikasi HMAC-SHA256 signature
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { event, data } = req.body;
  console.log("Event diterima:", event);

  // 2. Tangani event pesan masuk
  if (event === "message.received") {
    console.log(\`Chat masuk dari \${data.from}: \${data.message}\`);
    // Lakukan pemrosesan bot / simpan ke CRM...
  }

  // 3. Selalu respon 200 OK
  return res.status(200).json({ status: "received" });
});`,
      php: `<?php
// Endpoint Webhook di PHP / Laravel
$rawPayload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_SENDORA_SIGNATURE'] ?? '';
$webhookSecret = getenv('SENDORA_WEBHOOK_SECRET');

// 1. Verifikasi HMAC-SHA256 signature
$expectedSignature = hash_hmac('sha256', $rawPayload, $webhookSecret);

if (!hash_equals($expectedSignature, $signature)) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid signature"]);
    exit;
}

$payload = json_decode($rawPayload, true);
$event = $payload['event'] ?? '';
$data = $payload['data'] ?? [];

// 2. Tangani event pesan masuk
if ($event === 'message.received') {
    $sender = $data['from'];
    $message = $data['message'];
    // Proses chat pelanggan / kirim auto-reply...
}

// 3. Respon 200 OK
http_response_code(200);
echo json_encode(["status" => "received"]);
?>`,
      python: `from fastapi import FastAPI, Request, HTTPException
import hmac
import hashlib
import os

app = FastAPI()
WEBHOOK_SECRET = os.getenv("SENDORA_WEBHOOK_SECRET", "whsec_your_secret")

@app.post("/webhook/sendora")
async def handle_sendora_webhook(request: Request):
    raw_body = await request.body()
    signature = request.headers.get("x-sendora-signature", "")
    
    # 1. Verifikasi HMAC-SHA256 signature
    expected_sig = hmac.new(
        WEBHOOK_SECRET.encode(),
        raw_body,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(expected_sig, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
        
    payload = await request.json()
    event = payload.get("event")
    data = payload.get("data", {})
    
    # 2. Tangani event
    if event == "message.received":
        print(f"Chat dari {data.get('from')}: {data.get('message')}")
        # Proses pesan / trigger AI chatbot...
        
    # 3. Respon 200 OK
    return {"status": "received"}`
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900 font-sans">
      {/* Landing Navbar with Mobile Drawer */}
      <LandingNavbar />

      {/* Docs Body with Interactive Sticky Sidebar */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 md:py-10 flex-1 flex flex-col md:flex-row gap-8 lg:gap-10">
        {/* Left Sticky Sidebar (ScrollSpy Highlight) */}
        <aside className="w-full md:w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            <div className="px-4 py-3 bg-white rounded-2xl border border-slate-200/90 flex items-center justify-between shadow-xs">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-600" /> REST API Docs v1.0
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>

            <nav className="space-y-1 bg-white p-2.5 rounded-2xl border border-slate-200/90 max-h-[calc(100vh-250px)] overflow-y-auto shadow-xs">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 rounded-xl bg-white border border-slate-200/90 space-y-2.5 shadow-xs">
              <p className="font-bold text-xs flex items-center gap-1.5 text-slate-900">
                <Terminal className="w-3.5 h-3.5 text-emerald-600" /> Interactive Sandbox
              </p>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Coba request API langsung dari browser tanpa coding melalui Live Sandbox Tester di dashboard.
              </p>
              <Link
                href="/dashboard/docs"
                className="inline-flex items-center justify-center w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg font-semibold text-xs h-9 px-3 transition-colors shadow-xs mt-1"
              >
                Buka Live Tester
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Main Content */}
        <main className="flex-1 space-y-12 max-w-4xl min-w-0">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link href="/" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                Beranda
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-bold">Dokumentasi API</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/#pricing"
                className="text-xs font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
              >
                Lihat Paket
              </Link>
              <span className="text-slate-300">•</span>
              <Link
                href="/login"
                className="text-xs font-semibold text-emerald-600 hover:underline"
              >
                Dashboard & API Keys
              </Link>
            </div>
          </div>

          {/* 1. Intro */}
          <section id="intro" className="space-y-4 scroll-mt-24">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <Zap className="w-3.5 h-3.5 text-emerald-600" /> Getting Started Guide
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              Dokumentasi REST API Sendora
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed font-normal">
              Sendora menyediakan RESTful API berbasis JSON berkecepatan tinggi yang memungkinkan Anda mengirim pesan WhatsApp transaksional (OTP, notifikasi pesanan, invoice), menjalankan broadcast massal dengan perlindungan anti-ban, merotasi multi-device secara otomatis (<b>Round-Robin load balancing</b>), dan menangkap webhook event pesan masuk.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
                <span className="text-slate-500 font-semibold block mb-1">Base URL:</span>
                <code className="font-bold text-emerald-700 text-xs break-all">{originUrl}/api/v1</code>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
                <span className="text-slate-500 font-semibold block mb-1">Content-Type:</span>
                <span className="font-bold font-mono text-slate-900 text-xs">application/json</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
                <span className="text-slate-500 font-semibold block mb-1">Kecepatan Kirim:</span>
                <span className="font-bold text-emerald-600 font-mono text-xs">&lt; 1.2 detik / pesan</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 space-y-2.5 shadow-xs">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900">Format Standard Response JSON:</h4>
              <div className="bg-slate-900 text-slate-100 text-xs p-4 rounded-xl font-mono leading-relaxed border border-slate-800 shadow-inner overflow-x-auto">
                <pre><code>{`// Sukses (HTTP 200):
{
  "success": true,
  "data": { ... }
}

// Error (HTTP 400/401/404/429):
{
  "success": false,
  "error": "Pesan deskripsi kesalahan",
  "code": 400
}`}</code></pre>
              </div>
            </div>
          </section>

          {/* 2. Authentication */}
          <section id="auth" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <KeyRound className="w-5 h-5 text-emerald-600" /> 2. Autentikasi & API Key
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Semua permintaan ke API Sendora wajib diautentikasi dengan menyertakan <b>API Key</b> di Header HTTP. Kami mendukung dua format header:
            </p>

            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-700">Opsi 1 (Standar Rekomendasi):</span>
              <div className="bg-slate-900 text-emerald-400 text-xs rounded-xl p-3.5 font-mono border border-slate-800 shadow-inner overflow-x-auto">
                <code>Authorization: Bearer snd_live_948f928c2e1739f8bc20a</code>
              </div>

              <span className="text-xs font-bold text-slate-700 pt-1 block">Opsi 2:</span>
              <div className="bg-slate-900 text-emerald-400 text-xs rounded-xl p-3.5 font-mono border border-slate-800 shadow-inner overflow-x-auto">
                <code>X-API-Key: snd_live_948f928c2e1739f8bc20a</code>
              </div>
            </div>

            <div className="p-3.5 bg-sky-50/70 border border-sky-200/80 rounded-xl text-xs text-sky-950 leading-relaxed flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sky-900">Tips Keamanan:</span> Dapatkan API Key Anda di menu <b className="font-semibold text-sky-950">Dashboard &gt; Developers &gt; API Keys</b>. Jangan pernah mempublikasikan API Key Anda di sisi frontend client-side.
              </div>
            </div>
          </section>

          {/* 3. Send Message */}
          <section id="send-message" className="space-y-5 scroll-mt-24 border-t border-slate-200 pt-8">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="bg-emerald-600 text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg">POST</span>
                <span className="font-mono font-bold text-sm sm:text-base text-slate-900">/api/v1/messages/send</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                Mengirimkan pesan WhatsApp ke nomor tujuan tunggal dengan fitur rendering Spintax, substitusi variabel dinamis, dan opsi pemilihan device pengirim.
              </p>
            </div>

            {/* Code Selector Tabs */}
            <div className="bg-white border border-slate-200/90 shadow-xs rounded-2xl overflow-hidden">
              <div className="bg-slate-50 p-3 sm:p-4 border-b border-slate-100 flex items-center justify-between gap-2">
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
                  onClick={() => copyCode(snippets.send[selectedLang], "send-main")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedSection === "send-main" ? (
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
              <div className="bg-slate-950 text-slate-100 p-4 sm:p-5 font-mono text-xs leading-relaxed border border-slate-800 shadow-inner overflow-x-auto">
                <pre className="whitespace-pre-wrap break-words">{snippets.send[selectedLang]}</pre>
              </div>
            </div>

            {/* Parameters Table */}
            <div className="space-y-2.5">
              <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Request Body Parameters</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Parameter</th>
                      <th className="p-3">Tipe</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Deskripsi</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs divide-y divide-slate-100 text-slate-900">
                    <tr className="hover:bg-slate-50/50">
                      <td className="font-bold text-emerald-700 p-3">to</td>
                      <td className="p-3 text-slate-500">string</td>
                      <td className="p-3 font-sans"><span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] px-2 py-0.5 rounded-full font-semibold">Wajib</span></td>
                      <td className="font-sans text-slate-700 p-3">Nomor penerima WhatsApp (format <code>62812xxx</code> atau <code>0812xxx</code>).</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="font-bold text-emerald-700 p-3">message</td>
                      <td className="p-3 text-slate-500">string</td>
                      <td className="p-3 font-sans"><span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] px-2 py-0.5 rounded-full font-semibold">Wajib</span></td>
                      <td className="font-sans text-slate-700 p-3">Isi pesan teks. Mendukung Spintax <code>{`{A|B}`}</code> dan placeholder <code>{`{{key}}`}</code>.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="font-bold text-emerald-700 p-3">deviceId</td>
                      <td className="p-3 text-slate-500">string</td>
                      <td className="p-3 font-sans"><span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-2 py-0.5 rounded-full font-semibold">Opsional</span></td>
                      <td className="font-sans text-slate-700 p-3">ID device pengirim spesifik, atau gunakan <code>"auto_rotate"</code> untuk Round-Robin otomatis.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="font-bold text-emerald-700 p-3">variables</td>
                      <td className="p-3 text-slate-500">object</td>
                      <td className="p-3 font-sans"><span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-2 py-0.5 rounded-full font-semibold">Opsional</span></td>
                      <td className="font-sans text-slate-700 p-3">Key-value pengganti variabel (contoh: <code>{`{ "name": "Budi", "order_id": "123" }`}</code>).</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Response Examples */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-emerald-300 shadow-xs space-y-2">
                <span className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 200 OK (Success)
                </span>
                <pre className="bg-slate-950 p-3.5 rounded-lg font-mono text-xs text-emerald-400 leading-relaxed border border-slate-800 shadow-inner overflow-x-auto">
{`{
  "success": true,
  "data": {
    "id": "msg_17255829102",
    "providerMessageId": "3EB09F21882",
    "recipient": "6281234567890",
    "content": "Halo Budi, pesanan...",
    "status": "SENT",
    "sentAt": "2026-09-06T00:20:00Z"
  }
}`}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-white border border-rose-300 shadow-xs space-y-2">
                <span className="font-bold text-rose-800 flex items-center gap-1.5 text-xs">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" /> 400 / 404 (Error)
                </span>
                <pre className="bg-slate-950 p-3.5 rounded-lg font-mono text-xs text-rose-400 leading-relaxed border border-slate-800 shadow-inner overflow-x-auto">
{`{
  "success": false,
  "error": "Recipient in Blacklist / DND list."
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* 4. Auto-Rotate */}
          <section id="auto-rotate" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <RotateCcw className="w-5 h-5 text-emerald-600" /> 4. Multi-Device Auto-Rotation (Round-Robin)
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Untuk bisnis dengan volume pengiriman tinggi, Sendora menyediakan engine <b>Auto-Rotate</b> yang otomatis membagi antrean pesan bergantian ke seluruh nomor WhatsApp yang aktif terhubung (<b>Round-Robin load balancing</b>).
            </p>
            <div className="bg-slate-900 text-slate-100 text-xs p-4 rounded-xl font-mono border border-slate-800 shadow-inner overflow-x-auto">
              <pre><code>{`// Cantumkan "deviceId": "auto_rotate" pada request API:
{
  "to": "6281234567890",
  "message": "Kode OTP Anda adalah {{otp}}",
  "deviceId": "auto_rotate"
}`}</code></pre>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3.5 bg-white border border-slate-200/90 shadow-xs rounded-xl">
                <span className="font-bold text-emerald-700 block mb-1">Mencegah Nomor Terblokir</span>
                <span className="text-slate-600">Volume tidak bertumpuk pada satu kartu SIM.</span>
              </div>
              <div className="p-3.5 bg-white border border-slate-200/90 shadow-xs rounded-xl">
                <span className="font-bold text-emerald-700 block mb-1">Otomatis Failover</span>
                <span className="text-slate-600">Device yang sedang offline otomatis dilewati.</span>
              </div>
              <div className="p-3.5 bg-white border border-slate-200/90 shadow-xs rounded-xl">
                <span className="font-bold text-emerald-700 block mb-1">Zero Configuration</span>
                <span className="text-slate-600">Cukup hubungkan nomor di menu Devices.</span>
              </div>
            </div>
          </section>

          {/* 5. Spintax */}
          <section id="spintax" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> 5. Spintax & Dynamic Variables
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              <b>Spintax (Spin Syntax)</b> memungkinkan Anda menghasilkan ribuan variasi kalimat unik dari satu pesan master dengan format kurung kurawal <code>{`{pilihan1|pilihan2|pilihan3}`}</code>.
            </p>
            <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 space-y-2.5 text-xs shadow-xs">
              <span className="font-bold text-slate-900">Master Template:</span>
              <div className="bg-slate-900 text-slate-100 text-xs p-3.5 rounded-xl font-mono border border-slate-800 shadow-inner overflow-x-auto">
                <pre><code>{`{Halo|Hai|Selamat pagi} {{name}}, pesanan {{order_id}} {sudah|telah} {dikirim|diproses} via {{kurir}}!`}</code></pre>
              </div>
              <span className="font-bold text-slate-900 block pt-1">Variasi yang Dihasilkan:</span>
              <ul className="list-disc list-inside space-y-1 font-mono text-xs text-slate-700">
                <li>"Halo Budi, pesanan INV-01 sudah dikirim via JNE!"</li>
                <li>"Hai Budi, pesanan INV-01 telah diproses via JNE!"</li>
                <li>"Selamat pagi Budi, pesanan INV-01 sudah diproses via JNE!"</li>
              </ul>
            </div>
          </section>

          {/* 6. Devices API */}
          <section id="devices-api" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <Smartphone className="w-5 h-5 text-emerald-600" /> 6. Manajemen WhatsApp Devices API
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Cek daftar device WhatsApp yang terdaftar beserta status koneksi socket real-time.
            </p>
            <div className="flex items-center gap-2.5">
              <span className="bg-sky-600 text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg">GET</span>
              <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">/api/gateway/sessions</span>
            </div>
            <div className="bg-slate-900 text-slate-100 text-xs p-4 rounded-xl font-mono border border-slate-800 shadow-inner overflow-x-auto">
              <pre><code>{`// Response:
{
  "success": true,
  "data": [
    {
      "id": "dev_01_primary",
      "name": "Customer Support WhatsApp",
      "phoneNumber": "628123456789",
      "status": "connected",
      "updatedAt": "2026-09-06T00:15:00Z"
    }
  ]
}`}</code></pre>
            </div>
          </section>

          {/* 7. Messages Status */}
          <section id="messages-status" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <Activity className="w-5 h-5 text-emerald-600" /> 7. Siklus Status Pesan (Message Lifecycle)
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Setiap pesan yang diproses melalui sistem Sendora melewati transisi status berikut:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center text-xs font-mono font-bold">
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800 shadow-2xs">1. QUEUED</div>
              <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 shadow-2xs">2. PROCESSING</div>
              <div className="p-3 bg-sky-50 text-sky-800 rounded-xl border border-sky-200 shadow-2xs">3. SENT</div>
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 shadow-2xs">4. DELIVERED</div>
              <div className="p-3 bg-indigo-50 text-indigo-800 rounded-xl border border-indigo-200 shadow-2xs">5. READ</div>
            </div>
          </section>

          {/* 8. Webhooks */}
          <section id="webhooks" className="space-y-5 scroll-mt-24 border-t border-slate-200 pt-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 mb-2">
                <Webhook className="w-3.5 h-3.5 text-emerald-600" /> Two-Way Messaging Event Stream
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
                8. Inbound Webhooks & HMAC Signature Verification
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              <b>Inbound Webhook</b> adalah mekanisme pengiriman data otomatis secara <i>real-time</i> dari server Sendora ke URL endpoint aplikasi/server Anda setiap kali terjadi aktivitas di WhatsApp.
            </p>

            {/* Architecture Flow Diagram */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 space-y-3 shadow-xs">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" /> Alur Kerja Inbound Webhook:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900 block">1. Pelanggan Chat</span>
                  <p className="text-slate-600 text-[11px]">Pelanggan mengirim pesan balasan di WhatsApp.</p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <span className="font-bold text-emerald-900 block">2. Gateway Tangkap</span>
                  <p className="text-emerald-800 text-[11px]">Sendora menangkap event pesan secara instan (&lt; 200ms).</p>
                </div>
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-1">
                  <span className="font-bold text-sky-900 block">3. Dispatcher POST</span>
                  <p className="text-sky-800 text-[11px]">Sendora mengirim HTTP POST JSON dengan signature HMAC.</p>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                  <span className="font-bold text-indigo-900 block">4. Server Anda Respon</span>
                  <p className="text-indigo-800 text-[11px]">Aplikasi memproses chat dan merespon 200 OK.</p>
                </div>
              </div>
            </div>

            {/* Supported Events Table */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" /> Daftar Event Types yang Didukung:
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Event Type</th>
                      <th className="p-3">Deskripsi Peristiwa</th>
                      <th className="p-3">Trigger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-900">
                    <tr className="hover:bg-slate-50/50">
                      <td className="font-mono font-bold text-emerald-700 p-3">message.received</td>
                      <td className="font-medium p-3">Pesan teks, gambar, atau dokumen masuk dari pelanggan.</td>
                      <td className="text-slate-600 p-3">Saat user membalas chat WhatsApp.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="font-mono font-bold text-sky-700 p-3">message.delivered</td>
                      <td className="font-medium p-3">Laporan status pesan diterima di perangkat tujuan (Centang Dua).</td>
                      <td className="text-slate-600 p-3">Saat pesan sampai di HP penerima.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="font-mono font-bold text-indigo-700 p-3">message.read</td>
                      <td className="font-medium p-3">Laporan status pesan dibaca/dibuka (Centang Biru).</td>
                      <td className="text-slate-600 p-3">Saat penerima membuka chat.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="font-mono font-bold text-teal-700 p-3">device.connected</td>
                      <td className="font-medium p-3">Koneksi nomor WhatsApp aktif dan siap digunakan.</td>
                      <td className="text-slate-600 p-3">Saat sesi tersambung kembali.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="font-mono font-bold text-rose-700 p-3">device.disconnected</td>
                      <td className="font-medium p-3">Perangkat WhatsApp logout atau HP mati.</td>
                      <td className="text-slate-600 p-3">Saat socket WhatsApp terputus.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="font-mono font-bold text-amber-700 p-3">blacklist.opt_out</td>
                      <td className="font-medium p-3">Kontak membalas kata kunci <code>STOP</code> atau <code>UNSUB</code>.</td>
                      <td className="text-slate-600 p-3">Nomor otomatis masuk DND.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature Verification Code Switcher */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verifikasi Keamanan Header HMAC-SHA256:
                </h4>
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1 self-start sm:self-auto border border-slate-200">
                  {(["nodejs", "php", "python"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedWebhookLang(lang)}
                      className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                        selectedWebhookLang === lang
                          ? "bg-white text-slate-900 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {lang === "nodejs" ? "Node.js (Express)" : lang === "php" ? "PHP (Laravel / Native)" : "Python (FastAPI)"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="bg-slate-900 text-slate-100 text-xs p-4 sm:p-5 rounded-xl font-mono leading-relaxed border border-slate-800 shadow-inner overflow-x-auto">
                  <pre><code>{snippets.webhookVerify[selectedWebhookLang]}</code></pre>
                </div>
                <button
                  onClick={() => copyCode(snippets.webhookVerify[selectedWebhookLang], "webhook-code")}
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedSection === "webhook-code" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Salin Kode
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Best Practice Note */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1 shadow-2xs">
              <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Best Practice & Standar Response:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-emerald-800 text-[11px]">
                <li>Server Anda <b>wajib merespon status HTTP 200</b> dalam waktu maksimal 5 detik.</li>
                <li>Jika server endpoint timeout atau 5xx, sistem retry otomatis akan mencoba hingga 3 kali dengan jeda eksponensial.</li>
              </ul>
            </div>
          </section>

          {/* 9. Rate Limits */}
          <section id="rate-limits" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <Clock className="w-5 h-5 text-emerald-600" /> 9. Rate Limits & Kuota Paket
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Paket</th>
                    <th className="p-3">Batas Request / Menit</th>
                    <th className="p-3">Maksimal Devices</th>
                    <th className="p-3">Kuota Bulanan</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs divide-y divide-slate-100 text-slate-900">
                  <tr className="hover:bg-slate-50/50">
                    <td className="font-bold p-3">Free Trial</td>
                    <td className="p-3">10 req / min</td>
                    <td className="p-3">1 Device</td>
                    <td className="p-3">100 pesan</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="font-bold text-sky-700 p-3">Starter</td>
                    <td className="p-3">60 req / min</td>
                    <td className="p-3">2 Devices</td>
                    <td className="p-3">5.000 pesan</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="font-bold text-emerald-700 p-3">Business</td>
                    <td className="p-3">300 req / min</td>
                    <td className="p-3">5 Devices</td>
                    <td className="p-3">25.000 pesan</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="font-bold text-indigo-700 p-3">Pro Unlimited</td>
                    <td className="p-3">1.000 req / min</td>
                    <td className="p-3">10 Devices</td>
                    <td className="p-3">100.000 pesan</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 10. Errors */}
          <section id="errors" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8 pb-16">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <AlertCircle className="w-5 h-5 text-emerald-600" /> 10. Error Codes & Troubleshooting
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Status Code</th>
                    <th className="p-3">Penyebab Error</th>
                    <th className="p-3">Solusi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-900">
                  <tr className="hover:bg-slate-50/50">
                    <td className="font-mono font-bold text-rose-600 p-3">400 Bad Request</td>
                    <td className="p-3 text-slate-700">Format nomor salah atau parameter wajib kosong.</td>
                    <td className="p-3 text-slate-600">Pastikan format nomor diawali kode negara seperti <code>62812xxx</code>.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="font-mono font-bold text-rose-600 p-3">401 Unauthorized</td>
                    <td className="p-3 text-slate-700">API Key tidak valid atau header authorization hilang.</td>
                    <td className="p-3 text-slate-600">Periksa kembali API Key di dashboard Sendora.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="font-mono font-bold text-rose-600 p-3">404 Not Found</td>
                    <td className="p-3 text-slate-700">Tidak ada WhatsApp device aktif yang terhubung.</td>
                    <td className="p-3 text-slate-600">Scan QR Code di menu WhatsApp Devices pada dashboard.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="font-mono font-bold text-rose-600 p-3">429 Rate Limit</td>
                    <td className="p-3 text-slate-700">Melampaui batas kecepatan request paket Anda.</td>
                    <td className="p-3 text-slate-600">Tambahkan jeda request atau upgrade paket Anda.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* Modern Multi-Column Footer */}
      <LandingFooter />
    </div>
  );
}
