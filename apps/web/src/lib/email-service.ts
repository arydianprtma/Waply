import nodemailer from "nodemailer";
import { getAdminSettings } from "./admin-settings";

interface EmailInvoiceParams {
  orderId: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  amount: number;
  status: "PENDING" | "PAID";
  paymentMethod?: string | null;
  vaNumber?: string | null;
  paymentUrl?: string | null;
}

/**
 * Creates and returns the nodemailer SMTP transporter using admin settings or environment variables.
 */
function getTransporter() {
  let host = process.env.SMTP_HOST || "smtp.resend.com";
  let port = Number(process.env.SMTP_PORT) || 465;
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;

  try {
    const settings = getAdminSettings();
    if (settings?.smtpConfig) {
      if (settings.smtpConfig.host) host = settings.smtpConfig.host;
      if (settings.smtpConfig.port) port = Number(settings.smtpConfig.port);
      if (settings.smtpConfig.username) user = settings.smtpConfig.username;
      if (settings.smtpConfig.password) pass = settings.smtpConfig.password;
    }
  } catch {
    // Fallback to process.env
  }

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Resolves Support / Transactional sender address.
 */
export function getSupportSenderAddress(): string {
  try {
    const settings = getAdminSettings();
    const email = settings?.smtpConfig?.fromEmail || process.env.SMTP_FROM || "support@waply.web.id";
    const name = settings?.smtpConfig?.fromName || "Waply Support";
    return sanitizeSenderAddress(email, "support@waply.web.id", name);
  } catch {
    return sanitizeSenderAddress(process.env.SMTP_FROM, "support@waply.web.id", "Waply Support");
  }
}

/**
 * Resolves No-Reply / OTP / Security sender address.
 */
export function getNoreplySenderAddress(): string {
  try {
    const settings = getAdminSettings();
    const email = settings?.smtpConfig?.noreplyEmail || process.env.SMTP_NOREPLY_FROM || "noreply@waply.web.id";
    const name = settings?.smtpConfig?.noreplyName || "Waply Security";
    return sanitizeSenderAddress(email, "noreply@waply.web.id", name);
  } catch {
    return sanitizeSenderAddress(process.env.SMTP_NOREPLY_FROM, "noreply@waply.web.id", "Waply Security");
  }
}

/**
 * Normalizes email 'from' headers to clean 'Name <email@domain>' or 'email@domain' format.
 * Strips corrupted JSON escapes, outer backslashes, or quotes.
 */
export function sanitizeSenderAddress(raw: string | undefined, defaultEmail: string, defaultName: string): string {
  if (!raw || !raw.trim()) {
    return `${defaultName} <${defaultEmail}>`;
  }
  let clean = raw.trim();
  // Strip backslashes, wrapping quotes, and escaped quotes
  clean = clean.replace(/\\"/g, "").replace(/^["']|["']$/g, "").trim();
  
  const match = clean.match(/(.*)<([^>]+)>/);
  if (match) {
    const name = match[1].replace(/["']/g, "").trim();
    const email = match[2].trim();
    return name ? `${name} <${email}>` : email;
  }
  
  if (clean.includes("@")) {
    return `${defaultName} <${clean}>`;
  }
  
  return `${defaultName} <${defaultEmail}>`;
}

/**
 * Generate modern, enterprise-grade responsive HTML email template for invoices and receipts.
 * Designed with bulletproof table layout for 100% compatibility across Gmail, Apple Mail, Outlook, and mobile.
 */
function generateEmailHtml(params: EmailInvoiceParams): string {
  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(params.amount);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://waply.id";
  const dateStr = new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isPaid = params.status === "PAID";
  const badgeText = isPaid ? "PEMBAYARAN LUNAS" : "TAGIHAN INVOICE";
  const badgeBg = isPaid ? "#ecfdf5" : "#fffbeb";
  const badgeBorder = isPaid ? "#a7f3d0" : "#fde68a";
  const badgeColor = isPaid ? "#059669" : "#d97706";
  const statusText = isPaid ? "LUNAS (AKTIF)" : "MENUNGGU PEMBAYARAN";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="id">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${isPaid ? "Bukti Pembayaran Resmi - Waply" : "Tagihan Pesanan Baru - Waply"}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          
          <!-- Header Area -->
          <tr>
            <td style="padding: 32px 32px 24px; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
                      Waply<span style="color: #059669;">.</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; font-weight: 700; color: ${badgeColor}; background-color: ${badgeBg}; border: 1px solid ${badgeBorder}; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.02em;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 6px; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3; letter-spacing: -0.01em;">
                ${isPaid ? "Bukti Pembayaran Resmi" : "Tagihan Pesanan Baru"}
              </h1>

              <p style="margin: 0 0 20px; font-size: 12px; color: #64748b; font-family: monospace;">
                ORDER ID: <strong style="color: #0f172a;">${params.orderId}</strong>
              </p>

              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">
                Halo <strong>${params.customerName || "Pelanggan Waply"}</strong>,
              </p>

              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #475569;">
                ${
                  isPaid
                    ? "Terima kasih atas pembayaran Anda. Langganan <strong>Waply WhatsApp Gateway</strong> telah diverifikasi dan paket Anda telah <strong>AKTIF</strong> sepenuhnya."
                    : "Pesanan langganan baru Anda telah kami terima. Silakan selesaikan pembayaran sebelum batas waktu berakhir agar layanan dapat langsung aktif otomatis."
                }
              </p>

              <!-- Total Amount Box -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${isPaid ? "#059669" : "#64748b"}; margin-bottom: 6px;">
                      ${isPaid ? "JUMLAH TOTAL DITERIMA" : "TOTAL JUMLAH TAGIHAN"}
                    </div>
                    <div style="font-size: 30px; font-weight: 800; color: ${isPaid ? "#065f46" : "#0f172a"}; letter-spacing: -0.02em; line-height: 1.1;">
                      ${formattedAmount}
                    </div>
                    <div style="margin-top: 6px;">
                      <span style="display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; background-color: #ffffff; border: 1px solid #e2e8f0; color: #334155;">
                        Paket ${params.planName}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              ${
                !isPaid && params.vaNumber
                  ? `
              <!-- Virtual Account Box -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 1px dashed #10b981; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px; text-align: center;">
                    <div style="font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
                      NOMOR VIRTUAL ACCOUNT
                    </div>
                    <div style="font-family: monospace; font-size: 22px; font-weight: 800; letter-spacing: 2px; color: #065f46; margin: 4px 0;">
                      ${params.vaNumber}
                    </div>
                    <div style="font-size: 12px; color: #047857;">
                      Metode Transfer: ${params.paymentMethod || "Bank Transfer"}
                    </div>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <!-- Transaction Details Table -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 24px;">
                <tr>
                  <td colspan="2" style="background-color: #f8fafc; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em;">
                    Rincian Transaksi
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9; width: 44%;">
                    Layanan & Paket
                  </td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #0f172a; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">
                    Waply ${params.planName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">
                    Metode Pembayaran
                  </td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #0f172a; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">
                    ${params.paymentMethod || "QRIS / Instant Payment"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">
                    Waktu Transaksi
                  </td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #0f172a; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">
                    ${dateStr} WIB
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">
                    Status
                  </td>
                  <td style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-align: right;">
                    <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; background-color: ${badgeBg}; border: 1px solid ${badgeBorder}; color: ${badgeColor};">
                      ${statusText}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Primary Action CTA Button -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <a href="${appUrl}/dashboard/billing" target="_blank" style="display: block; width: 100%; box-sizing: border-box; text-align: center; background-color: #059669; color: #ffffff; padding: 13px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; min-height: 44px;">
                      ${isPaid ? "Buka Dashboard Waply" : "Lihat Status & Bayar Sekarang"}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b; text-align: center;">
                  Pembayaran diproses resmi dan aman via Midtrans Payment Gateway. Kuota dan fitur aktif otomatis setelah transaksi terverifikasi.
                </p>
              </div>

            </td>
          </tr>

          <!-- Minimal Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                Dikirim oleh sistem transaksi Waply &bull; <a href="${appUrl}" style="color: #64748b; text-decoration: none;">${appUrl.replace(/^https?:\/\//, "")}</a>
              </p>
            </td>
          </tr>

        </table>
        <!-- End Main Card -->
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Dispatch real transactional email to the customer.
 */
export async function sendEmailInvoiceNotification(params: EmailInvoiceParams): Promise<boolean> {
  try {
    if (!params.customerEmail || !params.customerEmail.includes("@")) {
      console.log("[Email Service] No valid customer email provided, skipping email dispatch.");
      return false;
    }

    const transporter = getTransporter();
    const isPaid = params.status === "PAID";
    const subject = isPaid
      ? `[LUNAS] Bukti Pembayaran Resmi - Waply ${params.planName} (#${params.orderId})`
      : `[TAGIHAN] Rincian Tagihan Pesanan Waply ${params.planName} (#${params.orderId})`;

    const htmlContent = generateEmailHtml(params);
    const fromAddress = getSupportSenderAddress();

    if (!transporter) {
      console.warn(
        `[Email Service] ⚠️ SMTP belum dikonfigurasi di .env.local (SMTP_USER & SMTP_PASS). Email simulasi dicatat untuk ${params.customerEmail} [Order: ${params.orderId}]`
      );
      return false;
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      to: params.customerEmail,
      subject,
      html: htmlContent,
    });

    console.log(
      `[Email Service] ✅ Email invoice berhasil terkirim ke ${params.customerEmail} (Message ID: ${info.messageId})`
    );
    return true;
  } catch (err: any) {
    console.error("[Email Service] ❌ Gagal mengirim email invoice:", err.message);
    return false;
  }
}

export interface EmailResetPasswordParams {
  customerEmail: string;
  customerName?: string;
  resetUrl: string;
}

/**
 * Generate responsive corporate HTML email template for password reset.
 */
function generateResetPasswordEmailHtml(params: EmailResetPasswordParams): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://waply.web.id";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="id">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Atur Ulang Kata Sandi</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          
          <!-- Header Area -->
          <tr>
            <td style="padding: 32px 32px 24px; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
                      Waply<span style="color: #059669;">.</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; font-weight: 700; color: #0284c7; background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.02em;">
                      KEAMANAN AKUN
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3; letter-spacing: -0.01em;">
                Permintaan atur ulang kata sandi
              </h1>

              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">
                Halo <strong>${params.customerName || params.customerEmail}</strong>,
              </p>

              <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #475569;">
                Kami menerima permintaan untuk mengatur ulang kata sandi akun Waply Anda. Silakan klik tombol di bawah untuk membuat kata sandi baru.
              </p>

              <!-- Action Button (Min 44px tap target) -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td>
                    <a href="${params.resetUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; text-align: center; background-color: #0f172a; color: #ffffff; padding: 13px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; min-height: 44px;">
                      Atur Ulang Kata Sandi
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #334155;">
                  Informasi Penting:
                </p>
                <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #64748b; line-height: 1.5;">
                  <li>Tautan ini kedaluwarsa dalam 60 menit.</li>
                  <li>Jika Anda tidak meminta ini, abaikan email ini dan kata sandi Anda tetap tidak berubah.</li>
                </ul>
              </div>

              <!-- Fallback Direct URL -->
              <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
                <p style="margin: 0 0 6px; font-size: 12px; color: #64748b;">
                  Jika tombol di atas tidak berfungsi, buka tautan berikut di peramban:
                </p>
                <p style="margin: 0; font-size: 11px; line-height: 1.4; word-break: break-all;">
                  <a href="${params.resetUrl}" style="color: #059669; text-decoration: underline;">${params.resetUrl}</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Minimal Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                Dikirim oleh sistem keamanan Waply &bull; <a href="${appUrl}" style="color: #64748b; text-decoration: none;">${appUrl.replace(/^https?:\/\//, "")}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Dispatch password reset email via configured SMTP.
 */
export async function sendEmailResetPassword(params: EmailResetPasswordParams): Promise<boolean> {
  try {
    if (!params.customerEmail || !params.customerEmail.includes("@")) {
      console.log("[Email Service] No valid customer email provided for password reset.");
      return false;
    }

    const transporter = getTransporter();
    const subject = `[PEMULIHAN AKUN] Tautan Atur Ulang Password Akun Waply`;
    const htmlContent = generateResetPasswordEmailHtml(params);
    const fromAddress = getNoreplySenderAddress();

    if (!transporter) {
      console.warn(
        `[Email Service] ⚠️ SMTP belum dikonfigurasi di .env.local (SMTP_USER & SMTP_PASS). Tautan reset password tercatat untuk ${params.customerEmail}: ${params.resetUrl}`
      );
      return false;
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      to: params.customerEmail,
      subject,
      html: htmlContent,
    });

    console.log(
      `[Email Service] ✅ Email reset password berhasil dikirim ke ${params.customerEmail} (Message ID: ${info.messageId})`
    );
    return true;
  } catch (err: any) {
    console.error("[Email Service] ❌ Gagal mengirim email reset password:", err.message);
    return false;
  }
}

export interface EmailVerificationParams {
  customerEmail: string;
  customerName?: string;
  verificationUrl: string;
}

function generateVerificationEmailHtml(params: EmailVerificationParams): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://waply.web.id";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="id">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verifikasi Alamat Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          
          <!-- Header Area -->
          <tr>
            <td style="padding: 32px 32px 24px; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
                      Waply<span style="color: #059669;">.</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; font-weight: 700; color: #059669; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.02em;">
                      VERIFIKASI AKUN
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3; letter-spacing: -0.01em;">
                Konfirmasi alamat email Anda
              </h1>

              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">
                Halo <strong>${params.customerName || params.customerEmail}</strong>,
              </p>

              <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #475569;">
                Terima kasih telah mendaftar di Waply. Untuk mengaktifkan akun dan memastikan keamanan akses WhatsApp Gateway Anda, silakan konfirmasi kepemilikan alamat email ini.
              </p>

              <!-- Action Button (Min 44px tap target) -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td>
                    <a href="${params.verificationUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; text-align: center; background-color: #059669; color: #ffffff; padding: 13px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; min-height: 44px;">
                      Konfirmasi Alamat Email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                  Tautan ini berlaku selama 24 jam. Jika Anda tidak merasa mendaftar di Waply, silakan abaikan email ini dan akun tidak akan diaktifkan.
                </p>
              </div>

              <!-- Fallback Direct URL -->
              <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
                <p style="margin: 0 0 6px; font-size: 12px; color: #64748b;">
                  Jika tombol di atas tidak berfungsi, buka tautan berikut di peramban:
                </p>
                <p style="margin: 0; font-size: 11px; line-height: 1.4; word-break: break-all;">
                  <a href="${params.verificationUrl}" style="color: #059669; text-decoration: underline;">${params.verificationUrl}</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Minimal Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                Dikirim oleh sistem keamanan Waply &bull; <a href="${appUrl}" style="color: #64748b; text-decoration: none;">${appUrl.replace(/^https?:\/\//, "")}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Dispatch new account email verification via SMTP.
 */
export async function sendEmailVerification(params: EmailVerificationParams): Promise<boolean> {
  try {
    if (!params.customerEmail || !params.customerEmail.includes("@")) {
      return false;
    }
    const transporter = getTransporter();
    const subject = `[VERIFIKASI AKUN] Konfirmasi Alamat Email Anda di Waply`;
    const htmlContent = generateVerificationEmailHtml(params);
    const fromAddress = getNoreplySenderAddress();

    if (!transporter) {
      console.warn(`[Email Service] SMTP belum dikonfigurasi untuk email verifikasi: ${params.customerEmail}`);
      return false;
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      to: params.customerEmail,
      subject,
      html: htmlContent,
    });
    console.log(`[Email Service] ✅ Email verifikasi berhasil dikirim ke ${params.customerEmail} (ID: ${info.messageId})`);
    return true;
  } catch (err: any) {
    console.error("[Email Service] ❌ Gagal mengirim email verifikasi:", err.message);
    return false;
  }
}

export interface EmailOtpParams {
  customerEmail: string;
  customerName?: string;
  otpCode: string;
  expiresInMinutes?: number;
}

/**
 * Generate corporate responsive HTML email for OTP codes following antislop design rules.
 */
function generateOtpEmailHtml(params: EmailOtpParams): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://waply.web.id";
  const minutes = params.expiresInMinutes || 5;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="id">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kode Autentikasi OTP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          
          <!-- Header Area -->
          <tr>
            <td style="padding: 32px 32px 24px; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
                      Waply<span style="color: #059669;">.</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; font-weight: 700; color: #059669; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.02em;">
                      AUTENTIKASI 2FA
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3; letter-spacing: -0.01em;">
                Kode verifikasi OTP Anda
              </h1>

              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">
                Halo <strong>${params.customerName || params.customerEmail}</strong>,
              </p>

              <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #475569;">
                Gunakan kode verifikasi berikut untuk menyelesaikan proses autentikasi akun Waply Anda. Jangan berikan kode ini kepada siapa pun, termasuk pihak yang mengatasnamakan Waply.
              </p>

              <!-- OTP Code Display Card -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px;">
                <tr>
                  <td align="center" style="padding: 24px 16px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 8px;">
                      KODE VERIFIKASI SEMENTARA
                    </div>
                    <div style="font-size: 36px; font-weight: 800; font-family: monospace, sans-serif; letter-spacing: 0.25em; color: #0f172a; line-height: 1;">
                      ${params.otpCode}
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
                      Berlaku selama <strong>${minutes} menit</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                  Jika Anda tidak sedang melakukan permintaan masuk atau tindakan verifikasi ini, amankan akun Anda segera atau hubungi tim customer service kami.
                </p>
              </div>

            </td>
          </tr>

          <!-- Minimal Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                Dikirim oleh sistem keamanan Waply &bull; <a href="${appUrl}" style="color: #64748b; text-decoration: none;">${appUrl.replace(/^https?:\/\//, "")}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Dispatch OTP verification email via configured SMTP (noreply@waply.web.id).
 */
export async function sendEmailOtp(params: EmailOtpParams): Promise<boolean> {
  try {
    if (!params.customerEmail || !params.customerEmail.includes("@") || !params.otpCode) {
      return false;
    }
    const transporter = getTransporter();
    const subject = `[KODE OTP] ${params.otpCode} adalah Kode Verifikasi Akun Waply Anda`;
    const htmlContent = generateOtpEmailHtml(params);
    const fromAddress = getNoreplySenderAddress();

    if (!transporter) {
      console.warn(`[Email Service] SMTP belum dikonfigurasi untuk pengiriman OTP: ${params.customerEmail}`);
      return false;
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      to: params.customerEmail,
      subject,
      html: htmlContent,
    });
    console.log(`[Email Service] ✅ Email OTP berhasil dikirim ke ${params.customerEmail} (ID: ${info.messageId})`);
    return true;
  } catch (err: any) {
    console.error("[Email Service] ❌ Gagal mengirim email OTP:", err.message);
    return false;
  }
}

export interface EmailTicketNotificationParams {
  recipientEmail: string;
  recipientName: string;
  ticketId: string;
  subject: string;
  messagePreview: string;
  senderName: string;
  ticketUrl: string;
  actionType: "NEW_TICKET_ALERT_ADMIN" | "ADMIN_REPLY_TO_USER" | "ESCALATED_TO_HUMAN";
}

/**
 * Dispatch CS ticket notifications (both for customer and admin).
 */
export async function sendEmailTicketNotification(params: EmailTicketNotificationParams): Promise<boolean> {
  try {
    if (!params.recipientEmail || !params.recipientEmail.includes("@")) {
      return false;
    }
    const transporter = getTransporter();
    const isToAdmin = params.actionType === "NEW_TICKET_ALERT_ADMIN" || params.actionType === "ESCALATED_TO_HUMAN";
    const emailSubject = isToAdmin
      ? `[TIKET CS BARU #${params.ticketId}] ${params.subject}`
      : `[UPDATE TIKET #${params.ticketId}] Balasan Baru dari Tim CS Waply`;

    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tiket Bantuan Waply</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          
          <!-- Header Area -->
          <tr>
            <td style="padding: 32px 32px 24px; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
                      Waply<span style="color: #059669;">.</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; font-weight: 700; color: ${isToAdmin ? "#b45309" : "#047857"}; background-color: ${isToAdmin ? "#fef3c7" : "#ecfdf5"}; border: 1px solid ${isToAdmin ? "#fde68a" : "#a7f3d0"}; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.02em;">
                      TIKET #${params.ticketId}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3; letter-spacing: -0.01em;">
                ${isToAdmin ? "Tiket bantuan memerlukan respon" : "Pembaruan tiket bantuan Anda"}
              </h1>

              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">
                Halo <strong>${params.recipientName}</strong>,
              </p>

              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
                ${isToAdmin ? "Pengguna telah mengirimkan pesan tiket baru yang memerlukan perhatian tim:" : "Tim Customer Support Waply telah memberikan tanggapan baru:"}
              </p>

              <!-- Message Quote Box -->
              <div style="background-color: #f8fafc; border-left: 3px solid #059669; padding: 16px; border-radius: 6px; margin-bottom: 28px;">
                <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #64748b;">
                  Pesan dari ${params.senderName}:
                </p>
                <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.6; font-style: italic;">
                  "${params.messagePreview}"
                </p>
              </div>

              <!-- Action Button -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                <tr>
                  <td>
                    <a href="${params.ticketUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; text-align: center; background-color: #059669; color: #ffffff; padding: 13px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; min-height: 44px;">
                      Lihat Percakapan Tiket
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                Waply Support &bull; <a href="https://waply.web.id" style="color: #64748b; text-decoration: none;">waply.web.id</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

    const fromAddress = getSupportSenderAddress();

    if (!transporter) return false;

    await transporter.sendMail({
      from: fromAddress,
      to: params.recipientEmail,
      subject: emailSubject,
      html: htmlContent,
    });
    return true;
  } catch (err: any) {
    console.error("[Email Service] ❌ Gagal mengirim notifikasi tiket:", err.message);
    return false;
  }
}


