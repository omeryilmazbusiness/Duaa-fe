"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, LogOut, TimerOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { displayName, personInitials } from "@/domain/session/types";
import { managerGuard, postLoginPath } from "@/domain/staff-scope";
import { LanguagePicker } from "@/components/login/language-picker";
import { ReportComposer } from "@/components/staff/report-composer";
import { PageShell } from "@/components/theme/page-shell";
import { formatTimeRange } from "@/lib/format";
import { kernel } from "@/lib/kernel";
import { FADE_UP, IOS_EASE, PILL_SPRING, PRESS_SOFT, STAGE_SPRING } from "@/lib/motion";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { ApiError } from "@/infrastructure/http/errors";
import { TONE_GRADIENT, TONE_SOFT } from "@/theme/tones";

type TaskFilter = "open" | "done";

export function StaffPortal({ slug }: { slug: string }) {
  const { session, isLoading, isAuthenticated, logout } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const [completing, setCompleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>("open");

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !session) {
      router.replace(`/${slug}/staff-login`);
      return;
    }
    if (managerGuard(session.scope) === "manager") {
      router.replace(
        postLoginPath({ slug: session.workspace.slug, surface: "manager", defaultTab: session.defaultTab }),
      );
    }
  }, [isLoading, isAuthenticated, session, router, slug]);

  const wid = session?.workspace.id ?? "";
  const tasks = useQuery({
    queryKey: qk.portal(wid),
    queryFn: () => kernel.portalTasks(wid),
    enabled: !!session && session.scope === "staff_personnel",
  });

  const complete = useMutation({
    mutationFn: (id: string) => kernel.completePortalTask(wid, id),
    onSuccess: () => {
      toast.success(t.done);
      qc.invalidateQueries({ queryKey: qk.portal(wid) });
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
    onSettled: () => setCompleting(null),
  });

  const rows = tasks.data ?? [];
  const openRows = useMemo(() => rows.filter((task) => task.status !== "completed"), [rows]);
  const doneRows = useMemo(() => rows.filter((task) => task.status === "completed"), [rows]);
  const visible = filter === "open" ? openRows : doneRows;
  const overdueCount = openRows.filter((task) => task.isOverdue).length;

  if (isLoading || !session) {
    return (
      <div className="ios-canvas flex min-h-dvh items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-zinc-300" />
      </div>
    );
  }

  const letters = personInitials(session.user.firstName, session.user.lastName);

  return (
    <PageShell className="pb-[env(safe-area-inset-bottom)]">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/55 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <span
            className={cn(
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] text-[14px] font-semibold tracking-tight",
              TONE_GRADIENT.sky,
            )}
          >
            {letters}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold tracking-tight text-zinc-950">{displayName(session.user)}</p>
            <p className="truncate text-[12px] font-medium tabular-nums text-zinc-500">
              {session.membership.staffDepartment}
              {session.membership.employeeNumber ? ` · ${session.membership.employeeNumber}` : ""}
            </p>
          </div>
          <LanguagePicker />
          <button
            type="button"
            aria-label={t.logout}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-zinc-500 shadow-[0_1px_0_rgba(15,23,42,0.04)] ring-1 ring-zinc-200/70 transition active:scale-95"
            onClick={() => {
              logout();
              router.replace(`/${slug}/staff-login`);
            }}
          >
            <LogOut className="h-4 w-4" strokeWidth={2.1} />
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-4">
        <section className="grid grid-cols-2 gap-2" role="tablist" aria-label={t.myTasks}>
          <FilterChip
            label={t.open}
            count={openRows.length}
            active={filter === "open"}
            tone="amber"
            alert={overdueCount > 0}
            onClick={() => setFilter("open")}
          />
          <FilterChip
            label={t.completed}
            count={doneRows.length}
            active={filter === "done"}
            tone="emerald"
            onClick={() => setFilter("done")}
          />
        </section>

        <section
          className="overflow-hidden rounded-[24px] border border-white/80 bg-white/85 shadow-[0_1px_0_rgba(15,23,42,0.04),0_18px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl"
          data-testid="staff-tasks"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
              transition={{ ...STAGE_SPRING, opacity: { duration: 0.22, ease: IOS_EASE } }}
            >
              {tasks.isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
                </div>
              ) : visible.length === 0 ? (
                <p className="px-5 py-12 text-center text-[14px] font-medium text-zinc-400">{t.noTasks}</p>
              ) : (
                <ul className="divide-y divide-zinc-100/80">
                  {visible.map((task) => {
                    const done = task.status === "completed";
                    const busy = completing === task.id;
                    return (
                      <motion.li
                        key={task.id}
                        layout
                        variants={FADE_UP}
                        initial="hidden"
                        animate="show"
                        transition={{ duration: 0.32, ease: IOS_EASE }}
                        className="flex items-center gap-3 px-4 py-3.5"
                      >
                        <motion.button
                          type="button"
                          disabled={done || busy}
                          aria-label={done ? t.done : t.completed}
                          onClick={() => {
                            if (done) return;
                            setCompleting(task.id);
                            complete.mutate(task.id);
                          }}
                          whileTap={done || busy ? undefined : { scale: 0.88 }}
                          transition={PRESS_SOFT.transition}
                          className={cn(
                            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:opacity-100",
                            done
                              ? "bg-emerald-500 text-white shadow-[0_8px_18px_-10px_rgba(16,185,129,0.7)]"
                              : task.isOverdue
                                ? "bg-rose-500 text-white shadow-[0_8px_18px_-10px_rgba(244,63,94,0.7)]"
                                : "bg-zinc-900 text-white shadow-[0_8px_18px_-10px_rgba(24,24,27,0.55)]",
                          )}
                        >
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <Check className="h-5 w-5" strokeWidth={2.6} /> : <Check className="h-5 w-5" strokeWidth={2.4} />}
                        </motion.button>
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate text-[15px] font-semibold tracking-tight text-zinc-950", done && "text-zinc-400 line-through")}>
                            {task.title}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium tabular-nums text-zinc-500">
                            {formatTimeRange(task.scheduledStartAt, task.scheduledEndAt, locale)}
                            {task.isOverdue && !done ? (
                              <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold", TONE_SOFT.rose)}>
                                <TimerOff className="h-3 w-3" />
                                {t.overdue}
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        <ReportComposer workspaceId={wid} />
      </main>
    </PageShell>
  );
}

function FilterChip({
  label,
  count,
  active,
  tone,
  alert,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  tone: "amber" | "emerald";
  alert?: boolean;
  onClick: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      whileHover={reduce ? undefined : PRESS_SOFT.whileHover}
      whileTap={reduce ? undefined : PRESS_SOFT.whileTap}
      transition={PRESS_SOFT.transition}
      className={cn(
        "relative flex items-center justify-between gap-2 overflow-hidden rounded-[18px] border px-3.5 py-3 text-start",
        active ? "border-zinc-900/10" : "border-white/70 bg-white/55 text-zinc-500",
      )}
    >
      {active ? (
        <motion.span
          layoutId="staff-filter-pill"
          className="absolute inset-0 rounded-[18px] bg-white shadow-[0_10px_24px_-18px_rgba(15,23,42,0.4)]"
          transition={reduce ? { duration: 0.01 } : PILL_SPRING}
          aria-hidden
        />
      ) : null}
      <span className="relative z-10 text-[13px] font-semibold tracking-tight text-zinc-900">{label}</span>
      <span
        className={cn(
          "relative z-10 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
          alert ? TONE_SOFT.rose : tone === "amber" ? TONE_SOFT.amber : TONE_SOFT.emerald,
        )}
      >
        {count}
      </span>
    </motion.button>
  );
}
