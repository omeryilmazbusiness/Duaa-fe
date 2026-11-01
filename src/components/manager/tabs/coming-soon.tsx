"use client";

import { Sparkles } from "lucide-react";
import { IconWell, ToneCard } from "@/components/manager/white-card";
import { useLocale } from "@/providers/locale-provider";

export function ComingSoonPanel({ title }: { title: string }) {
  const { t } = useLocale();
  return (
    <ToneCard tone="indigo" className="px-5 py-6">
      <IconWell icon={Sparkles} size="lg" />
      <p className="mt-3 font-serif text-2xl">{title}</p>
      <p className="mt-2 text-sm text-white/75">{t.comingSoon}</p>
    </ToneCard>
  );
}
