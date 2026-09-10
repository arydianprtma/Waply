export interface PaymentChannelDefinition {
  id: string;
  name: string;
  description: string;
  category: "E-Wallet & QR" | "Virtual Account" | "Pop-up Gateway";
  badge?: string;
  iconName?: "QrCode" | "Building2" | "Smartphone" | "CreditCard";
}

export const AVAILABLE_PAYMENT_CHANNELS: PaymentChannelDefinition[] = [
  {
    id: "qris",
    name: "QRIS Nasional",
    description: "BCA Mobile, GoPay, OVO, Dana, ShopeePay, Mandiri Livin, BRImo, dll.",
    category: "E-Wallet & QR",
    badge: "TERCEPAT & PRAKTIS",
    iconName: "QrCode",
  },
  {
    id: "bca_va",
    name: "BCA Virtual Account",
    description: "Transfer via BCA Mobile, myBCA, KlikBCA, atau ATM BCA.",
    category: "Virtual Account",
    badge: "POPULER",
    iconName: "Building2",
  },
  {
    id: "mandiri_va",
    name: "Mandiri Bill / VA",
    description: "Transfer via Livin by Mandiri atau ATM Mandiri.",
    category: "Virtual Account",
    iconName: "Building2",
  },
  {
    id: "bri_va",
    name: "BRI (BRIVA)",
    description: "Transfer via BRImo, Internet Banking BRI, atau ATM BRI.",
    category: "Virtual Account",
    iconName: "Building2",
  },
  {
    id: "bni_va",
    name: "BNI Virtual Account",
    description: "Transfer via BNI Mobile Banking atau ATM BNI.",
    category: "Virtual Account",
    iconName: "Building2",
  },
  {
    id: "permata_va",
    name: "Permata Virtual Account",
    description: "Transfer via PermataMobile X, PermataNet, atau ATM Permata.",
    category: "Virtual Account",
    iconName: "Building2",
  },
  {
    id: "cimb_va",
    name: "CIMB Virtual Account",
    description: "Transfer via OCTO Mobile, OCTO Clicks, atau ATM CIMB Niaga.",
    category: "Virtual Account",
    iconName: "Building2",
  },
  {
    id: "gopay",
    name: "GoPay & QRIS",
    description: "Bayar instan via aplikasi GoPay atau scan QR.",
    category: "E-Wallet & QR",
    iconName: "Smartphone",
  },
  {
    id: "shopeepay",
    name: "ShopeePay & QRIS",
    description: "Bayar instan via aplikasi ShopeePay atau scan QR.",
    category: "E-Wallet & QR",
    iconName: "Smartphone",
  },
  {
    id: "snap",
    name: "Midtrans Snap Modal (Kartu Kredit & Semua Saluran)",
    description: "Popup payment modal Midtrans dengan opsi Kartu Kredit, Debit, & alternatif lainnya.",
    category: "Pop-up Gateway",
    iconName: "CreditCard",
  },
];

export const DEFAULT_ENABLED_PAYMENT_CHANNELS = [
  "qris",
  "bca_va",
  "mandiri_va",
  "bri_va",
  "bni_va",
  "gopay",
  "snap",
];
