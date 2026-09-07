import fs from "fs";
import path from "path";
import { parseSpintax } from "./spintax";
import { normalizePhoneNumber } from "./contacts";
import { getNextRotatedDevice } from "./device-rotation";
import { fetchGateway } from "./gateway-client";
import { applyWatermarkIfFree } from "./watermark";

export type BroadcastStatus = "DRAFT" | "RUNNING" | "PAUSED" | "COMPLETED" | "CANCELLED";

export interface BroadcastRecipient {
  id: string;
  phoneNumber: string;
  name: string;
  variables?: Record<string, string | number>;
  renderedMessage?: string;
  status: "PENDING" | "SENT" | "FAILED" | "SKIPPED_BLACKLIST";
  sentAt?: string;
  error?: string;
  messageId?: string;
}

export interface BroadcastCampaign {
  id: string;
  userId: string;
  name: string;
  deviceId?: string;
  messageTemplate: string;
  status: BroadcastStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  batchSize: number; // e.g. 10
  batchDelaySec: number; // e.g. 60 (cooldown antar batch)
  minDelaySec: number; // e.g. 4
  maxDelaySec: number; // e.g. 12
  recipients: BroadcastRecipient[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".sendora-data");
const LOCAL_CAMPAIGNS_FILE = path.join(LOCAL_STORAGE_DIR, "broadcast-campaigns.json");
const GATEWAY_URL = process.env.GATEWAY_INTERNAL_URL || "http://localhost:3002";

// Active runner state tracker to support pausing / cancelling
const activeRunners = new Map<string, { abort: boolean; pause: boolean }>();

function ensureStorageDir() {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  }
}

export function getLocalCampaigns(userId: string): BroadcastCampaign[] {
  ensureStorageDir();
  try {
    if (!fs.existsSync(LOCAL_CAMPAIGNS_FILE)) {
      const defaultCampaigns: BroadcastCampaign[] = [
        {
          id: "cmp_demo_1",
          userId,
          name: "Promo Weekend Diskon 25%",
          messageTemplate: "{Halo|Hai|Selamat siang} {{name}}, nikmati promo diskon 25% spesial akhir pekan dengan kode SENDORA25!",
          status: "COMPLETED",
          totalRecipients: 3,
          sentCount: 3,
          failedCount: 0,
          skippedCount: 0,
          batchSize: 10,
          batchDelaySec: 30,
          minDelaySec: 4,
          maxDelaySec: 8,
          recipients: [
            {
              id: "rcp_1",
              phoneNumber: "6281234567890",
              name: "Budi Santoso",
              renderedMessage: "Selamat siang Budi Santoso, nikmati promo diskon 25% spesial akhir pekan dengan kode SENDORA25!",
              status: "SENT",
              sentAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: "rcp_2",
              phoneNumber: "6285712345678",
              name: "Siti Rahmawati",
              renderedMessage: "Hai Siti Rahmawati, nikmati promo diskon 25% spesial akhir pekan dengan kode SENDORA25!",
              status: "SENT",
              sentAt: new Date(Date.now() - 3500000).toISOString(),
            },
            {
              id: "rcp_3",
              phoneNumber: "6289698765432",
              name: "Ahmad Fauzi",
              renderedMessage: "Halo Ahmad Fauzi, nikmati promo diskon 25% spesial akhir pekan dengan kode SENDORA25!",
              status: "SENT",
              sentAt: new Date(Date.now() - 3400000).toISOString(),
            },
          ],
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 3400000).toISOString(),
          completedAt: new Date(Date.now() - 3400000).toISOString(),
        },
      ];
      fs.writeFileSync(LOCAL_CAMPAIGNS_FILE, JSON.stringify(defaultCampaigns, null, 2));
      return defaultCampaigns;
    }
    const data = fs.readFileSync(LOCAL_CAMPAIGNS_FILE, "utf-8");
    const list: BroadcastCampaign[] = JSON.parse(data || "[]");
    return list.filter((c) => c.userId === userId || userId === "demo-user-local-id");
  } catch {
    return [];
  }
}

export function saveLocalCampaigns(campaigns: BroadcastCampaign[]) {
  ensureStorageDir();
  fs.writeFileSync(LOCAL_CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2));
}

export function getCampaignById(userId: string, campaignId: string): BroadcastCampaign | null {
  const campaigns = getLocalCampaigns(userId);
  return campaigns.find((c) => c.id === campaignId) || null;
}

