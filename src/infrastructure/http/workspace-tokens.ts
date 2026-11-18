import type { TokenStore } from "@/application/ports";

const WORKSPACE_PATH = /^\/v1\/workspaces\/([0-9a-fA-F-]{36})(?:\/|$|\?)/;
const REFRESH_MARGIN_MS = 60_000;
const FALLBACK_TTL_MS = 10 * 60_000;

interface TokenClaims {
  workspaceId?: string;
  expMs?: number;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

export type IssueWorkspaceToken = (workspaceId: string, primaryToken: string) => Promise<string>;

export interface WorkspaceTokenBroker {
  /** Bearer token for `path`: the session token, or one scoped to the workspace the path targets. */
  tokenFor(path: string): Promise<{ token: string | null; scoped: boolean }>;
  invalidate(path: string): void;
}

export function workspaceIdFromPath(path: string): string | null {
  const match = WORKSPACE_PATH.exec(path);
  return match?.[1] ? match[1].toLowerCase() : null;
}

export function readTokenClaims(token: string): TokenClaims | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const json = JSON.parse(decodeBase64Url(part)) as { workspace_id?: unknown; exp?: unknown };
    return {
      workspaceId: typeof json.workspace_id === "string" ? json.workspace_id.toLowerCase() : undefined,
      expMs: typeof json.exp === "number" ? json.exp * 1000 : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * The backend binds every token to one workspace. A general manager browsing the
 * portfolio dashboard needs hotel and cafe data side by side, so requests that
 * target another workspace use a token issued for that membership instead.
 */
export function createWorkspaceTokenBroker(
  tokens: TokenStore,
  issue: IssueWorkspaceToken,
  now: () => number = Date.now,
): WorkspaceTokenBroker {
  let owner: string | null = null;
  const cache = new Map<string, CachedToken>();
  const inflight = new Map<string, Promise<string | null>>();

  function resetIfOwnerChanged(primary: string) {
    if (owner === primary) return;
    owner = primary;
    cache.clear();
    inflight.clear();
  }

  async function scopedToken(workspaceId: string, primary: string): Promise<string | null> {
    const hit = cache.get(workspaceId);
    if (hit && hit.expiresAt - REFRESH_MARGIN_MS > now()) return hit.token;
    const pending = inflight.get(workspaceId);
    if (pending) return pending;
    const request = issue(workspaceId, primary)
      .then((token) => {
        if (owner !== primary) return null;
        const exp = readTokenClaims(token)?.expMs ?? now() + FALLBACK_TTL_MS;
        cache.set(workspaceId, { token, expiresAt: exp });
        return token;
      })
      .catch(() => null)
      .finally(() => {
        inflight.delete(workspaceId);
      });
    inflight.set(workspaceId, request);
    return request;
  }

  return {
    async tokenFor(path) {
      const primary = tokens.get();
      if (!primary) return { token: null, scoped: false };
      resetIfOwnerChanged(primary);
      const target = workspaceIdFromPath(path);
      if (!target) return { token: primary, scoped: false };
      const own = readTokenClaims(primary)?.workspaceId;
      if (!own || own === target) return { token: primary, scoped: false };
      const scoped = await scopedToken(target, primary);
      return scoped ? { token: scoped, scoped: true } : { token: primary, scoped: false };
    },
    invalidate(path) {
      const target = workspaceIdFromPath(path);
      if (target) cache.delete(target);
    },
  };
}

function decodeBase64Url(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
