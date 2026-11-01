"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PAGE_ENTER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { DuaMark } from "@/components/brand/dua-mark";
import { PageShell } from "@/components/theme/page-shell";
import { Card, CardContent } from "@/components/ui/card";

export function LoginShell({
  title,
  subtitle,
  formError,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  formError?: string | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <PageShell className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-50/50 px-4 py-10 md:py-16">
      <motion.div
        className="relative z-10 mx-auto w-full max-w-sm space-y-8"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0.01 } : PAGE_ENTER}
      >
        <header className="space-y-4 text-center">
          <div className="flex flex-col items-center gap-5">
            <div className="inline-flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-[28px] border border-zinc-100/80 bg-white shadow-md shadow-zinc-200/60">
              <DuaMark className="h-full w-full text-3xl" />
            </div>
            <div className="space-y-1.5">
              <h1 className="font-serif text-3xl tracking-tight text-zinc-900">{title}</h1>
              <p className="text-sm font-medium text-zinc-500">{subtitle}</p>
            </div>
          </div>
        </header>

        <Card className="rounded-3xl border-zinc-100 bg-white shadow-xl shadow-zinc-200/40">
          <CardContent className="p-6 md:p-8">
            {formError ? (
              <p className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {formError}
              </p>
            ) : null}
            {children}
          </CardContent>
        </Card>
        {footer}
      </motion.div>
    </PageShell>
  );
}

export function LoginFieldIcon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400", className)}>
      {children}
    </span>
  );
}
