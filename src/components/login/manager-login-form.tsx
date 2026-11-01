"use client";

import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { postLoginPath } from "@/domain/staff-scope";
import type { WorkspaceOption } from "@/domain/session/types";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoginFieldIcon, LoginShell } from "@/components/login/login-shell";
import { LanguagePicker } from "@/components/login/language-picker";
import { PersonalPortalLink } from "@/components/login/personal-portal-link";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";

export function ManagerLoginForm({ slug }: { slug?: string }) {
  const { t } = useLocale();
  const { acceptLogin, isAuthenticated, session, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [options, setOptions] = useState<WorkspaceOption[] | null>(null);

  useEffect(() => {
    if (isAuthenticated && session) {
      router.replace(postLoginPath({ slug: session.workspace.slug, surface: session.surface, defaultTab: session.defaultTab }));
    }
  }, [isAuthenticated, session, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = options
        ? await kernel.selectWorkspace(email, password, options.find((o) => o.slug === slug)?.id ?? options[0]!.id)
        : await kernel.loginEmail(email, password);
      if (res.needsWorkspacePick && res.workspaces?.length) {
        setOptions(res.workspaces);
        return;
      }
      if (!res.token || !res.session) {
        setError("Login did not return a session");
        return;
      }
      acceptLogin(res.token, res.session, res.expiresIn);
      toast.success("Welcome back");
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

  async function pick(workspaceId: string) {
    setError(null);
    setPending(true);
    try {
      const res = await kernel.selectWorkspace(email, password, workspaceId);
      if (!res.token || !res.session) {
        setError("Login did not return a session");
        return;
      }
      acceptLogin(res.token, res.session, res.expiresIn);
      toast.success("Welcome back");
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

  if (options) {
    return (
      <LoginShell title={t.pickWorkspace} subtitle={t.pickWorkspaceHint} formError={error}>
        <ul className="space-y-2">
          {options.map((ws) => (
            <li key={ws.id}>
              <button
                type="button"
                onClick={() => pick(ws.id)}
                disabled={locked}
                className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left hover:bg-white"
              >
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">{ws.name}</span>
                  <span className="text-[11px] uppercase tracking-wide text-zinc-900/40">{ws.kind}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </LoginShell>
    );
  }

  return (
    <LoginShell
      title={t.staffSignIn}
      subtitle={t.staffSubtitle}
      formError={error}
      footer={
        <div className="flex flex-col items-center gap-8">
          <PersonalPortalLink slug={slug} />
          <LanguagePicker />
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate autoComplete="on">
        <div className="relative">
          <LoginFieldIcon>
            <Mail className="h-5 w-5" />
          </LoginFieldIcon>
          <Input
            data-testid="input-email"
            placeholder={t.email}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 rounded-2xl border-zinc-200 bg-zinc-50 pl-12"
            required
            disabled={locked}
          />
        </div>
        <div className="relative">
          <LoginFieldIcon>
            <Lock className="h-5 w-5" />
          </LoginFieldIcon>
          <Input
            data-testid="input-password"
            placeholder={t.password}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 rounded-2xl border-zinc-200 bg-zinc-50 pl-12 pr-12"
            required
            disabled={locked}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t.hidePassword : t.showPassword}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <Button
          type="submit"
          className="h-14 w-full rounded-2xl text-base font-medium shadow-md shadow-zinc-900/15"
          disabled={locked}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {pending ? t.signingIn : t.signIn}
        </Button>
      </form>
    </LoginShell>
  );
}
