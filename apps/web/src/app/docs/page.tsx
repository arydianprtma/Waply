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
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-10 flex-1 flex flex-col md:flex-row gap-10">
        {/* Left Sticky Sidebar (ScrollSpy Highlight) */}
        <aside className="w-full md:w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-5">
            <div className="px-4 py-3 bg-emerald-100/80 rounded-2xl border border-emerald-300 flex items-center justify-between shadow-sm">
              <span className="text-sm font-black text-emerald-900 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-700" /> REST API Docs v1.0
              </span>
              <span className="badge badge-sm badge-success text-white font-bold">Online</span>
            </div>

            <nav className="space-y-1.5 bg-white p-3 rounded-2xl border border-slate-200 max-h-[calc(100vh-250px)] overflow-y-auto shadow-sm">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all text-left ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                        : "text-slate-700 hover:bg-slate-100 hover:text-emerald-700"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-sm">
              <p className="font-black text-sm flex items-center gap-2 text-slate-900">
                <Terminal className="w-4 h-4 text-emerald-600" /> Interactive Sandbox?
              </p>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Ingin mencoba request API langsung dari browser tanpa coding? Buka Live Tester di dashboard.
              </p>
              <Link href="/dashboard/api-keys" className="btn btn-sm btn-block gap-1.5 mt-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 border-none shadow-sm">
                Buka API Keys <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Main Content (Solid Black High Contrast Typography) */}
        <main className="flex-1 space-y-16 max-w-4xl min-w-0">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Link href="/" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                Beranda
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-extrabold">Dokumentasi API</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/#pricing"
                className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors"
              >
                Lihat Paket
              </Link>
              <span className="text-slate-300">•</span>
              <Link
                href="/login"
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                Dashboard & API Keys →
              </Link>
            </div>
          </div>

          {/* 1. Intro */}
          <section id="intro" className="space-y-5 scroll-mt-24">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
              <Zap className="w-4 h-4 text-emerald-700" /> Getting Started Guide
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950">
              Dokumentasi REST API Sendora
            </h1>
            <p className="text-base md:text-lg text-slate-800 leading-relaxed font-normal">
              Sendora menyediakan RESTful API berbasis JSON berkecepatan tinggi yang memungkinkan Anda mengirim pesan WhatsApp transaksional (OTP, notifikasi pesanan, invoice), menjalankan broadcast massal dengan perlindungan anti-ban, merotasi multi-device secara otomatis (<b>Round-Robin load balancing</b>), dan menangkap webhook event pesan masuk.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-sm">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-slate-500 font-bold block mb-1">Base URL:</span>
                <code className="font-bold text-emerald-700 text-sm break-all">{originUrl}/api/v1</code>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-slate-500 font-bold block mb-1">Content-Type:</span>
                <span className="font-bold font-mono text-slate-900">application/json</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-slate-500 font-bold block mb-1">Kecepatan Kirim:</span>
                <span className="font-bold text-emerald-600 font-mono">&lt; 1.2 detik / pesan</span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-sm">
              <h4 className="font-bold text-base text-slate-950">Format Standard Response JSON:</h4>
              <div className="mockup-code bg-slate-900 text-slate-100 text-sm p-4 rounded-xl font-mono leading-relaxed shadow-inner">
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
          <section id="auth" className="space-y-5 scroll-mt-24 border-t border-slate-200 pt-10">
            <h2 className="text-2xl font-black flex items-center gap-2.5 text-slate-950">
              <KeyRound className="w-6 h-6 text-emerald-600" /> 2. Autentikasi & API Key
            </h2>
            <p className="text-base text-slate-800 leading-relaxed font-normal">
              Semua permintaan ke API Sendora wajib diautentikasi dengan menyertakan <b>API Key</b> di Header HTTP. Kami mendukung dua format header:
            </p>

            <div className="space-y-3">
              <span className="text-sm font-bold text-slate-900">Opsi 1 (Standar Rekomendasi):</span>
              <div className="mockup-code bg-slate-900 text-emerald-400 text-sm rounded-xl p-4 font-mono shadow-inner">
                <pre><code>Authorization: Bearer snd_live_948f928c2e1739f8bc20a</code></pre>
              </div>

              <span className="text-sm font-bold text-slate-900 pt-2 block">Opsi 2:</span>
              <div className="mockup-code bg-slate-900 text-emerald-400 text-sm rounded-xl p-4 font-mono shadow-inner">
                <pre><code>X-API-Key: snd_live_948f928c2e1739f8bc20a</code></pre>
              </div>
            </div>

            <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-sm font-medium text-sky-950">
              <span><b>💡 Tips Keamanan:</b> Dapatkan API Key Anda di menu <b>Dashboard &gt; Developers &gt; API Keys</b>. Jangan pernah mempublikasikan API Key Anda di sisi frontend client-side.</span>
            </div>
          </section>

          {/* 3. Send Message */}
          <section id="send-message" className="space-y-6 scroll-mt-24 border-t border-slate-200 pt-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="badge badge-success text-white font-mono font-bold text-xs px-3 py-3.5">POST</span>
                <span className="font-mono font-bold text-lg text-slate-950">/api/v1/messages/send</span>
              </div>
              <p className="text-base text-slate-800 leading-relaxed font-normal">
                Mengirimkan pesan WhatsApp ke nomor tujuan tunggal dengan fitur rendering Spintax, substitusi variabel dinamis, dan opsi pemilihan device pengirim.
              </p>
            </div>

            {/* Code Selector Tabs */}
            <div className="card bg-white border border-slate-300 shadow-md rounded-2xl overflow-hidden">
              <div className="bg-slate-100 p-3.5 border-b border-slate-300 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {(["curl", "nodejs", "python", "php"] as CodeLang[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLang(lang)}
                      className={`btn btn-sm uppercase font-mono rounded-xl font-bold ${
                        selectedLang === lang ? "bg-emerald-600 text-white shadow-sm border-none" : "btn-ghost text-slate-700"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => copyCode(snippets.send[selectedLang], "send-main")}
                  className="btn btn-ghost btn-sm gap-1.5 font-bold text-slate-900 hover:text-emerald-700"
                >
                  {copiedSection === "send-main" ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" /> Disalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Salin Kode
                    </>
                  )}
                </button>
              </div>
              <div className="bg-slate-950 text-slate-100 p-5 font-mono text-sm shadow-inner leading-relaxed">
                <pre className="whitespace-pre-wrap break-words">{snippets.send[selectedLang]}</pre>
              </div>
            </div>

            {/* Parameters Table */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm uppercase text-slate-950 tracking-wider">Request Body Parameters</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
                <table className="table table-sm text-sm">
                  <thead className="bg-slate-100 text-slate-950 font-black border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Parameter</th>
                      <th className="py-3 px-4">Tipe</th>
                      <th className="py-3 px-4">Wajib</th>
                      <th className="py-3 px-4">Deskripsi</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-sm divide-y divide-slate-200 text-slate-900">
                    <tr>
                      <td className="font-bold text-emerald-700 py-3 px-4">to</td>
                      <td className="py-3 px-4">string</td>
                      <td className="py-3 px-4"><span className="badge badge-sm badge-error text-white font-bold">Ya</span></td>
                      <td className="font-sans text-slate-800 py-3 px-4">Nomor penerima WhatsApp (format <code>62812xxx</code> atau <code>0812xxx</code>).</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-emerald-700 py-3 px-4">message</td>
                      <td className="py-3 px-4">string</td>
                      <td className="py-3 px-4"><span className="badge badge-sm badge-error text-white font-bold">Ya</span></td>
                      <td className="font-sans text-slate-800 py-3 px-4">Isi pesan teks. Mendukung Spintax <code>{`{A|B}`}</code> dan placeholder <code>{`{{key}}`}</code>.</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-emerald-700 py-3 px-4">deviceId</td>
                      <td className="py-3 px-4">string</td>
                      <td className="py-3 px-4"><span className="badge badge-sm badge-ghost font-semibold">Opsional</span></td>
                      <td className="font-sans text-slate-800 py-3 px-4">ID device pengirim spesifik, atau gunakan <code>"auto_rotate"</code> untuk Round-Robin otomatis.</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-emerald-700 py-3 px-4">variables</td>
                      <td className="py-3 px-4">object</td>
                      <td className="py-3 px-4"><span className="badge badge-sm badge-ghost font-semibold">Opsional</span></td>
                      <td className="font-sans text-slate-800 py-3 px-4">Key-value pengganti variabel (contoh: <code>{`{ "name": "Budi", "order_id": "123" }`}</code>).</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Response Examples (Dark High Contrast Code Blocks with No Horizontal Scroll) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <div className="p-5 rounded-2xl bg-white border-2 border-emerald-500 shadow-sm space-y-3">
                <span className="font-black text-emerald-700 flex items-center gap-2 text-base">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> 200 OK (Success)
                </span>
                <pre className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-emerald-300 leading-relaxed shadow-inner whitespace-pre-wrap break-all overflow-x-hidden">
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

              <div className="p-5 rounded-2xl bg-white border-2 border-rose-500 shadow-sm space-y-3">
                <span className="font-black text-rose-700 flex items-center gap-2 text-base">
                  <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" /> 400 / 404 (Error)
                </span>
                <pre className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-rose-300 leading-relaxed shadow-inner whitespace-pre-wrap break-words overflow-x-hidden">
{`{
  "success": false,
  "error": "Recipient in Blacklist / DND list."
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* 4. Auto-Rotate */}
          <section id="auto-rotate" className="space-y-5 scroll-mt-24 border-t border-slate-200 pt-10">
            <h2 className="text-2xl font-black flex items-center gap-2.5 text-slate-950">
              <RotateCcw className="w-6 h-6 text-emerald-600" /> 4. Multi-Device Auto-Rotation (Round-Robin)
            </h2>
            <p className="text-base text-slate-800 leading-relaxed font-normal">
              Untuk bisnis dengan volume pengiriman tinggi, Sendora menyediakan engine <b>Auto-Rotate</b> yang otomatis membagi antrean pesan bergantian ke seluruh nomor WhatsApp yang aktif terhubung (<b>Round-Robin load balancing</b>).
            </p>
            <div className="mockup-code bg-slate-900 text-slate-100 text-sm p-4 rounded-xl font-mono shadow-inner">
              <pre><code>{`// Cantumkan "deviceId": "auto_rotate" pada request API:
{
  "to": "6281234567890",
  "message": "Kode OTP Anda adalah {{otp}}",
  "deviceId": "auto_rotate"
}`}</code></pre>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm pt-2">
              <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
                <span className="font-bold text-emerald-700 block mb-1">Mencegah Nomor Terblokir</span>
                <span className="text-slate-700 text-xs">Volume tidak bertumpuk pada satu kartu SIM.</span>
              </div>
              <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
                <span className="font-bold text-emerald-700 block mb-1">Otomatis Failover</span>
                <span className="text-slate-700 text-xs">Device yang sedang offline otomatis dilewati.</span>
              </div>
              <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
                <span className="font-bold text-emerald-700 block mb-1">Zero Configuration</span>
                <span className="text-slate-700 text-xs">Cukup hubungkan nomor di menu Devices.</span>
              </div>
            </div>
          </section>

          {/* 5. Spintax */}
          <section id="spintax" className="space-y-5 scroll-mt-24 border-t border-slate-200 pt-10">
            <h2 className="text-2xl font-black flex items-center gap-2.5 text-slate-950">
              <ShieldCheck className="w-6 h-6 text-emerald-600" /> 5. Spintax & Dynamic Variables
            </h2>
            <p className="text-base text-slate-800 leading-relaxed font-normal">
              <b>Spintax (Spin Syntax)</b> memungkinkan Anda menghasilkan ribuan variasi kalimat unik dari satu pesan master dengan format kurung kurawal <code>{`{pilihan1|pilihan2|pilihan3}`}</code>.
            </p>
            <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3 text-sm shadow-sm">
              <span className="font-bold text-slate-950">Master Template:</span>
              <div className="mockup-code bg-slate-900 text-slate-100 text-sm p-4 rounded-xl font-mono shadow-inner">
                <pre><code>{`{Halo|Hai|Selamat pagi} {{name}}, pesanan {{order_id}} {sudah|telah} {dikirim|diproses} via {{kurir}}!`}</code></pre>
              </div>
              <span className="font-bold text-slate-950 block pt-1">Variasi yang Dihasilkan:</span>
              <ul className="list-disc list-inside space-y-1.5 font-mono text-xs text-slate-800 font-semibold">
                <li>"Halo Budi, pesanan INV-01 sudah dikirim via JNE!"</li>
                <li>"Hai Budi, pesanan INV-01 telah diproses via JNE!"</li>
                <li>"Selamat pagi Budi, pesanan INV-01 sudah diproses via JNE!"</li>
              </ul>
            </div>
          </section>

          {/* 6. Devices API */}
          <section id="devices-api" className="space-y-5 scroll-mt-24 border-t border-slate-200 pt-10">
            <h2 className="text-2xl font-black flex items-center gap-2.5 text-slate-950">
              <Smartphone className="w-6 h-6 text-emerald-600" /> 6. Manajemen WhatsApp Devices API
            </h2>
            <p className="text-base text-slate-800 leading-relaxed font-normal">
              Cek daftar device WhatsApp yang terdaftar beserta status koneksi socket real-time.
            </p>
            <div className="flex items-center gap-3">
              <span className="badge badge-info text-white font-mono font-bold text-xs px-3 py-3.5">GET</span>
              <span className="font-mono font-bold text-base text-slate-950">/api/gateway/sessions</span>
            </div>
            <div className="mockup-code bg-slate-900 text-slate-100 text-sm p-4 rounded-xl font-mono shadow-inner">
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
          <section id="messages-status" className="space-y-5 scroll-mt-24 border-t border-slate-200 pt-10">
            <h2 className="text-2xl font-black flex items-center gap-2.5 text-slate-950">
              <Activity className="w-6 h-6 text-emerald-600" /> 7. Siklus Status Pesan (Message Lifecycle)
            </h2>
            <p className="text-base text-slate-800 leading-relaxed font-normal">
              Setiap pesan yang diproses melalui sistem Sendora melewati transisi status berikut:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-sm font-mono font-bold">
              <div className="p-3.5 bg-white rounded-xl border border-slate-300 text-slate-900 shadow-sm">1. QUEUED</div>
              <div className="p-3.5 bg-amber-100 text-amber-900 rounded-xl border border-amber-300 shadow-sm">2. PROCESSING</div>
              <div className="p-3.5 bg-sky-100 text-sky-900 rounded-xl border border-sky-300 shadow-sm">3. SENT</div>
              <div className="p-3.5 bg-emerald-100 text-emerald-900 rounded-xl border border-emerald-300 shadow-sm">4. DELIVERED</div>
              <div className="p-3.5 bg-indigo-100 text-indigo-900 rounded-xl border border-indigo-300 shadow-sm">5. READ</div>
            </div>
          </section>

          {/* 8. Webhooks */}
          <section id="webhooks" className="space-y-6 scroll-mt-24 border-t border-slate-200 pt-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 mb-2">
                <Webhook className="w-3.5 h-3.5 text-emerald-700" /> Two-Way Messaging Event Stream
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-950 flex items-center gap-2.5">
                8. Inbound Webhooks & HMAC Signature Verification
              </h2>
            </div>

            <p className="text-base text-slate-800 leading-relaxed font-normal">
              <b>Inbound Webhook</b> adalah mekanisme pengiriman data otomatis secara <i>real-time</i> dari server Sendora ke URL endpoint aplikasi/server Anda setiap kali terjadi aktivitas di WhatsApp (seperti pesan balasan dari pelanggan, laporan status centang dua, nomor meminta berhenti kirim, atau perangkat terputus).
            </p>

            {/* Architecture Flow Diagram */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-sm">
              <h4 className="font-bold text-sm text-slate-950 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" /> Alur Kerja Inbound Webhook:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-extrabold text-slate-900 block">1. Pelanggan Chat</span>
                  <p className="text-slate-600">Pelanggan mengirim pesan balasan / status pesan berubah di WhatsApp.</p>
                </div>
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <span className="font-extrabold text-emerald-900 block">2. Gateway Mendeteksi</span>
                  <p className="text-emerald-800">Sendora Gateway menangkap event pesan WhatsApp secara instan (&lt; 200ms).</p>
                </div>
                <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl space-y-1">
                  <span className="font-extrabold text-sky-900 block">3. Dispatcher HTTP POST</span>
                  <p className="text-sky-800">Sendora mengirim HTTP POST payload JSON ke Webhook URL Anda dengan tanda tangan HMAC.</p>
                </div>
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                  <span className="font-extrabold text-purple-900 block">4. Server Anda Memproses</span>
                  <p className="text-purple-800">Aplikasi Anda memvalidasi signature, memproses chat, membalas via AI / bot, dan merespon 200 OK.</p>
                </div>
              </div>
            </div>

            {/* Step-by-Step Usage Guide */}
            <div className="p-5 md:p-6 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <h4 className="font-bold text-base text-slate-950 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" /> Panduan Langkah Penggunaan Webhook (Step-by-Step):
                </h4>
                <Link
                  href="/dashboard/webhooks"
                  className="btn btn-xs btn-primary gap-1 font-bold text-white shadow-sm self-start sm:self-auto"
                >
                  Buka Menu Webhooks <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center text-[11px]">
                    1
                  </div>
                  <span className="font-bold text-slate-900 block text-xs">Siapkan Endpoint URL</span>
                  <p className="text-slate-600 leading-relaxed">
                    Buat route POST di server Anda (misal: <code>/api/webhook</code>) atau gunakan <a href="https://webhook.site" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-semibold">webhook.site</a> untuk uji coba instan.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center text-[11px]">
                    2
                  </div>
                  <span className="font-bold text-slate-900 block text-xs">Daftarkan di Dashboard</span>
                  <p className="text-slate-600 leading-relaxed">
                    Masuk ke menu <b>Webhooks</b> di dashboard, klik <b>+ Tambah Endpoint</b>, lalu masukkan URL webhook Anda.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center text-[11px]">
                    3
                  </div>
                  <span className="font-bold text-slate-900 block text-xs">Pilih Event yang Diinginkan</span>
                  <p className="text-slate-600 leading-relaxed">
                    Centang event yang ingin didengar (misal: <code>message.received</code> untuk pesan masuk, <code>message.delivered</code>, dsb).
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center text-[11px]">
                    4
                  </div>
                  <span className="font-bold text-slate-900 block text-xs">Lakukan Test Ping</span>
                  <p className="text-slate-600 leading-relaxed">
                    Klik tombol <b>Test Ping</b> di dashboard untuk memastikan server Anda dapat menerima payload dan merespon <code>200 OK</code>.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center text-[11px]">
                    5
                  </div>
                  <span className="font-bold text-slate-900 block text-xs">Selesai & Live!</span>
                  <p className="text-slate-600 leading-relaxed">
                    Kirim chat ke nomor WhatsApp Anda dari HP lain, server Anda akan otomatis menerima data chat secara live.
                  </p>
                </div>
              </div>
            </div>

            {/* Supported Events Table */}
            <div className="space-y-3">
              <h4 className="font-bold text-base text-slate-950 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" /> Daftar Event Types yang Didukung:
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
                <table className="table table-sm text-sm">
                  <thead className="bg-slate-100 text-slate-950 font-black border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Deskripsi Peristiwa</th>
                      <th className="py-3 px-4">Kapan Diterima?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-900 text-xs">
                    <tr>
                      <td className="font-mono font-bold text-emerald-700 py-3 px-4">message.received</td>
                      <td className="font-medium py-3 px-4">Pesan teks, gambar, atau dokumen masuk dari pelanggan.</td>
                      <td className="text-slate-600 py-3 px-4">Saat user membalas chat WhatsApp Anda.</td>
                    </tr>
                    <tr>
                      <td className="font-mono font-bold text-sky-700 py-3 px-4">message.delivered</td>
                      <td className="font-medium py-3 px-4">Laporan status pesan telah diterima di perangkat penerima (Centang Dua).</td>
                      <td className="text-slate-600 py-3 px-4">Setelah pesan sukses terkirim dan sampai di HP penerima.</td>
                    </tr>
                    <tr>
                      <td className="font-mono font-bold text-indigo-700 py-3 px-4">message.read</td>
                      <td className="font-medium py-3 px-4">Laporan status pesan telah dibaca/dibuka (Centang Biru).</td>
                      <td className="text-slate-600 py-3 px-4">Saat penerima membuka chat WhatsApp.</td>
                    </tr>
                    <tr>
                      <td className="font-mono font-bold text-teal-700 py-3 px-4">device.connected</td>
                      <td className="font-medium py-3 px-4">Koneksi nomor WhatsApp aktif dan siap digunakan.</td>
                      <td className="text-slate-600 py-3 px-4">Saat QR code berhasil discan atau sesi tersambung kembali.</td>
                    </tr>
                    <tr>
                      <td className="font-mono font-bold text-rose-700 py-3 px-4">device.disconnected</td>
                      <td className="font-medium py-3 px-4">Perangkat WhatsApp logout, HP mati, atau kehilangan koneksi internet.</td>
                      <td className="text-slate-600 py-3 px-4">Segera saat socket WhatsApp terputus.</td>
                    </tr>
                    <tr>
                      <td className="font-mono font-bold text-amber-700 py-3 px-4">blacklist.opt_out</td>
                      <td className="font-medium py-3 px-4">Kontak membalas kata kunci <code>STOP</code> atau <code>UNSUB</code>.</td>
                      <td className="text-slate-600 py-3 px-4">Nomor otomatis dimasukkan ke Blacklist & DND.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payload JSON Example */}
            <div className="space-y-3">
              <h4 className="font-bold text-base text-slate-950 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-600" /> Contoh Struktur Payload JSON (Event: message.received):
              </h4>
              <div className="mockup-code bg-slate-900 text-slate-100 text-sm p-4 rounded-xl font-mono shadow-inner">
                <pre><code>{`{
  "event": "message.received",
  "timestamp": "2026-09-06T15:25:00.120Z",
  "data": {
    "messageId": "msg_981726351271",
    "deviceId": "dev_01_support",
    "from": "6281234567890",
    "pushName": "Budi Santoso",
    "messageType": "text",
    "message": "Halo kak, saya mau tanya harga paket langganannya?",
    "isGroup": false
  }
}`}</code></pre>
              </div>
            </div>

            {/* Signature Verification Code Switcher */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-bold text-base text-slate-950 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verifikasi Keamanan Header HMAC-SHA256:
                </h4>
                <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold gap-1 self-start sm:self-auto">
                  {(["nodejs", "php", "python"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedWebhookLang(lang)}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        selectedWebhookLang === lang
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {lang === "nodejs" ? "Node.js (Express)" : lang === "php" ? "PHP (Laravel / Native)" : "Python (FastAPI)"}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-600">
                Setiap webhook request menyertakan header <code>X-Sendora-Signature</code>. Gunakan Webhook Secret Anda untuk memastikan request benar-benar berasal dari server resmi Sendora.
              </p>

              <div className="relative">
                <div className="mockup-code bg-slate-900 text-slate-100 text-sm p-4 rounded-xl font-mono shadow-inner">
                  <pre><code>{snippets.webhookVerify[selectedWebhookLang]}</code></pre>
                </div>
                <button
                  onClick={() => copyCode(snippets.webhookVerify[selectedWebhookLang], "webhook-code")}
                  className="absolute top-3 right-3 btn btn-xs btn-ghost text-slate-400 hover:text-white gap-1 bg-slate-800/80 border border-slate-700"
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
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1.5 shadow-sm">
              <span className="font-extrabold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Best Practice & Standar Response:
              </span>
              <ul className="list-disc list-inside space-y-1 text-emerald-800 font-medium">
                <li>Server Anda <b>wajib merespon dengan status HTTP 200</b> dalam waktu maksimal 5 detik agar event dianggap berhasil dikirim.</li>
                <li>Jika server endpoint Anda mengembalikan status 5xx atau timeout, sistem retry otomatis Sendora akan mencoba mengirim ulang hingga 3 kali dengan jeda eksponensial.</li>
              </ul>
            </div>
          </section>

          {/* 9. Rate Limits */}
          <section id="rate-limits" className="space-y-5 scroll-mt-24 border-t border-slate-200 pt-10">
            <h2 className="text-2xl font-black flex items-center gap-2.5 text-slate-950">
              <Clock className="w-6 h-6 text-emerald-600" /> 9. Rate Limits & Kuota Paket
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
              <table className="table table-sm text-sm">
                <thead className="bg-slate-100 text-slate-950 font-black border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Paket</th>
                    <th className="py-3 px-4">Batas Request / Menit</th>
                    <th className="py-3 px-4">Maksimal Devices</th>
                    <th className="py-3 px-4">Kuota Bulanan</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-sm divide-y divide-slate-200 text-slate-900">
                  <tr>
                    <td className="font-bold py-3 px-4">Free Trial</td>
                    <td className="py-3 px-4">10 req / min</td>
                    <td className="py-3 px-4">1 Device</td>
                    <td className="py-3 px-4">100 pesan</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-sky-700 py-3 px-4">Starter</td>
                    <td className="py-3 px-4">60 req / min</td>
                    <td className="py-3 px-4">2 Devices</td>
                    <td className="py-3 px-4">5.000 pesan</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-emerald-700 py-3 px-4">Business</td>
                    <td className="py-3 px-4">300 req / min</td>
                    <td className="py-3 px-4">5 Devices</td>
                    <td className="py-3 px-4">25.000 pesan</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-indigo-700 py-3 px-4">Pro Unlimited</td>
                    <td className="py-3 px-4">1.000 req / min</td>
                    <td className="py-3 px-4">10 Devices</td>
                    <td className="py-3 px-4">100.000 pesan</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 10. Errors */}
          <section id="errors" className="space-y-5 scroll-mt-24 border-t border-slate-200 pt-10 pb-20">
            <h2 className="text-2xl font-black flex items-center gap-2.5 text-slate-950">
              <AlertCircle className="w-6 h-6 text-emerald-600" /> 10. Error Codes & Troubleshooting
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
              <table className="table table-sm text-sm">
                <thead className="bg-slate-100 text-slate-950 font-black border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Status Code</th>
                    <th className="py-3 px-4">Penyebab Error</th>
                    <th className="py-3 px-4">Solusi</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-sm divide-y divide-slate-200 text-slate-900">
                  <tr>
                    <td className="font-bold text-rose-600 py-3 px-4">400 Bad Request</td>
                    <td className="font-sans text-slate-800 py-3 px-4">Format nomor salah atau parameter wajib kosong.</td>
                    <td className="font-sans text-slate-800 py-3 px-4">Pastikan format nomor diawali kode negara seperti <code>62812xxx</code>.</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-rose-600 py-3 px-4">401 Unauthorized</td>
                    <td className="font-sans text-slate-800 py-3 px-4">API Key tidak valid atau header authorization hilang.</td>
                    <td className="font-sans text-slate-800 py-3 px-4">Periksa kembali API Key di dashboard Sendora.</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-rose-600 py-3 px-4">404 Not Found</td>
                    <td className="font-sans text-slate-800 py-3 px-4">Tidak ada WhatsApp device aktif yang terhubung.</td>
                    <td className="font-sans text-slate-800 py-3 px-4">Scan QR Code di menu WhatsApp Devices pada dashboard.</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-rose-600 py-3 px-4">429 Rate Limit</td>
                    <td className="font-sans text-slate-800 py-3 px-4">Melampaui batas kecepatan request paket Anda.</td>
                    <td className="font-sans text-slate-800 py-3 px-4">Tambahkan jeda request atau upgrade paket Anda.</td>
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
