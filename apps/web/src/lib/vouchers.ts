import fs from "fs";
import path from "path";

export type DiscountType = "PERCENTAGE" | "FIXED";

export interface Voucher {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number; // e.g. 10 for 10%, or 20000 for Rp 20.000
  maxDiscountAmount?: number | null; // Maksimal potongan (khusus tipe percentage)
  minOrderAmount?: number; // Minimal belanja
  applicablePlans: string[]; // ["ALL"] or ["STARTER", "BUSINESS", "PRO"]
  applicablePeriods: string[]; // ["ALL"] or ["1", "3", "12"]
  usageLimit?: number | null; // Maksimal berapa kali voucher dapat digunakan (null = tanpa batas)
  usedCount: number; // Berapa kali sudah digunakan
  validFrom: string; // ISO date
  validUntil?: string | null; // ISO date / null jika tanpa kadaluarsa
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherValidationResult {
  valid: boolean;
  voucher?: Voucher;
  discountAmount: number;
  finalAmount: number;
  message?: string;
  error?: string;
}

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
const VOUCHERS_FILE = path.join(DATA_DIR, "vouchers.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export const DEFAULT_VOUCHERS: Voucher[] = [];

export function getAllVouchers(): Voucher[] {
  ensureDataDir();
  try {
    if (fs.existsSync(VOUCHERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(VOUCHERS_FILE, "utf-8"));
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch {}

  return [];
}

export function saveVoucher(voucher: Partial<Voucher> & { code: string; discountValue: number }): Voucher {
  ensureDataDir();
  const vouchers = getAllVouchers();
  const code = voucher.code.trim().toUpperCase().replace(/\s+/g, "");

  const existingIdx = vouchers.findIndex(
    (v) => v.id === voucher.id || v.code.toUpperCase() === code
  );

  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    const updated: Voucher = {
      ...vouchers[existingIdx],
      ...voucher,
      code,
      updatedAt: now,
    };
    vouchers[existingIdx] = updated;
    fs.writeFileSync(VOUCHERS_FILE, JSON.stringify(vouchers, null, 2), "utf-8");
    return updated;
  }

  const newVoucher: Voucher = {
    id: voucher.id || `vcr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    code,
    name: voucher.name || `Promo ${code}`,
    description: voucher.description || "",
    discountType: voucher.discountType || "PERCENTAGE",
    discountValue: Number(voucher.discountValue) || 0,
    maxDiscountAmount: voucher.maxDiscountAmount ? Number(voucher.maxDiscountAmount) : null,
    minOrderAmount: voucher.minOrderAmount ? Number(voucher.minOrderAmount) : 0,
    applicablePlans: voucher.applicablePlans && voucher.applicablePlans.length > 0 ? voucher.applicablePlans : ["ALL"],
    applicablePeriods: voucher.applicablePeriods && voucher.applicablePeriods.length > 0 ? voucher.applicablePeriods : ["ALL"],
    usageLimit: voucher.usageLimit ? Number(voucher.usageLimit) : null,
    usedCount: voucher.usedCount || 0,
    validFrom: voucher.validFrom || now,
    validUntil: voucher.validUntil || null,
    isActive: voucher.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };

  vouchers.unshift(newVoucher);
  fs.writeFileSync(VOUCHERS_FILE, JSON.stringify(vouchers, null, 2), "utf-8");
  return newVoucher;
}

export function deleteVoucher(id: string): boolean {
  ensureDataDir();
  const vouchers = getAllVouchers();
  const filtered = vouchers.filter((v) => v.id !== id && v.code !== id);
  if (filtered.length !== vouchers.length) {
    fs.writeFileSync(VOUCHERS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    return true;
  }
  return false;
}

export function toggleVoucher(id: string): Voucher | null {
  ensureDataDir();
  const vouchers = getAllVouchers();
  const item = vouchers.find((v) => v.id === id || v.code === id);
  if (!item) return null;

  item.isActive = !item.isActive;
  item.updatedAt = new Date().toISOString();
  fs.writeFileSync(VOUCHERS_FILE, JSON.stringify(vouchers, null, 2), "utf-8");
  return item;
}

export function getVoucherByCode(code: string): Voucher | null {
  const vouchers = getAllVouchers();
  const clean = (code || "").trim().toUpperCase();
  return vouchers.find((v) => v.code.toUpperCase() === clean) || null;
}

export function recordVoucherUsage(code: string): boolean {
  ensureDataDir();
  const vouchers = getAllVouchers();
  const clean = (code || "").trim().toUpperCase();
  const idx = vouchers.findIndex((v) => v.code.toUpperCase() === clean);
  if (idx >= 0) {
    vouchers[idx].usedCount = (vouchers[idx].usedCount || 0) + 1;
    vouchers[idx].updatedAt = new Date().toISOString();
    fs.writeFileSync(VOUCHERS_FILE, JSON.stringify(vouchers, null, 2), "utf-8");
    return true;
  }
  return false;
}

export function validateVoucher(params: {
  code: string;
  planId?: string;
  durationMonths?: number;
  orderAmount: number;
}): VoucherValidationResult {
  const code = (params.code || "").trim().toUpperCase();
  if (!code) {
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: params.orderAmount,
      error: "Silakan masukkan kode voucher",
    };
  }

  const voucher = getVoucherByCode(code);
  if (!voucher) {
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: params.orderAmount,
      error: `Kode voucher "${code}" tidak ditemukan`,
    };
  }

  if (!voucher.isActive) {
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: params.orderAmount,
      error: `Voucher "${voucher.code}" saat ini sedang tidak aktif`,
    };
  }

  const now = new Date();

  if (voucher.validFrom && new Date(voucher.validFrom) > now) {
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: params.orderAmount,
      error: `Voucher "${voucher.code}" belum berlaku`,
    };
  }

  if (voucher.validUntil && new Date(voucher.validUntil) < now) {
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: params.orderAmount,
      error: `Voucher "${voucher.code}" telah kedaluwarsa`,
    };
  }

  if (voucher.usageLimit && voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: params.orderAmount,
      error: `Kuota penggunaan voucher "${voucher.code}" telah habis (${voucher.usedCount}/${voucher.usageLimit})`,
    };
  }

  if (voucher.minOrderAmount && params.orderAmount < voucher.minOrderAmount) {
    const minFmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(voucher.minOrderAmount);
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: params.orderAmount,
      error: `Voucher ini berlaku untuk minimal pembelian ${minFmt}`,
    };
  }

  // Plan restriction
  if (params.planId && voucher.applicablePlans && !voucher.applicablePlans.includes("ALL")) {
    const cleanPlan = params.planId.toUpperCase().replace(/^YEARLY_/, "");
    if (!voucher.applicablePlans.includes(cleanPlan)) {
      return {
        valid: false,
        discountAmount: 0,
        finalAmount: params.orderAmount,
        error: `Voucher "${voucher.code}" tidak dapat digunakan untuk paket ${params.planId}`,
      };
    }
  }

  // Period restriction
  if (params.durationMonths && voucher.applicablePeriods && !voucher.applicablePeriods.includes("ALL")) {
    if (!voucher.applicablePeriods.includes(String(params.durationMonths))) {
      return {
        valid: false,
        discountAmount: 0,
        finalAmount: params.orderAmount,
        error: `Voucher "${voucher.code}" hanya berlaku untuk periode langganan tertentu`,
      };
    }
  }

  // Calculate discount
  let discountAmount = 0;
  if (voucher.discountType === "PERCENTAGE") {
    discountAmount = Math.round((params.orderAmount * voucher.discountValue) / 100);
    if (voucher.maxDiscountAmount && voucher.maxDiscountAmount > 0) {
      discountAmount = Math.min(discountAmount, voucher.maxDiscountAmount);
    }
  } else {
    // FIXED
    discountAmount = Math.min(voucher.discountValue, params.orderAmount);
  }

  const finalAmount = Math.max(0, params.orderAmount - discountAmount);
  const discountFmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(discountAmount);

  return {
    valid: true,
    voucher,
    discountAmount,
    finalAmount,
    message: `Voucher "${voucher.code}" berhasil diterapkan! Hemat ${discountFmt}`,
  };
}
