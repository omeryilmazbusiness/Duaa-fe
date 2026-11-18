import type { TokenStore } from "@/application/ports";
import { parseApiError } from "./errors";
import { createWorkspaceTokenBroker, type WorkspaceTokenBroker } from "./workspace-tokens";

/** Must stay above the backend chat budget (18s) and below a hung rewrite. */
const REQUEST_TIMEOUT_MS = 22_000;

export interface HttpClient {
  request<T>(path: string, init?: RequestInit): Promise<T>;
  requestBlob(path: string, init?: RequestInit): Promise<Blob | null>;
}

export function createHttpClient(tokens: TokenStore): HttpClient {
  const broker: WorkspaceTokenBroker = createWorkspaceTokenBroker(tokens, issueWorkspaceToken);

  async function send(path: string, init: RequestInit, accept: string | null): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
      const headers = new Headers(init.headers);
      if (accept && !headers.has("Accept")) headers.set("Accept", accept);
      const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
      if (init.body && !isFormData && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      const { token, scoped } = await broker.tokenFor(path);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const signal = mergeSignals(init.signal ?? undefined, REQUEST_TIMEOUT_MS);
      const res = await fetch(path, { ...init, headers, signal });
      if (scoped && attempt === 0 && (res.status === 401 || res.status === 403)) {
        broker.invalidate(path);
        continue;
      }
      return res;
    }
  }

  return {
    async request<T>(path: string, init: RequestInit = {}): Promise<T> {
      let res: Response;
      try {
        res = await send(path, init, "application/json");
      } catch (err) {
        if (isAbortError(err)) {
          throw parseApiError(504, {
            error: { code: "ai_provider_timeout", message: "the AI provider took too long to answer; try again" },
          });
        }
        throw err;
      }
      const text = await res.text();
      let body: unknown = null;
      if (text) {
        try {
          body = JSON.parse(text) as unknown;
        } catch {
          if (!res.ok) throw parseApiError(res.status, null);
          throw parseApiError(res.status || 502, { error: { message: "the server sent an unreadable answer" } });
        }
      }
      if (!res.ok) throw parseApiError(res.status, body);
      return body as T;
    },

    async requestBlob(path: string, init: RequestInit = {}): Promise<Blob | null> {
      const res = await send(path, init, null);
      if (res.status === 501 || res.status === 204) {
        return null;
      }
      if (!res.ok) {
        return null;
      }
      return res.blob();
    },
  };
}

async function issueWorkspaceToken(workspaceId: string, primaryToken: string): Promise<string> {
  const res = await fetch(`/v1/me/workspaces/${encodeURIComponent(workspaceId)}/select`, {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Bearer ${primaryToken}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`workspace token ${res.status}`);
  const body = (await res.json()) as { token?: unknown };
  if (typeof body.token !== "string" || !body.token) throw new Error("workspace token missing");
  return body.token;
}

function mergeSignals(existing: AbortSignal | undefined, ms: number): AbortSignal {
  const timeout = AbortSignal.timeout(ms);
  return existing && typeof AbortSignal.any === "function" ? AbortSignal.any([existing, timeout]) : timeout;
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && (err.name === "AbortError" || err.name === "TimeoutError");
}
