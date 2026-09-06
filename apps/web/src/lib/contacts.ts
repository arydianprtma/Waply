import fs from "fs";
import path from "path";
import { prisma } from "@sendora/database";

export interface ContactGroup {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  groupId: string | null;
  groupName?: string;
  customVariables?: Record<string, string | number>;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".sendora-data");
const LOCAL_CONTACTS_FILE = path.join(LOCAL_STORAGE_DIR, "contacts.json");
const LOCAL_GROUPS_FILE = path.join(LOCAL_STORAGE_DIR, "contact-groups.json");

function ensureStorageDir() {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  }
}

export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

// ----------------------------------------------------
// GROUPS
// ----------------------------------------------------

export function getLocalGroups(userId: string): ContactGroup[] {
  ensureStorageDir();
  try {
    if (!fs.existsSync(LOCAL_GROUPS_FILE)) {
      const defaultGroups: ContactGroup[] = [
        { id: "grp_pelanggan_vip", userId, name: "Pelanggan VIP", color: "#10b981", createdAt: new Date().toISOString() },
        { id: "grp_leads_baru", userId, name: "Leads Baru", color: "#0ea5e9", createdAt: new Date().toISOString() },
        { id: "grp_reseller", userId, name: "Reseller / Agen", color: "#8b5cf6", createdAt: new Date().toISOString() },
      ];
      fs.writeFileSync(LOCAL_GROUPS_FILE, JSON.stringify(defaultGroups, null, 2));
      return defaultGroups;
    }
    const data = fs.readFileSync(LOCAL_GROUPS_FILE, "utf-8");
    const groups: ContactGroup[] = JSON.parse(data || "[]");
    return groups.filter((g) => g.userId === userId || userId === "demo-user-local-id");
  } catch {
    return [];
  }
}

export function saveLocalGroups(groups: ContactGroup[]) {
  ensureStorageDir();
  fs.writeFileSync(LOCAL_GROUPS_FILE, JSON.stringify(groups, null, 2));
}

export function createGroup(userId: string, name: string, color = "#10b981"): ContactGroup {
  const groups = getLocalGroups(userId);
  const newGroup: ContactGroup = {
    id: `grp_${Date.now()}`,
    userId,
    name: name.trim(),
    color,
    createdAt: new Date().toISOString(),
  };
  groups.push(newGroup);
  saveLocalGroups(groups);
  return newGroup;
}

export function deleteGroup(userId: string, groupId: string): boolean {
  const groups = getLocalGroups(userId);
  const filtered = groups.filter((g) => g.id !== groupId);
  saveLocalGroups(filtered);

  // Unassign group from contacts
  const contacts = getLocalContacts(userId);
  contacts.forEach((c) => {
    if (c.groupId === groupId) {
      c.groupId = null;
      c.groupName = undefined;
    }
  });
  saveLocalContacts(contacts);
  return true;
}

// ----------------------------------------------------
// CONTACTS
// ----------------------------------------------------

