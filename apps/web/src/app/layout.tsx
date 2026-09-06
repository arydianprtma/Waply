import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Sendora - WhatsApp Gateway & Messaging API SaaS",
  description: "Simple Messaging, Powerful Automation. WhatsApp Gateway & Messaging API for developers and businesses.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/favicon-32x32.png?v=2", type: "image/png", sizes: "32x32" },
      { url: "/sendora-icon.png?v=2", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/apple-icon.png?v=2",
  },
};

import { DialogProvider } from "@/components/confirm-dialog";
import NextTopLoader from "nextjs-toploader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-theme="sendoraLight">
      <head>
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png?v=2" />
      </head>
      <body className={`${plusJakartaSans.className} antialiased`}>
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
      </body>
    </html>
  );
}

