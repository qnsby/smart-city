import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import { getMeApi, loginApi, registerApi } from "../api/auth";
import { registerUnauthorizedHandler } from "../api/client";
import type { LoginPayload, RegisterPayload, User } from "../types";
import { STORAGE_KEYS } from "../utils/constants";
import { normalizeRole } from "../utils/roles";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(localStorage.getItem(STORAGE_KEYS.token));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    return raw ? (JSON.parse(raw) as User) : null;
  });
  const [loading, setLoading] = useState(Boolean(token));

  const persist = (nextToken: string | null, nextUser: User | null) => {
    setToken(nextToken);
    setUser(nextUser);
    if (nextToken) localStorage.setItem(STORAGE_KEYS.token, nextToken);
    else localStorage.removeItem(STORAGE_KEYS.token);
    if (nextUser) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
    else localStorage.removeItem(STORAGE_KEYS.user);
  };

  const logout = () => {
    persist(null, null);
    if (window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  };

  useEffect(() => {
    registerUnauthorizedHandler(logout);
  }, []);

  const refreshMe = async () => {
    if (!localStorage.getItem(STORAGE_KEYS.token)) return;
    const me = await getMeApi();
    const normalized: User = { ...me, role: normalizeRole(me.role) };
    persist(localStorage.getItem(STORAGE_KEYS.token), normalized);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await getMeApi();
        if (!active) return;
        persist(token, { ...me, role: normalizeRole(me.role) });
      } catch (err: unknown) {
        if (!active) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        // Current backend may not expose /me. Keep cached session if we still have user.
        if (status === 404 && user) {
          setLoading(false);
          return;
        }
        persist(null, null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = async (payload: LoginPayload) => {
    const result = await loginApi(payload);
    localStorage.setItem(STORAGE_KEYS.token, result.token);
    setToken(result.token);
    if (result.user?.id && result.user?.name && result.user?.role) {
      persist(result.token, {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email || "",
        role: normalizeRole(result.user.role),
        department_id: result.user.department_id ?? null
      });
      return;
    }
    const me = await getMeApi();
    persist(result.token, { ...me, role: normalizeRole(me.role) });
  };

  const register = async (payload: RegisterPayload) => {
    await registerApi(payload);
    await login({ login: payload.email, password: payload.password });
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      refreshMe
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
