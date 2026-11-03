"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check, HandHelping, Loader2, Star } from "lucide-react";
import { useState } from "react";
import { LanguagePicker } from "@/components/login/language-picker";
import {
  canSubmitGuest,
  GUEST_INTENTS,
  GUEST_STARS,
  guestAskKey,
  guestIntentTone,
  guestKindKey,
  guestNeedsNote,
  guestNeedsRating,
  guestNoteKey,
  guestSendKey,
  toGuestSubmit,
} from "@/domain/cafe/guest";
import { isValidQRToken, type PublicQR, type VoiceKind } from "@/domain/cafe/qr";
import { FADE_UP, IOS_EASE, PILL_SPRING, PRESS_SOFT, STAGE_SPRING, STAGGER_PARENT, TAP_SPRING } from "@/lib/motion";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_GRADIENT, TONE_SOLID, TONE_TINT, type Tone } from "@/theme/tones";

const INTENT_ICON = {
  review: Star,
  complaint: AlertTriangle,
  request: HandHelping,
} as const;

const CARD =
  "overflow-hidden rounded-[22px] bg-white shadow-[0_10px_34px_-22px_rgba(15,23,42,0.28)] ring-1 ring-zinc-900/5";

export function QRGuestCard({ token }: { token: string }) {
  const valid = isValidQRToken(token);
  const query = useQuery({
    queryKey: qk.publicQR(token),
    queryFn: () => kernel.resolvePublicQR(token),
    enabled: valid,
    retry: 1,
    staleTime: 30_000,
  });

  if (!valid || query.isError) {
    return (
      <GuestFrame>
        <UnknownState />
      </GuestFrame>
    );
  }
  if (query.isPending || !query.data) {
    return (
      <GuestFrame>
        <div className="flex flex-1 items-center justify-center py-24 text-zinc-400" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
          <span className="sr-only">Loading</span>
        </div>
      </GuestFrame>
    );
  }
  return (
    <GuestFrame>
      <GuestVoiceForm token={token} place={query.data} />
    </GuestFrame>
  );
}