export function createBroadcastCampaign(
  userId: string,
  payload: {
    name: string;
    deviceId?: string;
    messageTemplate: string;
    recipients: Array<{ phoneNumber: string; name?: string; variables?: Record<string, any> }>;
    batchSize?: number;
    batchDelaySec?: number;
    minDelaySec?: number;
    maxDelaySec?: number;
  }
): BroadcastCampaign {
  const campaigns = getLocalCampaigns(userId);

  // Blacklist check
  let blacklistedPhones = new Set<string>();
  try {
    const blFile = path.join(LOCAL_STORAGE_DIR, "blacklist.json");
    if (fs.existsSync(blFile)) {
      const blItems = JSON.parse(fs.readFileSync(blFile, "utf-8") || "[]");
      blItems.forEach((b: any) => blacklistedPhones.add(b.phoneNumber));
    }
  } catch {}

  const formattedRecipients: BroadcastRecipient[] = payload.recipients.map((r, idx) => {
    const phone = normalizePhoneNumber(r.phoneNumber);
    const isBlocked = blacklistedPhones.has(phone);
    return {
      id: `rcp_${Date.now()}_${idx}`,
      phoneNumber: phone,
      name: r.name?.trim() || `Pelanggan +${phone}`,
      variables: r.variables || {},
      status: isBlocked ? "SKIPPED_BLACKLIST" : "PENDING",
      error: isBlocked ? "Dilewati (Nomor ada dalam Blacklist / DND)" : undefined,
    };
  });

  const skippedCount = formattedRecipients.filter((r) => r.status === "SKIPPED_BLACKLIST").length;

  const newCampaign: BroadcastCampaign = {
    id: `cmp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    userId,
    name: payload.name.trim() || `Broadcast ${new Date().toLocaleDateString("id-ID")}`,
    deviceId: payload.deviceId,
    messageTemplate: payload.messageTemplate,
    status: "DRAFT",
    totalRecipients: formattedRecipients.length,
    sentCount: 0,
    failedCount: 0,
    skippedCount,
    batchSize: payload.batchSize || 10,
    batchDelaySec: payload.batchDelaySec || 60,
    minDelaySec: payload.minDelaySec || 4,
    maxDelaySec: payload.maxDelaySec || 12,
    recipients: formattedRecipients,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  campaigns.unshift(newCampaign);
  saveLocalCampaigns(campaigns);
  return newCampaign;
}

export function deleteBroadcastCampaign(userId: string, campaignId: string): boolean {
  // If running, abort it
  const runner = activeRunners.get(campaignId);
  if (runner) {
    runner.abort = true;
    activeRunners.delete(campaignId);
  }

  const campaigns = getLocalCampaigns(userId);
  const filtered = campaigns.filter((c) => c.id !== campaignId);
  saveLocalCampaigns(filtered);
  return true;
}

export function pauseBroadcastCampaign(userId: string, campaignId: string): boolean {
  const runner = activeRunners.get(campaignId);
  if (runner) {
    runner.pause = true;
  }
  const campaigns = getLocalCampaigns(userId);
  const camp = campaigns.find((c) => c.id === campaignId);
  if (camp && camp.status === "RUNNING") {
    camp.status = "PAUSED";
    camp.updatedAt = new Date().toISOString();
    saveLocalCampaigns(campaigns);
  }
  return true;
}

export function cancelBroadcastCampaign(userId: string, campaignId: string): boolean {
  const runner = activeRunners.get(campaignId);
  if (runner) {
    runner.abort = true;
    activeRunners.delete(campaignId);
  }
  const campaigns = getLocalCampaigns(userId);
  const camp = campaigns.find((c) => c.id === campaignId);
  if (camp && (camp.status === "RUNNING" || camp.status === "PAUSED" || camp.status === "DRAFT")) {
    camp.status = "CANCELLED";
    camp.updatedAt = new Date().toISOString();
    saveLocalCampaigns(campaigns);
  }
  return true;
}

/**
 * Execute Broadcast Campaign Queue in Background with safety throttling
 */
export async function startBroadcastCampaign(userId: string, campaignId: string): Promise<{ success: boolean; error?: string }> {
  const campaigns = getLocalCampaigns(userId);
  const campaign = campaigns.find((c) => c.id === campaignId);
  if (!campaign) {
    return { success: false, error: "Kampanye broadcast tidak ditemukan" };
  }

  if (campaign.status === "COMPLETED" || campaign.status === "CANCELLED") {
    return { success: false, error: `Kampanye sudah berstatus ${campaign.status}` };
  }

  // Find active device session
  let deviceId = campaign.deviceId;
  if (!deviceId) {
    try {
      const gwRes = await fetchGateway("/api/sessions");
      const gwJson = await gwRes.json();
      if (gwJson.success && Array.isArray(gwJson.data)) {
        const connected = gwJson.data.find((d: any) => d.status === "CONNECTED");
        if (connected) deviceId = connected.id;
        else if (gwJson.data.length > 0) deviceId = gwJson.data[0].id;
      }
    } catch {}
  }

  if (!deviceId) {
    return { success: false, error: "Tidak ada WhatsApp device yang terhubung untuk mengirim broadcast" };
  }

  // Update status to RUNNING
  campaign.status = "RUNNING";
  campaign.deviceId = deviceId;
  campaign.updatedAt = new Date().toISOString();
  saveLocalCampaigns(campaigns);

  const runnerControl = { abort: false, pause: false };
  activeRunners.set(campaignId, runnerControl);

  // Run async worker in background (non-blocking)
  (async () => {
    try {
      let batchSentCounter = 0;

      for (let i = 0; i < campaign.recipients.length; i++) {
        const currentControl = activeRunners.get(campaignId);
        if (!currentControl || currentControl.abort) {
          campaign.status = "CANCELLED";
          break;
        }

        if (currentControl.pause) {
          campaign.status = "PAUSED";
          break;
        }

        const recipient = campaign.recipients[i];
        if (recipient.status !== "PENDING") {
          continue;
        }

        // Render spintax and variables for this specific recipient
        const vars = {
          name: recipient.name,
          nama: recipient.name,
          phone: recipient.phoneNumber,
          nomor: recipient.phoneNumber,
          ...(recipient.variables || {}),
        };
        const rendered = parseSpintax(campaign.messageTemplate, vars);
        const { finalMessage } = applyWatermarkIfFree(campaign.userId, rendered);
        recipient.renderedMessage = finalMessage;

        // Determine device to use (supports per-message Round-Robin rotation if auto_rotate)
        const activeDev = await getNextRotatedDevice(campaign.deviceId);
        const sendDeviceId = activeDev?.id || deviceId;

        // Send via Gateway
        try {
          const res = await fetchGateway(`/api/sessions/${sendDeviceId}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: recipient.phoneNumber,
              message: finalMessage,
            }),
          });
          const json = await res.json();

          if (json.success) {
            recipient.status = "SENT";
            recipient.sentAt = new Date().toISOString();
            recipient.messageId = json.data?.messageId;
            campaign.sentCount++;
          } else {
            recipient.status = "FAILED";
            recipient.error = json.error || "Gagal dikirim via gateway";
            campaign.failedCount++;
          }
        } catch (sendErr: any) {
          recipient.status = "FAILED";
          recipient.error = sendErr.message || "Network error";
          campaign.failedCount++;
        }

        campaign.updatedAt = new Date().toISOString();
        saveLocalCampaigns(campaigns);
        batchSentCounter++;

        // Check if all pending messages are finished
        const remaining = campaign.recipients.filter((r) => r.status === "PENDING").length;
        if (remaining === 0) {
          campaign.status = "COMPLETED";
          campaign.completedAt = new Date().toISOString();
          saveLocalCampaigns(campaigns);
          activeRunners.delete(campaignId);
          break;
        }

        // Safety Throttling Delays:
        // 1. Batch cooldown
        if (batchSentCounter >= campaign.batchSize) {
          batchSentCounter = 0;
          const cooldownMs = (campaign.batchDelaySec || 30) * 1000;
          await new Promise((resolve) => setTimeout(resolve, cooldownMs));
        } else {
          // 2. Random delay per message
          const minDelay = (campaign.minDelaySec || 4) * 1000;
          const maxDelay = (campaign.maxDelaySec || 8) * 1000;
          const delayMs = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    } catch (workerErr) {
      console.error("Broadcast worker error:", workerErr);
    } finally {
      activeRunners.delete(campaignId);
    }
  })();

  return { success: true };
}
