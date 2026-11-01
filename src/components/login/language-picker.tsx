"use client";

import { LOCALES } from "@/lib/i18n";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = { en: "EN", tr: "TR", ar: "AR" };

export function LanguagePicker({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  return (
    <div className={cn("inline-flex rounded-full border border-zinc-200 bg-white p-0.5", className)} role="group">
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
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
