import path from "path";
import fs from "fs";

/**
 * Resolves the persistent .waply-data directory reliably regardless of process.cwd()
 * (whether executed from monorepo root H:\WhatsApp Gateway or apps\web).
 */
export function getDataDirectory(): string {
  const possiblePaths = [
    path.resolve(process.cwd(), "apps", "web", ".waply-data"),
    path.resolve(process.cwd(), ".waply-data"),
    path.resolve(__dirname, "..", "..", ".waply-data"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.existsSync(path.join(p, "subscription.json"))) {
      return p;
    }
  }

  // Fallback to first existing directory or default
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }

  const defaultDir = possiblePaths[0];
  try {
    fs.mkdirSync(defaultDir, { recursive: true });
  } catch {}
  return defaultDir;
}
