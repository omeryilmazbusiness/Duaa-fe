"use client";

import { Keyboard, Pause, RotateCcw, Send, Settings, Volume2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AiMark } from "@/components/assistant/ai-mark";
import { GlassEffect, GlassFilter } from "@/components/assistant/speaker/liquid-glass";
import { ListeningOverlay } from "@/components/assistant/speaker/listening-overlay";
import { useAiSpeaker } from "@/components/assistant/speaker/use-ai-speaker";
import { VoiceMicHero } from "@/components/assistant/speaker/voice-mic-hero";
import type { SpeakerIssue } from "@/domain/assistant/speaker";
import type { AssistantErrorKind } from "@/domain/assistant/types";
import type { Messages } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

const ERROR_KEY: Record<AssistantErrorKind, keyof Messages> = {
  limit: "aiErrLimit",
  key: "aiErrKey",
  provider: "aiErrProvider",
  not_configured: "aiErrNotConfigured",
  warming: "aiErrProvider",
  generic: "aiErrGeneric",
};

const ISSUE_KEY: Record<SpeakerIssue, keyof Messages> = {
  mic_denied: "aiSpeakerMicDenied",
  mic_unavailable: "aiSpeakerMicUnavailable",
  unsupported: "aiSpeakerUnsupported",
  no_speech: "aiSpeakerNoSpeech",
};

function DecorativeDots({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none grid grid-cols-3 gap-[3px]", className)} aria-hidden>
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className="h-[3px] w-[3px] rounded-full bg-zinc-300/70" />
      ))}
    </div>
  );
}

