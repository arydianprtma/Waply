import fs from 'fs';
import path from 'path';

export interface UrlScanEntry {
  path: string;
  count: number;
  method: string;
  lastStatusCode: number;
  statusCodes: number[];
  lastSeen: string;
  firstSeen: string;
  recentIps: string[];
  category: 'ENV_LEAK_PROBE' | 'API_MISMATCH' | 'ADMIN_SCAN' | 'SOURCE_LEAK' | 'COMMON_404';
}

const DATA_DIR = path.resolve(process.cwd(), '.waply-data');
const SCANS_FILE = path.join(DATA_DIR, 'url_scans.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function categorizePath(p: string): UrlScanEntry['category'] {
  const low = p.toLowerCase();
  if (low.includes('.env') || low.includes('.yml') || low.includes('.config') || low.includes('.json')) {
    return 'ENV_LEAK_PROBE';
  }
  if (low.includes('/admin') || low.includes('wp-') || low.includes('phpmyadmin') || low.includes('cpanel')) {
    return 'ADMIN_SCAN';
  }
  if (low.startsWith('/api/')) {
    return 'API_MISMATCH';
  }
  if (low.includes('.git') || low.includes('.svn') || low.includes('.bak') || low.includes('.zip')) {
    return 'SOURCE_LEAK';
  }
  return 'COMMON_404';
}

export function getAllUrlScans(): UrlScanEntry[] {
  ensureDir();
  try {
    if (!fs.existsSync(SCANS_FILE)) {
      fs.writeFileSync(SCANS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(SCANS_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function recordUrlScan(
  reqPath: string,
  options: {
    method?: string;
    statusCode?: number;
    ip?: string;
    userAgent?: string;
  } = {}
): void {
  try {
    ensureDir();
    const cleanPath = reqPath.split('?')[0].trim() || '/';
    
    // Ignore internal static assets
    if (
      cleanPath.startsWith('/_next') ||
      cleanPath.startsWith('/favicon') ||
      cleanPath.startsWith('/icon') ||
      cleanPath.match(/\.(png|jpg|jpeg|svg|css|js|ico|woff|woff2|ttf)$/i)
    ) {
      return;
    }

    const scans = getAllUrlScans();
    const now = new Date().toISOString();
    const statusCode = options.statusCode || 404;
    const method = (options.method || 'GET').toUpperCase();
    const ip = options.ip || 'unknown';

    const idx = scans.findIndex((s) => s.path === cleanPath);
    if (idx >= 0) {
      scans[idx].count += 1;
      scans[idx].lastSeen = now;
      scans[idx].lastStatusCode = statusCode;
      if (!scans[idx].statusCodes.includes(statusCode)) {
        scans[idx].statusCodes.push(statusCode);
      }
      if (ip && ip !== 'unknown' && !scans[idx].recentIps.includes(ip)) {
        scans[idx].recentIps.unshift(ip);
        scans[idx].recentIps = scans[idx].recentIps.slice(0, 5);
      }
    } else {
      scans.push({
        path: cleanPath,
        count: 1,
        method: method,
        lastStatusCode: statusCode,
        statusCodes: [statusCode],
        lastSeen: now,
        firstSeen: now,
        recentIps: ip && ip !== 'unknown' ? [ip] : [],
        category: categorizePath(cleanPath),
      });
    }

    fs.writeFileSync(SCANS_FILE, JSON.stringify(scans, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to record URL scan:', err);
  }
}

export function getTop4xxPaths(limit = 15): Array<UrlScanEntry & { percentage: number }> {
  const scans = getAllUrlScans();
  const sorted = [...scans].sort((a, b) => b.count - a.count);
  const maxCount = sorted.length > 0 ? Math.max(sorted[0].count, 1) : 1;

  return sorted.slice(0, limit).map((s) => ({
    ...s,
    percentage: Math.round((s.count / maxCount) * 100),
  }));
}

export function getUrlScanSummary() {
  const scans = getAllUrlScans();
  const totalHits = scans.reduce((acc, curr) => acc + curr.count, 0);
  const uniquePaths = scans.length;
  const envProbes = scans.filter((s) => s.category === 'ENV_LEAK_PROBE').reduce((acc, curr) => acc + curr.count, 0);
  const apiMismatches = scans.filter((s) => s.category === 'API_MISMATCH').reduce((acc, curr) => acc + curr.count, 0);

  return {
    totalHits,
    uniquePaths,
    envProbes,
    apiMismatches,
    topPath: scans.length > 0 ? [...scans].sort((a, b) => b.count - a.count)[0]?.path : '—',
  };
}

export function clearUrlScans(): void {
  ensureDir();
  try {
    fs.writeFileSync(SCANS_FILE, JSON.stringify([], null, 2), 'utf-8');
  } catch {}
}
