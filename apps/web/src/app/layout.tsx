import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#10b981",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://waply.web.id"),
  title: {
    default: "Waply - WhatsApp Gateway & Multi-Device Messaging API Indonesia",
    template: "%s | Waply",
  },
  description:
    "Layanan WhatsApp Gateway & Messaging API tercepat dan aman di Indonesia. Kirim pesan broadcast massal anti-banned, multi-device auto-rotate, warmup nomor bertahap, dan integrasi REST API mudah untuk developer dan bisnis.",
  keywords: [
    "whatsapp gateway indonesia",
    "api whatsapp murah",
    "whatsapp gateway multi device",
    "broadcast whatsapp anti banned",
    "wa gateway laravel",
    "whatsapp api nodejs",
    "kirim wa otomatis",
    "rest api whatsapp",
    "whatsapp auto reply bot",
    "spintax whatsapp gateway",
    "notifikasi whatsapp otomatis",
    "otp whatsapp gateway",
  ],
  authors: [{ name: "Waply", url: "https://waply.web.id" }],
  creator: "Waply",
  publisher: "Waply",
  alternates: {
    canonical: "https://waply.web.id",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://waply.web.id",
    siteName: "Waply",
    title: "Waply - WhatsApp Gateway & Multi-Device Messaging API Indonesia",
    description:
      "Infrastruktur WhatsApp Gateway tercepat dan aman di Indonesia. Multi-device auto-rotate, warmup anti-banned, dan REST API mudah untuk developer & bisnis.",
    images: [
      {
        url: "/waply_brand_logo_mockup.png",
        width: 1200,
        height: 630,
        alt: "Waply WhatsApp Gateway",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Waply - WhatsApp Gateway & Multi-Device Messaging API Indonesia",
    description:
      "Infrastruktur WhatsApp Gateway tercepat dan aman. Multi-device auto-rotate & REST API multi-bahasa.",
    images: ["/waply_brand_logo_mockup.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/waply-icon.png?v=6", type: "image/png" },
      { url: "/favicon.png?v=6", type: "image/png" },
      { url: "/favicon.ico?v=6" },
    ],
    shortcut: "/waply-icon.png?v=6",
    apple: "/apple-touch-icon.png?v=6",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://waply.web.id/#organization",
      "name": "Waply",
      "url": "https://waply.web.id",
      "logo": {
        "@type": "ImageObject",
        "url": "https://waply.web.id/waply-icon.png",
        "width": 512,
        "height": 512,
      },
      "description":
        "Layanan WhatsApp Gateway & Messaging API resmi di Indonesia untuk developer & bisnis.",
    },
    {
      "@type": "WebSite",
      "@id": "https://waply.web.id/#website",
      "url": "https://waply.web.id",
      "name": "Waply",
      "publisher": {
        "@id": "https://waply.web.id/#organization",
      },
      "inLanguage": "id-ID",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://waply.web.id/#software",
      "name": "Waply WhatsApp Gateway",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "IDR",
        "description": "Free trial 500 pesan tanpa kartu kredit",
      },
      "description":
        "Infrastruktur WhatsApp Gateway & Messaging API tercepat dan aman. Mendukung multi-device auto-rotate, warmup nomor otomatis, dan REST API multi-bahasa.",
    },
  ],
};

import { Plus_Jakarta_Sans } from "next/font/google";
import { DialogProvider } from "@/components/confirm-dialog";
import { ThemeProvider, themeInitScript } from "@/components/theme-provider";
import NextTopLoader from "nextjs-toploader";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakartaSans.variable} data-theme="waplyLight" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="icon" type="image/png" href="/waply-icon.png?v=6" />
        <link rel="shortcut icon" href="/waply-icon.png?v=6" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=6" />
      </head>
      <body
        className={`${plusJakartaSans.className} font-sans antialiased`}
        suppressHydrationWarning
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
      >
        <ThemeProvider>
          <NextTopLoader
            color="#10b981"
            initialPosition={0.25}
            crawlSpeed={80}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease-out"
            speed={100}
            shadow="0 0 12px #10b981,0 0 4px #059669"
            zIndex={99999}
          />
          <DialogProvider>
            {children}
          </DialogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