export function getLocalContacts(userId: string): Contact[] {
  ensureStorageDir();
  try {
    if (!fs.existsSync(LOCAL_CONTACTS_FILE)) {
      const defaultContacts: Contact[] = [
        {
          id: "cnt_1",
          userId,
          name: "Budi Santoso",
          phoneNumber: "6281234567890",
          groupId: "grp_pelanggan_vip",
          groupName: "Pelanggan VIP",
          customVariables: { kota: "Jakarta", saldo: 500000 },
          notes: "Pelanggan setia sejak 2025",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "cnt_2",
          userId,
          name: "Siti Rahmawati",
          phoneNumber: "6285712345678",
          groupId: "grp_leads_baru",
          groupName: "Leads Baru",
          customVariables: { kota: "Surabaya", minat: "Paket Pro" },
          notes: "Follow up hari Senin",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "cnt_3",
          userId,
          name: "Ahmad Fauzi",
          phoneNumber: "6289698765432",
          groupId: "grp_reseller",
          groupName: "Reseller / Agen",
          customVariables: { kota: "Bandung", tier: "Gold" },
          notes: "Reseller wilayah Jawa Barat",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      fs.writeFileSync(LOCAL_CONTACTS_FILE, JSON.stringify(defaultContacts, null, 2));
      return defaultContacts;
    }
    const data = fs.readFileSync(LOCAL_CONTACTS_FILE, "utf-8");
    const contacts: Contact[] = JSON.parse(data || "[]");
    return contacts.filter((c) => c.userId === userId || userId === "demo-user-local-id");
  } catch {
    return [];
  }
}

export function saveLocalContacts(contacts: Contact[]) {
  ensureStorageDir();
  fs.writeFileSync(LOCAL_CONTACTS_FILE, JSON.stringify(contacts, null, 2));
}

export function createContact(
  userId: string,
  data: {
    name: string;
    phoneNumber: string;
    groupId?: string | null;
    customVariables?: Record<string, any>;
    notes?: string | null;
  }
): { success: boolean; contact?: Contact; error?: string } {
  const phoneNumber = normalizePhoneNumber(data.phoneNumber);
  if (!phoneNumber || phoneNumber.length < 9) {
    return { success: false, error: "Nomor WhatsApp tidak valid" };
  }

  const contacts = getLocalContacts(userId);
  if (contacts.some((c) => c.phoneNumber === phoneNumber)) {
    return { success: false, error: `Nomor +${phoneNumber} sudah terdaftar dalam kontak` };
  }

  const groups = getLocalGroups(userId);
  const matchedGroup = groups.find((g) => g.id === data.groupId);

  const newContact: Contact = {
    id: `cnt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    userId,
    name: data.name.trim() || `Kontak +${phoneNumber}`,
    phoneNumber,
    groupId: data.groupId || null,
    groupName: matchedGroup?.name,
    customVariables: data.customVariables || {},
    notes: data.notes || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  contacts.unshift(newContact);
  saveLocalContacts(contacts);

  return { success: true, contact: newContact };
}

export function updateContact(
  userId: string,
  id: string,
  data: Partial<Contact>
): { success: boolean; contact?: Contact; error?: string } {
  const contacts = getLocalContacts(userId);
  const index = contacts.findIndex((c) => c.id === id);
  if (index === -1) {
    return { success: false, error: "Kontak tidak ditemukan" };
  }

  if (data.phoneNumber) {
    data.phoneNumber = normalizePhoneNumber(data.phoneNumber);
  }

  const groups = getLocalGroups(userId);
  let groupName = contacts[index].groupName;
  if (data.groupId !== undefined) {
    const matched = groups.find((g) => g.id === data.groupId);
    groupName = matched?.name;
  }

  contacts[index] = {
    ...contacts[index],
    ...data,
    groupName,
    updatedAt: new Date().toISOString(),
  };

  saveLocalContacts(contacts);
  return { success: true, contact: contacts[index] };
}

export function deleteContact(userId: string, id: string): boolean {
  const contacts = getLocalContacts(userId);
  const filtered = contacts.filter((c) => c.id !== id);
  saveLocalContacts(filtered);
  return true;
}

export function importContactsBulk(
  userId: string,
  items: Array<{
    name?: string;
    phoneNumber: string;
    groupName?: string;
    customVariables?: Record<string, any>;
    notes?: string;
  }>
): { imported: number; skipped: number; errors: string[] } {
  const contacts = getLocalContacts(userId);
  const groups = getLocalGroups(userId);
  const existingPhones = new Set(contacts.map((c) => c.phoneNumber));

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of items) {
    if (!item.phoneNumber) {
      skipped++;
      continue;
    }

    const normalized = normalizePhoneNumber(item.phoneNumber);
    if (!normalized || normalized.length < 9) {
      skipped++;
      errors.push(`Nomor tidak valid: ${item.phoneNumber}`);
      continue;
    }

    if (existingPhones.has(normalized)) {
      skipped++;
      continue;
    }

    let groupId: string | null = null;
    let matchedGroupName: string | undefined = undefined;

    if (item.groupName) {
      let g = groups.find((grp) => grp.name.toLowerCase() === item.groupName!.toLowerCase().trim());
      if (!g) {
        g = createGroup(userId, item.groupName.trim());
        groups.push(g);
      }
      groupId = g.id;
      matchedGroupName = g.name;
    }

    const newContact: Contact = {
      id: `cnt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      name: item.name?.trim() || `Kontak +${normalized}`,
      phoneNumber: normalized,
      groupId,
      groupName: matchedGroupName,
      customVariables: item.customVariables || {},
      notes: item.notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    contacts.unshift(newContact);
    existingPhones.add(normalized);
    imported++;
  }

  saveLocalContacts(contacts);
  return { imported, skipped, errors };
}
