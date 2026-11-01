"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Check, HandHelping, Loader2, Star } from "lucide-react";
import { useState } from "react";
import { DuaMark } from "@/components/brand/dua-mark";
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
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_GRADIENT, TONE_SOFT, TONE_SOLID, type Tone } from "@/theme/tones";

const INTENT_ICON = {
  review: Star,
  complaint: AlertTriangle,
  request: HandHelping,
} as const;

const CARD = "rounded-[28px] bg-white shadow-[0_10px_34px_-24px_rgba(15,23,42,0.35)] ring-1 ring-zinc-900/5";

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
        <div className="flex flex-1 items-center justify-center py-24 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin" />
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
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white via-amber-50/50 to-transparent" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="py-3">
          <LanguagePicker variant="flags" />
        </div>
        {children}
      </div>
    </main>
  );
}

function UnknownState() {
  const { t } = useLocale();
  return (
    <section className={cn(CARD, "mt-10 px-6 py-14 text-center")}>
      <h1 className="font-serif text-[32px] tracking-tight text-zinc-950">{t.qrUnknown}</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-zinc-500">{t.qrUnknownBody}</p>
    </section>
  );
}

function GuestVoiceForm({ token, place }: { token: string; place: PublicQR }) {
  const { t } = useLocale();
  const [intent, setIntent] = useState<VoiceKind>("review");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const tone = guestIntentTone(intent);
  const ready = canSubmitGuest({ kind: intent, rating, comment, open: place.reviewsOpen });
  const submit = useMutation({
    mutationFn: () => kernel.submitPublicQR(token, toGuestSubmit({ kind: intent, rating, comment })),
    onSuccess: () => setDone(true),
  });

  if (done) {
    return (
      <section className={cn(CARD, "mt-8 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center")}>
        <span className={cn("flex h-24 w-24 items-center justify-center rounded-[30px]", TONE_SOLID.emerald)}>
          <Check className="h-12 w-12" strokeWidth={2.4} />
        </span>
        <h1 className="mt-7 font-serif text-[38px] tracking-tight text-zinc-950">{t.voiceThanksTitle}</h1>
        <p className="mt-3 max-w-xs text-[17px] leading-relaxed text-zinc-500">{t.voiceThanks}</p>
      </section>
    );
  }

  return (
    <form
      className="flex flex-1 flex-col gap-5 pb-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready && !submit.isPending) submit.mutate();
      }}
    >
      <header className="flex flex-col items-center pt-1 text-center">
        <DuaMark className="h-16 w-16 rounded-[20px] text-3xl shadow-[0_12px_24px_-16px_rgba(24,24,27,0.55)]" />
        <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-zinc-400">{place.cafeName}</p>
        <h1 className="mt-2 max-w-sm font-serif text-[36px] leading-[1.05] tracking-tight text-zinc-950">{t[guestAskKey(intent)]}</h1>
      </header>

      {!place.reviewsOpen ? (
        <p className={cn("rounded-[22px] px-4 py-3 text-center text-[14px] font-medium", TONE_SOFT.amber)} role="status">
          {t.voiceClosedHint}
        </p>
      ) : null}

      <section className="grid grid-cols-3 gap-2.5" role="tablist" aria-label={t.qrGuestHint}>
        {GUEST_INTENTS.map((kind) => {
          const Icon = INTENT_ICON[kind];
          const active = intent === kind;
          const kindTone = guestIntentTone(kind);
          return (
            <button
              key={kind}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setIntent(kind)}
              className={cn(CARD, "flex min-h-[132px] flex-col items-center justify-center gap-3 px-2", active && "ring-2 ring-zinc-900/80")}
            >
              <span className={cn("flex h-[68px] w-[68px] items-center justify-center rounded-[22px]", active ? TONE_GRADIENT[kindTone] : "bg-zinc-100 text-zinc-400")}>
                <Icon className="h-9 w-9" strokeWidth={2} fill={kind === "review" && active ? "currentColor" : "none"} />
              </span>
              <span className="text-[13px] font-semibold leading-tight text-zinc-800">{t[guestKindKey(kind)]}</span>
            </button>
          );
        })}
      </section>

      {guestNeedsRating(intent) ? <StarRow rating={rating} onPick={setRating} /> : null}

      <label className={cn(CARD, "block px-5 py-4")}>
        <span className="sr-only">{t[guestNoteKey(intent)]}</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t[guestNoteKey(intent)]}
          rows={guestNeedsNote(intent) ? 4 : 3}
          className="w-full resize-none bg-transparent text-[17px] leading-relaxed text-zinc-950 outline-none placeholder:text-zinc-400"
        />
      </label>

      {submit.isError ? (
        <p className="rounded-[20px] bg-rose-50 px-4 py-3 text-[14px] font-medium text-rose-700" role="alert">
          {submit.error.message}
        </p>
      ) : null}

      <div className="sticky bottom-0 mt-auto bg-[linear-gradient(to_top,var(--ios-grouped)_72%,transparent)] pt-3">
        <button
          type="submit"
          disabled={!ready || submit.isPending}
          className={cn(
            "flex h-[64px] w-full items-center justify-center rounded-[24px] text-[17px] font-semibold text-white disabled:opacity-35",
            TONE_GRADIENT[tone as Tone],
          )}
        >
          {submit.isPending ? t.voiceSending : t[guestSendKey(intent)]}
        </button>
      </div>
    </form>
  );
}

function StarRow({ rating, onPick }: { rating: number; onPick: (n: number) => void }) {
  const { t } = useLocale();
  return (
    <section className={cn(CARD, "px-3 py-7")}>
      <div className="flex items-center justify-between" role="radiogroup" aria-label={t.voiceRating}>
        {GUEST_STARS.map((n) => {
          const on = rating >= n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={t.voiceStar.replace("{n}", String(n))}
              onClick={() => onPick(n)}
              className="flex h-14 w-14 items-center justify-center rounded-full"
            >
              <Star
                className={cn("h-12 w-12", on ? "text-amber-400 drop-shadow-[0_6px_10px_rgba(245,158,11,0.35)]" : "text-zinc-200")}
                strokeWidth={1.4}
                fill={on ? "currentColor" : "none"}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
