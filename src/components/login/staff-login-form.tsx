"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { loginPath, postLoginPath } from "@/domain/staff-scope";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { LanguagePicker } from "@/components/login/language-picker";
import { DuaMark } from "@/components/brand/dua-mark";
import { PageShell } from "@/components/theme/page-shell";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { TONE_SOLID } from "@/theme/tones";

export function StaffLoginForm({ slug }: { slug: string }) {
  const { t } = useLocale();
  const { acceptLogin, isAuthenticated, session, isLoading } = useAuth();
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isAuthenticated && session) {
      router.replace(postLoginPath({ slug: session.workspace.slug, surface: session.surface, defaultTab: session.defaultTab }));
    }
  }, [isAuthenticated, session, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{4}$/.test(number)) {
      setError(t.fourDigits);
      return;
    }
    setPending(true);
    try {
      const res = await kernel.loginEmployee(slug, number);
      if (!res.token || !res.session) {
        setError(t.fourDigits);
        return;
      }
      acceptLogin(res.token, res.session, res.expiresIn);
      toast.success(t.personalTasks);
      router.replace(
        postLoginPath({
          slug: res.session.workspace.slug,
          surface: res.session.surface,
          defaultTab: res.session.defaultTab,
        }),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.fourDigits);
    } finally {
      setPending(false);
    }
  }

  const locked = pending || isLoading || isAuthenticated;

  return (
    <PageShell className="flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <DuaMark className="h-14 w-14 rounded-[18px] text-lg" />
          <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-zinc-950">{t.personalTasks}</h1>
          <p className="mt-1.5 text-[14px] font-medium text-zinc-500">{t.personalSubtitle}</p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_1px_0_rgba(15,23,42,0.04),0_28px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur-xl"
          noValidate
        >
          <input
            data-testid="input-employee-number"
            placeholder="••••"
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 4))}
            disabled={locked}
            aria-label={t.personalTasks}
            className="h-16 w-full rounded-[20px] border border-zinc-200/80 bg-zinc-50/90 text-center font-mono text-[34px] font-semibold tracking-[0.55em] text-zinc-950 outline-none placeholder:tracking-[0.55em] placeholder:text-zinc-300 focus:border-zinc-300 focus:bg-white disabled:opacity-60"
          />
          {error ? (
            <p role="alert" className="mt-3 text-center text-[12px] font-medium text-rose-600">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={locked || number.length !== 4}
            className={cn(
              "mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-[18px] text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-40",
              TONE_SOLID.zinc,
            )}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {pending ? t.loadingTasks : t.getTasks}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4">
          <LanguagePicker />
          <Link
            href={loginPath(slug)}
            className="text-[13px] font-medium text-zinc-400 underline-offset-4 hover:text-zinc-700 hover:underline"
            data-testid="link-staff-login"
          >
            {t.staffSignIn}
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
