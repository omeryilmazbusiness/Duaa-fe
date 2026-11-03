"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { CafeDefinition } from "@/domain/cafe/definition";
import {
  buildSetupOverview,
  initialStep,
  isStepLocked,
  neighborStep,
  readAiSkipped,
  stepOrder,
  writeSetupLater,
  type CafeSetupOverview,
  type CafeSetupStepKey,
} from "@/domain/cafe/setup";
import { postLoginPath } from "@/domain/staff-scope";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { AIStep } from "./ai-step";
import { BranchesStep } from "./branches-step";
import { CafeStep } from "./cafe-step";
import { PillButton } from "./glass";
import { SetupDone } from "./setup-done";
import { SetupIntro } from "./setup-intro";
import { SLAStep } from "./sla-step";
import { StepDock } from "./step-dock";
import { TablesStep } from "./tables-step";

type Slide = { dir: number; still: boolean };

const CARD_MOTION: Variants = {
  enter: ({ dir, still }: Slide) =>
    still ? { opacity: 0 } : { opacity: 0, x: dir * 56, scale: 0.97, filter: "blur(10px)" },
  center: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" },
  exit: ({ dir, still }: Slide) =>
    still ? { opacity: 0 } : { opacity: 0, x: dir * -56, scale: 0.97, filter: "blur(10px)" },
};

function SetupFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="night-glass relative isolate min-h-dvh bg-[#050816] text-white">
      <div aria-hidden className="night-aurora fixed inset-0 -z-10" />
      {children}
    </div>
  );
}

