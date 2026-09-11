import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#10b981",
};

export const metadata: Metadata = {
  title: "Waply - WhatsApp Gateway & Multi-Device Messaging API SaaS",
  description: "Infrastruktur WhatsApp Gateway & Messaging API tercepat dan aman untuk developer dan bisnis.",
  icons: {
    icon: [
      { url: "/favicon.png?v=3", type: "image/png" },
      { url: "/icon.png?v=3", type: "image/png" },
      { url: "/favicon.ico?v=3" },
    ],
    shortcut: "/favicon.png?v=3",
    apple: "/apple-touch-icon.png?v=3",
  },
};

import { DialogProvider } from "@/components/confirm-dialog";
import { ThemeProvider, themeInitScript } from "@/components/theme-provider";
import NextTopLoader from "nextjs-toploader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-theme="waplyLight" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="icon" type="image/png" href="/favicon.png?v=3" />
        <link rel="shortcut icon" href="/favicon.png?v=3" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3" />
      </head>
      <body
        className={`${plusJakartaSans.className} antialiased`}
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

