const API_OVERRIDE_KEY = "pca_api_base_override";

export function setApiBaseOverride(url: string | null): void {
  if (!url) {
    localStorage.removeItem(API_OVERRIDE_KEY);
    return;
  }
  localStorage.setItem(API_OVERRIDE_KEY, url.replace(/\/$/, ""));
}

function envMode(): string {
  return (import.meta.env.VITE_API_URL ?? "").trim().toLowerCase();
}

/** Same-origin requests via Vite proxy → localhost:8000 (best for dev tunnels). */
export function usesDevProxy(): boolean {
  return envMode() === "proxy";
}

function resolveAutoApiBase(): string {
  if (typeof window === "undefined") return "";

  const override = localStorage.getItem(API_OVERRIDE_KEY)?.trim();
  if (override) return override.replace(/\/$/, "");

  const { protocol, hostname, port } = window.location;

  if (hostname.includes("5173")) {
    return `${protocol}//${hostname.replace(/5173/g, "8000")}`;
  }
  if (hostname.includes("-5173.")) {
    return `${protocol}//${hostname.replace("-5173.", "-8000.")}`;
  }

  if (port === "5173" || hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//${hostname}:8000`;
  }

  return `${protocol}//${hostname}:8000`;
}

/**
 * API base URL.
 * - `proxy` — recommended for VS Code dev tunnels (no CORS; only forward port 5173)
 * - `http://localhost:8000` — same PC, direct API
 * - `auto` — try to guess :8000 or tunnel host (often blocked by CORS)
 */
export function getApiBase(): string {
  if (usesDevProxy()) {
    return "";
  }

  const raw = (import.meta.env.VITE_API_URL ?? "").trim();
  if (raw && raw.toLowerCase() !== "auto") {
    return raw.replace(/\/$/, "");
  }
  return resolveAutoApiBase();
}

export function isApiEnabled(): boolean {
  if (usesDevProxy()) return true;
  return Boolean(getApiBase());
}

export function hasAuthToken(): boolean {
  return Boolean(localStorage.getItem("pca_access_token"));
}

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("pca_access_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: string | { msg?: string }[] };
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
  } catch {
    /* ignore */
  }
  return fallback;
}
