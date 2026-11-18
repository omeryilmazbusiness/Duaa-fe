"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { PremiumMicIcon } from "@/components/assistant/speaker/premium-mic-icon";
import { SonicWaveform } from "@/components/assistant/speaker/sonic-waveform";

export function ListeningOverlay({
  open,
  listening,
  amplitude = 0,
  transcript,
  listeningLabel,
  workingLabel,
  subtitle,
  cancelLabel,
  sendLabel,
  onCancel,
  onSend,
}: {
  open: boolean;
  listening: boolean;
  amplitude?: number;
  transcript: string;
  listeningLabel: string;
  workingLabel: string;
  subtitle: string;
  cancelLabel: string;
  sendLabel: string;
  onCancel: () => void;
  onSend: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const displayText = transcript.trim();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.24 }}
          role="dialog"
          aria-modal="true"
          aria-label={listeningLabel}
          data-testid="ai-speaker-overlay"
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-white/72 backdrop-blur-xl"
            aria-label={cancelLabel}
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative z-10 w-full max-w-sm"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200/90 bg-white/95 shadow-[0_24px_64px_-20px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
              <div className="relative flex flex-col items-center px-6 pb-6 pt-8">
                <div className="relative mb-6 flex h-28 w-full items-center justify-center">
                  <SonicWaveform amplitude={amplitude} active simulate={!listening} theme="light" className="rounded-2xl" />
                  <div className="relative z-10 flex h-[4.85rem] w-[4.85rem] items-center justify-center rounded-full bg-white shadow-[0_8px_28px_-8px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.95)]">
                    <PremiumMicIcon variant="dark" className="h-8 w-8" />
                  </div>
                </div>

                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400" aria-live="polite">
                  {listening ? listeningLabel : workingLabel}
                </p>

                <div className="mt-5 min-h-[4.5rem] w-full rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-4 text-center">
                  {displayText ? (
                    <p dir="auto" className="text-[17px] font-medium leading-relaxed text-zinc-900">
                      <span className="text-zinc-400">&ldquo;</span>
                      {displayText}
                      <span className="text-zinc-400">&rdquo;</span>
                      {listening ? (
                        <span className="ms-0.5 inline-block h-[1.1em] w-[2px] animate-pulse bg-indigo-400 align-[-2px]" />
                      ) : null}
                    </p>
                  ) : (
                    <p className="text-[14px] leading-relaxed text-zinc-500">{subtitle}</p>
                  )}
                </div>

                <div className="mt-6 grid w-full grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[13px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    type="button"
                    onClick={onSend}
                    disabled={!listening}
                    data-testid="ai-speaker-send-now"
                    className="rounded-2xl bg-zinc-900 px-4 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {sendLabel}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
