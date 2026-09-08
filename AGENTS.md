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

# Panduan Arsitektur Base URL & REST API Sendora

Dokumen ini memuat standar teknis dan panduan integrasi REST API Sendora untuk developer dan sistem client.

## 1. Konsep Dasar: Base URL vs Endpoint Path

Dalam memanggil API Sendora, URL lengkap terbentuk dari penggabungan **Base URL (Host Server)** dan **Endpoint Path**:

$$\text{Full API URL} = \text{Base URL (Host)} + \text{Endpoint Path}$$

### A. Base URL (Host Server)
- **Produksi (Live Public Domain):** `https://ardp.my.id`
- **Development / Localhost:** `http://localhost:3001`

> **Catatan Penting:** Base URL adalah alamat root domain server (`https://ardp.my.id`). Jangan menambahkan sub-path pada konfigurasi `baseURL` di HTTP client (seperti Axios) jika Anda memanggil endpoint dengan prefix yang berbeda (`/api/v1/...` vs `/api/...`).

---

## 2. Direktori Lengkap Endpoint REST API

| Kategori | Method | Endpoint Path | Full URL (Produksi) | Fungsi Utama |
| :--- | :---: | :--- | :--- | :--- |
| **Pesan & Template** | `POST` | `/api/v1/messages/send` | `https://ardp.my.id/api/v1/messages/send` | Kirim pesan teks, media, atau template shortcode |
| **Pustaka Template** | `GET` | `/api/v1/templates` | `https://ardp.my.id/api/v1/templates` | Ambil daftar shortcode template milik akun |
| **Broadcast Campaign** | `POST` | `/api/broadcast` | `https://ardp.my.id/api/broadcast` | Buat kampanye pesan massal (broadcast) |
| **Jalankan Broadcast** | `POST` | `/api/broadcast/{id}/start` | `https://ardp.my.id/api/broadcast/{id}/start` | Trigger pengiriman kampanye broadcast |
| **Status Broadcast** | `GET` | `/api/broadcast/{id}` | `https://ardp.my.id/api/broadcast/{id}` | Cek progres dan statistik kampanye |
| **Manajemen Kontak** | `GET` / `POST` | `/api/contacts` | `https://ardp.my.id/api/contacts` | Ambil atau tambah data kontak penerima |
| **Device WhatsApp** | `GET` | `/api/gateway/sessions` | `https://ardp.my.id/api/gateway/sessions` | Cek status koneksi nomor WhatsApp |

---

## 3. Format Autentikasi HTTP Header

Semua request wajib menyertakan API Key akun yang dibuat melalui menu **Dashboard > API Keys**:

```http
Authorization: Bearer snd_live_YOUR_API_KEY
Content-Type: application/json
```

*Atau menggunakan custom header:*
```http
X-API-Key: snd_live_YOUR_API_KEY
```

---

## 4. Contoh Implementasi di Aplikasi Client

### Contoh A: Menggunakan Template Shortcode (`POST /api/v1/messages/send`)
Client cukup mengirimkan `template` (shortcode) beserta object `variables` tanpa perlu menulis ulang isi template:

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

### Contoh B: Node.js / TypeScript (Axios Best Practice)

```typescript
import axios from "axios";

const sendora = axios.create({
  baseURL: "https://ardp.my.id",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.SENDORA_API_KEY}`,
  },
});

// 1. Kirim pesan template
async function sendNotification(phone: string, name: string, invoice: string) {
  const response = await sendora.post("/api/v1/messages/send", {
    to: phone,
    template: "tpl_order_notif",
    deviceId: "auto_rotate",
    variables: { name, order_id: invoice },
  });
  return response.data;
}

// 2. Buat broadcast campaign
async function createBroadcast(campaignName: string, recipients: Array<{ phoneNumber: string; name: string }>) {
  const response = await sendora.post("/api/broadcast", {
    name: campaignName,
    messageTemplate: "Halo {{name}}, info promo minggu ini!",
    batchSize: 10,
    batchDelaySec: 60,
    recipients,
  });
  return response.data;
}
```

### Contoh C: PHP (cURL)

```php
<?php
$baseUrl = "https://ardp.my.id";
$apiKey = "snd_live_YOUR_API_KEY";

$payload = [
    "to" => "6281234567890",
    "template" => "tpl_order_notif",
    "deviceId" => "auto_rotate",
    "variables" => [
        "name" => "Budi Santoso",
        "order_id" => "INV-2026-9812"
    ]
];

$ch = curl_init("$baseUrl/api/v1/messages/send");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "Authorization: Bearer $apiKey"
    ],
    CURLOPT_POSTFIELDS => json_encode($payload)
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>
```

