<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, load the antislop skill for the task:
- Core filter, always on: `antislop`
- UI / visual: `antislop-ui`
- Copy & text: `antislop-copywriting`
- Code comments: `antislop-code`
- Mobile / responsive: `antislop-layoutmobile`
- People: `antislop-human`
Before starting, ask the user when antislop applies: during the work, or after it is done.
<!-- antislop:end -->

---

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, load the antislop skill for the task:
- Core filter, always on: `antislop`
- UI / visual: `antislop-ui`
- Copy & text: `antislop-copywriting`
- Code comments: `antislop-code`
- Mobile / responsive: `antislop-layoutmobile`
- People: `antislop-human`
Before starting, ask the user when antislop applies: during the work, or after it is done.
<!-- antislop:end -->

---

# 🚀 Panduan Arsitektur & Integrasi REST API Waply WhatsApp Gateway

Dokumen ini memuat standar teknis, arsitektur sistem, direktori endpoint, spesifikasi Webhook, dan panduan integrasi client SDK multi-bahasa untuk Waply.

---

## 1. Arsitektur Sistem & Konsep Base URL

### A. Formula Pemanggilan API
Setiap pemanggilan endpoint REST API Waply menggunakan formula:

$$\text{Full API URL} = \text{Base URL (Host Server)} + \text{Endpoint Path}$$

### B. Daftar Base URL (Host Server)
* **Produksi (Live Public Domain):** `https://ardp.my.id`
* **Development / Local Testing:** `http://localhost:3001` (Web) / `http://localhost:3002` (Gateway Worker)

> **⚠️ Catatan Penting:** Base URL adalah domain utama (`https://ardp.my.id`). Jangan menambahkan sub-path pada konfigurasi `baseURL` di HTTP client (seperti Axios) jika memanggil endpoint dengan awalan berbeda (`/api/v1/...` vs `/api/...`).

---

## 2. Format Autentikasi & Header HTTP

Setiap request ke endpoint API wajib menyertakan API Key akun yang dibuat melalui menu **Dashboard > API Keys**:

```http
Authorization: Bearer snd_live_YOUR_API_KEY
Content-Type: application/json
Accept: application/json
```

*Atau menggunakan custom header:*
```http
X-API-Key: snd_live_YOUR_API_KEY
Content-Type: application/json
```

---

## 3. Direktori Lengkap Endpoint REST API

| Kategori | Method | Endpoint Path | Full URL (Produksi) | Deskripsi & Fungsi |
| :--- | :---: | :--- | :--- | :--- |
| **Kirim Pesan** | `POST` | `/api/v1/messages/send` | `https://ardp.my.id/api/v1/messages/send` | Kirim teks, media (gambar/pdf/dokumen), atau shortcode template |
| **Pustaka Template** | `GET` | `/api/v1/templates` | `https://ardp.my.id/api/v1/templates` | Ambil daftar shortcode template milik akun |
| **Buat Template** | `POST` | `/api/v1/templates` | `https://ardp.my.id/api/v1/templates` | Daftarkan shortcode template baru |
| **Broadcast Campaign** | `POST` | `/api/broadcast` | `https://ardp.my.id/api/broadcast` | Buat kampanye broadcast pesan massal |
| **Jalankan Broadcast** | `POST` | `/api/broadcast/{id}/start` | `https://ardp.my.id/api/broadcast/{id}/start` | Mulai antrean pengiriman broadcast |
| **Pause Broadcast** | `POST` | `/api/broadcast/{id}/pause` | `https://ardp.my.id/api/broadcast/{id}/pause` | Jeda sementara pengiriman broadcast |
| **Status Broadcast** | `GET` | `/api/broadcast/{id}` | `https://ardp.my.id/api/broadcast/{id}` | Cek progres, statistik pengiriman, dan pesan gagal |
| **Manajemen Kontak** | `GET` / `POST` | `/api/contacts` | `https://ardp.my.id/api/contacts` | Ambil atau simpan data kontak penerima |
| **Import Kontak** | `POST` | `/api/contacts/import` | `https://ardp.my.id/api/contacts/import` | Import batch kontak penerima dari array/CSV |
| **Blacklist & DND** | `GET` / `POST` | `/api/blacklist` | `https://ardp.my.id/api/blacklist` | Blokir nomor dari broadcast & balasan otomatis |
| **Aturan Auto-Reply** | `GET` / `POST` | `/api/autoreply` | `https://ardp.my.id/api/autoreply` | Kelola aturan bot auto-reply & keyword trigger |
| **Device WhatsApp** | `GET` | `/api/gateway/sessions` | `https://ardp.my.id/api/gateway/sessions` | Cek status koneksi nomor WhatsApp yang aktif |
| **Inbound Webhook** | `GET` / `POST` | `/api/webhooks` | `https://ardp.my.id/api/webhooks` | Daftarkan URL webhook untuk menerima event real-time |

