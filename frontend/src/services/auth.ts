import { DEMO_ACCOUNTS } from "../constants/demoAccounts";
import type { LoginCredentials, UserRole } from "../types/auth";
import { getApiBase, getAuthHeaders, isApiEnabled } from "./api";

export interface AuthResult {
  success: boolean;
  role?: UserRole;
  message?: string;
}

export interface CurrentUserPayload {
  userId: string;
  role: UserRole;
  displayName: string;
  assignedBrgy?: string | null;
}

export async function fetchCurrentUser(): Promise<CurrentUserPayload | null> {
  if (!isApiEnabled()) return null;

  try {
    const response = await fetch(`${getApiBase()}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      user_id: string;
      role: UserRole;
      display_name: string;
      assigned_brgy?: string | null;
    };

    return {
      userId: data.user_id,
      role: data.role,
      displayName: data.display_name,
      assignedBrgy: data.assigned_brgy ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Validates credentials. Uses demo accounts until FastAPI JWT auth is wired.
 * Set VITE_API_URL to your backend when /auth/login is ready.
 */
export async function login(credentials: LoginCredentials): Promise<AuthResult> {
  if (!credentials.id?.trim() || !credentials.password?.trim()) {
    return { success: false, message: "Please fill all the required information." };
  }

  if (isApiEnabled()) {
    try {
      const response = await fetch(`${getApiBase()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          detail?: string;
        } | null;
        return {
          success: false,
          message: data?.detail ?? "That ID or password doesn't match. Check and try again.",
        };
      }

      const data = (await response.json()) as { role: UserRole; access_token?: string };
      if (!data.access_token) {
        return {
          success: false,
          message: "Server did not return an access token. Check the backend is running.",
        };
      }
      localStorage.setItem("pca_access_token", data.access_token);
      return { success: true, role: data.role };
    } catch {
      return {
        success: false,
        message:
          "Cannot reach the API. Run uvicorn on port 8000 in a terminal (not only the Ports tab). " +
          "With VS Code Ports: forward 5173 and 8000, open the 5173 link, and if login still fails paste the 8000 URL: " +
          "localStorage.setItem('pca_api_base_override','https://YOUR-8000-FORWARDED-URL') then refresh.",
      };
    }
  }

  const match = DEMO_ACCOUNTS.find(
    (account) =>
      account.id === credentials.id &&
      account.password === credentials.password &&
      account.role === credentials.role,
  );

  if (!match) {
    return {
      success: false,
      message: "That ID or password doesn't match. Check and try again.",
    };
  }

  return { success: true, role: match.role };
}
