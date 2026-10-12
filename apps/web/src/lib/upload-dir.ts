import path from "path";
import fs from "fs";

import { getDataDirectory } from "./data-dir";

/**
 * Resolves the persistent uploads directory reliably across local dev and Docker container environments.
 * Uses the persistent .waply-data directory so uploaded files survive container rebuilds and restarts.
 */
export function getUploadsDirectory(...subdirs: string[]): string {
  const persistentRoot = path.join(getDataDirectory(), "uploads");

  try {
    if (!fs.existsSync(persistentRoot)) {
      fs.mkdirSync(persistentRoot, { recursive: true });
    }
  } catch {}

  const finalDir = subdirs.length > 0 ? path.join(persistentRoot, ...subdirs) : persistentRoot;
  try {
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }
  } catch {}

  return finalDir;
}

/**
 * Locates an uploaded file across persistent storage or legacy public/uploads
 */
export function findUploadFile(...pathSegments: string[]): string | null {
  const persistentRoot = path.join(getDataDirectory(), "uploads");
  const candidatePersistent = path.join(persistentRoot, ...pathSegments);
  if (fs.existsSync(candidatePersistent)) {
    try {
      if (fs.statSync(candidatePersistent).isFile()) {
        return candidatePersistent;
      }
    } catch {}
  }

  const publicRoots = [
    path.resolve(process.cwd(), "apps", "web", "public", "uploads"),
    path.resolve(process.cwd(), "public", "uploads"),
  ];

  for (const root of publicRoots) {
    const candidatePublic = path.join(root, ...pathSegments);
    if (fs.existsSync(candidatePublic)) {
      try {
        if (fs.statSync(candidatePublic).isFile()) {
          return candidatePublic;
        }
      } catch {}
    }
  }

  return null;
}
