import path from "path";
import fs from "fs";

/**
 * Resolves the persistent uploads directory reliably across local dev and Docker container environments.
 * Checks for dedicated mounted directory or falls back to public/uploads.
 */
export function getUploadsDirectory(...subdirs: string[]): string {
  const possibleRoots = [
    path.resolve(process.cwd(), "apps", "web", "public", "uploads"),
    path.resolve(process.cwd(), "public", "uploads"),
  ];

  let targetRoot = possibleRoots[0];
  for (const root of possibleRoots) {
    if (fs.existsSync(root)) {
      targetRoot = root;
      break;
    }
  }

  const finalDir = subdirs.length > 0 ? path.join(targetRoot, ...subdirs) : targetRoot;
  try {
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }
  } catch {}

  return finalDir;
}
