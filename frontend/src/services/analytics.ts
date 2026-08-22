import { getApiBase, getAuthHeaders, isApiEnabled } from "./api";

export interface ConditionTrendData {
  labels: string[];
  healthy: number[];
  yellowing: number[];
  scale: number[];
  beetle: number[];
  scope: string;
  brgy?: string | null;
}

export interface ProvincialStats {
  healthy_pct: number;
  yellowing_pct: number;
  pest_pct: number;
  labels: Record<string, string>;
  sample_size: number;
}

export interface FarmerSectorRow {
  code: string;
  status: string;
  label_en: string;
  label_hil: string;
  color: string;
}

export interface PortalNotification {
  id: string;
  title: string;
  body: string;
  href: string;
  is_new: boolean;
}

export async function fetchConditionTrend(brgy?: string): Promise<ConditionTrendData | null> {
  if (!isApiEnabled()) return null;
  const q = brgy ? `?brgy=${encodeURIComponent(brgy)}` : "";
  try {
    const res = await fetch(`${getApiBase()}/analytics/trend${q}`, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    return (await res.json()) as ConditionTrendData;
  } catch {
    return null;
  }
}

export async function fetchOfficerConditionTrend(): Promise<ConditionTrendData | null> {
  if (!isApiEnabled()) return null;
  try {
    const res = await fetch(`${getApiBase()}/analytics/trend/officer`, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    return (await res.json()) as ConditionTrendData;
  } catch {
    return null;
  }
}

export async function fetchProvincialStats(): Promise<ProvincialStats | null> {
  if (!isApiEnabled()) return null;
  try {
    const res = await fetch(`${getApiBase()}/analytics/province`, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    return (await res.json()) as ProvincialStats;
  } catch {
    return null;
  }
}

export async function fetchFarmerSectorStatus(): Promise<FarmerSectorRow[] | null> {
  if (!isApiEnabled()) return null;
  try {
    const res = await fetch(`${getApiBase()}/analytics/farmer/sectors`, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    return (await res.json()) as FarmerSectorRow[];
  } catch {
    return null;
  }
}

export async function fetchPortalNotifications(): Promise<PortalNotification[]> {
  if (!isApiEnabled()) return [];
  try {
    const res = await fetch(`${getApiBase()}/analytics/notifications`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return (await res.json()) as PortalNotification[];
  } catch {
    return [];
  }
}
