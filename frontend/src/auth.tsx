import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "./api";

interface AuthCtx {
  isAdmin: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(() => !!getToken());

  const logout = useCallback(() => {
    setToken(null);
    setIsAdmin(false);
  }, []);

  const login = useCallback(async (password: string) => {
    const { access_token } = await api.login(password);
    setToken(access_token);
    setIsAdmin(true);
  }, []);

  useEffect(() => {
    window.addEventListener("auth:expired", logout);
    return () => window.removeEventListener("auth:expired", logout);
  }, [logout]);

  return <Ctx.Provider value={{ isAdmin, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth fuera de AuthProvider");
  return ctx;
}
