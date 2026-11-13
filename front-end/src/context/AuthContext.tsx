import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiRequest } from "@/api/client";
import type { ApiUser } from "@/api/types";
import type { AuthUser, Role } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, turnstileToken?: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(value: ApiUser): AuthUser {
  const roles = value.roles.length ? value.roles : (["Agent"] as Role[]);
  const role = value.isSuperAdmin ? ("SuperAdmin" as Role) : roles[0];
  return {
    id: value.id,
    name: value.name,
    email: value.email,
    role,
    roles: value.isSuperAdmin ? (["SuperAdmin", ...roles] as Role[]) : roles,
    permissions: value.permissions,
    companyId: value.companyId,
    branchId: value.branchId,
    isSuperAdmin: Boolean(value.isSuperAdmin),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiRequest<ApiUser>("/auth/me")
      .then((value) => active && setUser(mapUser(value)))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const login = useCallback(async (email: string, password: string, turnstileToken?: string) => {
    const value = await apiRequest<ApiUser>("/auth/login", {
      method: "POST",
      body: {
        email: email.trim(),
        password,
        ...(turnstileToken ? { turnstileToken } : {}),
      },
      retryAuth: false,
    });
    const mapped = mapUser(value);
    setUser(mapped);
    return mapped;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest<void>("/auth/logout", { method: "POST", retryAuth: false });
    } finally {
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (name: string, email: string) => {
    const value = await apiRequest<ApiUser>("/auth/me", {
      method: "PATCH",
      body: { name: name.trim(), email: email.trim() },
    });
    setUser(mapUser(value));
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, updateProfile }),
    [user, loading, login, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
