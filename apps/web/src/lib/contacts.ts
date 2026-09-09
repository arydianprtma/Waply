import fs from "fs";
import path from "path";
import { prisma } from "@waply/database";

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

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".waply-data");
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

function readAllGroups(): ContactGroup[] {
  ensureStorageDir();
  try {
    if (!fs.existsSync(LOCAL_GROUPS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(LOCAL_GROUPS_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

function writeAllGroups(groups: ContactGroup[]) {
  ensureStorageDir();
  fs.writeFileSync(LOCAL_GROUPS_FILE, JSON.stringify(groups, null, 2));
}

export function getLocalGroups(userId: string): ContactGroup[] {
  const groups = readAllGroups();
  const userGroups = groups.filter((g) => g.userId === userId);
  
  if (userGroups.length === 0 && groups.length === 0 && userId) {
    // Seed initial default groups only for the first installation
    const defaultGroups: ContactGroup[] = [
      { id: `grp_vip_${userId.slice(0, 6)}`, userId, name: "Pelanggan VIP", color: "#10b981", createdAt: new Date().toISOString() },
      { id: `grp_leads_${userId.slice(0, 6)}`, userId, name: "Leads Baru", color: "#0ea5e9", createdAt: new Date().toISOString() },
      { id: `grp_reseller_${userId.slice(0, 6)}`, userId, name: "Reseller / Agen", color: "#8b5cf6", createdAt: new Date().toISOString() },
    ];
    writeAllGroups(defaultGroups);
    return defaultGroups;
  }
  return userGroups;
}

export function saveLocalGroups(userId: string, userGroups: ContactGroup[]) {
  const allGroups = readAllGroups().filter((g) => g.userId !== userId);
  writeAllGroups([...allGroups, ...userGroups]);
}

export function createGroup(userId: string, name: string, color = "#10b981"): ContactGroup {
  const allGroups = readAllGroups();
  const newGroup: ContactGroup = {
    id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    name: name.trim(),
    color,
    createdAt: new Date().toISOString(),
  };
  allGroups.push(newGroup);
  writeAllGroups(allGroups);
  return newGroup;
}

export function deleteGroup(userId: string, groupId: string): boolean {
  const allGroups = readAllGroups();
  const filtered = allGroups.filter((g) => !(g.id === groupId && g.userId === userId));
  writeAllGroups(filtered);

  // Unassign group from contacts belonging to this user
  const allContacts = readAllContacts();
  let changed = false;
  allContacts.forEach((c) => {
    if (c.userId === userId && c.groupId === groupId) {
      c.groupId = null;
      c.groupName = undefined;
      changed = true;
    }
  });
  if (changed) {
    writeAllContacts(allContacts);
  }
  return true;
}

// ----------------------------------------------------
// CONTACTS
// ----------------------------------------------------

function readAllContacts(): Contact[] {
  ensureStorageDir();
  try {
    if (!fs.existsSync(LOCAL_CONTACTS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(LOCAL_CONTACTS_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

function writeAllContacts(contacts: Contact[]) {
  ensureStorageDir();
  fs.writeFileSync(LOCAL_CONTACTS_FILE, JSON.stringify(contacts, null, 2));
}

export function getLocalContacts(userId: string): Contact[] {
  const contacts = readAllContacts();
  return contacts.filter((c) => c.userId === userId);
}

export function saveLocalContacts(userId: string, userContacts: Contact[]) {
  const allContacts = readAllContacts().filter((c) => c.userId !== userId);
  writeAllContacts([...allContacts, ...userContacts]);
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

  const userContacts = getLocalContacts(userId);
  if (userContacts.some((c) => c.phoneNumber === phoneNumber)) {
    return { success: false, error: `Nomor +${phoneNumber} sudah terdaftar dalam kontak Anda` };
  }

  const groups = getLocalGroups(userId);
  const matchedGroup = groups.find((g) => g.id === data.groupId);

  const newContact: Contact = {
    id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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

  const allContacts = readAllContacts();
  allContacts.unshift(newContact);
  writeAllContacts(allContacts);

  return { success: true, contact: newContact };
}

export function updateContact(
  userId: string,
  id: string,
  data: Partial<Contact>
): { success: boolean; contact?: Contact; error?: string } {
  const allContacts = readAllContacts();
  const index = allContacts.findIndex((c) => c.id === id && c.userId === userId);
  if (index === -1) {
    return { success: false, error: "Kontak tidak ditemukan" };
  }

  if (data.phoneNumber) {
    data.phoneNumber = normalizePhoneNumber(data.phoneNumber);
  }

  const groups = getLocalGroups(userId);
  let groupName = allContacts[index].groupName;
  if (data.groupId !== undefined) {
    const matched = groups.find((g) => g.id === data.groupId);
    groupName = matched?.name;
  }

  allContacts[index] = {
    ...allContacts[index],
    ...data,
    groupName,
    updatedAt: new Date().toISOString(),
  };

  writeAllContacts(allContacts);
  return { success: true, contact: allContacts[index] };
}

export function deleteContact(userId: string, id: string): boolean {
  const allContacts = readAllContacts();
  const filtered = allContacts.filter((c) => !(c.id === id && c.userId === userId));
  if (filtered.length === allContacts.length) return false;
  writeAllContacts(filtered);
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
  const allContacts = readAllContacts();
  const userContacts = allContacts.filter((c) => c.userId === userId);
  const groups = getLocalGroups(userId);
  const existingPhones = new Set(userContacts.map((c) => c.phoneNumber));

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];
  const newContactsToAdd: Contact[] = [];

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
      id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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

    newContactsToAdd.unshift(newContact);
    existingPhones.add(normalized);
    imported++;
  }

  if (newContactsToAdd.length > 0) {
    writeAllContacts([...newContactsToAdd, ...allContacts]);
  }
  return { imported, skipped, errors };
}
