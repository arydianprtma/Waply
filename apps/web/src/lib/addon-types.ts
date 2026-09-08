export type AddonType = "DEVICE" | "MESSAGES";

export interface AddonItem {
  id: string; // e.g. "ADDON_DEV_1", "ADDON_MSG_5K"
  name: string; // e.g. "+1 WhatsApp Device"
  type: AddonType;
  amount: number; // e.g. 1 device or 5000 messages
  price: number; // in IDR
  description?: string;
  badge?: string; // e.g. "Populer", "Hemat"
  isActive: boolean;
  createdAt: string;
}

export interface UserAddon {
  id: string;
  userId: string;
  addonId: string;
  name: string;
  type: AddonType;
  amount: number;
  orderId?: string;
  pricePaid: number;
  activatedAt: string;
  expiresAt?: string | null;
  status: "ACTIVE" | "EXPIRED";
}
