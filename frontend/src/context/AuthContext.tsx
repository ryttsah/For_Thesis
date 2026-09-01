import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { hasAuthToken, isApiEnabled } from "../services/api";
import { fetchCurrentUser } from "../services/auth";
import type { UserRole } from "../types/auth";

export interface AuthUser {
  id: string;
  role: UserRole;
  displayName: string;
  initials: string;
  subtitle: string;
  assignedBrgy?: string | null;
}

const ROLE_HOME: Record<UserRole, string> = {
  officer: "/officer",
  farmer: "/farmer",
  admin: "/admin",
};

const USER_PROFILES: Record<
  string,
  { displayName: string; initials: string; subtitle: string }
> = {
  "PCA-ADMIN-001": {
    displayName: "PCA Administrator",
    initials: "AD",
    subtitle: "System Admin",
  },
};

interface AuthContextValue {
  user: AuthUser | null;
  isAuthLoading: boolean;
  establishSession: (id: string, role: UserRole, displayName?: string, assignedBrgy?: string | null) => void;
  logout: () => void;
  homePath: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "pca_auth_user";

function loadStoredUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function buildAuthUser(
  id: string,
  role: UserRole,
  displayName?: string,
  assignedBrgy?: string | null,
): AuthUser {
  const profile = USER_PROFILES[id] ?? {
    displayName: displayName ?? id,
    initials: (displayName ?? id).slice(0, 2).toUpperCase(),
    subtitle: role === "officer" ? "PCA Officer" : role,
  };

  return {
    id,
    role,
    displayName: displayName ?? profile.displayName,
    initials: profile.initials,
    subtitle: profile.subtitle,
    assignedBrgy: assignedBrgy ?? null,
  };
}

function loadInitialUser(): AuthUser | null {
  if (isApiEnabled() && !hasAuthToken()) {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }

  return loadStoredUser();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadInitialUser);
  const [isAuthLoading, setIsAuthLoading] = useState(() => isApiEnabled() && hasAuthToken());

  useEffect(() => {
    if (!isApiEnabled() || !hasAuthToken()) {
      setIsAuthLoading(false);
      return;
    }

    let cancelled = false;

    void fetchCurrentUser().then((me) => {
      if (cancelled) return;

      if (me) {
        const next = buildAuthUser(me.userId, me.role, me.displayName, me.assignedBrgy);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setUser(next);
      } else {
        localStorage.removeItem("pca_access_token");
        sessionStorage.removeItem(STORAGE_KEY);
        setUser(null);
      }

      setIsAuthLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const establishSession = useCallback(
    (id: string, role: UserRole, displayName?: string, assignedBrgy?: string | null) => {
      const next = buildAuthUser(id, role, displayName, assignedBrgy);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setUser(next);
    },
    [],
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("pca_access_token");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthLoading,
      establishSession,
      logout,
      homePath: user ? ROLE_HOME[user.role] : null,
    }),
    [user, isAuthLoading, establishSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
