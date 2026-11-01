import type { TokenStore } from "@/application/ports";
import type { SessionPayload } from "@/domain/session/types";
import { mapSession } from "@/infrastructure/http/mappers";

const TOKEN_KEY = "duaos_token";
const SESSION_KEY = "duaos_session";
const EXP_KEY = "duaos_token_exp";

type Listener = () => void;

/**
 * Browser token persistence. SSR and the hydration pass must both see `null`
 * (`getServerSnapshot`). The real localStorage value is read only after hydrate.
 */
export class LocalStorageTokenStore implements TokenStore {
  private readonly listeners = new Set<Listener>();

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  get = (): string | null => {
    if (typeof window === "undefined") return null;
    if (isExpired()) {
      this.clear();
      return null;
    }
    return window.localStorage.getItem(TOKEN_KEY);
  };

  getServerSnapshot = (): string | null => null;

  set(token: string, expiresInSec?: number): void {
    window.localStorage.setItem(TOKEN_KEY, token);
    const ttl = expiresInSec && expiresInSec > 0 ? expiresInSec : 8 * 60 * 60;
    window.localStorage.setItem(EXP_KEY, String(Date.now() + ttl * 1000));
    this.emit();
  }

  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(EXP_KEY);
    this.emit();
  }

  readSession(): SessionPayload | null {
    if (typeof window === "undefined" || isExpired()) return null;
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return mapSession(JSON.parse(raw) as unknown);
    } catch {
      return null;
    }
  }

  writeSession(session: SessionPayload): void {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}

function isExpired(): boolean {
  const raw = window.localStorage.getItem(EXP_KEY);
  if (!raw) return false;
  const exp = Number(raw);
  return Number.isFinite(exp) && Date.now() > exp;
}

export const tokenStore = new LocalStorageTokenStore();