/** Dashboard AI speaker — Guest Premium liquid voice card; answers in the screen language, aloud and in text. */
export function AiSpeakerCard({
  workspaceId,
  ready,
  onOpenSettings,
  className,
}: {
  workspaceId: string;
  /** False when DUAA AI has no key or is switched off. */
  ready: boolean;
  onOpenSettings?: () => void;
  className?: string;
}) {
  const { t, locale } = useLocale();
  const speaker = useAiSpeaker({ workspaceId, locale });
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [setupHint, setSetupHint] = useState(false);

  const listening = speaker.phase === "listening";
  const busy = speaker.phase === "thinking" || speaker.phase === "speaking" || speaker.phase === "transcribing";
  const overlayOpen = listening || speaker.phase === "transcribing";

  const statusText = (() => {
    switch (speaker.phase) {
      case "listening":
        return speaker.transcript ? `“${speaker.transcript}”` : t.aiSpeakerListening;
      case "transcribing":
        return t.aiSpeakerTranscribing;
      case "thinking":
        return t.aiThinking;
      case "speaking":
        return t.aiSpeakerSpeaking;
      default:
        return speaker.canListen ? t.aiSpeakerHint : t.aiSpeakerUnsupported;
    }
  })();

  function handleMic() {
    if (!ready) {
      setSetupHint(true);
      return;
    }
    if (listening) {
      speaker.finish();
      return;
    }
    if (speaker.phase === "thinking" || speaker.phase === "transcribing") {
      speaker.cancel();
      return;
    }
    void speaker.start();
  }

  function submitTyped(e: FormEvent) {
    e.preventDefault();
    if (!ready) {
      setSetupHint(true);
      return;
    }
    const text = draft.trim();
    if (!text || speaker.phase === "thinking") return;
    setDraft("");
    void speaker.ask(text);
  }

  const notice = !ready && setupHint
    ? t.aiErrNotConfigured
    : speaker.error
      ? t[ERROR_KEY[speaker.error]]
      : speaker.issue
        ? t[ISSUE_KEY[speaker.issue]]
        : null;
  const hasConversation = !!speaker.question || !!speaker.answer;

  return (
    <section className={cn("relative", className)} data-testid="ai-speaker-card" aria-label={t.aiSpeakerLabel}>
      <GlassFilter />
      <GlassEffect
        className="rounded-[28px]"
        style={{
          boxShadow:
            "0 18px 48px -18px rgba(0, 0, 0, 0.13), 0 6px 16px -6px rgba(0, 0, 0, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.88)",
        }}
      >
        <div className="relative overflow-hidden px-5 pb-4 pt-5 text-center">
          <DecorativeDots className="absolute end-5 top-5 opacity-40" />
          <DecorativeDots className="absolute -end-1 top-8 opacity-25" />

          <div className="relative mb-2">
            <span className="absolute -top-1.5 left-1/2 h-1 w-1 -translate-x-[0.35rem] rounded-full bg-red-500/80" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{t.aiSpeakerLabel}</p>
          </div>

          <h2 className="font-serif text-[26px] font-semibold leading-tight tracking-tight text-zinc-900">{t.aiSpeakerTitle}</h2>

          <VoiceMicHero
            className="mb-0 mt-2"
            isListening={listening}
            isBusy={busy}
            amplitude={speaker.amplitude}
            onClick={handleMic}
            ariaLabel={listening ? t.aiSpeakerSendNow : t.aiSpeakerHint}
          />

          <p className="min-h-[18px] text-[12px] font-medium leading-relaxed text-zinc-600" aria-live="polite" dir="auto">
            {statusText}
          </p>

          {notice ? (
            <div
              className="mx-auto mt-3 flex max-w-md flex-wrap items-center justify-center gap-2 rounded-2xl bg-amber-50/90 px-3 py-2 text-[12.5px] font-medium text-amber-900 ring-1 ring-inset ring-amber-200/70"
              role="status"
              data-testid="ai-speaker-notice"
            >
              <span>{notice}</span>
              {(!ready || speaker.error === "key" || speaker.error === "not_configured") && onOpenSettings ? (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-amber-900 shadow-sm"
                >
                  <Settings className="h-3 w-3" />
                  {t.aiSpeakerSetup}
                </button>
              ) : null}
            </div>
          ) : null}

          {hasConversation ? (
            <div className="mx-auto mt-4 max-w-xl rounded-[22px] bg-white/75 p-4 text-start ring-1 ring-inset ring-zinc-900/[0.05]" data-testid="ai-speaker-answer">
              {speaker.question ? (
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{t.aiSpeakerYou}</p>
                  <p dir="auto" className="mt-0.5 text-[14px] leading-relaxed text-zinc-700">
                    {speaker.question}
                  </p>
                </div>
              ) : null}
              <div className="mt-3 flex items-start gap-2.5">
                <AiMark className="mt-0.5 h-6 w-6" />
                {speaker.answer ? (
                  <p dir="auto" className="min-w-0 flex-1 whitespace-pre-line text-[15px] leading-relaxed text-zinc-900">
                    {speaker.answer}
                  </p>
                ) : (
                  <p className="min-w-0 flex-1 text-[14px] text-zinc-500">{speaker.phase === "thinking" ? t.aiThinking : "—"}</p>
                )}
              </div>
              {speaker.answer ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {speaker.phase === "speaking" ? (
                    <button
                      type="button"
                      onClick={speaker.stopSpeaking}
                      className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-[12px] font-semibold text-white"
                    >
                      <Pause className="h-3.5 w-3.5" />
                      {t.aiStopSpeaking}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={speaker.replay}
                      className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-200"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      {t.aiSpeakerReplay}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={speaker.reset}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t.aiNewChat}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="relative mt-3">
            {typing ? (
              <form onSubmit={submitTyped} className="mx-auto flex max-w-xl items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t.aiInputPlaceholder}
                  maxLength={2000}
                  dir="auto"
                  autoFocus
                  aria-label={t.aiInputPlaceholder}
                  className="h-11 min-w-0 flex-1 rounded-full border border-zinc-200 bg-white/90 px-4 text-[14px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                  data-testid="ai-speaker-input"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || speaker.phase === "thinking"}
                  aria-label={t.aiSend}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:opacity-40"
                >
                  <Send className="h-4 w-4 rtl:-scale-x-100" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setTyping(true)}
                className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 transition-colors hover:text-zinc-700"
              >
                <Keyboard className="h-3.5 w-3.5" />
                {t.aiSpeakerType}
              </button>
            )}
          </div>
        </div>
      </GlassEffect>

      <ListeningOverlay
        open={overlayOpen}
        listening={listening}
        amplitude={speaker.amplitude}
        transcript={speaker.transcript}
        listeningLabel={t.aiSpeakerListening}
        workingLabel={t.aiSpeakerTranscribing}
        subtitle={t.aiSpeakerSubtitle}
        cancelLabel={t.cancel}
        sendLabel={t.aiSpeakerSendNow}
        onCancel={speaker.cancel}
        onSend={speaker.finish}
      />
    </section>
  );
}
