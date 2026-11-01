"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { staffLoginPath } from "@/domain/staff-scope";
import { useLocale } from "@/providers/locale-provider";

const DEFAULT_SLUG = "duaa-cafe";

export function PersonalPortalLink({ slug = DEFAULT_SLUG }: { slug?: string }) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col items-center gap-2.5">
      <p className="text-[11px] font-medium tracking-wide text-zinc-400">{t.personalTasks}</p>
      <Link
        href={staffLoginPath(slug)}
        aria-label={t.personalTasks}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-zinc-900 ring-1 ring-zinc-200/90 shadow-[0_2px_6px_rgba(24,24,27,0.06)] transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(24,24,27,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15 focus-visible:ring-offset-2 active:scale-95"
        data-testid="link-personal-login"
      >
        <UserRound className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </Link>
    </div>
  );
}
