"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CafeQRCode } from "@/domain/cafe/qr";
import { FADE_UP, IOS_EASE, PRESS_SOFT, STAGGER_PARENT, TAP_SPRING } from "@/lib/motion";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { TONE_SOFT, TONE_TINT, TONE_WELL } from "@/theme/tones";

export function CafeQRDesk({
  workspaceId,
  canRotate,
}: {
  workspaceId: string;
  canRotate: boolean;
}) {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: qk.cafeQR(workspaceId),
    queryFn: () => kernel.listCafeQR(workspaceId),
    staleTime: 15_000,
  });
  const rotate = useMutation({
    mutationFn: (siteId: string) => kernel.rotateCafeQR(workspaceId, siteId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.cafeQR(workspaceId) });
      toast.success(t.qrRotated);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (query.isPending) {
    return (
      <div className="flex items-center gap-2 py-6 text-[14px] text-zinc-500" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {t.qrLoading}
      </div>
    );
  }
  if (query.isError) {
    return (
      <button
        type="button"
        className="min-h-11 text-[14px] font-semibold text-zinc-950 underline-offset-2 hover:underline"
        onClick={() => void query.refetch()}
      >
        {t.qrLoadError}
      </button>
    );
  }
  const items = query.data ?? [];
  if (items.length === 0) {
    return (
      <div className="rounded-[22px] bg-gradient-to-br from-indigo-50 via-white to-white px-5 py-10 text-center ring-1 ring-indigo-100/80">
        <p className="text-[15px] font-medium text-zinc-600">{t.cafeEmptyQR}</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={STAGGER_PARENT}
    >
      <motion.p
        className="px-0.5 text-[13px] leading-snug text-zinc-500"
        variants={FADE_UP}
        transition={{ duration: 0.35 }}
      >
        {t.qrHint}
      </motion.p>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((code) => (
          <QRCodeCard
            key={code.siteId}
            code={code}
            canRotate={canRotate}
            busy={rotate.isPending}
            onRotate={() => rotate.mutate(code.siteId)}
            copyLabel={t.qrCopy}
            openLabel={t.qrOpen}
            rotateLabel={t.qrRotate}
            retiredLabel={t.qrRetired}
            copiedLabel={t.qrCopied}
            liveLabel={t.sourceLive}
          />
        ))}
      </div>
    </motion.div>
  );
}

function QRCodeCard({
  code,
  canRotate,
  busy,
  onRotate,
  copyLabel,
  openLabel,
  rotateLabel,
  retiredLabel,
  copiedLabel,
  liveLabel,
}: {
  code: CafeQRCode;
  canRotate: boolean;
  busy: boolean;
  onRotate: () => void;
  copyLabel: string;
  openLabel: string;
  rotateLabel: string;
  retiredLabel: string;
  copiedLabel: string;
  liveLabel: string;
}) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const place = [code.branch, code.area].filter(Boolean).join(" · ");

  const copy = async () => {
    await navigator.clipboard.writeText(code.publicUrl);
    setCopied(true);
    toast.success(copiedLabel);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <motion.article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[24px] border border-white/80 bg-gradient-to-br p-4 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.4)]",
        "sm:flex-row sm:items-stretch sm:gap-4 sm:p-4",
        TONE_TINT.indigo,
      )}
      data-testid="cafe-qr-code"
      variants={FADE_UP}
      whileHover={reduce ? undefined : PRESS_SOFT.whileHover}
      whileTap={reduce ? undefined : PRESS_SOFT.whileTap}
      transition={reduce ? { duration: 0.01 } : { duration: 0.4, ease: IOS_EASE }}
    >
      {/* QR pad */}
      <div className="mx-auto flex shrink-0 items-center justify-center sm:mx-0">
        <div className="relative rounded-[20px] bg-white p-3 shadow-[0_10px_28px_-18px_rgba(15,23,42,0.45)] ring-1 ring-zinc-900/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={code.imagePath}
            alt=""
            width={120}
            height={120}
            className={cn(
              "h-[120px] w-[120px] rounded-[12px] bg-white object-contain",
              !code.active && "opacity-40 grayscale",
            )}
          />
          {!code.active ? (
            <span
              className={cn(
                "absolute inset-x-3 bottom-3 rounded-full px-2 py-1 text-center text-[10px] font-semibold",
                TONE_SOFT.zinc,
              )}
            >
              {retiredLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex min-w-0 flex-1 flex-col sm:mt-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold tracking-tight text-zinc-950">{code.label}</p>
            {place ? <p className="mt-0.5 truncate text-[12px] font-medium text-zinc-500">{place}</p> : null}
          </div>
          {code.active ? (
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", TONE_SOFT.emerald)}>
              {liveLabel}
            </span>
          ) : null}
        </div>

        <p className="mt-2 line-clamp-2 break-all font-mono text-[11px] leading-snug text-zinc-400">{code.publicUrl}</p>

        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          <ActionPill
            label={copied ? "Copied" : copyLabel}
            icon={copied ? Check : Copy}
            onClick={() => void copy()}
            tone="sky"
          />
          <a
            href={code.publicPath}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition-colors",
              TONE_SOFT.indigo,
              "hover:brightness-95 active:scale-[0.97]",
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
            {openLabel}
          </a>
          {canRotate && code.active ? (
            <ActionPill
              label={rotateLabel}
              icon={RefreshCw}
              onClick={onRotate}
              disabled={busy}
              tone="rose"
            />
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

function ActionPill({
  label,
  icon: Icon,
  onClick,
  disabled,
  tone,
}: {
  label: string;
  icon: typeof Copy;
  onClick: () => void;
  disabled?: boolean;
  tone: "sky" | "rose" | "indigo";
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold disabled:opacity-40",
        TONE_SOFT[tone],
      )}
      whileTap={reduce || disabled ? undefined : { scale: 0.96 }}
      transition={TAP_SPRING}
    >
      <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full text-white", TONE_WELL[tone])}>
        <Icon className="h-3 w-3" strokeWidth={2.4} aria-hidden />
      </span>
      {label}
    </motion.button>
  );
}
