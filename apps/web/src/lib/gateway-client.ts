/**
 * Unified Gateway Client Helper for Next.js Web App
 * Automatically injects internal security token
 */

const GATEWAY_URL = process.env.GATEWAY_INTERNAL_URL || process.env.GATEWAY_URL || "http://localhost:3002";
const GATEWAY_SECRET = process.env.GATEWAY_SECRET || "sendora_internal_gateway_token_key";

export function getGatewayUrl(): string {
  return GATEWAY_URL;
}

export function getGatewayHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    "x-gateway-secret": GATEWAY_SECRET,
    ...extraHeaders,
  };
}

export async function fetchGateway(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${GATEWAY_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const headers = {
    ...getGatewayHeaders(),
    ...(options.headers || {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
