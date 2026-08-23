import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { AuthUser, Role } from "@/types";
import { users as systemUsers } from "@/lib/mockUsers";

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "jfk.auth.user";

const DEMO_PASSWORD = "baqar+321456";

const ACCOUNTS: Array<{ name: string; email: string; role: Role; status: string }> = [
  { name: "Baqar Hassan", email: "baqar@jfktravel.com", role: "Administrator", status: "Active" },
  ...systemUsers.map((u) => ({ name: u.name, email: u.email, role: u.role, status: u.status })),
];

function findAccount(email: string) {
  const normalized = email.trim().toLowerCase();
  return ACCOUNTS.find((a) => a.email.toLowerCase() === normalized);
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const login = useCallback(async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 800));
    const account = findAccount(email);
    if (!account || password !== DEMO_PASSWORD) {
      throw new Error("Invalid email or password.");
    }
    if (account.status !== "Active") {
      throw new Error("This account is inactive or suspended. Contact your administrator.");
    }
    const authUser: AuthUser = {
      name: account.name,
      email: account.email,
      role: account.role,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