---

## 4. Format Payload Kirim Pesan (`POST /api/v1/messages/send`)

### A. Kirim Pesan Teks Biasa dengan Spintax
```json
{
  "to": "6281234567890",
  "message": "{Halo|Hai|Selamat pagi} Kak {{name}}, tagihan Anda sebesar {{total}} telah terbit.",
  "deviceId": "auto_rotate"
}
```

### B. Kirim Menggunakan Shortcode Template
```json
{
  "to": "6281234567890",
  "template": "tpl_order_notif",
  "deviceId": "auto_rotate",
  "variables": {
    "name": "Budi Santoso",
    "order_id": "INV-2026-9812",
    "total": "Rp 350.000"
  }
}
```

### C. Kirim Pesan Media (Gambar / Dokumen PDF)
```json
{
  "to": "6281234567890",
  "message": "Berikut invoice pesanan Anda:",
  "mediaUrl": "https://example.com/files/invoice-INV-9812.pdf",
  "mediaType": "document",
  "fileName": "Invoice-INV-9812.pdf",
  "deviceId": "auto_rotate"
}
```

---

## 5. Inbound Webhook Events & Format Payload

Ketika ada event WhatsApp, Waply mengirimkan HTTP `POST` ke endpoint webhook Anda:

| Event ID | Kapan Dipicu |
| :--- | :--- |
| `message.received` | Pesan baru masuk dari customer |
| `message.sent` | Pesan berhasil dikirim dari sistem |
| `message.delivered` | Pesan telah terkirim ke HP penerima (centang dua abu-abu) |
| `message.read` | Pesan telah dibaca oleh penerima (centang biru) |
| `device.connected` | Sesi device WhatsApp berhasil terhubung ke server |
| `device.disconnected`| Sesi device WhatsApp terputus |

### Contoh Payload Webhook Masuk (`message.received`):
```json
{
  "event": "message.received",
  "timestamp": "2026-09-10T00:30:00.000Z",
  "deviceId": "dev_1788886430266",
  "data": {
    "messageId": "msg_981247192",
    "from": "6281234567890",
    "senderName": "Budi Santoso",
    "text": "Halo, saya mau konfirmasi pembayaran order #9812",
    "messageType": "conversation",
    "mediaUrl": null
  }
}
```

---

## 6. Contoh Implementasi Multi-Language SDK

### A. TypeScript / Node.js (Axios)
```typescript
import axios from "axios";

const waply = axios.create({
  baseURL: "https://ardp.my.id",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.WAPLY_API_KEY}`,
  },
});

// 1. Kirim pesan template
export async function sendTemplateNotification(phone: string, name: string, invoice: string) {
  const { data } = await waply.post("/api/v1/messages/send", {
    to: phone,
    template: "tpl_order_notif",
    deviceId: "auto_rotate",
    variables: { name, order_id: invoice },
  });
  return data;
}

