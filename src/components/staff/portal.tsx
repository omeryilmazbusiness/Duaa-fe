"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardList, Loader2, LogOut, TimerOff, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { displayName } from "@/domain/session/types";
import { managerGuard, postLoginPath } from "@/domain/staff-scope";
import { DuaMark } from "@/components/brand/dua-mark";
import { LanguagePicker } from "@/components/login/language-picker";
import { WhiteCard } from "@/components/manager/white-card";
import { ReportComposer } from "@/components/staff/report-composer";
import { AppHeader, PageShell, ScreenMain } from "@/components/theme/page-shell";
import { Button } from "@/components/ui/button";
import { formatTimeRange } from "@/lib/format";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { ApiError } from "@/infrastructure/http/errors";

export function StaffPortal({ slug }: { slug: string }) {
  const { session, isLoading, isAuthenticated, logout } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const [completing, setCompleting] = useState<string | null>(null);

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

  if (isLoading || !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <PageShell>
      <AppHeader
        start={
          <>
            <DuaMark className="h-8 w-8 rounded-xl text-sm" />
            <p className="font-serif text-[15px] text-zinc-900">{session.workspace.name}</p>
          </>
        }
        end={
          <>
            <LanguagePicker />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t.logout}
              onClick={() => {
                logout();
                router.replace(`/${slug}/staff-login`);
              }}
            >
              <LogOut />
            </Button>
          </>
        }
      />
      <ScreenMain>
        <WhiteCard className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-zinc-900/50">
            <User className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">{displayName(session.user)}</p>
            <p className="text-[12px] text-zinc-900/50">
              {session.membership.staffDepartment}
              {session.membership.employeeNumber ? ` · #${session.membership.employeeNumber}` : ""}
            </p>
          </div>
        </WhiteCard>
        <WhiteCard>
          <div className="mb-3 flex items-center gap-2 text-zinc-900/45">
            <ClipboardList className="h-4 w-4" />
            <h2 className="text-sm font-semibold text-zinc-900">{t.myTasks}</h2>
          </div>
          {tasks.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-zinc-300" />
          ) : (tasks.data ?? []).length === 0 ? (
            <p className="text-sm text-zinc-900/50">{t.noTasks}</p>
          ) : (
            <ul className="divide-y divide-sand-line/70">
              {(tasks.data ?? []).map((task) => {
                const done = task.status === "completed";
                return (
                  <li key={task.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-zinc-900">{task.title}</p>
                      <p className="font-mono text-[12px] text-zinc-900/45">
                        {formatTimeRange(task.scheduledStartAt, task.scheduledEndAt, locale)}
                      </p>
                    </div>
                    {task.isOverdue && !done ? (
                      <TimerOff className="h-4 w-4 shrink-0 text-rose-700" aria-label={t.overdue} />
                    ) : null}
                    {done ? (
                      <Check className="h-5 w-5 shrink-0 text-emerald-700" aria-label={t.done} />
                    ) : (
                      <Button
                        size="icon-sm"
                        variant="outline"
                        disabled={completing === task.id}
                        aria-label={t.completed}
                        onClick={() => {
                          setCompleting(task.id);
                          complete.mutate(task.id);
                        }}
                      >
                        {completing === task.id ? <Loader2 className="animate-spin" /> : <Check />}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </WhiteCard>
        <ReportComposer workspaceId={wid} />
      </ScreenMain>
    </PageShell>
  );
}
