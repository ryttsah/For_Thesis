import type { ComponentType } from "react";
import {
  IconChartBar,
  IconChecklist,
  IconClipboardList,
  IconFileExport,
  IconFlag2,
  IconLayoutDashboard,
  IconMap2,
  IconPlant2,
  IconUserCheck,
  IconUsers,
} from "@tabler/icons-react";

export interface NavItem {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; stroke?: number; className?: string }>;
  path: string;
  badge?: number;
}

export const OFFICER_NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: IconLayoutDashboard, path: "/officer" },
      { id: "map", label: "Sector Map", icon: IconMap2, path: "/officer/map" },
      { id: "analytics", label: "Analytics", icon: IconChartBar, path: "/officer/analytics" },
    ],
  },
  {
    label: "Management",
    items: [
      { id: "farms", label: "All Farms", icon: IconPlant2, path: "/officer/farms" },
      { id: "surveys", label: "Surveys", icon: IconClipboardList, path: "/officer/surveys" },
      { id: "visits", label: "Priority Visits", icon: IconFlag2, path: "/officer/visits" },
    ],
  },
  {
    label: "Data",
    items: [
      { id: "queue", label: "Review Queue", icon: IconChecklist, path: "/officer/queue" },
      { id: "reports", label: "Reports", icon: IconFileExport, path: "/officer/reports" },
    ],
  },
];

export const ADMIN_NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      {
        id: "admin-dashboard",
        label: "Dashboard",
        icon: IconLayoutDashboard,
        path: "/admin",
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        id: "admin-approvals",
        label: "Farmer Approvals",
        icon: IconUserCheck,
        path: "/admin/approvals",
      },
      { id: "admin-officers", label: "Officer Management", icon: IconUsers, path: "/admin/officers" },
      { id: "admin-farms", label: "All Farms", icon: IconPlant2, path: "/admin/farms" },
      {
        id: "admin-surveys",
        label: "All Surveys",
        icon: IconClipboardList,
        path: "/admin/surveys",
      },
    ],
  },
  {
    label: "Reports",
    items: [
      { id: "admin-analytics", label: "Analytics", icon: IconChartBar, path: "/admin/analytics" },
      { id: "admin-reports", label: "Reports", icon: IconFileExport, path: "/admin/reports" },
    ],
  },
];

export const OFFICER_PAGE_TITLES: Record<string, string> = {
  "/officer": "Dashboard",
  "/officer/map": "Sector Map",
  "/officer/analytics": "Analytics",
  "/officer/farms": "All Farms",
  "/officer/surveys": "Surveys",
  "/officer/visits": "Priority Visits",
  "/officer/queue": "Review Queue",
  "/officer/reports": "Reports",
};

export const ADMIN_PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/approvals": "Farmer Approvals",
  "/admin/officers": "Officer Management",
  "/admin/farms": "All Farms",
  "/admin/surveys": "All Surveys",
  "/admin/analytics": "Analytics",
  "/admin/reports": "Reports",
};
