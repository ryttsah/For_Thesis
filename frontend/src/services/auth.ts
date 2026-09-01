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

/** Validates credentials against the FastAPI auth service. */
export async function login(credentials: LoginCredentials): Promise<AuthResult> {
  if (!credentials.id?.trim() || !credentials.password?.trim()) {
    return { success: false, message: "Please fill all the required information." };
  }

  if (!isApiEnabled()) {
    return {
      success: false,
      message: "The API is not configured. Connect the backend before signing in.",
    };
  }

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
        "Cannot reach the API. Check that the backend service is running and VITE_API_URL points to it.",
    };
  }
}
