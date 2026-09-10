import fs from "fs";
import path from "path";
import { BroadcastCampaign } from "./broadcast";
import { getAllManagedUsers } from "./admin-users";

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
const CAMPAIGNS_FILE = path.join(DATA_DIR, "broadcast-campaigns.json");

export interface SystemBroadcastCampaign extends BroadcastCampaign {
  userName?: string;
  userEmail?: string;
}

export function getAllSystemBroadcasts(): {
  campaigns: SystemBroadcastCampaign[];
  summary: {
    totalCampaigns: number;
    runningCount: number;
    pausedCount: number;
    completedCount: number;
    totalRecipientsQueued: number;
    totalSent: number;
  };
} {
  try {
    if (!fs.existsSync(CAMPAIGNS_FILE)) {
      return {
        campaigns: [],
        summary: {
          totalCampaigns: 0,
          runningCount: 0,
          pausedCount: 0,
          completedCount: 0,
          totalRecipientsQueued: 0,
          totalSent: 0,
        },
      };
    }

    const raw = fs.readFileSync(CAMPAIGNS_FILE, "utf-8");
    const campaigns: BroadcastCampaign[] = JSON.parse(raw || "[]");

    const users = getAllManagedUsers();
    const userMap = new Map(users.map((u) => [u.id.toLowerCase(), u]));
    users.forEach((u) => {
      if (u.email) userMap.set(u.email.toLowerCase(), u);
    });

    const enriched: SystemBroadcastCampaign[] = campaigns.map((c) => {
      const user = userMap.get((c.userId || "").toLowerCase());
      return {
        ...c,
        userName: user?.name || "User",
        userEmail: user?.email || "-",
      };
    });

    // Sort by latest createdAt
    enriched.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    let runningCount = 0;
    let pausedCount = 0;
    let completedCount = 0;
    let totalRecipientsQueued = 0;
    let totalSent = 0;

    enriched.forEach((c) => {
      if (c.status === "RUNNING") runningCount++;
      else if (c.status === "PAUSED") pausedCount++;
      else if (c.status === "COMPLETED") completedCount++;

      totalRecipientsQueued += Number(c.totalRecipients) || 0;
      totalSent += Number(c.sentCount) || 0;
    });

    return {
      campaigns: enriched,
      summary: {
        totalCampaigns: enriched.length,
        runningCount,
        pausedCount,
        completedCount,
        totalRecipientsQueued,
        totalSent,
      },
    };
  } catch (err) {
    console.error("Error reading system broadcasts:", err);
    return {
      campaigns: [],
      summary: {
        totalCampaigns: 0,
        runningCount: 0,
        pausedCount: 0,
        completedCount: 0,
        totalRecipientsQueued: 0,
        totalSent: 0,
      },
    };
  }
}

export function adminPauseBroadcast(campaignId: string): BroadcastCampaign | null {
  try {
    if (!fs.existsSync(CAMPAIGNS_FILE)) return null;
    const raw = fs.readFileSync(CAMPAIGNS_FILE, "utf-8");
    const campaigns: BroadcastCampaign[] = JSON.parse(raw || "[]");

    const targetIdx = campaigns.findIndex((c) => c.id === campaignId);
    if (targetIdx === -1) return null;

    campaigns[targetIdx].status = "PAUSED";
    campaigns[targetIdx].updatedAt = new Date().toISOString();
    fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2));
    return campaigns[targetIdx];
  } catch {
    return null;
  }
}

export function adminCancelBroadcast(campaignId: string): BroadcastCampaign | null {
  try {
    if (!fs.existsSync(CAMPAIGNS_FILE)) return null;
    const raw = fs.readFileSync(CAMPAIGNS_FILE, "utf-8");
    const campaigns: BroadcastCampaign[] = JSON.parse(raw || "[]");

    const targetIdx = campaigns.findIndex((c) => c.id === campaignId);
    if (targetIdx === -1) return null;

    campaigns[targetIdx].status = "CANCELLED";
    campaigns[targetIdx].updatedAt = new Date().toISOString();
    fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2));
    return campaigns[targetIdx];
  } catch {
    return null;
  }
}
