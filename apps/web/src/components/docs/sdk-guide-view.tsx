"use client";

import { useState } from "react";
import { CodeBlock } from "./code-block";
import {
  FlutterIcon,
  NodejsIcon,
  PhpIcon,
  PythonIcon,
  GolangIcon,
  KotlinIcon,
  CsharpIcon,
} from "./language-icons";
import {
  Code2,
  FileText,
  Bot,
  Zap,
  Terminal,
  Check,
  Copy,
  Layers,
  Sparkles,
  ShieldCheck,
  Send,
  Radio,
  Webhook,
  ExternalLink,
  BookOpen,
} from "lucide-react";

export type SdkLanguage =
  | "flutter"
  | "nodejs"
  | "php"
  | "python"
  | "go"
  | "kotlin"
  | "csharp";

interface SdkGuideViewProps {
  originUrl: string;
  onSwitchToApi?: () => void;
}

export function SdkGuideView({ originUrl, onSwitchToApi }: SdkGuideViewProps) {
  const [selectedLang, setSelectedLang] = useState<SdkLanguage>("flutter");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const languages: {
    id: SdkLanguage;
    name: string;
    runtime: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: string;
    pkgManager: string;
    installCmd: string;
    brandColor: string;
    lightBg: string;
    lightBorder: string;
  }[] = [
    {
      id: "flutter",
      name: "Flutter / Dart",
      runtime: "Flutter 3.x+ / Dart 3.x",
      icon: FlutterIcon,
      badge: "Mobile & Multiplatform",
      pkgManager: "pub",
      installCmd: "flutter pub add http",
      brandColor: "#02569B",
      lightBg: "bg-sky-50/80",
      lightBorder: "border-sky-300",
    },
    {
      id: "nodejs",
      name: "Node.js (TypeScript)",
      runtime: "Node 18+ / Bun / Deno",
      icon: NodejsIcon,
      badge: "Backend & Fullstack",
      pkgManager: "npm",
      installCmd: "npm install axios",
      brandColor: "#339933",
      lightBg: "bg-emerald-50/80",
      lightBorder: "border-emerald-300",
    },
    {
      id: "php",
      name: "PHP (Laravel / cURL)",
      runtime: "PHP 8.1+ / Laravel 10/11",
      icon: PhpIcon,
      badge: "Web & Enterprise",
      pkgManager: "composer",
      installCmd: "composer require guzzlehttp/guzzle",
      brandColor: "#777BB4",
      lightBg: "bg-indigo-50/80",
      lightBorder: "border-indigo-300",
    },
    {
      id: "python",
      name: "Python (Requests / FastAPI)",
      runtime: "Python 3.9+",
      icon: PythonIcon,
      badge: "Automation & AI",
      pkgManager: "pip",
      installCmd: "pip install requests",
      brandColor: "#3776AB",
      lightBg: "bg-amber-50/80",
      lightBorder: "border-amber-300",
    },
    {
      id: "go",
      name: "Golang (net/http)",
      runtime: "Go 1.20+",
      icon: GolangIcon,
      badge: "High-Performance",
      pkgManager: "go",
      installCmd: "go get -u github.com/google/uuid",
      brandColor: "#00ACD7",
      lightBg: "bg-cyan-50/80",
      lightBorder: "border-cyan-300",
    },
    {
      id: "kotlin",
      name: "Java / Kotlin (OkHttp)",
      runtime: "Kotlin 1.9+ / Android / JVM",
      icon: KotlinIcon,
      badge: "Android & JVM",
      pkgManager: "gradle",
      installCmd: 'implementation("com.squareup.okhttp3:okhttp:4.12.0")',
      brandColor: "#7F52FF",
      lightBg: "bg-purple-50/80",
      lightBorder: "border-purple-300",
    },
    {
      id: "csharp",
      name: "C# / .NET (HttpClient)",
      runtime: ".NET 8.0 / 9.0",
      icon: CsharpIcon,
      badge: "Enterprise & Desktop",
      pkgManager: "nuget",
      installCmd: "dotnet add package System.Text.Json",
      brandColor: "#512BD4",
      lightBg: "bg-violet-50/80",
      lightBorder: "border-violet-300",
    },
  ];

  const currentLangMeta = languages.find((l) => l.id === selectedLang)!;

  const sdkCodes: Record<
    SdkLanguage,
    {
      clientSnippet: string;
      sendTextSnippet: string;
      templateSnippet: string;
      broadcastSnippet: string;
      webhookSnippet: string;
    }
  > = {
    flutter: {
      clientSnippet: `import 'dart:convert';
import 'package:http/http.dart' as http;

/// Waply WhatsApp Gateway Client untuk Flutter & Dart
class WaplyClient {
  final String apiKey;
  final String baseUrl;

  WaplyClient({
    required this.apiKey,
    this.baseUrl = "${originUrl}",
  });

  /// Kirim pesan teks dengan dukungan Spintax & Variabel Dinamis
  Future<Map<String, dynamic>> sendTextMessage({
    required String to,
    required String message,
    String deviceId = "auto_rotate",
    Map<String, dynamic>? variables,
  }) async {
    final url = Uri.parse('$baseUrl/api/v1/messages/send');
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $apiKey',
      },
      body: jsonEncode({
        'to': to,
        'message': message,
        'deviceId': deviceId,
        if (variables != null) 'variables': variables,
      }),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      throw Exception('Waply Error (\${response.statusCode}): \${response.body}');
    }
  }

  /// Kirim pesan notifikasi menggunakan Shortcode Template
  Future<Map<String, dynamic>> sendTemplateMessage({
    required String to,
    required String template,
    required Map<String, dynamic> variables,
    String deviceId = "auto_rotate",
  }) async {
    final url = Uri.parse('$baseUrl/api/v1/messages/send');
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $apiKey',
      },
      body: jsonEncode({
        'to': to,
        'template': template,
        'deviceId': deviceId,
        'variables': variables,
      }),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      throw Exception('Waply Template Error (\${response.statusCode}): \${response.body}');
    }
  }

  /// Kirim pesan media (Gambar / PDF) dengan caption opsional
  Future<Map<String, dynamic>> sendMediaMessage({
    required String to,
    required String mediaUrl,
    String? caption,
    String deviceId = "auto_rotate",
  }) async {
    final url = Uri.parse('$baseUrl/api/v1/messages/send');
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $apiKey',
      },
      body: jsonEncode({
        'to': to,
        'mediaUrl': mediaUrl,
        if (caption != null) 'message': caption,
        'deviceId': deviceId,
      }),
    );

    return jsonDecode(response.body) as Map<String, dynamic>;
  }
}`,
      sendTextSnippet: `// Contoh Pemanggilan di Aplikasi Flutter (misal pada Tombol Kirim / Checkout):
final waply = WaplyClient(apiKey: 'snd_live_YOUR_API_KEY');

try {
  final result = await waply.sendTextMessage(
    to: '6281234567890',
    message: '{Halo|Hai|Selamat siang} {{name}}, kode OTP pendaftaran Anda: {{otp}}. Jangan berikan ke siapapun.',
    variables: {
      'name': 'Budi Santoso',
      'otp': '482910',
    },
  );
  
  print('Pesan berhasil dikirim! ID: \${result['data']['messageId']}');
} catch (e) {
  print('Gagal mengirim pesan: \$e');
}`,
      templateSnippet: `// Kirim notifikasi status invoice otomatis via template
final waply = WaplyClient(apiKey: 'snd_live_YOUR_API_KEY');

final res = await waply.sendTemplateMessage(
  to: '6281234567890',
  template: 'tpl_order_notif', // Shortcode yang dibuat di menu Templates
  variables: {
    'name': 'Budi Santoso',
    'order_id': 'INV-2026-9812',
    'eta': 'Besok Siang',
  },
);

print('Notifikasi terkirim: \${res['data']['status']}');`,
      broadcastSnippet: `// Membuat kampanye broadcast penerima massal di Flutter/Dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<void> launchBroadcastCampaign() async {
  final url = Uri.parse('${originUrl}/api/broadcast');
  final response = await http.post(
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer snd_live_YOUR_API_KEY',
    },
    body: jsonEncode({
      'name': 'Flash Sale Member 30%',
      'messageTemplate': '{Halo|Hai} {{name}}, klaim voucher {{voucher}} sekarang!',
      'batchSize': 10,
      'batchDelaySec': 60,
      'minDelaySec': 4,
      'maxDelaySec': 8,
      'recipients': [
        {'phoneNumber': '6281234567890', 'name': 'Budi', 'variables': {'voucher': 'PROMO30'}},
        {'phoneNumber': '6285712345678', 'name': 'Siti', 'variables': {'voucher': 'PROMO30'}},
      ],
    }),
  );

  final data = jsonDecode(response.body);
  final campaignId = data['data']['id'];

  // Trigger antrean pengiriman background
  await http.post(
    Uri.parse('${originUrl}/api/broadcast/\$campaignId/start'),
    headers: {'Authorization': 'Bearer snd_live_YOUR_API_KEY'},
  );
  print('Broadcast berjalan ID: $campaignId');
}`,
      webhookSnippet: `import 'dart:convert';
import 'package:crypto/crypto.dart';

/// 1. Verifikasi HMAC-SHA256 signature Webhook di Dart / Shelf / Flutter Backend
bool verifyWaplyWebhook({
  required String rawBody,
  required String signatureHeader,
  required String webhookSecret,
}) {
  final cleanSignature = signatureHeader.replaceFirst('sha256=', '').trim();
  final hmacSha256 = Hmac(sha256, utf8.encode(webhookSecret));
  final digest = hmacSha256.convert(utf8.encode(rawBody));
  return digest.toString().toLowerCase() == cleanSignature.toLowerCase();
}

/// 2. Contoh Handler Webhook Masuk (Dart / Shelf Server)
void handleIncomingWebhook(String rawPayload, String signatureHeader) {
  const secret = 'whsec_YOUR_WEBHOOK_SECRET';

  if (!verifyWaplyWebhook(
    rawBody: rawPayload,
    signatureHeader: signatureHeader,
    webhookSecret: secret,
  )) {
    print('Signature webhook tidak valid (Unauthorized)!');
    return;
  }

  final payload = jsonDecode(rawPayload) as Map<String, dynamic>;
  final event = payload['event'];
  final data = payload['data'];

  if (event == 'message.received') {
    print('Pesan masuk dari \${data['sender']['number']}: \${data['text']}');
    // Opsional: Kirim push notification ke aplikasi Flutter via FCM / WebSocket
  }
}`,
    },

    nodejs: {
      clientSnippet: `import axios, { AxiosInstance } from "axios";

export interface WaplyConfig {
  apiKey: string;
  baseUrl?: string;
}

export class WaplyClient {
  private client: AxiosInstance;

  constructor(config: WaplyConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl || "${originUrl}",
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Bearer \${config.apiKey}\`,
      },
      timeout: 10000,
    });
  }

  /**
   * Kirim pesan teks langsung dengan dukungan Spintax & Variabel Dinamis
   */
  async sendText(
    to: string,
    message: string,
    variables?: Record<string, any>,
    deviceId = "auto_rotate"
  ) {
    const res = await this.client.post("/api/v1/messages/send", {
      to,
      message,
      variables,
      deviceId,
    });
    return res.data;
  }

  /**
   * Kirim pesan menggunakan Shortcode Template
   */
  async sendTemplate(
    to: string,
    template: string,
    variables: Record<string, any>,
    deviceId = "auto_rotate"
  ) {
    const res = await this.client.post("/api/v1/messages/send", {
      to,
      template,
      variables,
      deviceId,
    });
    return res.data;
  }

  /**
   * Kirim pesan media (Gambar / PDF)
   */
  async sendMedia(
    to: string,
    mediaUrl: string,
    caption?: string,
    deviceId = "auto_rotate"
  ) {
    const res = await this.client.post("/api/v1/messages/send", {
      to,
      mediaUrl,
      message: caption,
      deviceId,
    });
    return res.data;
  }
}`,
      sendTextSnippet: `import { WaplyClient } from "./waply-client";

const waply = new WaplyClient({
  apiKey: process.env.WAPLY_API_KEY || "snd_live_YOUR_API_KEY",
});

// Kirim pesan WhatsApp OTP / Notifikasi
async function run() {
  const response = await waply.sendText(
    "6281234567890",
    "{Halo|Hai|Selamat siang} {{name}}, pesanan {{order_id}} Anda telah kami proses!",
    {
      name: "Budi Santoso",
      order_id: "INV-2026-9812",
    }
  );

  console.log("Response:", response);
}

run();`,
      templateSnippet: `// Kirim via Template Shortcode yang terdaftar di Waply
const response = await waply.sendTemplate(
  "6281234567890",
  "tpl_order_notif", // Template shortcode
  {
    name: "Budi Santoso",
    order_id: "INV-2026-9812",
    eta: "Besok Siang",
  }
);

console.log("Template sent:", response.data.messageId);`,
      broadcastSnippet: `// Buat & Jalankan Broadcast Campaign Massal
const createRes = await axios.post(
  "${originUrl}/api/broadcast",
  {
    name: "Promo Diskon Gajian 30%",
    messageTemplate: "{Halo|Hai} {{name}}, promo gajian spesial diskon 30% hari ini!",
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
    headers: { Authorization: "Bearer snd_live_YOUR_API_KEY" },
  }
);

const campaignId = createRes.data.data.id;

// Jalankan antrean pengiriman background
await axios.post(
  \`${originUrl}/api/broadcast/\${campaignId}/start\`,
  {},
  { headers: { Authorization: "Bearer snd_live_YOUR_API_KEY" } }
);

console.log("Broadcast dimulai:", campaignId);`,
      webhookSnippet: `import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = process.env.WAPLY_WEBHOOK_SECRET || "whsec_your_secret";

app.post("/webhook/waply", (req, res) => {
  const signature = req.headers["x-waply-signature"] as string;
  const rawBody = JSON.stringify(req.body);

  // 1. Verifikasi HMAC-SHA256 signature
  const expectedSig = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (!signature || signature.replace("sha256=", "") !== expectedSig) {
    return res.status(401).json({ error: "Invalid HMAC signature" });
  }

  // 2. Tangani event real-time
  const { event, data } = req.body;
  if (event === "message.received") {
    console.log(\`Pesan masuk dari \${data.sender.number}: \${data.text}\`);
  }

  // 3. Wajib respon 200 OK dalam 5 detik
  res.status(200).json({ status: "acknowledged" });
});

app.listen(3000, () => console.log("Webhook listener berjalan di port 3000"));`,
    },

    php: {
      clientSnippet: `<?php

namespace App\\Services;

use Illuminate\\Support\\Facades\\Http;
use Exception;

class WaplyService
{
    protected string $baseUrl;
    protected string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.waply.base_url', '${originUrl}');
        $this->apiKey = config('services.waply.api_key', 'snd_live_YOUR_API_KEY');
    }

    /**
     * Kirim pesan teks dengan Spintax dan variabel
     */
    public function sendTextMessage(string $to, string $message, array $variables = [], string $deviceId = 'auto_rotate'): array
    {
        $response = Http::withToken($this->apiKey)
            ->timeout(10)
            ->post("{$this->baseUrl}/api/v1/messages/send", [
                'to' => $to,
                'message' => $message,
                'deviceId' => $deviceId,
                'variables' => $variables,
            ]);

        if ($response->failed()) {
            throw new Exception("Waply API Error: " . $response->body());
        }

        return $response->json();
    }

    /**
     * Kirim pesan menggunakan Shortcode Template
     */
    public function sendTemplate(string $to, string $template, array $variables, string $deviceId = 'auto_rotate'): array
    {
        $response = Http::withToken($this->apiKey)
            ->timeout(10)
            ->post("{$this->baseUrl}/api/v1/messages/send", [
                'to' => $to,
                'template' => $template,
                'deviceId' => $deviceId,
                'variables' => $variables,
            ]);

        if ($response->failed()) {
            throw new Exception("Waply Template Error: " . $response->body());
        }

        return $response->json();
    }
}`,
      sendTextSnippet: `// Contoh pemanggilan di Controller / Job Laravel:
use App\\Services\\WaplyService;

class OrderController extends Controller
{
    public function notifyCustomer(WaplyService $waply, Order $order)
    {
        $waply->sendTextMessage(
            to: $order->customer_phone,
            message: "{Halo|Hai} Kak {{name}}, pesanan Anda {{order_id}} sebesar {{total}} telah kami terima.",
            variables: [
                'name' => $order->customer_name,
                'order_id' => $order->invoice_number,
                'total' => 'Rp ' . number_format($order->total_amount, 0, ',', '.'),
            ]
        );

        return response()->json(['status' => 'Notification sent']);
    }
}`,
      templateSnippet: `// Kirim Template Shortcode di Laravel:
$waply = app(WaplyService::class);

$result = $waply->sendTemplate(
    to: '6281234567890',
    template: 'tpl_order_notif',
    variables: [
        'name' => 'Budi Santoso',
        'order_id' => 'INV-2026-9812',
        'eta' => 'Besok Siang',
    ]
);`,
      broadcastSnippet: `// Buat Broadcast Campaign via cURL / Laravel Http:
$response = Http::withToken('snd_live_YOUR_API_KEY')
    ->post('${originUrl}/api/broadcast', [
        'name' => 'Promo Diskon Gajian 30%',
        'messageTemplate' => '{Halo|Hai} {{name}}, promo diskon gajian spesial untuk Anda!',
        'batchSize' => 10,
        'batchDelaySec' => 60,
        'minDelaySec' => 4,
        'maxDelaySec' => 8,
        'recipients' => [
            ['phoneNumber' => '6281234567890', 'name' => 'Budi Santoso'],
            ['phoneNumber' => '6285712345678', 'name' => 'Siti Rahma'],
        ]
    ]);

$campaignId = $response->json('data.id');

// Mulai kirim
Http::withToken('snd_live_YOUR_API_KEY')
    ->post("${originUrl}/api/broadcast/{$campaignId}/start");`,
      webhookSnippet: `// Laravel Webhook Controller:
namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;

class WaplyWebhookController extends Controller
{
    public function handle(Request $request)
    {
        $rawPayload = $request->getContent();
        $signature = $request->header('X-Waply-Signature', '');
        $webhookSecret = config('services.waply.webhook_secret');

        // 1. Verifikasi Signature HMAC-SHA256
        $expected = hash_hmac('sha256', $rawPayload, $webhookSecret);
        if (!hash_equals($expected, str_replace('sha256=', '', $signature))) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        // 2. Handle Event
        $event = $request->input('event');
        $data = $request->input('data');

        if ($event === 'message.received') {
            // Tangani pesan masuk pelanggan
            \\Log::info("Pesan dari " . $data['sender']['number'] . ": " . $data['text']);
        }

        return response()->json(['status' => 'received'], 200);
    }
}`,
    },

    python: {
      clientSnippet: `import requests
from typing import Optional, Dict, Any

class WaplyClient:
    """Waply WhatsApp Gateway SDK untuk Python"""
    def __init__(self, api_key: str, base_url: str = "${originUrl}"):
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }

    def send_text(
        self,
        to: str,
        message: str,
        variables: Optional[Dict[str, Any]] = None,
        device_id: str = "auto_rotate"
    ) -> dict:
        """Kirim pesan teks dengan Spintax dan variabel"""
        url = f"{self.base_url}/api/v1/messages/send"
        payload = {
            "to": to,
            "message": message,
            "deviceId": device_id,
        }
        if variables:
            payload["variables"] = variables

        response = requests.post(url, json=payload, headers=self.headers, timeout=10)
        response.raise_for_status()
        return response.json()

    def send_template(
        self,
        to: str,
        template: str,
        variables: Dict[str, Any],
        device_id: str = "auto_rotate"
    ) -> dict:
        """Kirim pesan notifikasi template shortcode"""
        url = f"{self.base_url}/api/v1/messages/send"
        payload = {
            "to": to,
            "template": template,
            "deviceId": device_id,
            "variables": variables
        }
        response = requests.post(url, json=payload, headers=self.headers, timeout=10)
        response.raise_for_status()
        return response.json()`,
      sendTextSnippet: `from waply import WaplyClient
import os

waply = WaplyClient(api_key=os.getenv("WAPLY_API_KEY", "snd_live_YOUR_API_KEY"))

# Kirim pesan teks dinamis dengan Spintax
res = waply.send_text(
    to="6281234567890",
    message="{Halo|Hai|Selamat siang} Kak {{name}}, tiket support #{{ticket_id}} telah dibuat!",
    variables={
        "name": "Budi Santoso",
        "ticket_id": "TCK-8821"
    }
)

print("Status pengiriman:", res["status"], "ID:", res["data"]["messageId"])`,
      templateSnippet: `# Kirim notifikasi template shortcode
res = waply.send_template(
    to="6281234567890",
    template="tpl_order_notif",
    variables={
        "name": "Budi Santoso",
        "order_id": "INV-2026-9812",
        "eta": "Besok Siang"
    }
)

print("Template terkirim:", res["data"]["messageId"])`,
      broadcastSnippet: `import requests

headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer snd_live_YOUR_API_KEY"
}

# 1. Buat Kampanye Broadcast
payload = {
    "name": "Promo Weekend Spesial 30%",
    "messageTemplate": "{Halo|Hai} {{name}}, dapatkan diskon 30% hari ini!",
    "batchSize": 10,
    "batchDelaySec": 60,
    "minDelaySec": 4,
    "maxDelaySec": 8,
    "recipients": [
        {"phoneNumber": "6281234567890", "name": "Budi Santoso"},
        {"phoneNumber": "6285712345678", "name": "Siti Rahma"}
    ]
}

create_res = requests.post("${originUrl}/api/broadcast", json=payload, headers=headers)
campaign_id = create_res.json()["data"]["id"]

# 2. Jalankan Antrean
requests.post(f"${originUrl}/api/broadcast/{campaign_id}/start", headers=headers)
print("Broadcast aktif:", campaign_id)`,
      webhookSnippet: `from fastapi import FastAPI, Request, HTTPException
import hmac
import hashlib
import os

app = FastAPI()
WEBHOOK_SECRET = os.getenv("WAPLY_WEBHOOK_SECRET", "whsec_your_secret")

@app.post("/webhook/waply")
async def handle_waply_webhook(request: Request):
    raw_body = await request.body()
    signature = request.headers.get("x-waply-signature", "").replace("sha256=", "")
    
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
        
    return {"status": "received"}`,
    },

    go: {
      clientSnippet: `package waply

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Client struct {
	BaseURL    string
	APIKey     string
	HTTPClient *http.Client
}

func NewClient(apiKey string, baseURL string) *Client {
	if baseURL == "" {
		baseURL = "${originUrl}"
	}
	return &Client{
		BaseURL: baseURL,
		APIKey:  apiKey,
		HTTPClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

type SendMessageRequest struct {
	To        string                 \`json:"to"\`
	Message   string                 \`json:"message,omitempty"\`
	Template  string                 \`json:"template,omitempty"\`
	DeviceId  string                 \`json:"deviceId,omitempty"\`
	Variables map[string]interface{} \`json:"variables,omitempty"\`
}

func (c *Client) SendTextMessage(to, message string, variables map[string]interface{}) (map[string]interface{}, error) {
	reqBody := SendMessageRequest{
		To:        to,
		Message:   message,
		DeviceId:  "auto_rotate",
		Variables: variables,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", fmt.Sprintf("%s/api/v1/messages/send", c.BaseURL), bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.APIKey))

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(respBytes, &result)

	return result, nil
}`,
      sendTextSnippet: `package main

import (
	"fmt"
	"waply"
)

func main() {
	client := waply.NewClient("snd_live_YOUR_API_KEY", "${originUrl}")

	vars := map[string]interface{}{
		"name":     "Budi Santoso",
		"order_id": "INV-2026-9812",
	}

	res, err := client.SendTextMessage(
		"6281234567890",
		"{Halo|Hai} {{name}}, pesanan {{order_id}} sedang diproses!",
		vars,
	)

	if err != nil {
		panic(err)
	}

	fmt.Printf("Message Sent Response: %+v\\n", res)
}`,
      templateSnippet: `// Kirim Template Shortcode di Golang:
reqBody := waply.SendMessageRequest{
    To:       "6281234567890",
    Template: "tpl_order_notif",
    DeviceId: "auto_rotate",
    Variables: map[string]interface{}{
        "name":     "Budi Santoso",
        "order_id": "INV-2026-9812",
        "eta":      "Besok Siang",
    },
}`,
      broadcastSnippet: `// Membuat Kampanye Broadcast di Golang:
// Lakukan HTTP POST ke '${originUrl}/api/broadcast'
// dan start queue via POST ke '${originUrl}/api/broadcast/{id}/start'`,
      webhookSnippet: `package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"strings"
)

func webhookHandler(w http.ResponseWriter, r *http.Request) {
	secret := "whsec_your_secret"
	bodyBytes, _ := io.ReadAll(r.Body)

	// 1. Verifikasi Signature
	sig := strings.Replace(r.Header.Get("X-Waply-Signature"), "sha256=", "", 1)
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(bodyBytes)
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(sig), []byte(expectedSig)) {
		http.Error(w, "Invalid signature", http.StatusUnauthorized)
		return
	}

	// 2. Respon 200 OK
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(\`{"status":"acknowledged"}\`))
}`,
    },

    kotlin: {
      clientSnippet: `package com.waply.sdk

import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class WaplyClient(
    private val apiKey: String,
    private val baseUrl: String = "${originUrl}"
) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    fun sendText(to: String, message: String, variables: Map<String, Any>? = null): String {
        val payload = JSONObject().apply {
            put("to", to)
            put("message", message)
            put("deviceId", "auto_rotate")
            if (variables != null) {
                put("variables", JSONObject(variables))
            }
        }

        val request = Request.Builder()
            .url("$baseUrl/api/v1/messages/send")
            .header("Authorization", "Bearer $apiKey")
            .header("Content-Type", "application/json")
            .post(payload.toString().toRequestBody(jsonMediaType))
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw IOException("Waply HTTP Error: \${response.code}")
            return response.body?.string() ?: ""
        }
    }
}`,
      sendTextSnippet: `val waply = WaplyClient(apiKey = "snd_live_YOUR_API_KEY")

val response = waply.sendText(
    to = "6281234567890",
    message = "{Halo|Hai} {{name}}, kode verifikasi: {{code}}",
    variables = mapOf("name" to "Budi", "code" to "992104")
)

println("Response: $response")`,
      templateSnippet: `// Kirim via Shortcode Template di Kotlin:
val payload = JSONObject().apply {
    put("to", "6281234567890")
    put("template", "tpl_order_notif")
    put("deviceId", "auto_rotate")
    put("variables", JSONObject(mapOf("name" to "Budi", "order_id" to "INV-9912")))
}`,
      broadcastSnippet: `// Broadcast massal via OkHttpClient di Android / Kotlin Backend:
// POST ke '${originUrl}/api/broadcast'`,
      webhookSnippet: `import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import java.security.MessageDigest

// Verifikasi Signature HMAC-SHA256 di Kotlin / Ktor / Spring Boot:
fun verifyWaplyWebhook(rawBody: String, signatureHeader: String, webhookSecret: String): Boolean {
    val cleanSig = signatureHeader.removePrefix("sha256=").trim()
    val mac = Mac.getInstance("HmacSHA256")
    val secretKey = SecretKeySpec(webhookSecret.toByteArray(Charsets.UTF_8), "HmacSHA256")
    mac.init(secretKey)
    val hash = mac.doFinal(rawBody.toByteArray(Charsets.UTF_8))
    val calculatedSig = hash.joinToString("") { "%02x".format(it) }
    return MessageDigest.isEqual(calculatedSig.toByteArray(), cleanSig.toByteArray())
}`,
    },

    csharp: {
      clientSnippet: `using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Waply.Sdk
{
    public class WaplyClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;

        public WaplyClient(string apiKey, string baseUrl = "${originUrl}")
        {
            _baseUrl = baseUrl.TrimEnd('/');
            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        }

        public async Task<string> SendTextMessageAsync(string to, string message, Dictionary<string, object> variables = null, string deviceId = "auto_rotate")
        {
            var payload = new
            {
                to,
                message,
                deviceId,
                variables
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"\${_baseUrl}/api/v1/messages/send", jsonContent);

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> SendTemplateMessageAsync(string to, string template, Dictionary<string, object> variables, string deviceId = "auto_rotate")
        {
            var payload = new
            {
                to,
                template,
                deviceId,
                variables
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"\${_baseUrl}/api/v1/messages/send", jsonContent);

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }
    }
}`,
      sendTextSnippet: `using Waply.Sdk;

var waply = new WaplyClient("snd_live_YOUR_API_KEY");

var vars = new Dictionary<string, object>
{
    { "name", "Budi Santoso" },
    { "order_id", "INV-2026-9812" }
};

var response = await waply.SendTextMessageAsync(
    "6281234567890",
    "{Halo|Hai} {{name}}, pesanan Anda {{order_id}} sudah siap dikirim!",
    vars
);

Console.WriteLine($"Response: {response}");`,
      templateSnippet: `// Kirim Notifikasi via Template Shortcode di C# .NET:
var result = await waply.SendTemplateMessageAsync(
    "6281234567890",
    "tpl_order_notif",
    new Dictionary<string, object>
    {
        { "name", "Budi Santoso" },
        { "order_id", "INV-2026-9812" },
        { "eta", "Besok Siang" }
    }
);`,
      broadcastSnippet: `// Buat Broadcast Campaign di ASP.NET Core:
// POST ke '${originUrl}/api/broadcast' dan start via '${originUrl}/api/broadcast/{id}/start'`,
      webhookSnippet: `// ASP.NET Core Controller (Webhook HMAC-SHA256 Verification):
using System.Security.Cryptography;
using System.Text;

[HttpPost("webhook/waply")]
public async Task<IActionResult> HandleWebhook([FromHeader(Name = "X-Waply-Signature")] string signature)
{
    using var reader = new StreamReader(Request.Body);
    var body = await reader.ReadToEndAsync();
    var secret = "whsec_YOUR_WEBHOOK_SECRET";
    
    // Verifikasi HMAC-SHA256 signature
    var cleanSig = signature?.Replace("sha256=", "").Trim();
    using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
    var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(body));
    var calculatedSig = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();

    if (!string.Equals(calculatedSig, cleanSig, StringComparison.OrdinalIgnoreCase))
    {
        return Unauthorized(new { error = "Invalid signature" });
    }
    
    return Ok(new { status = "acknowledged" });
}`,
    },
  };

  const selectedCodes = sdkCodes[selectedLang];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Multi-Language SDK &amp; Boilerplate
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Panduan Integrasi Multi-Bahasa Pemrograman
            </h1>
          </div>
          {onSwitchToApi && (
            <button
              onClick={onSwitchToApi}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-600" /> Lihat REST API Raw
            </button>
          )}
        </div>

        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
          Waply adalah gateway universal berbasis <b>standar REST API (HTTP JSON)</b>. Waply dapat dipanggil dari <b>semua bahasa pemrograman</b> apa pun (Flutter, Node.js, PHP, Python, Golang, Kotlin/Java, C# .NET, Swift, Rust, dsb.). Cukup kirim HTTP POST ke endpoint Waply dengan Header Authorization Bearer.
        </p>

        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <b>Zero Dependency Requirement:</b> Anda dapat menyalin kode boilerplate kelas client di bawah langsung ke project aplikasi Anda tanpa perlu instalasi SDK proprietary khusus.
          </span>
        </div>
      </div>

      {/* Language Selector Tabs */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Pilih Bahasa Pemrograman Aplikasi Anda:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {languages.map((lang) => {
            const Icon = lang.icon;
            const isSelected = selectedLang === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setSelectedLang(lang.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 shadow-2xs relative overflow-hidden ${
                  isSelected
                    ? "bg-white border-slate-900 ring-2 ring-slate-900/10 shadow-md"
                    : "bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50/70"
                }`}
              >
                {/* Active indicator badge */}
                {isSelected && (
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: lang.brandColor }}
                  />
                )}
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 p-1.5 rounded-xl flex items-center justify-center border transition-all ${
                      isSelected
                        ? `${lang.lightBg} ${lang.lightBorder} shadow-2xs`
                        : "bg-slate-100/80 border-slate-200 text-slate-700"
                    }`}
                  >
                    <Icon className="w-full h-full object-contain" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {lang.pkgManager}
                  </span>
                </div>
                <div>
                  <div className={`font-bold text-xs truncate ${isSelected ? "text-slate-900" : "text-slate-800"}`}>
                    {lang.name}
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      isSelected ? "text-slate-600 font-medium" : "text-slate-500"
                    }`}
                  >
                    {lang.badge}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Language Details & Installation */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-11 h-11 p-2 rounded-xl ${currentLangMeta.lightBg} border ${currentLangMeta.lightBorder} flex items-center justify-center shadow-2xs`}
            >
              <currentLangMeta.icon className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Setup Proyek {currentLangMeta.name}
              </h2>
              <p className="text-xs text-slate-500">
                Kompatibel dengan {currentLangMeta.runtime}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            Official Recipe
          </span>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700">
            Perintah Instalasi Dependensi HTTP ({currentLangMeta.pkgManager}):
          </span>
          <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 p-3 rounded-xl font-mono text-xs text-emerald-400">
            <code className="break-all">{currentLangMeta.installCmd}</code>
            <button
              onClick={() => copyCode(currentLangMeta.installCmd, "install-cmd")}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg shrink-0 transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
            >
              {copiedId === "install-cmd" ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> Disalin
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Salin
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 1. Client Helper Class */}
      <section className="space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-emerald-600" /> 1. Kelas Helper / Client Wrapper
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          Simpan kode berikut sebagai file service/helper di folder project Anda:
        </p>
        <CodeBlock
          code={selectedCodes.clientSnippet}
          language={selectedLang}
        />
      </section>

      {/* 2. Example: Kirim Pesan Teks & Spintax */}
      <section className="space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
          <Send className="w-4 h-4 text-emerald-600" /> 2. Kirim Pesan Teks + Spintax &amp; Variabel
        </h3>
        <CodeBlock
          code={selectedCodes.sendTextSnippet}
          language={selectedLang}
          filename={`send_message_example.${selectedLang === "flutter" ? "dart" : selectedLang === "nodejs" ? "ts" : selectedLang === "php" ? "php" : selectedLang === "python" ? "py" : selectedLang === "go" ? "go" : selectedLang === "kotlin" ? "kt" : "cs"}`}
        />
      </section>

      {/* 3. Example: Kirim via Template Shortcode */}
      <section className="space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-600" /> 3. Kirim via Template Shortcode
        </h3>
        <CodeBlock
          code={selectedCodes.templateSnippet}
          language={selectedLang}
          filename={`template_example.${selectedLang === "flutter" ? "dart" : selectedLang === "nodejs" ? "ts" : selectedLang === "php" ? "php" : selectedLang === "python" ? "py" : selectedLang === "go" ? "go" : selectedLang === "kotlin" ? "kt" : "cs"}`}
        />
      </section>

      {/* 4. Example: Broadcast Campaign */}
      <section className="space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-500" /> 4. Buat &amp; Mulai Kampanye Broadcast
        </h3>
        <CodeBlock
          code={selectedCodes.broadcastSnippet}
          language={selectedLang}
          filename={`broadcast_example.${selectedLang === "flutter" ? "dart" : selectedLang === "nodejs" ? "ts" : selectedLang === "php" ? "php" : selectedLang === "python" ? "py" : selectedLang === "go" ? "go" : selectedLang === "kotlin" ? "kt" : "cs"}`}
        />
      </section>

      {/* 5. Example: Webhook Signature Verification */}
      <section className="space-y-3 pb-12">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
          <Webhook className="w-4 h-4 text-indigo-600" /> 5. Verifikasi Webhook HMAC-SHA256
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          Amankan endpoint webhook Anda dari pemalsuan data dengan mencocokkan signature header <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">X-Waply-Signature</code> menggunakan Secret Key akun Anda.
        </p>
        <CodeBlock
          code={selectedCodes.webhookSnippet}
          language={selectedLang}
          filename={`webhook_handler.${selectedLang === "flutter" ? "dart" : selectedLang === "nodejs" ? "ts" : selectedLang === "php" ? "php" : selectedLang === "python" ? "py" : selectedLang === "go" ? "go" : selectedLang === "kotlin" ? "kt" : "cs"}`}
        />
      </section>
    </div>
  );
}
