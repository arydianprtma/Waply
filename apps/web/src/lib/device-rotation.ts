import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
const ROTATION_STATE_FILE = path.join(DATA_DIR, "rotation_state.json");
const GATEWAY_URL = process.env.GATEWAY_INTERNAL_URL || "http://localhost:3002";

interface RotationState {
  lastIndex: number;
  lastDeviceId?: string;
  updatedAt: string;
}

function getRotationState(): RotationState {
  try {
    if (fs.existsSync(ROTATION_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(ROTATION_STATE_FILE, "utf-8"));
    }
  } catch {}
  return { lastIndex: 0, updatedAt: new Date().toISOString() };
}

function saveRotationState(state: RotationState) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ROTATION_STATE_FILE, JSON.stringify(state, null, 2));
  } catch {}
}

import { fetchGateway } from "./gateway-client";

export interface ConnectedDevice {
  id: string;
  name?: string;
  phoneNumber?: string;
  status: string;
}

/**
 * Fetch all active/connected WhatsApp devices from Gateway
 */
export async function getActiveDevices(): Promise<ConnectedDevice[]> {
  try {
    const res = await fetchGateway("/api/sessions", { cache: "no-store" });
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data.filter((d: any) => d.status === "connected" || d.status === "CONNECTED");
    }
  } catch (err) {
    console.error("[Rotation] Failed to query gateway sessions:", err);
  }
  return [];
}

/**
 * Get next device using Round-Robin rotation among active devices
 */
export async function getNextRotatedDevice(requestedDeviceId?: string): Promise<ConnectedDevice | null> {
  const activeDevices = await getActiveDevices();

  if (activeDevices.length === 0) {
    // If specific device was requested, try fallback
    if (requestedDeviceId && requestedDeviceId !== "auto_rotate") {
      return { id: requestedDeviceId, status: "unknown" };
    }
    return null;
  }

  // If specific device requested and not auto_rotate
  if (requestedDeviceId && requestedDeviceId !== "auto_rotate") {
    const found = activeDevices.find((d) => d.id === requestedDeviceId);
    return found || activeDevices[0];
  }

  // Auto-Rotate: Round-Robin across active devices
  const state = getRotationState();
  const nextIndex = (state.lastIndex + 1) % activeDevices.length;
  const selectedDevice = activeDevices[nextIndex];

  saveRotationState({
    lastIndex: nextIndex,
    lastDeviceId: selectedDevice.id,
    updatedAt: new Date().toISOString(),
  });

  return selectedDevice;
}
