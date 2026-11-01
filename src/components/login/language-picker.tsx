"use client";

import { LocaleFlag } from "@/components/brand/locale-flag";
import { LOCALES, localeNameKey } from "@/lib/i18n";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/utils";

const SHORT: Record<string, string> = { en: "EN", tr: "TR", ar: "AR" };

export function LanguagePicker({
  className,
  variant = "compact",
}: {
  className?: string;
  variant?: "compact" | "flags";
}) {
  const { locale, setLocale, t } = useLocale();

  if (variant === "flags") {
    return (
      <div
        className={cn(
          "grid grid-cols-3 gap-2 rounded-[32px] bg-white p-2 shadow-[0_10px_34px_-24px_rgba(15,23,42,0.35)] ring-1 ring-zinc-900/5",
          className,
        )}
        role="group"
        aria-label={t.language}
      >
        {LOCALES.map((code) => {
          const active = locale === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              aria-pressed={active}
              className={cn(
                "flex min-h-[108px] flex-col items-center justify-center gap-2.5 rounded-[24px] transition-colors",
                active
                  ? "bg-zinc-950 text-white shadow-[0_12px_24px_-14px_rgba(24,24,27,0.7)]"
                  : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              <LocaleFlag locale={code} className="h-12 w-12" />
              <span className="text-[13px] font-semibold leading-none tracking-wide">{t[localeNameKey(code)]}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex rounded-full border border-zinc-200 bg-white p-0.5", className)} role="group" aria-label={t.language}>
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={cn(
            "min-w-8 rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide",
            locale === code ? "bg-zinc-950 text-white" : "text-zinc-400 hover:text-zinc-800",
          )}
        >
          {SHORT[code]}
        </button>
      ))}
    </div>
  );
}
