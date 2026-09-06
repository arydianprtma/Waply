import nodemailer from "nodemailer";

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
 * Creates and returns the nodemailer SMTP transporter using environment variables.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

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
 * Generate modern, enterprise-grade responsive HTML email template for invoices and receipts.
 * Designed with bulletproof table layout for 100% compatibility across Gmail, Apple Mail, Outlook, and mobile.
 */
function generateEmailHtml(params: EmailInvoiceParams): string {
  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(params.amount);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sendora.id";
  const dateStr = new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isPaid = params.status === "PAID";
  const statusBg = isPaid ? "#ecfdf5" : "#fffbeb";
  const statusBorder = isPaid ? "#a7f3d0" : "#fde68a";
  const statusColor = isPaid ? "#059669" : "#d97706";
  const statusText = isPaid ? "LUNAS (AKTIF)" : "MENUNGGU PEMBAYARAN";
  const statusBadge = isPaid ? "Pembayaran Berhasil" : "Menunggu Pembayaran";
  const headerBg = isPaid
    ? "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0d9488 100%)"
    : "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="id">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${isPaid ? "Bukti Pembayaran Resmi - Sendora" : "Tagihan Pesanan Baru - Sendora"}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0;">
          
          <!-- Brand & Header Banner -->
          <tr>
            <td style="padding: 40px 32px 32px; background: ${headerBg}; text-align: center;">
              
              <!-- Brand Logo / Badge -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: rgba(255, 255, 255, 0.12); padding: 8px 16px; border-radius: 9999px; border: 1px solid rgba(255, 255, 255, 0.2);">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 10px; height: 10px; background-color: #10b981; border-radius: 50%; display: inline-block; margin-right: 8px;"></td>
                        <td style="color: #ffffff; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;">SENDORA GATEWAY</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Status Badge Pill -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
                <tr>
                  <td style="background-color: ${isPaid ? "#10b981" : "#f59e0b"}; color: #ffffff; font-size: 12px; font-weight: 800; padding: 5px 14px; border-radius: 9999px; letter-spacing: 0.04em; text-transform: uppercase;">
                    ${statusBadge}
                  </td>
                </tr>
              </table>

              <h1 style="margin: 0 0 10px; color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: -0.02em; line-height: 1.2;">
                ${isPaid ? "Bukti Pembayaran Resmi" : "Tagihan Pesanan Baru"}
              </h1>

              <p style="margin: 0; color: #cbd5e1; font-size: 13px; font-family: monospace, sans-serif; letter-spacing: 0.03em;">
                ORDER ID: <span style="color: #ffffff; font-weight: 700;">${params.orderId}</span>
              </p>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #334155;">
                Halo <strong style="color: #0f172a;">${params.customerName || "Pelanggan Sendora"}</strong>,
              </p>
              <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #475569;">
                ${
                  isPaid
                    ? "Terima kasih atas kepercayaan Anda. Pembayaran langganan <strong>Sendora WhatsApp Gateway</strong> telah diverifikasi dan paket Anda telah <strong>AKTIF</strong> sepenuhnya."
                    : "Pesanan langganan baru Anda telah kami terima. Silakan selesaikan pembayaran Anda sebelum batas waktu berakhir agar layanan dapat langsung aktif secara otomatis."
                }
              </p>

              <!-- Total Amount Card -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: ${isPaid ? "#f0fdf4" : "#f8fafc"}; border: 1.5px solid ${isPaid ? "#bbf7d0" : "#e2e8f0"}; border-radius: 16px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px 20px; text-align: center;">
                    <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: ${isPaid ? "#15803d" : "#64748b"}; margin-bottom: 6px;">
                      ${isPaid ? "JUMLAH TOTAL DITERIMA" : "TOTAL JUMLAH TAGIHAN"}
                    </div>
                    <div style="font-size: 34px; font-weight: 900; color: ${isPaid ? "#166534" : "#0f172a"}; letter-spacing: -0.03em; line-height: 1.1;">
                      ${formattedAmount}
                    </div>
                    <div style="margin-top: 8px;">
                      <span style="display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; background-color: ${isPaid ? "#dcfce7" : "#e2e8f0"}; color: ${isPaid ? "#166534" : "#334155"};">
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
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #faf5ff; border: 2px dashed #a855f7; border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 11px; font-weight: 800; color: #7e22ce; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">
                      NOMOR VIRTUAL ACCOUNT
                    </div>
                    <div style="font-family: monospace; font-size: 24px; font-weight: 900; letter-spacing: 3px; color: #581c87; margin: 4px 0;">
                      ${params.vaNumber}
                    </div>
                    <div style="font-size: 12px; color: #6b21a8; font-weight: 600;">
                      Metode Transfer: ${params.paymentMethod || "Bank Transfer"}
                    </div>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <!-- Itemized Receipt Details Table -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; margin-bottom: 28px;">
                <tr>
                  <td colspan="2" style="background-color: #f8fafc; padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">
                    Rincian Transaksi
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; font-size: 13px; color: #64748b; font-weight: 500; border-bottom: 1px solid #f1f5f9; width: 42%;">
                    Layanan & Paket
                  </td>
                  <td style="padding: 14px 18px; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #f1f5f9;">
                    Sendora ${params.planName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; font-size: 13px; color: #64748b; font-weight: 500; border-bottom: 1px solid #f1f5f9;">
                    Metode Pembayaran
                  </td>
                  <td style="padding: 14px 18px; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #f1f5f9;">
                    ${params.paymentMethod || "QRIS / Instant Payment"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; font-size: 13px; color: #64748b; font-weight: 500; border-bottom: 1px solid #f1f5f9;">
                    Waktu Transaksi
                  </td>
                  <td style="padding: 14px 18px; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #f1f5f9;">
                    ${dateStr} WIB
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; font-size: 13px; color: #64748b; font-weight: 500;">
                    Status Saat Ini
                  </td>
                  <td style="padding: 14px 18px; font-size: 12px; font-weight: 800; text-align: right;">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background-color: ${statusBg}; border: 1px solid ${statusBorder}; color: ${statusColor};">
                      ${statusText}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Primary Action CTA Button -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" style="margin: auto;">
                      <tr>
                        <td align="center" style="border-radius: 14px; background-color: #059669; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35);">
                          <a href="${appUrl}/dashboard/billing" target="_blank" style="display: inline-block; padding: 16px 36px; font-size: 15px; font-weight: 800; color: #ffffff; text-decoration: none; border-radius: 14px; letter-spacing: 0.02em;">
                            ${isPaid ? "Buka Dashboard Sendora &rarr;" : "Lihat Status & Bayar Sekarang &rarr;"}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Security & Guarantee Info Note -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
                <tr>
                  <td style="padding: 14px 16px; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
                    <strong>Transaksi Terenkripsi Aman:</strong> Diproses secara resmi melalui Midtrans Payment Gateway. Sistem akan langsung mengaktifkan kuota dan fitur secara instan setelah pembayaran terverifikasi.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="padding: 28px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #334155;">
                Sendora WhatsApp Gateway & Messaging API
              </p>
              <p style="margin: 0 0 12px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                Solusi gateway pesan WhatsApp cepat, aman, dan handal untuk bisnis modern.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Sendora. Hak Cipta Dilindungi. • <a href="${appUrl}" style="color: #059669; text-decoration: none; font-weight: 600;">${appUrl.replace(/^https?:\/\//, "")}</a>
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
      ? `[LUNAS] Bukti Pembayaran Resmi - Sendora ${params.planName} (#${params.orderId})`
      : `[TAGIHAN] Rincian Tagihan Pesanan Sendora ${params.planName} (#${params.orderId})`;

    const htmlContent = generateEmailHtml(params);
    const fromAddress = process.env.SMTP_FROM || `"Sendora Gateway" <${process.env.SMTP_USER || "no-reply@sendora.id"}>`;

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sendora.id";
  const headerBg = "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="id">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Password Akun Sendora</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0;">
          
          <!-- Brand & Header Banner -->
          <tr>
            <td style="padding: 40px 32px 32px; background: ${headerBg}; text-align: center;">
              <!-- Brand Logo / Badge -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: rgba(255, 255, 255, 0.12); padding: 8px 16px; border-radius: 9999px; border: 1px solid rgba(255, 255, 255, 0.2);">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 10px; height: 10px; background-color: #10b981; border-radius: 50%; display: inline-block; margin-right: 8px;"></td>
                        <td style="color: #ffffff; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;">SENDORA GATEWAY</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Status Badge Pill -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
                <tr>
                  <td style="background-color: #0284c7; color: #ffffff; font-size: 12px; font-weight: 800; padding: 5px 14px; border-radius: 9999px; letter-spacing: 0.04em; text-transform: uppercase;">
                    Keamanan Akun
                  </td>
                </tr>
              </table>

              <h1 style="margin: 0 0 10px; color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: -0.02em; line-height: 1.2;">
                Permintaan Reset Password
              </h1>

              <p style="margin: 0; color: #cbd5e1; font-size: 13px;">
                Pemulihan akses dan keamanan kata sandi akun Sendora Anda
              </p>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px;">
              <!-- Greeting -->
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #334155;">
                Halo <strong style="color: #0f172a;">${params.customerName || params.customerEmail}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #475569;">
                Kami menerima permintaan untuk mengatur ulang kata sandi (password) akun Sendora Anda. Untuk melanjutkan dan membuat kata sandi baru, silakan klik tombol konfirmasi di bawah ini:
              </p>

              <!-- CTA Button -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="border-radius: 14px; background-color: #059669; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
                          <a href="${params.resetUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; font-size: 15px; font-weight: 800; color: #ffffff; text-decoration: none; border-radius: 14px; letter-spacing: 0.02em;">
                            Atur Ulang Password Sekarang &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                      Informasi Keamanan Penting:
                    </div>
                    <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #475569; line-height: 1.6;">
                      <li>Tautan ini hanya berlaku selama <strong>60 menit</strong> sejak email ini dikirimkan.</li>
                      <li>Jika Anda tidak merasa mengajukan permintaan ini, Anda dapat mengabaikan email ini. Kata sandi Anda saat ini tetap aman dan tidak akan berubah.</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <div style="font-size: 12px; color: #64748b; line-height: 1.5; word-break: break-all; border-top: 1px dashed #e2e8f0; padding-top: 18px;">
                Jika tombol di atas tidak dapat diklik, salin dan tempel tautan berikut ke browser Anda:<br />
                <a href="${params.resetUrl}" style="color: #059669; text-decoration: underline;">${params.resetUrl}</a>
              </div>

            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="padding: 28px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #334155;">
                Sendora WhatsApp Gateway & Messaging API
              </p>
              <p style="margin: 0 0 12px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                Solusi gateway pesan WhatsApp cepat, aman, dan handal untuk bisnis modern.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Sendora. Hak Cipta Dilindungi. • <a href="${appUrl}" style="color: #059669; text-decoration: none; font-weight: 600;">${appUrl.replace(/^https?:\/\//, "")}</a>
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
 * Dispatch password reset email via configured SMTP.
 */
export async function sendEmailResetPassword(params: EmailResetPasswordParams): Promise<boolean> {
  try {
    if (!params.customerEmail || !params.customerEmail.includes("@")) {
      console.log("[Email Service] No valid customer email provided for password reset.");
      return false;
    }

    const transporter = getTransporter();
    const subject = `[PEMULIHAN AKUN] Tautan Atur Ulang Password Akun Sendora`;
    const htmlContent = generateResetPasswordEmailHtml(params);
    const fromAddress = process.env.SMTP_FROM || `"Sendora Gateway" <${process.env.SMTP_USER || "no-reply@sendora.id"}>`;

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