function GuestFrame({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="ios-settings relative min-h-dvh overflow-hidden"
      data-testid="qr-guest"
      style={{
        paddingTop: "max(0.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-amber-100/70 via-rose-50/40 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -end-16 top-40 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl"
      />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
        <div className="flex justify-end py-2">
          <LanguagePicker
            variant="compact"
            className="bg-white/80 shadow-sm backdrop-blur [&_button]:min-h-11 [&_button]:min-w-11 [&_button]:px-3 [&_button]:text-[13px]"
          />
        </div>
        {children}
      </div>
    </main>
  );
}

function UnknownState() {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  return (
    <motion.section
      className={cn(CARD, "mt-6 px-5 py-12 text-center")}
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={STAGE_SPRING}
    >
      <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">{t.qrUnknown}</h1>
      <p className="mt-2 text-[15px] leading-snug text-zinc-500">{t.qrUnknownBody}</p>
    </motion.section>
  );
}

function GuestVoiceForm({ token, place }: { token: string; place: PublicQR }) {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const [intent, setIntent] = useState<VoiceKind>("review");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const tone = guestIntentTone(intent) as Tone;
  const ready = canSubmitGuest({ kind: intent, rating, comment, open: place.reviewsOpen });
  const submit = useMutation({
    mutationFn: () => kernel.submitPublicQR(token, toGuestSubmit({ kind: intent, rating, comment })),
    onSuccess: () => setDone(true),
  });

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <motion.section
          key="thanks"
          className={cn(CARD, "mt-6 flex flex-1 flex-col items-center justify-center bg-gradient-to-br px-6 py-16 text-center", TONE_TINT.emerald)}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -12 }}
          transition={STAGE_SPRING}
        >
          <motion.span
            className={cn("flex h-20 w-20 items-center justify-center rounded-[28px]", TONE_SOLID.emerald)}
            initial={reduce ? false : { scale: 0.4, rotate: -18 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={TAP_SPRING}
            aria-hidden
          >
            <Check className="h-10 w-10" strokeWidth={2.6} />
          </motion.span>
          <h1 className="mt-6 text-[32px] font-bold tracking-tight text-zinc-950">{t.voiceThanksTitle}</h1>
          <p className="mt-2 max-w-[16rem] text-[17px] leading-snug text-zinc-500">{t.voiceThanks}</p>
        </motion.section>
      ) : (
        <motion.form
          key="form"
          className="flex flex-1 flex-col gap-4 pb-3"
          initial={reduce ? false : "hidden"}
          animate="show"
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          variants={STAGGER_PARENT}
          onSubmit={(e) => {
            e.preventDefault();
            if (ready && !submit.isPending) submit.mutate();
          }}
        >
          <motion.header className="pt-1" variants={FADE_UP} transition={{ duration: 0.4, ease: IOS_EASE }}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-amber-700/70">{place.cafeName}</p>
            <AnimatePresence mode="wait">
              <motion.h1
                key={intent}
                className="mt-2 text-[34px] font-bold leading-[1.05] tracking-tight text-zinc-950"
                initial={reduce ? false : { opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduce ? undefined : { opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.28, ease: IOS_EASE }}
              >
                {t[guestAskKey(intent)]}
              </motion.h1>
            </AnimatePresence>
            <p className="mt-2 text-[15px] leading-snug text-zinc-500">{t.qrGuestHint}</p>
          </motion.header>

          {!place.reviewsOpen ? (
            <motion.p
              className="rounded-[18px] bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3 text-center text-[14px] font-medium text-amber-800 ring-1 ring-amber-200/70"
              role="status"
              variants={FADE_UP}
              transition={{ duration: 0.35, ease: IOS_EASE }}
            >
              {t.voiceClosedHint}
            </motion.p>
          ) : null}

          <motion.div variants={FADE_UP} transition={{ duration: 0.4, ease: IOS_EASE }}>
            <IntentTiles value={intent} onChange={setIntent} />
          </motion.div>

          <AnimatePresence mode="popLayout" initial={false}>
            {guestNeedsRating(intent) ? (
              <motion.div
                key="stars"
                initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, y: -8 }}
                transition={EXPAND_SPRING_SAFE}
              >
                <StarRow rating={rating} onPick={setRating} />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.label
            className={cn(CARD, "block bg-gradient-to-br px-5 py-4", TONE_TINT[tone])}
            variants={FADE_UP}
            transition={{ duration: 0.4, ease: IOS_EASE }}
            layout
          >
            <span className="sr-only">{t[guestNoteKey(intent)]}</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t[guestNoteKey(intent)]}
              rows={guestNeedsNote(intent) ? 4 : 3}
              enterKeyHint="done"
              className="w-full resize-none bg-transparent text-[17px] leading-snug text-zinc-950 outline-none placeholder:text-zinc-400"
            />
          </motion.label>

          {submit.isError ? (
            <motion.p
              className="rounded-[18px] bg-rose-50 px-4 py-3 text-[14px] font-medium text-rose-700 ring-1 ring-rose-200/80"
              role="alert"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {submit.error.message}
            </motion.p>
          ) : null}

          <motion.div
            className="sticky bottom-0 mt-auto bg-[linear-gradient(to_top,var(--ios-grouped)_72%,transparent)] pt-3"
            style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
            variants={FADE_UP}
            transition={{ duration: 0.4, ease: IOS_EASE }}
          >
            <motion.button
              type="submit"
              disabled={!ready || submit.isPending}
              className={cn(
                "flex h-[56px] w-full items-center justify-center rounded-[20px] text-[17px] font-semibold text-white disabled:opacity-35",
                TONE_GRADIENT[tone],
              )}
              whileTap={reduce || !ready ? undefined : { scale: 0.97 }}
              transition={TAP_SPRING}
            >
              {submit.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t.voiceSending}
                </span>
              ) : (
                t[guestSendKey(intent)]
              )}
            </motion.button>
          </motion.div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

const EXPAND_SPRING_SAFE = {
  type: "spring" as const,
  stiffness: 420,
  damping: 36,
  mass: 0.7,
};

function IntentTiles({ value, onChange }: { value: VoiceKind; onChange: (k: VoiceKind) => void }) {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  return (
    <div className="grid grid-cols-3 gap-2.5" role="tablist" aria-label={t.qrGuestHint}>
      {GUEST_INTENTS.map((kind) => {
        const Icon = INTENT_ICON[kind];
        const active = value === kind;
        const kindTone = guestIntentTone(kind) as Tone;
        return (
          <motion.button
            key={kind}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(kind)}
            className={cn(
              CARD,
              "relative flex min-h-[118px] flex-col items-center justify-center gap-2.5 px-2",
              active && "ring-2 ring-zinc-900/70",
            )}
            {...(reduce ? {} : PRESS_SOFT)}
            layout
          >
            {active ? (
              <motion.span
                layoutId="guest-intent-glow"
                className={cn("absolute inset-0 rounded-[22px] bg-gradient-to-br opacity-90", TONE_TINT[kindTone])}
                transition={reduce ? { duration: 0.01 } : PILL_SPRING}
                aria-hidden
              />
            ) : null}
            <motion.span
              className={cn(
                "relative z-10 flex h-14 w-14 items-center justify-center rounded-[18px]",
                active ? TONE_GRADIENT[kindTone] : "bg-zinc-100 text-zinc-400",
              )}
              animate={active && !reduce ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={TAP_SPRING}
            >
              <Icon className="h-7 w-7" strokeWidth={2} fill={kind === "review" && active ? "currentColor" : "none"} />
            </motion.span>
            <span className="relative z-10 text-[13px] font-semibold leading-tight text-zinc-800">
              {t[guestKindKey(kind)]}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

function StarRow({ rating, onPick }: { rating: number; onPick: (n: number) => void }) {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  return (
    <section className={cn(CARD, "bg-gradient-to-br from-amber-50 via-white to-orange-50/80 px-3 py-6")}>
      <p className="pb-3 text-center text-[13px] font-semibold text-amber-800/70">{t.voiceRating}</p>
      <div className="flex items-center justify-between px-1" role="radiogroup" aria-label={t.voiceRating}>
        {GUEST_STARS.map((n) => {
          const on = rating >= n;
          return (
            <motion.button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={t.voiceStar.replace("{n}", String(n))}
              onClick={() => onPick(n)}
              className="flex h-12 w-12 items-center justify-center rounded-full"
              whileTap={reduce ? undefined : { scale: 0.86 }}
              animate={on && !reduce ? { scale: 1.06 } : { scale: 1 }}
              transition={TAP_SPRING}
            >
              <Star
                className={cn(
                  "h-10 w-10 transition-colors",
                  on ? "text-amber-400 drop-shadow-[0_6px_12px_rgba(245,158,11,0.45)]" : "text-zinc-200",
                )}
                strokeWidth={1.4}
                fill={on ? "currentColor" : "none"}
              />
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