// 2. Buat Broadcast Massal
export async function createBroadcast(title: string, recipients: Array<{ phoneNumber: string; name: string }>) {
  const { data } = await waply.post("/api/broadcast", {
    name: title,
    messageTemplate: "{Halo|Hai} {{name}}, promo spesial minggu ini!",
    batchSize: 10,
    batchDelaySec: 60,
    recipients,
  });
  return data;
}
```

### B. PHP (cURL / Laravel Http Client)
```php
<?php
// Laravel Http Client
use Illuminate\Support\Facades\Http;

$response = Http::withHeaders([
    'Authorization' => 'Bearer ' . env('WAPLY_API_KEY'),
    'Content-Type'  => 'application/json',
])->post('https://ardp.my.id/api/v1/messages/send', [
    'to'       => '6281234567890',
    'template' => 'tpl_order_notif',
    'deviceId' => 'auto_rotate',
    'variables'=> [
        'name'     => 'Budi Santoso',
        'order_id' => 'INV-2026-9812',
    ],
]);

return $response->json();
?>
```

### C. Python (Requests / FastAPI)
```python
import requests
import os

WAPLY_API_KEY = os.getenv("WAPLY_API_KEY")
BASE_URL = "https://ardp.my.id"

def send_whatsapp(to_number: str, template: str, variables: dict):
    headers = {
        "Authorization": f"Bearer {WAPLY_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "to": to_number,
        "template": template,
        "deviceId": "auto_rotate",
        "variables": variables,
    }
    response = requests.post(f"{BASE_URL}/api/v1/messages/send", json=payload, headers=headers)
    return response.json()
```

### D. Go (Golang)
```go
package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os"
)

func SendWhatsApp(to, template string, variables map[string]string) (*http.Response, error) {
	payload := map[string]interface{}{
		"to":        to,
		"template":  template,
		"deviceId":  "auto_rotate",
		"variables": variables,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://ardp.my.id/api/v1/messages/send", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("WAPLY_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	return client.Do(req)
}
```

### E. Flutter / Dart
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> sendWhatsAppNotification({
  required String phone,
  required String name,
  required String invoiceNo,
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
      'template': 'tpl_order_notif',
      'deviceId': 'auto_rotate',
      'variables': {'name': name, 'order_id': invoiceNo},
    }),
  );
  print('Response status: ${response.statusCode}');
}
```

---

## 7. Standar Kode Response HTTP & Anti-Ban Best Practices

| Kode HTTP | Arti | Penjelasan Solusi |
| :--- | :--- | :--- |
| `200 OK` | Berhasil | Pesan atau kampanye berhasil diterima dan diproses antrean |
| `400 Bad Request` | Parameter Salah | Periksa format nomor telepon (wajib kode negara tanpa tanda `+`, contoh `62812...`) |
| `401 Unauthorized` | API Key Tidak Valid | Pastikan header `Authorization: Bearer <API_KEY>` disertakan |
| `403 Forbidden` | Fitur Terkunci | Fitur belum termasuk pada paket langganan Anda saat ini |
| `429 Too Many Requests` | Melebihi Kuota | Kuota pengiriman harian/bulanan paket telah habis atau rate-limit tercapai |
| `500 Internal Error` | Kesalahan Server | Gateway sedang memproses ulang koneksi WhatsApp device |

### 🛡️ Best Practices Anti-Banned:
1. **Gunakan Spintax:** Selalu gunakan variasi kata pembuka `{Halo|Hai|Selamat Siang}` dan penutup agar hash teks pesan unik.
2. **Aktifkan Fitur Auto-Rotate Device:** Gunakan `"deviceId": "auto_rotate"` agar beban pesan terbagi rata ke seluruh nomor WhatsApp yang terhubung.
3. **Patuhi Batas Warm-up:** Untuk nomor baru, gunakan fitur *Device Warmup* untuk menaikkan kuota harian secara bertahap.
4. **Jeda Antar Pesan:** Sistem otomatis menerapkan delay acak (4–12 detik) dan simulasi *Human Typing* sebelum pesan dikirim.

