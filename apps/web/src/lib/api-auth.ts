import crypto from "crypto";
import fs from "fs";
import path from "path";
import { prisma } from "@waply/database";

export interface AuthenticatedApiUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface ApiAuthResult {
  authenticated: boolean;
  user?: AuthenticatedApiUser;
  apiKeyId?: string;
  error?: string;
  status?: number;
}

interface LocalApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".waply-data");
const LOCAL_KEYS_FILE = path.join(LOCAL_STORAGE_DIR, "api-keys.json");

function getLocalKeys(): LocalApiKey[] {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_KEYS_FILE)) {
      fs.writeFileSync(LOCAL_KEYS_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(LOCAL_KEYS_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

function saveLocalKeys(keys: LocalApiKey[]) {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_KEYS_FILE, JSON.stringify(keys, null, 2));
  } catch (err) {
    console.error("Failed to save local keys:", err);
  }
}

/**
 * Generate a new secure API Key with prefix snd_live_
 */
export async function generateApiKey(userId: string, name: string) {
  const randomBytes = crypto.randomBytes(24).toString("hex");
  const rawKey = `snd_live_${randomBytes}`;
  const keyPrefix = rawKey.substring(0, 15); // e.g. snd_live_a1b2c3
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  if (!process.env.DATABASE_URL) {
    const localRecord: LocalApiKey = {
      id: `key_${Date.now()}`,
      userId,
      name,
      keyPrefix,
      keyHash,
      lastUsedAt: null,
      revokedAt: null,
      createdAt: new Date().toISOString(),
    };

    const keys = getLocalKeys();
    keys.unshift(localRecord);
    saveLocalKeys(keys);

    return {
      rawKey,
      apiKeyRecord: localRecord,
    };
  }

  try {
    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        userId,
        name,
        keyPrefix,
        keyHash,
      },
    });

    return {
      rawKey,
      apiKeyRecord,
    };
  } catch (err) {
    console.warn("Prisma save failed, saving API Key to local fallback store:", (err as Error).message);
    const localRecord: LocalApiKey = {
      id: `key_${Date.now()}`,
      userId,
      name,
      keyPrefix,
      keyHash,
      lastUsedAt: null,
      revokedAt: null,
      createdAt: new Date().toISOString(),
    };

    const keys = getLocalKeys();
    keys.unshift(localRecord);
    saveLocalKeys(keys);

    return {
      rawKey,
      apiKeyRecord: localRecord,
    };
  }
}

/**
 * List all API Keys for a user with DB + local fallback
 */
export async function listApiKeys(userId: string) {
  if (!process.env.DATABASE_URL) {
    const localKeys = getLocalKeys();
    return localKeys
      .filter((k) => k.userId === userId)
      .map(({ keyHash, ...rest }) => rest);
  }

  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return keys;
  } catch (err) {
    const localKeys = getLocalKeys();
    return localKeys
      .filter((k) => k.userId === userId)
      .map(({ keyHash, ...rest }) => rest);
  }
}

/**
 * Delete / Revoke API key with DB + local fallback
 */
export async function deleteApiKey(id: string, userId: string) {
  if (id.startsWith("key_") || !process.env.DATABASE_URL) {
    const keys = getLocalKeys();
    const updated = keys.filter((k) => !(k.id === id && k.userId === userId));
    saveLocalKeys(updated);
    return true;
  }

  try {
    await prisma.apiKey.deleteMany({ where: { id, userId } });
    const keys = getLocalKeys();
    const updated = keys.filter((k) => !(k.id === id && k.userId === userId));
    saveLocalKeys(updated);
    return true;
  } catch {
    const keys = getLocalKeys();
    const updated = keys.filter((k) => !(k.id === id && k.userId === userId));
    saveLocalKeys(updated);
    return true;
  }
}

import { checkAccountStatus } from "./security";
import { getUserById } from "./admin-users";

/**
 * Validate an API Key against the database or local fallback
 */
