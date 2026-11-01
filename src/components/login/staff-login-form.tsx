"use client";

import { ArrowRight, Hash, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { loginPath, postLoginPath } from "@/domain/staff-scope";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoginFieldIcon, LoginShell } from "@/components/login/login-shell";
import { LanguagePicker } from "@/components/login/language-picker";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";

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
        setError("Login did not return a session");
        return;
      }
      acceptLogin(res.token, res.session, res.expiresIn);
      toast.success("Welcome");
      router.replace(
        postLoginPath({
          slug: res.session.workspace.slug,
          surface: res.session.surface,
          defaultTab: res.session.defaultTab,
        }),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed");
    } finally {
      setPending(false);
    }
  }

  const locked = pending || isLoading || isAuthenticated;

  return (
    <LoginShell
      title={t.personalTasks}
      subtitle={t.personalSubtitle}
      formError={error}
      footer={
        <div className="flex justify-center">
          <LanguagePicker />
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div className="relative">
          <LoginFieldIcon>
            <Hash className="h-5 w-5" />
          </LoginFieldIcon>
          <Input
            data-testid="input-employee-number"
            placeholder="0000"
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="h-14 rounded-2xl border-zinc-200 bg-zinc-50 pl-12 text-center font-mono text-2xl tracking-[0.4em]"
            disabled={locked}
          />
        </div>
        <Button
          type="submit"
          className="h-14 w-full rounded-2xl text-base font-medium shadow-md shadow-zinc-900/15"
          disabled={locked}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {pending ? t.loadingTasks : t.getTasks}
        </Button>
      </form>
      <p className="mt-4 text-center text-xs leading-relaxed text-zinc-400">{t.portalHint}</p>
      <div className="mt-4 text-center">
        <Link
          href={loginPath(slug)}
          className="text-[13px] font-medium text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline"
          data-testid="link-staff-login"
        >
          {t.staffSignIn}
        </Link>
      </div>
    </LoginShell>
  );
}
