import type { TokenStore } from "@/application/ports";
import { parseApiError } from "./errors";

/** Must stay above the backend chat budget (16s) and below a hung rewrite. */
const REQUEST_TIMEOUT_MS = 20_000;

export interface HttpClient {
  request<T>(path: string, init?: RequestInit): Promise<T>;
}

export function createHttpClient(tokens: TokenStore): HttpClient {
  return {
    async request<T>(path: string, init: RequestInit = {}): Promise<T> {
      const headers = new Headers(init.headers);
      if (!headers.has("Accept")) headers.set("Accept", "application/json");
      if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      const token = tokens.get();
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const signal = mergeSignals(init.signal ?? undefined, REQUEST_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(path, { ...init, headers, signal });
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
  };
}

function mergeSignals(existing: AbortSignal | undefined, ms: number): AbortSignal {
  const timeout = AbortSignal.timeout(ms);
  return existing && typeof AbortSignal.any === "function" ? AbortSignal.any([existing, timeout]) : timeout;
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && (err.name === "AbortError" || err.name === "TimeoutError");
}