export function SetupScreen({ slug }: { slug: string }) {
  const { t } = useLocale();
  const { session, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !session) {
      router.replace(`/${slug}/login`);
      return;
    }
    if (session.scope !== "general_manager") {
      router.replace(postLoginPath({ slug: session.workspace.slug, surface: session.surface, defaultTab: session.defaultTab }));
    }
  }, [isLoading, isAuthenticated, session, router, slug]);

  const wid = session?.workspace.id ?? "";
  const definition = useQuery({
    queryKey: qk.cafeDefinition(wid),
    queryFn: () => kernel.getCafeDefinition(wid),
    enabled: Boolean(wid) && session?.workspace.kind === "cafe",
    staleTime: 15_000,
    retry: 1,
  });
  const assistant = useQuery({
    queryKey: qk.assistantStatus(wid),
    queryFn: () => kernel.getAssistantStatus(wid),
    enabled: Boolean(wid) && session?.scope === "general_manager",
    staleTime: 30_000,
    retry: 1,
  });

  if (isLoading || !session) {
    return (
      <SetupFrame>
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      </SetupFrame>
    );
  }

  return (
    <SetupFrame>
      {intro ? (
        <SetupIntro
          onDone={() => {
            window.scrollTo({ top: 0 });
            setIntro(false);
          }}
        />
      ) : (
        <div key="flow" className="animate-setup-stage-in">
          {definition.data ? (
            <SetupFlow
              slug={slug}
              definition={definition.data}
              aiConfigured={Boolean(assistant.data?.configured && assistant.data?.enabled)}
            />
          ) : (
            <div className="mx-auto flex min-h-dvh max-w-md items-center justify-center px-5">
              {definition.isError ? (
                <div className="space-y-3 text-center">
                  <p className="text-[14px] text-white/70">{t.setupLoadError}</p>
                  <PillButton variant="glass" onClick={() => void definition.refetch()}>
                    {t.aiRetry}
                  </PillButton>
                </div>
              ) : (
                <span role="status" className="flex items-center gap-3 text-[13px] font-medium text-white/60">
                  <span
                    aria-hidden
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent motion-reduce:animate-none"
                  />
                  {t.setupLoading}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </SetupFrame>
  );
}

function SetupFlow({
  slug,
  definition: initialDef,
  aiConfigured: initialAi,
}: {
  slug: string;
  definition: CafeDefinition;
  aiConfigured: boolean;
}) {
  const { t, dir } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const [definition, setDefinition] = useState(initialDef);
  const [aiConfigured, setAiConfigured] = useState(initialAi);
  const [aiSkipped, setAiSkipped] = useState(() => readAiSkipped(initialDef.workspaceId));
  const [leaving, setLeaving] = useState(false);
  const still = useReducedMotion() ?? false;
  const rtl = dir === "rtl";

  const overview = useMemo(
    () => buildSetupOverview(definition, { aiConfigured, aiSkipped }),
    [definition, aiConfigured, aiSkipped],
  );

  const [step, setStepState] = useState<CafeSetupStepKey | null>(() => initialStep(overview));
  const [forward, setForward] = useState(true);

  useEffect(() => {
    setDefinition(initialDef);
  }, [initialDef]);

  useEffect(() => {
    setAiConfigured(initialAi);
  }, [initialAi]);

  const indexOf = useCallback(
    (key: CafeSetupStepKey | null, of: CafeSetupOverview) => (key ? stepOrder(of).indexOf(key) : of.totalSteps),
    [],
  );

  const setStep = useCallback(
    (next: CafeSetupStepKey | null, of: CafeSetupOverview = overview) => {
      setForward(indexOf(next, of) >= indexOf(step, of));
      setStepState(next);
    },
    [indexOf, overview, step],
  );

  const locked = useCallback((key: CafeSetupStepKey) => isStepLocked(overview, key), [overview]);

  const back = step ? neighborStep(overview, step, -1) : null;
  const goBack = back ? () => setStep(back) : null;

  function advanced(nextDef: CafeDefinition, from: CafeSetupStepKey, ai?: { configured: boolean; skipped: boolean }) {
    const nextAiConfigured = ai?.configured ?? aiConfigured;
    const nextAiSkipped = ai?.skipped ?? aiSkipped;
    setDefinition(nextDef);
    qc.setQueryData(qk.cafeDefinition(nextDef.workspaceId), nextDef);
    if (ai) {
      setAiConfigured(ai.configured);
      setAiSkipped(ai.skipped);
    }
    const nextOverview = buildSetupOverview(nextDef, {
      aiConfigured: nextAiConfigured,
      aiSkipped: nextAiSkipped,
    });
    setStep(nextOverview.completed ? null : neighborStep(nextOverview, from, 1), nextOverview);
  }

  function later() {
    setLeaving(true);
    if (!overview.completed) writeSetupLater(definition.workspaceId, true);
    router.replace(`/${slug}/manager`);
  }

  function finish() {
    writeSetupLater(definition.workspaceId, false);
    router.replace(`/${slug}/manager`);
  }

  const position = step ? stepOrder(overview).indexOf(step) + 1 : overview.totalSteps;
  const slide: Slide = { dir: (forward ? 1 : -1) * (rtl ? -1 : 1), still };
  const eyebrow = step
    ? t.setupEyebrow.replace("{current}", String(position)).replace("{total}", String(overview.totalSteps))
    : t.setupEyebrowDone;

  return (
    <>
      <header className="mx-auto flex max-w-5xl items-center justify-end px-5 pt-5 sm:px-8 sm:pt-7">
        <PillButton
          variant="glass"
          className="h-10 px-4 text-[13px]"
          onClick={later}
          disabled={leaving}
          data-testid="setup-later"
        >
          {overview.completed ? t.setupDashboard : t.setupLater}
        </PillButton>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col items-center px-5 pb-16 pt-8 sm:px-8 sm:pt-10">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">{eyebrow}</p>
          <h1 className="liquid-glass-text text-[34px] font-semibold leading-[1.15] tracking-[-0.035em] sm:text-[44px]">
            {t.setupTitle}
          </h1>
        </div>

        <StepDock steps={overview.steps} active={step} onSelect={(key) => setStep(key)} locked={locked} />

        <AnimatePresence mode="wait" initial={false} custom={slide}>
          <motion.section
            key={step ?? "done"}
            custom={slide}
            variants={CARD_MOTION}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: still ? 0.15 : 0.42, ease: [0.32, 0.72, 0, 1] }}
            className="liquid-glass mt-10 w-full max-w-[600px] rounded-[32px] p-5 sm:p-8"
            data-testid={`setup-card-${step ?? "done"}`}
          >
            {step === "cafe" ? (
              <CafeStep
                definition={definition}
                onBack={goBack}
                onSaved={(next) => advanced(next, "cafe")}
              />
            ) : step === "branches" ? (
              <BranchesStep
                definition={definition}
                onBack={goBack}
                onSaved={(next) => advanced(next, "branches")}
              />
            ) : step === "tables" ? (
              <TablesStep
                definition={definition}
                onBack={goBack}
                onSaved={(next) => advanced(next, "tables")}
              />
            ) : step === "sla" ? (
              <SLAStep definition={definition} onBack={goBack} onSaved={(next) => advanced(next, "sla")} />
            ) : step === "ai" ? (
              <AIStep
                workspaceId={definition.workspaceId}
                onBack={goBack}
                onDone={(opts) => advanced(definition, "ai", opts)}
              />
            ) : (
              <SetupDone overview={overview} onEdit={(key) => setStep(key)} onFinish={finish} />
            )}
          </motion.section>
        </AnimatePresence>
      </main>
    </>
  );
}
