"use client";

import { useState } from "react";
import { Check, Copy, Code2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface CodeSnippet {
  id: string;
  name: string;
  lang: string;
  code: string;
}

const SNIPPETS: CodeSnippet[] = [
  {
    id: "ts",
    name: "TypeScript / Node.js",
    lang: "typescript",
    code: `import axios from "axios";

const waply = axios.create({
  baseURL: "https://ardp.my.id",
  headers: {
    Authorization: "Bearer snd_live_YOUR_API_KEY",
    "Content-Type": "application/json",
  },
});

// Kirim pesan teks / template dengan 1 baris
const response = await waply.post("/api/v1/messages/send", {
  to: "6281234567890",
  message: "{Halo|Hai} {{name}}, pesanan Anda telah dikirim!",
  variables: { name: "Budi Santoso" },
  deviceId: "auto_rotate",
});

console.log("Pesan berhasil diproses:", response.data);`,
  },
  {
    id: "php",
    name: "Laravel / PHP",
    lang: "php",
    code: `use Illuminate\\Support\\Facades\\Http;

$response = Http::withHeaders([
    'Authorization' => 'Bearer ' . env('WAPLY_API_KEY'),
    'Content-Type'  => 'application/json',
])->post('https://ardp.my.id/api/v1/messages/send', [
    'to'       => '6281234567890',
    'message'  => '{Halo|Hai} Kak {{name}}, invoice #{order_id} telah terbit.',
    'variables'=> [
        'name'     => 'Budi Santoso',
        'order_id' => 'INV-2026-9812',
    ],
    'deviceId' => 'auto_rotate',
]);

return $response->json();`,
  },
  {
    id: "flutter",
    name: "Flutter / Dart",
    lang: "dart",
    code: `import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> sendWhatsApp({
  required String phone,
  required String name,
  required String apiKey,
}) async {
  final url = Uri.parse('https://ardp.my.id/api/v1/messages/send');
  final response = await http.post(
    url,
    headers: {
      'Authorization': 'Bearer $apiKey',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'to': phone,
      'message': 'Halo $name, verifikasi kode OTP Anda: 891240',
      'deviceId': 'auto_rotate',
    }),
  );
  print('Status: \${response.statusCode}');
}`,
  },
  {
    id: "python",
    name: "Python",
    lang: "python",
    code: `import requests
import os

API_KEY = os.getenv("WAPLY_API_KEY")

payload = {
    "to": "6281234567890",
    "message": "Halo Kak {{name}}, terima kasih telah berbelanja!",
    "variables": {"name": "Budi"},
    "deviceId": "auto_rotate"
}

res = requests.post(
    "https://ardp.my.id/api/v1/messages/send",
    json=payload,
    headers={"Authorization": f"Bearer {API_KEY}"}
)

print(res.json())`,
  },
  {
    id: "go",
    name: "Go (Golang)",
    lang: "go",
    code: `package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os"
)

func SendMessage(to, message string) (*http.Response, error) {
	payload, _ := json.Marshal(map[string]interface{}{
		"to":       to,
		"message":  message,
		"deviceId": "auto_rotate",
	})

	req, _ := http.NewRequest("POST", "https://ardp.my.id/api/v1/messages/send", bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("WAPLY_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	return client.Do(req)
}`,
  },
  {
    id: "curl",
    name: "cURL",
    lang: "bash",
    code: `curl -X POST https://ardp.my.id/api/v1/messages/send \\
  -H "Authorization: Bearer snd_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "6281234567890",
    "message": "{Halo|Hai} Kak {{name}}, tagihan Anda Rp 150.000 sudah lunas.",
    "variables": { "name": "Budi" },
    "deviceId": "auto_rotate"
  }'`,
  },
];

export function LandingCodePreview() {
  const [activeTab, setActiveTab] = useState<string>("ts");
  const [copied, setCopied] = useState(false);

  const activeSnippet = SNIPPETS.find((s) => s.id === activeTab) || SNIPPETS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="developer-api" className="py-12 sm:py-20 px-4 md:px-12 bg-base-100 border-t border-base-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20 mb-3">
              <Code2 className="w-4 h-4 text-emerald-600" /> Developer-First REST API
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-base-content">
              Kirim Pesan dalam 3 Baris Kode
            </h2>
            <p className="text-base-content/70 mt-2 text-xs sm:text-sm max-w-xl leading-relaxed">
              Integrasikan ke aplikasi web, backend, atau mobile Anda dengan HTTP standard. Sudah tersedia contoh siap pakai untuk berbagai stack populer.
            </p>
          </div>

          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
          >
            Buka Dokumentasi Lengkap SDK <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Code Playground Box */}
        <div className="rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          {/* Header Bar with Language Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 px-4 py-2.5 bg-slate-900/90 backdrop-blur-md gap-2">
            {/* macOS Window dots & Tabs */}
            <div className="flex items-center gap-4 overflow-x-auto py-1">
              <div className="hidden sm:flex items-center gap-1.5 shrink-0 pr-2 border-r border-slate-800">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              </div>

              <div className="flex items-center gap-1">
                {SNIPPETS.map((snippet) => (
                  <button
                    key={snippet.id}
                    onClick={() => setActiveTab(snippet.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      activeTab === snippet.id
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    {snippet.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="btn btn-ghost btn-xs h-8 px-3 font-mono text-xs text-slate-300 hover:text-white hover:bg-slate-800 self-end sm:self-auto gap-1.5 border border-slate-700/60 rounded-lg"
              title="Salin kode ke clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Code Area */}
          <div className="p-4 sm:p-6 overflow-x-auto font-mono text-xs sm:text-[13px] leading-relaxed text-slate-300 selection:bg-emerald-500/30">
            <pre tabIndex={0} className="focus:outline-none">
              <code>{activeSnippet.code}</code>
            </pre>
          </div>

          {/* Footer Highlights */}
          <div className="px-4 sm:px-6 py-3 bg-slate-950/70 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <div className="flex items-center gap-4">
              <span>Base URL: <strong className="text-slate-200">https://ardp.my.id</strong></span>
              <span>Auth: <strong className="text-slate-200">Bearer Token</strong></span>
            </div>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Mendukung Spintax & Auto-Rotate
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