export async function validateApiKey(rawKey: string): Promise<ApiAuthResult> {
  if (!rawKey || !rawKey.startsWith("snd_live_")) {
    return {
      authenticated: false,
      error: "Invalid API key format. Key must start with 'snd_live_'",
      status: 401,
    };
  }

  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  if (!process.env.DATABASE_URL) {
    const localKeys = getLocalKeys();
    const localKey = localKeys.find((k) => k.keyHash === keyHash);

    if (!localKey) {
      return {
        authenticated: false,
        error: "Invalid or nonexistent API Key",
        status: 401,
      };
    }

    if (localKey.revokedAt) {
      return {
        authenticated: false,
        error: "API Key has been revoked",
        status: 403,
      };
    }

    // Check user status
    const managedUser = getUserById(localKey.userId);
    if (managedUser) {
      const statusCheck = checkAccountStatus(managedUser.status, managedUser.banReason);
      if (!statusCheck.allowed) {
        return {
          authenticated: false,
          error: statusCheck.reason || "Akun dinonaktifkan",
          status: statusCheck.statusCode || 403,
        };
      }
    }

    localKey.lastUsedAt = new Date().toISOString();
    saveLocalKeys(localKeys);

    return {
      authenticated: true,
      user: {
        id: localKey.userId,
        email: managedUser?.email || "demo@waply.id",
        name: managedUser?.name || "Waply User",
        role: managedUser?.role || "admin",
      },
      apiKeyId: localKey.id,
    };
  }

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (apiKey) {
      if (apiKey.revokedAt) {
        return {
          authenticated: false,
          error: "API Key has been revoked",
          status: 403,
        };
      }

      // Check user status in admin-users store
      const managedUser = getUserById(apiKey.user.id);
      if (managedUser) {
        const statusCheck = checkAccountStatus(managedUser.status, managedUser.banReason);
        if (!statusCheck.allowed) {
          return {
            authenticated: false,
            error: statusCheck.reason || "Akun dinonaktifkan",
            status: statusCheck.statusCode || 403,
          };
        }
      }

      prisma.apiKey
        .update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() },
        })
        .catch(() => {});

      return {
        authenticated: true,
        user: apiKey.user,
        apiKeyId: apiKey.id,
      };
    }
  } catch (err) {
    console.warn("DB query failed during API key auth, checking local fallback store:", (err as Error).message);
  }

  // Check local fallback keys
  const localKeys = getLocalKeys();
  const localKey = localKeys.find((k) => k.keyHash === keyHash);

  if (!localKey) {
    return {
      authenticated: false,
      error: "Invalid or nonexistent API Key",
      status: 401,
    };
  }

  if (localKey.revokedAt) {
    return {
      authenticated: false,
      error: "API Key has been revoked",
      status: 403,
    };
  }

  const fallbackUser = getUserById(localKey.userId);
  if (fallbackUser) {
    const statusCheck = checkAccountStatus(fallbackUser.status, fallbackUser.banReason);
    if (!statusCheck.allowed) {
      return {
        authenticated: false,
        error: statusCheck.reason || "Akun dinonaktifkan",
        status: statusCheck.statusCode || 403,
      };
    }
  }

  localKey.lastUsedAt = new Date().toISOString();
  saveLocalKeys(localKeys);

  return {
    authenticated: true,
    user: {
      id: localKey.userId,
      email: fallbackUser?.email || "demo@waply.id",
      name: fallbackUser?.name || "Waply User",
      role: fallbackUser?.role || "admin",
    },
    apiKeyId: localKey.id,
  };
}

/**
 * Extract and validate API Key from incoming HTTP Request
 */
export async function authenticateApiRequest(
  request: Request
): Promise<ApiAuthResult> {
  const authHeader = request.headers.get("authorization");
  const xApiKey = request.headers.get("x-api-key");

  let token: string | null = null;

  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (xApiKey) {
    token = xApiKey.trim();
  }

  if (!token) {
    return {
      authenticated: false,
      error: "Authentication required. Provide 'Authorization: Bearer snd_live_...' or 'x-api-key' header.",
      status: 401,
    };
  }

  return validateApiKey(token);
}
