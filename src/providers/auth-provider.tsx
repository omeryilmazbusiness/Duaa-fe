"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { LoginResult, SessionPayload } from "@/domain/session/types";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel, tokenStore } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";

interface AuthContextValue {
  token: string | null;
  session: SessionPayload | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setToken: (token: string, expiresInSec?: number) => void;
  acceptLogin: (token: string, session: SessionPayload, expiresInSec?: number) => void;
  switchWorkspace: (workspaceId: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [ready, setReady] = useState(false);
  const [cached, setCached] = useState<SessionPayload | null>(null);
  const token = useSyncExternalStore(tokenStore.subscribe, tokenStore.get, tokenStore.getServerSnapshot);
  const liveToken = ready ? token : null;

  useEffect(() => {
    setCached(tokenStore.readSession());
    setReady(true);
  }, []);

  const setToken = useCallback((next: string, expiresInSec?: number) => {
    tokenStore.set(next, expiresInSec);
  }, []);

  const acceptLogin = useCallback((next: string, session: SessionPayload, expiresInSec?: number) => {
    tokenStore.writeSession(session);
    setCached(session);
    tokenStore.set(next, expiresInSec);
  }, []);

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      const res = await kernel.switchWorkspace(workspaceId);
      if (res.token && res.session) {
        // PDF WS-01: clear prior business caches on workspace switch.
        qc.clear();
        tokenStore.writeSession(res.session);
        setCached(res.session);
        tokenStore.set(res.token, res.expiresIn);
      }
      return res;
    },
    [qc],
  );

  const logout = useCallback(() => {
    qc.clear();
    setCached(null);
    tokenStore.clear();
  }, [qc]);

  const me = useQuery({
    queryKey: [...qk.me, liveToken],
    queryFn: () => kernel.me(),
    enabled: ready && !!liveToken,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 400,
  });

  useEffect(() => {
    if (me.data) {
      tokenStore.writeSession(me.data);
      setCached(me.data);
    }
  }, [me.data]);

  useEffect(() => {
    if (!ready) return;
    if (me.error instanceof ApiError && me.error.status === 401) {
      logout();
    }
  }, [ready, me.error, logout]);

  const session = me.data ?? cached;
  const value = useMemo<AuthContextValue>(
    () => ({
      token: liveToken,
      session,
      // Wait for localStorage before deciding anyone is logged out.
      isLoading: !ready || (!!liveToken && !session && !me.isError),
      isAuthenticated: ready && !!liveToken && !!session,
      setToken,
      acceptLogin,
      switchWorkspace,
      logout,
    }),
    [ready, liveToken, session, me.isError, setToken, acceptLogin, switchWorkspace, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
