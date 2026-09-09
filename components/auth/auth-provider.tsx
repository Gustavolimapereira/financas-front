"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import type { User } from "@/types/api";
import { PageSkeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";

interface AuthContextValue { user: User; setUser: (user: User) => void; }
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest<User>("/api/me").then((data) => { if (active) setUser(data); }).catch(() => {
      if (active) { setFailed(true); router.replace("/login?session=expirada"); router.refresh(); }
    });
    return () => { active = false; };
  }, [router]);

  const value = useMemo(() => user ? { user, setUser } : null, [user]);
  if (!value) return <main className="private-loading">{failed ? <p>Redirecionando para o login...</p> : <PageSkeleton />}</main>;
  return <AuthContext.Provider value={value}><AppShell>{children}</AppShell></AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
