"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp, Plus, Sparkles, Trash2, X } from "lucide-react";
import { chatTitle } from "@/domain/assistant/desk";
import { useCallback, useEffect, useRef, useState } from "react";
import { canSend, MAX_MESSAGE_CHARS, usageRatio, type AssistantUsage } from "@/domain/assistant/types";
import type { SessionPayload } from "@/domain/session/types";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { AiMark } from "./ai-mark";
import { useAssistantChat, useAssistantStatus } from "./use-assistant";

/** Floating DUAA AI — always on the right for the GM. Chat opens only when available. */
export function AssistantWidget({ session }: { session: SessionPayload }) {
  const status = useAssistantStatus(session);
  if (session.scope !== "general_manager") return null;
  if (status.data?.available) {
    return <Assistant session={session} usage={status.data.usage} />;
  }
  return <AssistantWarming />;
}

/** Key not set yet: keep the launcher, never surface a configuration error. */
function AssistantWarming() {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {!open ? (
          <motion.button
            key="launcher-warm"
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t.aiOpen}
            data-testid="ai-launcher"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            whileHover={reduceMotion ? undefined : { y: -2 }}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            className="duaa-ai-ring fixed bottom-5 end-5 z-50 inline-flex h-12 items-center gap-2 rounded-full ps-3 pe-4 shadow-[0_12px_40px_-12px_rgba(124,58,237,0.55)] outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          >
            <AiMark />
            <span className="duaa-ai-text text-[13px] font-semibold tracking-[0.14em]">{t.aiName}</span>
          </motion.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <motion.section
            key="panel-warm"
            role="dialog"
            aria-label={t.aiName}
            data-testid="ai-panel-warming"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-3 bottom-3 z-50 flex max-h-[min(420px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-[0_30px_80px_-24px_rgba(76,29,149,0.45)] sm:inset-x-auto sm:bottom-5 sm:end-5 sm:w-[400px]"
          >
            <header className="relative flex items-center gap-3 px-5 pb-3 pt-4">
              <AiMark className="h-9 w-9" />
              <div className="min-w-0 flex-1">
                <p className="duaa-ai-text text-[15px] font-semibold tracking-[0.14em]">{t.aiName}</p>
                <p className="truncate text-[11px] text-zinc-500">{t.aiWarmingTagline}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.aiClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="relative flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-8 pt-2 text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
                <Sparkles className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <p
                role="status"
                data-testid="ai-warming-message"
                className="rounded-2xl bg-emerald-50 px-4 py-3 text-[13.5px] leading-snug text-emerald-800 ring-1 ring-emerald-200/80"
              >
                {t.aiWarmingBody}
              </p>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function Assistant({ session, usage }: { session: SessionPayload; usage: AssistantUsage }) {
  const { t, locale } = useLocale();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const onFailed = useCallback((text: string, tabId: string) => {
    setDrafts((cur) => ({ ...cur, [tabId]: text }));
  }, []);
  const chat = useAssistantChat({ workspaceId: session.workspace.id, locale, onFailed });
  const draft = drafts[chat.activeId] ?? "";
  const setDraft = (text: string) => setDrafts((cur) => ({ ...cur, [chat.activeId]: text }));
  const exhausted = usage.remaining <= 0;
  const sendable = canSend(draft, chat.pending, usage.remaining);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [chat.messages.length, chat.pending, chat.error, chat.streamingId, reduceMotion]);

  const submit = (text: string) => {
    chat.send(text);
    setDraft("");
  };

  const suggestions = [t.aiSuggestSummary, t.aiSuggestLate, t.aiSuggestTill];

  return (
    <>
      <AnimatePresence>
        {!open ? (
          <motion.button
            key="launcher"
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t.aiOpen}
            data-testid="ai-launcher"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            whileHover={reduceMotion ? undefined : { y: -2 }}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            className="duaa-ai-ring fixed bottom-5 end-5 z-50 inline-flex h-12 items-center gap-2 rounded-full ps-3 pe-4 shadow-[0_12px_40px_-12px_rgba(124,58,237,0.55)] outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          >
            <AiMark />
            <span className="duaa-ai-text text-[13px] font-semibold tracking-[0.14em]">{t.aiName}</span>
          </motion.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <motion.section
            key="panel"
            role="dialog"
            aria-label={t.aiName}
            data-testid="ai-panel"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-3 bottom-3 z-50 flex h-[min(640px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-[0_30px_80px_-24px_rgba(76,29,149,0.45)] sm:inset-x-auto sm:bottom-5 sm:end-5 sm:w-[400px]"
          >
            <div aria-hidden className="pointer-events-none absolute -top-24 -end-16 h-56 w-56 rounded-full bg-gradient-to-br from-violet-300/40 via-cyan-200/40 to-pink-200/40 blur-3xl" />

            <header className="relative flex items-center gap-3 px-5 pb-3 pt-4">
              <AiMark className="h-9 w-9" />
              <div className="min-w-0 flex-1">
                <p className="duaa-ai-text text-[15px] font-semibold tracking-[0.14em]">{t.aiName}</p>
                <p className="truncate text-[11px] text-zinc-500">{t.aiTagline}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  chat.clearAll();
                  setDrafts({});
                }}
                disabled={chat.desk.tabs.every((tab) => tab.messages.length === 0) && !chat.pending}
                aria-label={t.aiClearAll}
                title={t.aiClearAll}
                data-testid="ai-remove-chats"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.aiClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="relative flex items-center gap-1 px-4 pb-2" role="tablist" aria-label={t.aiName}>
              {chat.desk.tabs.map((tab, index) => {
                const label = chatTitle(tab.messages, t.aiChatTab.replace("{n}", String(index + 1)));
                const selected = tab.id === chat.activeId;
                return (
                  <div
                    key={tab.id}
                    className={cn(
                      "flex min-w-0 items-center rounded-full border px-1",
                      selected ? "border-violet-200 bg-violet-50" : "border-zinc-200 bg-white",
                    )}
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      title={label}
                      onClick={() => chat.pickTab(tab.id)}
                      className={cn(
                        "max-w-[88px] truncate px-2 py-1 text-[11px] font-semibold",
                        selected ? "text-violet-800" : "text-zinc-500",
                      )}
                    >
                      {label}
                    </button>
                    {chat.desk.tabs.length > 1 ? (
                      <button
                        type="button"
                        aria-label={t.aiCloseTab}
                        onClick={() => chat.removeTab(tab.id)}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => chat.addTab()}
                disabled={!chat.canAddTab}
                aria-label={t.aiNewChat}
                title={chat.canAddTab ? t.aiNewChat : t.aiMaxTabs}
                data-testid="ai-new-tab"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <UsageMeter usage={usage} label={t.aiUsage} />

            <div ref={listRef} aria-live="polite" className="relative flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {chat.messages.length === 0 ? (
                <Welcome
                  title={t.aiWelcomeTitle}
                  body={t.aiWelcomeBody}
                  suggestions={suggestions}
                  disabled={exhausted || chat.pending}
                  onPick={submit}
                />
              ) : (
                chat.messages.map((m, i) => (
                  <Bubble key={`${m.id}:${i}`} role={m.role} content={m.content} streaming={m.id === chat.streamingId} />
                ))
              )}
              {chat.pending ? <Thinking label={t.aiThinking} /> : null}
              {chat.error ? (
                <p
                  role="status"
                  data-testid="ai-warming-message"
                  className="rounded-2xl bg-emerald-50 px-3.5 py-2.5 text-[12.5px] leading-snug text-emerald-800 ring-1 ring-emerald-200/80"
                >
                  {t.aiWarmingBody}
                </p>
              ) : null}
            </div>

            <footer className="relative border-t border-zinc-100 bg-white/90 px-3 pb-3 pt-2.5 backdrop-blur">
              {exhausted ? (
                <p className="mb-2 px-1 text-center text-[12px] font-medium text-amber-700">{t.aiLimitReached}</p>
              ) : null}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (sendable) submit(draft);
                }}
                className="flex items-end gap-2 rounded-[22px] border border-zinc-200 bg-zinc-50/70 p-1.5 transition focus-within:border-violet-300 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(139,92,246,0.10)]"
              >
                <textarea
                  ref={inputRef}
                  value={draft}
                  rows={1}
                  maxLength={MAX_MESSAGE_CHARS}
                  disabled={exhausted}
                  placeholder={t.aiInputPlaceholder}
                  aria-label={t.aiInputPlaceholder}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      if (sendable) submit(draft);
                    }
                  }}
                  className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-3 py-2 text-[13.5px] leading-snug text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!sendable}
                  aria-label={t.aiSend}
                  className="duaa-ai-orb inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-md shadow-violet-500/30 transition enabled:hover:scale-105 disabled:opacity-35"
                >
                  <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </form>
              <p className="mt-2 px-2 text-center text-[10.5px] leading-snug text-zinc-400">{t.aiFooter}</p>
            </footer>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function UsageMeter({ usage, label }: { usage: AssistantUsage; label: string }) {
  const ratio = usageRatio(usage);
  return (
    <div className="relative px-5 pb-2">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={usage.limit}
        aria-valuenow={usage.used}
        className="h-1 overflow-hidden rounded-full bg-zinc-100"
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", ratio >= 1 ? "bg-amber-500" : "duaa-ai-bar")}
          style={{ width: `${Math.max(ratio * 100, usage.used > 0 ? 4 : 0)}%` }}
        />
      </div>
      <p className="mt-1.5 text-end text-[10.5px] tabular-nums text-zinc-400">
        {label.replace("{used}", String(usage.used)).replace("{limit}", String(usage.limit))}
      </p>
    </div>
  );
}

function Welcome({
  title,
  body,
  suggestions,
  disabled,
  onPick,
}: {
  title: string;
  body: string;
  suggestions: string[];
  disabled: boolean;
  onPick: (text: string) => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-2 text-center">
      <span className="duaa-ai-orb inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg shadow-violet-500/30">
        <Sparkles className="h-6 w-6" strokeWidth={1.8} />
      </span>
      <div className="space-y-1">
        <h3 className="font-serif text-[24px] leading-tight text-zinc-900">{title}</h3>
        <p className="mx-auto max-w-[260px] text-[12.5px] leading-snug text-zinc-500">{body}</p>
      </div>
      <div className="flex w-full flex-col gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onPick(s)}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-start text-[13px] text-zinc-700 transition hover:border-violet-300 hover:bg-violet-50/40 disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Bubble({ role, content, streaming }: { role: "user" | "assistant"; content: string; streaming?: boolean }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-ee-md bg-zinc-950 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white">
          {content}
        </p>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <AiMark className="mt-0.5 h-6 w-6" />
      <p className="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-es-md border border-zinc-100 bg-zinc-50 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-zinc-800">
        <Typewriter text={content} active={!!streaming} />
      </p>
    </div>
  );
}

function Typewriter({ text, active }: { text: string; active: boolean }) {
  const reduceMotion = useReducedMotion();
  const chars = Array.from(text);
  const [count, setCount] = useState(() => (active && !reduceMotion ? 0 : chars.length));

  useEffect(() => {
    if (!active || reduceMotion) {
      setCount(chars.length);
      return;
    }
    setCount(0);
    let i = 0;
    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      if (now - last < 12) {
        frame = requestAnimationFrame(tick);
        return;
      }
      last = now;
      i += chars[i] === " " || chars[i] === "\n" ? 2 : 1;
      setCount(Math.min(i, chars.length));
      if (i < chars.length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, active, reduceMotion, chars.length]);

  const shown = chars.slice(0, count).join("");
  const done = count >= chars.length;
  return (
    <>
      {shown}
      {active && !done ? (
        <span
          aria-hidden
          className="ms-0.5 inline-block h-[0.95em] w-[2px] translate-y-[0.12em] animate-pulse bg-violet-500 align-middle"
        />
      ) : null}
    </>
  );
}

function Thinking({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2" role="status" aria-label={label}>
      <AiMark className="h-6 w-6" />
      <span className="inline-flex items-center gap-1 rounded-2xl rounded-es-md border border-zinc-100 bg-zinc-50 px-3.5 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="duaa-ai-dot h-1.5 w-1.5 rounded-full bg-violet-400"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
    </div>
  );
}
