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
  Users,
  Flame,
  Radio,
  FileText,
  Bot,
  Ban,
  CreditCard,
  LifeBuoy,
  Sparkles,
  Lock,
  Package,
  Tag,
  Headphones,
} from "lucide-react";

type CodeLang = "curl" | "nodejs" | "python" | "php";

export default function PublicDocsPage() {
  const [selectedLang, setSelectedLang] = useState<CodeLang>("curl");
  const [selectedBroadcastLang, setSelectedBroadcastLang] = useState<CodeLang>("curl");
  const [selectedTemplateLang, setSelectedTemplateLang] = useState<CodeLang>("curl");
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
    { id: "devices", label: "3. WhatsApp Device & Multi-Device", icon: Smartphone },
    { id: "warmup", label: "4. Warmup Device Anti-Ban", icon: Flame },
    { id: "send-message", label: "5. Kirim Pesan (Send API)", icon: Send },
    { id: "spintax", label: "6. Spintax & Variabel Dinamis", icon: Sparkles },
    { id: "broadcast", label: "7. Broadcast Campaigns Massal", icon: Radio },
    { id: "contacts", label: "8. Buku Kontak & Grup", icon: Users },
    { id: "templates", label: "9. Pustaka Template Pesan", icon: FileText },
    { id: "automation", label: "10. Auto-Reply & Bot Chat", icon: Bot },
    { id: "blacklist", label: "11. Blacklist & Opt-Out DND", icon: Ban },
    { id: "webhooks", label: "12. Webhooks & HMAC Signature", icon: Webhook },
    { id: "billing", label: "13. Billing, Kuota & Voucher", icon: CreditCard },
    { id: "support", label: "14. Pusat Bantuan (Tickets)", icon: LifeBuoy },
    { id: "rate-limits", label: "15. Rate Limits & Kuota", icon: Clock },
    { id: "errors", label: "16. Error Codes & Solusi", icon: AlertCircle },
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
    templateSend: {
      curl: `curl -X POST ${originUrl}/api/v1/messages/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer snd_live_YOUR_API_KEY" \\
  -d '{
    "to": "6281234567890",
    "template": "tpl_order_notif",
    "deviceId": "auto_rotate",
    "variables": {
      "name": "Budi Santoso",
      "order_id": "INV-2026-9812",
      "eta": "Besok Siang"
    }
  }'`,
      nodejs: `import axios from "axios";

// Kirim pesan WhatsApp menggunakan Shortcode Template
const response = await axios.post(
  "${originUrl}/api/v1/messages/send",
  {
    to: "6281234567890",
    template: "tpl_order_notif", // Shortcode template dari menu Templates
    deviceId: "auto_rotate",
    variables: {
      name: "Budi Santoso",
      order_id: "INV-2026-9812",
      eta: "Besok Siang",
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
    "template": "tpl_order_notif",  # Shortcode template
    "deviceId": "auto_rotate",
    "variables": {
        "name": "Budi Santoso",
        "order_id": "INV-2026-9812",
        "eta": "Besok Siang"
    }
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
      php: `<?php
use Illuminate\\Support\\Facades\\Http;

// Kirim WhatsApp via Template menggunakan Laravel Http Client
\$response = Http::withToken('snd_live_YOUR_API_KEY')
    ->post('${originUrl}/api/v1/messages/send', [
        'to' => '6281234567890',
        'template' => 'tpl_order_notif', // Shortcode template
        'deviceId' => 'auto_rotate',
        'variables' => [
            'name' => 'Budi Santoso',
            'order_id' => 'INV-2026-9812',
            'eta' => 'Besok Siang'
        ]
    ]);

echo \$response->body();
?>`,
    },
    broadcast: {
      curl: `curl -X POST ${originUrl}/api/broadcast \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer snd_live_YOUR_API_KEY" \\
  -d '{
    "name": "Promo Weekend Spesial 30%",
    "messageTemplate": "{Halo|Hai|Selamat siang} {{name}}, dapatkan diskon 30% hari ini dengan kode {{kode}}!",
    "batchSize": 10,
    "batchDelaySec": 60,
    "minDelaySec": 4,
    "maxDelaySec": 8,
    "recipients": [
      { "phoneNumber": "6281234567890", "name": "Budi Santoso", "variables": { "kode": "SENDORA30" } },
      { "phoneNumber": "6285712345678", "name": "Siti Rahma", "variables": { "kode": "SENDORA30" } }
    ]
  }'`,
      nodejs: `import axios from "axios";

// 1. Buat Kampanye Broadcast
const createRes = await axios.post(
  "${originUrl}/api/broadcast",
  {
    name: "Promo Weekend Spesial 30%",
    messageTemplate: "{Halo|Hai|Selamat siang} {{name}}, nikmati promo diskon spesial!",
    batchSize: 10,
    batchDelaySec: 60,
    minDelaySec: 4,
    maxDelaySec: 8,
    recipients: [
      { phoneNumber: "6281234567890", name: "Budi Santoso" },
      { phoneNumber: "6285712345678", name: "Siti Rahma" }
    ],
  },
  {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer snd_live_YOUR_API_KEY",
    },
  }
);

const campaignId = createRes.data.data.id;

// 2. Jalankan Antrean Broadcast di Background
await axios.post(
  \`${originUrl}/api/broadcast/\${campaignId}/start\`,
  {},
  { headers: { Authorization: "Bearer snd_live_YOUR_API_KEY" } }
);

console.log("Broadcast dimulai:", campaignId);`,
      python: `import requests

# 1. Buat Kampanye Broadcast
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer snd_live_YOUR_API_KEY",
}
payload = {
    "name": "Promo Weekend Spesial 30%",
    "messageTemplate": "{Halo|Hai|Selamat siang} {{name}}, dapatkan promo hemat hari ini!",
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

# 2. Jalankan Broadcast
requests.post(f"${originUrl}/api/broadcast/{campaign_id}/start", headers=headers)
print("Broadcast running:", campaign_id)`,
      php: `<?php
$headers = [
    "Content-Type": "application/json",
    "Authorization": "Bearer snd_live_YOUR_API_KEY"
];

// 1. Buat Kampanye
$curl = curl_init("${originUrl}/api/broadcast");
curl_setopt($curl, CURLOPT_POST, true);
curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode([
    "name" => "Promo Weekend Spesial 30%",
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

// 2. Start Broadcast
$curlStart = curl_init("${originUrl}/api/broadcast/" . $campaignId . "/start");
curl_setopt($curlStart, CURLOPT_POST, true);
curl_setopt($curlStart, CURLOPT_HTTPHEADER, $headers);
curl_setopt($curlStart, CURLOPT_RETURNTRANSFER, true);
curl_exec($curlStart);
curl_close($curlStart);
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

  if (signature !== expectedSignature && signature !== \`sha256=\${expectedSignature}\`) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { event, data } = req.body;
  console.log("Event diterima:", event);

  // 2. Tangani event pesan masuk
  if (event === "message.received") {
    console.log(\`Chat masuk dari \${data.sender?.number}: \${data.text}\`);
  }

  // 3. Selalu respon 200 OK
  return res.status(200).json({ status: "received" });
});`,
      php: `<?php
$rawPayload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_SENDORA_SIGNATURE'] ?? '';
$webhookSecret = getenv('SENDORA_WEBHOOK_SECRET');

// 1. Verifikasi HMAC-SHA256 signature
$expectedSignature = hash_hmac('sha256', $rawPayload, $webhookSecret);

if (!hash_equals($expectedSignature, str_replace('sha256=', '', $signature))) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid signature"]);
    exit;
}

$payload = json_decode($rawPayload, true);
$event = $payload['event'] ?? '';
$data = $payload['data'] ?? [];

// 2. Tangani event pesan masuk
if ($event === 'message.received') {
    $sender = $data['sender']['number'] ?? '';
    $message = $data['text'] ?? '';
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
    signature = request.headers.get("x-sendora-signature", "").replace("sha256=", "")
    
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
        print(f"Chat dari {data.get('sender', {}).get('number')}: {data.get('text')}")
        
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
        {/* Left Sticky Sidebar (ScrollSpy Highlight - Hidden on Mobile) */}
        <aside className="hidden md:block md:w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            <div className="px-4 py-3 bg-white rounded-2xl border border-slate-200/90 flex items-center justify-between shadow-xs">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-600" /> Dokumentasi Lengkap
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                v1.2 Active
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
                Uji coba kirim pesan & panggil REST API langsung dari browser melalui Developer Playground.
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
              <span className="text-slate-900 font-bold">Dokumentasi Fitur & API</span>
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
                Dashboard
              </Link>
            </div>
          </div>

          {/* 1. Intro */}
          <section id="intro" className="space-y-4 scroll-mt-24">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <Zap className="w-3.5 h-3.5 text-emerald-600" /> Panduan Lengkap Platform
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              Dokumentasi Fitur & REST API Sendora
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed font-normal">
              Sendora adalah platform WhatsApp Gateway & Customer Engagement multi-tenant berperforma tinggi. Sendora dilengkapi kemampuan pengiriman pesan otomatis (OTP & invoice), kampanye broadcast anti-ban dengan throttling pintar, rotasi multi-device otomatis, auto-reply bot, pustaka template spintax, serta webhook event real-time.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
                <span className="text-slate-500 font-semibold block mb-1">Host / Base URL:</span>
                <code className="font-bold text-emerald-700 text-xs break-all">{originUrl}</code>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
                <span className="text-slate-500 font-semibold block mb-1">Format Data:</span>
                <span className="font-bold font-mono text-slate-900 text-xs">application/json</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
                <span className="text-slate-500 font-semibold block mb-1">Kecepatan Gateway:</span>
                <span className="font-bold text-emerald-600 font-mono text-xs">&lt; 1 detik / pesan</span>
              </div>
            </div>

            {/* Base URL & Endpoint Path Guide */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 font-bold text-xs">
                    URL
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Struktur Base URL &amp; Direktori Endpoint</h3>
                    <p className="text-xs text-slate-500 font-normal">Gabungkan Host Server dengan Endpoint Path tujuan</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-mono border border-slate-200">
                  <span className="font-semibold text-slate-900">Full URL</span> = Base URL + Endpoint Path
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Base URL adalah alamat host domain utama server Anda (<code className="font-semibold text-emerald-700 bg-emerald-50/80 px-1.5 py-0.5 rounded border border-emerald-200/60 font-mono text-xs">{originUrl}</code>). Saat melakukan request dari aplikasi (Axios, cURL, Fetch, PHP), sambungkan Base URL dengan <b>Endpoint Path</b> fitur terkait:
              </p>

              {/* Desktop Table View (>= md screens) */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/90 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 w-20">Method</th>
                      <th className="py-2.5 px-3">Endpoint Path</th>
                      <th className="py-2.5 px-3">Full URL Contoh</th>
                      <th className="py-2.5 px-3">Fungsi Utama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] font-mono">POST</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">/api/v1/messages/send</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] break-all">{originUrl}/api/v1/messages/send</td>
                      <td className="py-2.5 px-3 text-slate-600 font-normal">Kirim pesan teks, media, atau template</td>
                    </tr>
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-bold text-[10px] font-mono">GET</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">/api/v1/templates</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] break-all">{originUrl}/api/v1/templates</td>
                      <td className="py-2.5 px-3 text-slate-600 font-normal">Ambil daftar shortcode template milik akun</td>
                    </tr>
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] font-mono">POST</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">/api/broadcast</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] break-all">{originUrl}/api/broadcast</td>
                      <td className="py-2.5 px-3 text-slate-600 font-normal">Buat kampanye broadcast pesan massal</td>
                    </tr>
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] font-mono">POST</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">/api/broadcast/&#123;id&#125;/start</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] break-all">{originUrl}/api/broadcast/&#123;id&#125;/start</td>
                      <td className="py-2.5 px-3 text-slate-600 font-normal">Mulai/jalankan pengiriman broadcast</td>
                    </tr>
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-bold text-[10px] font-mono">GET</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">/api/contacts</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] break-all">{originUrl}/api/contacts</td>
                      <td className="py-2.5 px-3 text-slate-600 font-normal">Ambil atau simpan data kontak penerima</td>
                    </tr>
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-bold text-[10px] font-mono">GET</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">/api/gateway/sessions</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] break-all">{originUrl}/api/gateway/sessions</td>
                      <td className="py-2.5 px-3 text-slate-600 font-normal">Cek status koneksi perangkat WhatsApp</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile Reflow Card List (< md screens) */}
              <div className="grid grid-cols-1 gap-2.5 md:hidden">
                {[
                  {
                    method: "POST",
                    methodColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    path: "/api/v1/messages/send",
                    desc: "Kirim pesan teks, media, atau template",
                  },
                  {
                    method: "GET",
                    methodColor: "bg-sky-50 text-sky-700 border-sky-200",
                    path: "/api/v1/templates",
                    desc: "Ambil daftar shortcode template milik akun",
                  },
                  {
                    method: "POST",
                    methodColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    path: "/api/broadcast",
                    desc: "Buat kampanye broadcast pesan massal",
                  },
                  {
                    method: "POST",
                    methodColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    path: "/api/broadcast/{id}/start",
                    desc: "Mulai/jalankan pengiriman broadcast",
                  },
                  {
                    method: "GET",
                    methodColor: "bg-sky-50 text-sky-700 border-sky-200",
                    path: "/api/contacts",
                    desc: "Ambil atau simpan data kontak penerima",
                  },
                  {
                    method: "GET",
                    methodColor: "bg-sky-50 text-sky-700 border-sky-200",
                    path: "/api/gateway/sessions",
                    desc: "Cek status koneksi perangkat WhatsApp",
                  },
                ].map((ep) => (
                  <div key={ep.path} className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold ${ep.methodColor}`}>
                        {ep.method}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-900 break-all">{ep.path}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-normal leading-normal">{ep.desc}</p>
                    <div className="pt-1">
                      <code className="block text-[11px] font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 break-all">
                        {originUrl}{ep.path}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 2. Authentication */}
          <section id="auth" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <KeyRound className="w-5 h-5 text-emerald-600" /> 2. Autentikasi & API Key
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Setiap request ke REST API Sendora wajib menyertakan <b>API Key</b> pada Header HTTP dengan format standar:
            </p>

            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-700">Header Authorization (Standar):</span>
              <div className="bg-slate-900 text-emerald-400 text-xs rounded-xl p-3.5 font-mono border border-slate-800 shadow-inner overflow-x-auto">
                <code>Authorization: Bearer snd_live_948f928c2e1739f8bc20a</code>
              </div>

              <span className="text-xs font-bold text-slate-700 pt-1 block">Alternatif Custom Header:</span>
              <div className="bg-slate-900 text-emerald-400 text-xs rounded-xl p-3.5 font-mono border border-slate-800 shadow-inner overflow-x-auto">
                <code>X-API-Key: snd_live_948f928c2e1739f8bc20a</code>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-900">Keamanan Multi-Tenant:</span> API Key Anda terenkripsi dengan SHA-256 dan terikat strictly ke akun Anda. Anda dapat membuat beberapa API Key terpisah untuk staging dan production di menu <b className="font-semibold text-emerald-950">Dashboard &gt; API Keys</b>.
              </div>
            </div>
          </section>

          {/* 3. Devices & Multi-Device */}
          <section id="devices" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <Smartphone className="w-5 h-5 text-emerald-600" /> 3. WhatsApp Device & Multi-Device Rotasi
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Sendora menghubungkan nomor WhatsApp bisnis Anda menggunakan socket resmi Baileys tanpa memerlukan emulator.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 block">1. Scan QR Instan</span>
                <p className="text-slate-600 text-[11px]">Buka WhatsApp di HP &gt; Perangkat Tertaut &gt; Scan QR di menu Devices.</p>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 block">2. Status Real-Time</span>
                <p className="text-slate-600 text-[11px]">Memantau status koneksi CONNECTED, PAIRING, atau DISCONNECTED.</p>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 block">3. Multi-Device Rotation</span>
                <p className="text-slate-600 text-[11px]">Kirim dengan <code className="bg-slate-100 px-1 py-0.5 rounded">deviceId: "auto_rotate"</code> untuk rotasi Round-Robin.</p>
              </div>
            </div>
          </section>

          {/* 4. Device Warmup */}
          <section id="warmup" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <Flame className="w-5 h-5 text-amber-500" /> 4. Warmup Device & Panduan Anti-Ban
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Nomor WhatsApp baru atau nomor yang baru saja didaftarkan sangat rentan diblokir oleh algoritma WhatsApp jika langsung mengirim ribuan pesan. Gunakan fitur <Link href="/dashboard/devices/warmup" className="text-emerald-700 font-semibold underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800">Device Warmup</Link> untuk membangun reputasi nomor secara bertahap:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-2.5 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    Minggu ke-1
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fase Pengenalan</span>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 tracking-tight">20 - 50 <span className="text-xs font-normal text-slate-500">pesan / hari</span></div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Fokus interaksi 2 arah dengan kontak yang sudah saling menyimpan nomor kontak. Hindari broadcast ke nomor asing.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-2.5 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                    Minggu ke-2
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fase Peningkatan</span>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 tracking-tight">100 - 200 <span className="text-xs font-normal text-slate-500">pesan / hari</span></div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mulai kirim ke pelanggan umum. Wajib aktifkan <span className="font-semibold text-slate-800">Spintax Engine</span> dan beri jeda delay 5-10 detik.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-2.5 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Minggu ke-3+
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fase Skala Penuh</span>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 tracking-tight">1.000+ <span className="text-xs font-normal text-slate-500">pesan / hari</span></div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nomor telah memiliki reputasi kuat. Kampanye massal aman dengan sistem <span className="font-semibold text-slate-800">Batch Throttling</span> Sendora.
                </p>
              </div>
            </div>
          </section>

          {/* 5. Send Message API */}
          <section id="send-message" className="space-y-5 scroll-mt-24 border-t border-slate-200 pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
                <Send className="w-5 h-5 text-emerald-600" /> 5. Kirim Pesan (Direct Send API)
              </h2>
              <span className="bg-emerald-50 text-emerald-700 font-mono text-xs px-2.5 py-1 rounded-lg font-bold border border-emerald-200 self-start sm:self-auto">
                POST /api/v1/messages/send
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Endpoint utama untuk mengirim pesan WhatsApp transaksional (OTP, notifikasi pesanan, invoice tagihan) ke nomor pelanggan secara otomatis.
            </p>

            {/* Architecture Explainer: 2-Card Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" /> Nomor Pengirim
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Otomatis
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <b>Tidak perlu ditulis di kode</b>. Nomor pengirim otomatis ditentukan dari akun WhatsApp yang telah Anda scan di menu <Link href="/dashboard/devices" className="text-emerald-700 font-semibold underline decoration-emerald-300 hover:text-emerald-800">Devices</Link>. Cukup gunakan <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-800">deviceId: "auto_rotate"</code>.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-sky-600" /> Nomor Penerima (<code className="font-mono text-slate-800">to</code>)
                  </span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                    Wajib Dinamis
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <b>Wajib diisi</b> dengan nomor WhatsApp pelanggan Anda secara dinamis dari database/aplikasi Anda (format internasional diawali <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-800">628...</code> tanpa spasi atau simbol <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">+</code>).
                </p>
              </div>
            </div>

            {/* Code Snippet Tabs */}
            <div className="bg-slate-50 p-4 sm:p-5 border border-slate-200 rounded-2xl">
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
                  onClick={() => copyCode(snippets.send[selectedLang], "send-code")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedSection === "send-code" ? (
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
                <pre>{snippets.send[selectedLang]}</pre>
              </div>
            </div>

            {/* Request Body Parameters Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Spesifikasi Parameter Request (JSON Body):
              </h3>

              {/* Desktop / Tablet Table View */}
              <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-2xl shadow-xs bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 w-28 whitespace-nowrap">Parameter</th>
                      <th className="px-4 py-3 w-24 whitespace-nowrap">Tipe Data</th>
                      <th className="px-4 py-3 w-24 whitespace-nowrap">Status</th>
                      <th className="px-4 py-3">Keterangan &amp; Contoh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-900">
                    <tr className="hover:bg-slate-50/50">
                      <td className="font-mono font-bold text-emerald-700 px-4 py-3 whitespace-nowrap">to</td>
                      <td className="font-mono text-slate-500 px-4 py-3">string</td>
                      <td className="px-4 py-3"><span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">Wajib</span></td>
                      <td className="px-4 py-3 text-slate-600 leading-relaxed">
                        <b>Nomor WhatsApp Penerima (Pelanggan)</b>. Wajib format internasional (contoh: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">6281234567890</code>). Diisi variabel dinamis dari database/sistem Anda.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="font-mono font-bold text-emerald-700 px-4 py-3 whitespace-nowrap">message</td>
                      <td className="font-mono text-slate-500 px-4 py-3">string</td>
                      <td className="px-4 py-3"><span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">Wajib</span></td>
                      <td className="px-4 py-3 text-slate-600 leading-relaxed">
                        Isi pesan WhatsApp. Mendukung Spintax <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">{"{Halo|Hai}"}</code> dan variabel <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">{"{{name}}"}</code>.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="font-mono font-bold text-emerald-700 px-4 py-3 whitespace-nowrap">deviceId</td>
                      <td className="font-mono text-slate-500 px-4 py-3">string</td>
                      <td className="px-4 py-3"><span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">Opsional</span></td>
                      <td className="px-4 py-3 text-slate-600 leading-relaxed">
                        ID WhatsApp Device pengirim. Gunakan <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800 font-bold">"auto_rotate"</code> (rekomendasi) agar Sendora otomatis merotasi nomor WhatsApp aktif Anda.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="font-mono font-bold text-emerald-700 px-4 py-3 whitespace-nowrap">variables</td>
                      <td className="font-mono text-slate-500 px-4 py-3">object</td>
                      <td className="px-4 py-3"><span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">Opsional</span></td>
                      <td className="px-4 py-3 text-slate-600 leading-relaxed">
                        Key-Value pasangan data pengganti tag variabel (contoh: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">{`{"name": "Budi", "order_id": "INV-001"}`}</code>).
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Reflow View */}
              <div className="block sm:hidden space-y-2.5">
                <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <code className="font-mono font-bold text-emerald-700 text-xs">to</code>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md">Wajib</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <b>Nomor Penerima (Pelanggan)</b>. Format internasional <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">628...</code> dari database/aplikasi Anda.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <code className="font-mono font-bold text-emerald-700 text-xs">message</code>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md">Wajib</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Isi teks pesan. Mendukung Spintax <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">{"{Halo|Hai}"}</code> &amp; variabel <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">{"{{name}}"}</code>.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <code className="font-mono font-bold text-emerald-700 text-xs">deviceId</code>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">Opsional</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Device pengirim. Rekomendasi: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800 font-bold">"auto_rotate"</code> untuk rotasi otomatis.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <code className="font-mono font-bold text-emerald-700 text-xs">variables</code>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">Opsional</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Data dinamis untuk mengganti placeholder variabel di dalam teks pesan.
                  </p>
                </div>
              </div>
            </div>

            {/* Real-world Use Cases Guide */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Contoh Kasus Integrasi Nyata:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-2.5 shadow-xs">
                  <span className="text-xs font-bold text-emerald-800 block">
                    1. Pengiriman Kode OTP Login (Node.js)
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Kirim kode 6-digit ke nomor yang diinput user saat login:
                  </p>
                  <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto">
                    <pre>{`const res = await axios.post(
  "${originUrl}/api/v1/messages/send",
  {
    to: req.body.phone,
    message: "Kode OTP Anda: *{{otp}}*.",
    deviceId: "auto_rotate",
    variables: { otp: "492810" }
  },
  { 
    headers: { 
      Authorization: "Bearer " + API_KEY 
    } 
  }
);`}</pre>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-2.5 shadow-xs">
                  <span className="text-xs font-bold text-sky-800 block">
                    2. Notifikasi Tagihan Pesanan (PHP)
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Kirim tagihan otomatis setelah checkout dari database toko:
                  </p>
                  <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto">
                    <pre>{`$res = Http::withToken($apiKey)->post(
  "${originUrl}/api/v1/messages/send",
  [
    "to" => $order->customer_phone,
    "message" => "Halo {{name}}, tagihan Rp {{total}} terbit.",
    "deviceId" => "auto_rotate",
    "variables" => [
      "name" => $order->customer_name,
      "total" => "150.000",
      "inv" => (string)$order->id
    ]
  ]
);`}</pre>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Spintax */}
          <section id="spintax" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <Sparkles className="w-5 h-5 text-emerald-600" /> 6. Spintax Engine & Variabel Dinamis
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Spintax adalah teknik variasi kata acak untuk mencegah sistem spam WhatsApp mendeteksi kesamaan teks:
            </p>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
              <code>{`{Halo|Hai|Selamat siang} {{name}}, pesanan #{order_id} Anda {sedang diproses|sudah dikemas}!`}</code>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-emerald-700 block">Variasi Hasil 1:</span>
                <p className="text-slate-600 italic">"Halo Budi Santoso, pesanan #INV-01 Anda sedang diproses!"</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-sky-700 block">Variasi Hasil 2:</span>
                <p className="text-slate-600 italic">"Selamat siang Siti Rahma, pesanan #INV-02 Anda sudah dikemas!"</p>
              </div>
            </div>
          </section>

          {/* 7. Broadcast Campaigns */}
          <section id="broadcast" className="space-y-5 scroll-mt-24 border-t border-slate-200 pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
                <Radio className="w-5 h-5 text-emerald-600" /> 7. Broadcast Campaigns & Anti-Ban Throttling
              </h2>
              <span className="bg-emerald-50 text-emerald-700 font-mono text-xs px-2.5 py-1 rounded-lg font-bold border border-emerald-200 self-start sm:self-auto">
                POST /api/broadcast
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Kirim pesan massal ke ribuan penerima dengan aman menggunakan sistem <b>Safety Throttling</b> dan <b>Batch Cooldown</b> bawaan Sendora:
            </p>

            {/* Broadcast Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 block">Random Message Delay</span>
                <p className="text-slate-600 text-[11px]">Jeda acak antar pesan (misal 4 - 8 detik) sehingga pola pengiriman mirip manusia asli.</p>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 block">Batch Cooldown Delay</span>
                <p className="text-slate-600 text-[11px]">Setelah mengirim 1 batch (misal 10 pesan), sistem istirahat selama 30 - 60 detik.</p>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 block">Auto Blacklist Filter</span>
                <p className="text-slate-600 text-[11px]">Nomor yang terdaftar di Blacklist dilewati otomatis (<code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono font-bold">SKIPPED_BLACKLIST</code>) tanpa gagal.</p>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 block">Real-time Controls</span>
                <p className="text-slate-600 text-[11px]">Tersedia kontrol <b>Pause</b>, <b>Resume</b>, dan <b>Cancel</b> saat kampanye berjalan di background.</p>
              </div>
            </div>

            {/* Broadcast Code Snippet */}
            <div className="bg-slate-50 p-4 sm:p-5 border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap gap-1">
                  {(["curl", "nodejs", "python", "php"] as CodeLang[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedBroadcastLang(lang)}
                      className={`px-3 py-1 text-xs uppercase font-mono rounded-lg font-semibold transition-all cursor-pointer border ${
                        selectedBroadcastLang === lang
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => copyCode(snippets.broadcast[selectedBroadcastLang], "broadcast-code")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedSection === "broadcast-code" ? (
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
                <pre>{snippets.broadcast[selectedBroadcastLang]}</pre>
              </div>
            </div>
          </section>

          {/* 8. Contacts */}
          <section id="contacts" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <Users className="w-5 h-5 text-emerald-600" /> 8. Buku Kontak & Segmentasi Grup
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Kelola database pelanggan Anda di menu <Link href="/dashboard/contacts" className="text-emerald-700 font-semibold underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800">Buku Kontak</Link>:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-slate-700 space-y-1.5">
              <li><b>Import Bulk (CSV/Excel)</b>: Masukkan ratusan nomor sekaligus via endpoint <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs">/api/contacts/import</code>.</li>
              <li><b>Grup Kontak</b>: Segmentasikan pelanggan menjadi grup seperti Pelanggan VIP, Leads Baru, Reseller.</li>
              <li><b>Custom Variables</b>: Tambahkan variabel dinamis per kontak (kota, saldo, invoice, resi).</li>
            </ul>
          </section>

          {/* 9. Templates */}
          <section id="templates" className="space-y-5 scroll-mt-24 border-t border-slate-200 pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
                <FileText className="w-5 h-5 text-emerald-600" /> 9. Pustaka Template Pesan & Integrasi API
              </h2>
              <span className="bg-emerald-50 text-emerald-700 font-mono text-xs px-2.5 py-1 rounded-lg font-bold border border-emerald-200 self-start sm:self-auto">
                POST /api/v1/messages/send
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Simpan format pesan siap pakai di menu <Link href="/dashboard/templates" className="text-emerald-700 font-semibold underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800">Templates</Link>. Client dapat langsung memanggil template di aplikasi backend mereka menggunakan <b>Shortcode</b> tanpa perlu menulis ulang seluruh isi pesan di kode program.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl flex items-center gap-2.5 font-semibold text-slate-800 shadow-xs">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <Lock className="w-4 h-4" />
                </div>
                <span>OTP Verifikasi</span>
              </div>
              <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl flex items-center gap-2.5 font-semibold text-slate-800 shadow-xs">
                <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
                  <Package className="w-4 h-4" />
                </div>
                <span>Notifikasi Order</span>
              </div>
              <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl flex items-center gap-2.5 font-semibold text-slate-800 shadow-xs">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                  <Tag className="w-4 h-4" />
                </div>
                <span>Promo Diskon</span>
              </div>
              <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl flex items-center gap-2.5 font-semibold text-slate-800 shadow-xs">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                  <Headphones className="w-4 h-4" />
                </div>
                <span>CS Support</span>
              </div>
            </div>

            {/* Visual Screenshot Example Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600" />
                  Contoh Pengaturan Shortcode & Variabel di Menu Templates:
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                  Dashboard &gt; Templates
                </span>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex justify-center p-1 sm:p-2">
                <img
                  src="/docs-template-shortcode.png"
                  alt="Contoh Pengisian Shortcode Template Pesan di Dashboard Sendora"
                  className="w-full max-w-2xl h-auto object-contain rounded-lg shadow-xs"
                />
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Kotak merah pada gambar di atas menunjukkan <b>Shortcode</b> (<code className="bg-slate-100 text-emerald-800 font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200">tpl_order_notif</code>) yang digunakan sebagai nilai parameter <code className="bg-slate-100 text-slate-800 font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200">"template"</code> pada payload JSON API di bawah ini.
              </p>
            </div>

            {/* Cara Kerja Pemanggilan Template */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 text-xs text-emerald-950">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Cara Kerja Pemanggilan Template di Code Client
              </span>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed pt-1">
                <li>Buka menu <b>Templates</b> di dashboard dan buat template (misal Shortcode: <code className="bg-white border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-800">tpl_order_notif</code>).</li>
                <li>Tulis pesan dengan Spintax <code className="bg-white border border-emerald-200 px-1.5 py-0.5 rounded font-mono text-emerald-800 font-semibold">{"{Halo|Hai}"}</code> dan variabel <code className="bg-white border border-emerald-200 px-1.5 py-0.5 rounded font-mono text-emerald-800 font-semibold">{"{{name}}"}</code>, <code className="bg-white border border-emerald-200 px-1.5 py-0.5 rounded font-mono text-emerald-800 font-semibold">{"{{order_id}}"}</code>.</li>
                <li>Pada aplikasi backend Anda, panggil endpoint <code className="bg-white border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-900">/api/v1/messages/send</code> dengan parameter <code className="bg-white border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-900">template: "tpl_order_notif"</code> dan masukkan nilai objek <code className="bg-white border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-900">variables</code>.</li>
                <li>Jika sewaktu-waktu redaksi pesan diubah di dashboard, pesan API akan otomatis terupdate tanpa perlu mengubah kode aplikasi Anda.</li>
              </ol>
            </div>

            {/* Parameters Table for Template Sending */}
            <div className="space-y-3 pt-1">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Parameter Request Body:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <code className="font-mono font-bold text-emerald-700 text-xs">to</code>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md">Wajib</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Nomor WhatsApp tujuan (contoh: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">6281234567890</code>).
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <code className="font-mono font-bold text-emerald-700 text-xs">template</code>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">Shortcode</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Shortcode template dari dashboard (contoh: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-800">"tpl_order_notif"</code>).
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <code className="font-mono font-bold text-emerald-700 text-xs">variables</code>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">Objek JSON</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Data key-value untuk mengisi placeholder (misal: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">name</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">order_id</code>).
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <code className="font-mono font-bold text-emerald-700 text-xs">deviceId</code>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">Opsional</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    ID Device atau <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800 font-bold">"auto_rotate"</code> untuk rotasi acak.
                  </p>
                </div>
              </div>
            </div>

            {/* Template Code Snippet */}
            <div className="bg-slate-50 p-4 sm:p-5 border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap gap-1">
                  {(["curl", "nodejs", "python", "php"] as CodeLang[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedTemplateLang(lang)}
                      className={`px-3 py-1 text-xs uppercase font-mono rounded-lg font-semibold transition-all cursor-pointer border ${
                        selectedTemplateLang === lang
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => copyCode(snippets.templateSend[selectedTemplateLang], "template-code")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedSection === "template-code" ? (
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
                <pre>{snippets.templateSend[selectedTemplateLang]}</pre>
              </div>
            </div>

            {/* Endpoint GET Templates for Client Dropdowns */}
            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-2 text-xs shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-emerald-600" /> Fetch Daftar Template via API (Untuk Dropdown CRM / Web Client)
                </span>
                <span className="bg-slate-100 text-slate-700 font-mono text-[11px] px-2 py-0.5 rounded font-bold">
                  GET /api/v1/templates
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Aplikasi client dapat melakukan request <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">GET {originUrl}/api/v1/templates</code> dengan header <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">Authorization: Bearer YOUR_API_KEY</code> untuk mengambil daftar template aktif yang tersimpan di akun mereka.
              </p>
            </div>
          </section>

          {/* 10. Automation & Auto-Reply */}
          <section id="automation" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <Bot className="w-5 h-5 text-emerald-600" /> 10. Auto-Reply & Bot Otomatisasi
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Atur respon chat instan otomatis di menu <Link href="/dashboard/automation" className="text-emerald-700 font-semibold underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800">Auto Reply</Link>. Mendukung 5 tipe pencocokan kata kunci:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5">
                <span className="font-bold text-emerald-700">CONTAINS</span>
                <p className="text-slate-600">Merespon jika pesan mengandung kata (contoh: "harga", "pricelist").</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5">
                <span className="font-bold text-sky-700">EXACT</span>
                <p className="text-slate-600">Merespon jika pesan sama persis (contoh: "halo", "ping", "menu").</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5">
                <span className="font-bold text-indigo-700">STARTS_WITH</span>
                <p className="text-slate-600">Merespon jika pesan diawali kata tertentu (contoh: "order ", "daftar ").</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5">
                <span className="font-bold text-amber-700">FALLBACK</span>
                <p className="text-slate-600">Pesan penampung jika tidak ada kata kunci yang cocok.</p>
              </div>
            </div>
          </section>

          {/* 11. Blacklist */}
          <section id="blacklist" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <Ban className="w-5 h-5 text-rose-600" /> 11. Blacklist & Auto Opt-Out DND
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Patuhi privasi pelanggan dan hindari blokir nomor dengan manajemen <Link href="/dashboard/blacklist" className="text-emerald-700 font-semibold underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800">Blacklist</Link>:
            </p>
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs space-y-2 text-rose-950">
              <span className="font-bold text-rose-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> Auto Unsubscribe Detection:
              </span>
              <p className="leading-relaxed">
                Saat pelanggan membalas kata kunci seperti <code className="bg-white px-1.5 py-0.5 rounded border border-rose-300 font-bold">STOP</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-rose-300 font-bold">BERHENTI</code>, atau <code className="bg-white px-1.5 py-0.5 rounded border border-rose-300 font-bold">UNSUBSCRIBE</code>, sistem Sendora otomatis memasukkan nomor tersebut ke daftar Blacklist dan melewati pengiriman pesan selanjutnya.
              </p>
            </div>
          </section>

          {/* 12. Webhooks */}
          <section id="webhooks" className="space-y-5 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <Webhook className="w-5 h-5 text-emerald-600" /> 12. Webhooks & HMAC Signature
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Dengarkan event WhatsApp secara real-time ke URL server Anda dengan verifikasi keamanan HMAC SHA-256:
            </p>

            {/* Signature Verification Code Switcher */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Contoh Handler Verifikasi Signature:
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
          </section>

          {/* 13. Billing & Vouchers */}
          <section id="billing" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <CreditCard className="w-5 h-5 text-emerald-600" /> 13. Billing, Paket Langganan & Voucher
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Kelola status paket langganan dan upgrade kuota di menu <Link href="/dashboard/billing" className="text-emerald-700 font-semibold underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800">Billing & Paket</Link>:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 block">Pembayaran Otomatis</span>
                <p className="text-slate-600 text-[11px]">Mendukung GoPay, QRIS, Virtual Account (BCA/Mandiri/BNI/BRI), dan Kartu Kredit via Midtrans Snap.</p>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 block">Kode Voucher Diskon</span>
                <p className="text-slate-600 text-[11px]">Masukkan kode promo voucher saat checkout untuk potongan harga langsung.</p>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 block">Aktivasi Instan</span>
                <p className="text-slate-600 text-[11px]">Kuota pesan dan kapasitas multi-device bertambah otomatis saat pembayaran sukses.</p>
              </div>
            </div>
          </section>

          {/* 14. Support */}
          <section id="support" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <LifeBuoy className="w-5 h-5 text-emerald-600" /> 14. Pusat Bantuan (Support Tickets)
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Jika mengalami kendala teknis atau pertanyaan seputar gateway, buat tiket bantuan di menu <Link href="/dashboard/support" className="text-emerald-700 font-semibold underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800">Bantuan & Support</Link>. Tim teknis Sendora akan membalas langsung di room chat tiket Anda.
            </p>
          </section>

          {/* 15. Rate Limits */}
          <section id="rate-limits" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <Clock className="w-5 h-5 text-emerald-600" /> 15. Rate Limits & Kuota Paket
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

          {/* 16. Errors */}
          <section id="errors" className="space-y-4 scroll-mt-24 border-t border-slate-200 pt-8 pb-16">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
              <AlertCircle className="w-5 h-5 text-emerald-600" /> 16. Error Codes & Solusi
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
