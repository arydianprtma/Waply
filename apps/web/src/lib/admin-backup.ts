import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
const BACKUPS_DIR = path.join(DATA_DIR, "backups");

export interface BackupMetadata {
  id: string;
  createdAt: string;
  version: string;
  totalFiles: number;
  totalSizeFormatted: string;
  includedFiles: string[];
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

export function listBackups(): BackupMetadata[] {
  ensureDataDir();
  try {
    const files = fs.readdirSync(BACKUPS_DIR);
    const backups: BackupMetadata[] = [];

    for (const f of files) {
      if (f.endsWith(".json")) {
        try {
          const fullPath = path.join(BACKUPS_DIR, f);
          const stat = fs.statSync(fullPath);
          const raw = fs.readFileSync(fullPath, "utf-8");
          const parsed = JSON.parse(raw);

          backups.push({
            id: f.replace(".json", ""),
            createdAt: parsed.meta?.createdAt || stat.birthtime.toISOString(),
            version: parsed.meta?.version || "1.0.0",
            totalFiles: Object.keys(parsed.data || {}).length,
            totalSizeFormatted: `${(stat.size / 1024).toFixed(1)} KB`,
            includedFiles: Object.keys(parsed.data || {}),
          });
        } catch {}
      }
    }

    return backups.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export function createSystemBackup(): {
  success: boolean;
  backup?: BackupMetadata;
  fullData?: any;
} {
  ensureDataDir();
  try {
    const now = new Date();
    const backupId = `waply_backup_${now.toISOString().replace(/[:.]/g, "-")}`;
    const backupFilePath = path.join(BACKUPS_DIR, `${backupId}.json`);

    const files = fs.readdirSync(DATA_DIR);
    const backupPayload: Record<string, any> = {};

    for (const file of files) {
      if (file.endsWith(".json") && file !== "backups") {
        try {
          const content = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
          backupPayload[file] = JSON.parse(content || "{}");
        } catch {}
      }
    }

    const fullSnapshot = {
      meta: {
        id: backupId,
        createdAt: now.toISOString(),
        version: "0.1.0",
        platform: "Waply WhatsApp Gateway",
      },
      data: backupPayload,
    };

    fs.writeFileSync(backupFilePath, JSON.stringify(fullSnapshot, null, 2));
    const stat = fs.statSync(backupFilePath);

    const meta: BackupMetadata = {
      id: backupId,
      createdAt: now.toISOString(),
      version: "0.1.0",
      totalFiles: Object.keys(backupPayload).length,
      totalSizeFormatted: `${(stat.size / 1024).toFixed(1)} KB`,
      includedFiles: Object.keys(backupPayload),
    };

    return {
      success: true,
      backup: meta,
      fullData: fullSnapshot,
    };
  } catch (err: any) {
    return { success: false };
  }
}

export function getBackupContent(backupId: string): any | null {
  ensureDataDir();
  try {
    const backupFilePath = path.join(BACKUPS_DIR, `${backupId}.json`);
    if (fs.existsSync(backupFilePath)) {
      const raw = fs.readFileSync(backupFilePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}
