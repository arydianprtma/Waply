export interface PaymentChannelDefinition {
  id: string;
  name: string;
  description: string;
  category: "Virtual Account" | "E-Wallet & QR" | "Kartu & Lainnya";
  badge?: string;
  iconName?: "QrCode" | "Building2" | "Smartphone" | "CreditCard";
}

export const AVAILABLE_PAYMENT_CHANNELS: PaymentChannelDefinition[] = [
  {
    id: "bri_va",
    name: "BRI (BRIVA)",
    description: "Transfer via BRImo, Internet Banking BRI, atau ATM BRI.",
    category: "Virtual Account",
    badge: "AKTIF",
    iconName: "Building2",
  },
  {
    id: "qris",
    name: "QRIS Semua Bank & E-Wallet",
    description: "BCA Mobile, GoPay, OVO, Dana, ShopeePay, Mandiri Livin, BRImo, dll.",
    category: "E-Wallet & QR",
    badge: "INSTAN",
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
    name: "ShopeePay",
    description: "Bayar instan via aplikasi ShopeePay atau scan QR.",
    category: "E-Wallet & QR",
    iconName: "Smartphone",
  },
  {
    id: "credit_card",
    name: "Kartu Kredit / Debit",
    description: "Visa, MasterCard, JCB, American Express.",
    category: "Kartu & Lainnya",
    iconName: "CreditCard",
  },
];

export const DEFAULT_ENABLED_PAYMENT_CHANNELS = [
  "bri_va",
];
