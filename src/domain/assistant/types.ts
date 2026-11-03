export type AssistantProviderId = "openai" | "gemini";

export interface AssistantModelOption {
  id: string;
  /** Served on the provider's free API tier. */
  free: boolean;
}

export interface AssistantProviderOption {
  id: AssistantProviderId;
  label: string;
  defaultModel: string;
  models: AssistantModelOption[];
}

export interface AssistantSettings {
  configured: boolean;
  enabled: boolean;
  provider: AssistantProviderId;
  model: string;
  /** Last 4 characters of the stored key. The key itself is never returned. */
  keyHint: string;
  dailyLimit: number;
  providers: AssistantProviderOption[];
}

export interface AssistantUsage {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
}

export interface AssistantStatus {
  available: boolean;
  configured: boolean;
  enabled: boolean;
  provider?: AssistantProviderId;
  model?: string;
  usage: AssistantUsage;
}

export interface AssistantSaveInput {
  provider: AssistantProviderId;
  model: string;
  /** Empty keeps the stored key. */
  apiKey: string;
  dailyLimit: number;
  enabled: boolean;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export interface ChatReply {
  reply: string;
  usage: AssistantUsage;
}

export const MAX_MESSAGE_CHARS = 2000;
export const MAX_HISTORY = 4;
export const MIN_DAILY_LIMIT = 1;
export const MAX_DAILY_LIMIT = 500;

export function canSend(draft: string, pending: boolean, remaining: number): boolean {
  const text = draft.trim();
  return !pending && remaining > 0 && text.length > 0 && [...text].length <= MAX_MESSAGE_CHARS;
}

/** The wire transcript: most recent turns only, ids stripped. Mirrors the server clamp. */
export function toWireMessages(history: ChatMessage[]): { role: ChatRole; content: string }[] {
  let wire = history.map(({ role, content }) => ({ role, content }));
  while (wire.length > 0 && wire[wire.length - 1]!.role !== "user") {
    wire = wire.slice(0, -1);
  }
  if (wire.length > MAX_HISTORY) {
    wire = wire.slice(-MAX_HISTORY);
  }
  while (wire.length > 0 && wire[0]!.role !== "user") {
    wire = wire.slice(1);
  }
  return wire;
}

export function clampDailyLimit(value: number): number {
  if (!Number.isFinite(value)) return MIN_DAILY_LIMIT;
  return Math.min(MAX_DAILY_LIMIT, Math.max(MIN_DAILY_LIMIT, Math.round(value)));
}

/** Fraction of today's quota used, 0..1. */
export function usageRatio(usage: AssistantUsage): number {
  if (usage.limit <= 0) return 1;
  return Math.min(1, Math.max(0, usage.used / usage.limit));
}

export type AssistantErrorKind = "limit" | "key" | "provider" | "not_configured" | "warming" | "generic";

/** Maps a backend error code to a UI category so copy stays localised. */
export function assistantErrorKind(code: string): AssistantErrorKind {
  switch (code) {
    case "ai_daily_limit":
      return "limit";
    case "ai_key_rejected":
    case "ai_key_unreadable":
    case "ai_key_invalid":
    case "ai_key_required":
      return "key";
    case "ai_not_configured":
      return "not_configured";
    case "ai_provider_timeout":
      return "warming";
    case "ai_model_not_found":
    case "ai_request_rejected":
    case "ai_region_blocked":
    case "ai_provider_rate_limited":
    case "ai_provider_unavailable":
    case "ai_provider_unreachable":
    case "ai_provider_bad_response":
    case "ai_empty_response":
      return "provider";
    default:
      return "generic";
  }
}

/** Sentinel for the "other model" choice in the picker. Never sent to the API. */
export const CUSTOM_MODEL = "__custom__";

export const DEFAULT_PROVIDER: AssistantProviderId = "gemini";
export const DEFAULT_MODEL = "gemini-3.1-flash-lite";

const minKeyLen = 16;
const maxKeyLen = 256;

/** Same bounds as the backend — used to auto-save a pasted key. */
export function looksLikeAPIKey(raw: string): boolean {
  const key = raw.trim();
  if (key.length < minKeyLen || key.length > maxKeyLen) return false;
  return !/\s/.test(key) && /^[\x21-\x7E]+$/.test(key);
}

/** Display-only mask. The raw key is never stored in the browser. */
export function maskStoredKey(hint: string): string {
  const tail = hint.trim();
  return tail ? `••••••••${tail}` : "••••••••";
}

/** Whether `model` is one of the provider's listed models. */
export function isListedModel(models: AssistantModelOption[], model: string): boolean {
  return models.some((m) => m.id === model);
}

/**
 * Models to offer for `provider`. The live list (from the stored key) only
 * applies to the provider that key belongs to; otherwise the built-in catalogue.
 */
export function modelsFor(
  provider: AssistantProviderOption | undefined,
  live: AssistantModelOption[] | undefined,
  liveProvider: AssistantProviderId,
): AssistantModelOption[] {
  if (!provider) return [];
  if (live && live.length > 0 && provider.id === liveProvider) return live;
  return provider.models;
}

/** Gemini first, then GPT — the order the settings picker renders. */
export function pickerGroups(
  providers: AssistantProviderOption[],
  live: AssistantModelOption[] | undefined,
  liveProvider: AssistantProviderId,
): AssistantProviderOption[] {
  const groups = providers.map((p) => ({ ...p, models: modelsFor(p, live, liveProvider) }));
  return [...groups].sort((a, b) => Number(b.id === DEFAULT_PROVIDER) - Number(a.id === DEFAULT_PROVIDER));
}

/** First-time setup: the provider's free default, Gemini when available. */
export function defaultSelection(providers: AssistantProviderOption[]): {
  provider: AssistantProviderId;
  model: string;
} {
  const gemini = providers.find((p) => p.id === DEFAULT_PROVIDER);
  if (gemini) {
    const freeDefault = gemini.models.find((m) => m.id === gemini.defaultModel) ?? gemini.models.find((m) => m.free);
    return { provider: DEFAULT_PROVIDER, model: freeDefault?.id ?? (gemini.defaultModel || DEFAULT_MODEL) };
  }
  const first = providers[0];
  return { provider: first?.id ?? DEFAULT_PROVIDER, model: first?.defaultModel ?? DEFAULT_MODEL };
}

/** Encodes a picker row so Gemini and GPT models can share one <select>. */
export function selectionValue(provider: AssistantProviderId, model: string): string {
  return `${provider}:${model}`;
}

export function parseSelection(raw: string): { provider: AssistantProviderId; model: string } | null {
  const sep = raw.indexOf(":");
  if (sep <= 0) return null;
  const provider = raw.slice(0, sep);
  const model = raw.slice(sep + 1);
  if ((provider !== "gemini" && provider !== "openai") || !model) return null;
  return { provider, model };
}
