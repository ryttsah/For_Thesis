import type { DemoAccount } from "../types/auth";

/** Demo credentials from the HTML mockup — replace with FastAPI /auth/login later. */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: "PCA-2024-0012", password: "officer123", role: "officer" },
  { id: "FARMER-001", password: "magsasaka123", role: "farmer" },
  { id: "PCA-ADMIN-001", password: "admin2024", role: "admin" },
];

export const DEMO_HELP: Record<
  "officer" | "farmer" | "admin",
  { idLabel: string; id: string; password: string }
> = {
  officer: {
    idLabel: "Employee ID",
    id: "PCA-2024-0012",
    password: "officer123",
  },
  farmer: {
    idLabel: "Farmer ID",
    id: "FARMER-001",
    password: "magsasaka123",
  },
  admin: {
    idLabel: "ID",
    id: "PCA-ADMIN-001",
    password: "admin2024",
  },
};
