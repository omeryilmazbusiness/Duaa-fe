import type { StaffLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const FLAG_SRC: Record<StaffLocale, string> = {
  en: "/flags/en.png",
  tr: "/flags/tr.png",
  ar: "/flags/ar.png",
};

export function LocaleFlag({ locale, className }: { locale: StaffLocale; className?: string }) {
  return (
    <span className={cn("relative block overflow-hidden rounded-full bg-white shadow-[0_4px_10px_-4px_rgba(15,23,42,0.45)] ring-1 ring-black/10", className)}>
      <img src={FLAG_SRC[locale]} alt="" className="h-full w-full object-cover" draggable={false} />
    </span>
  );
}
