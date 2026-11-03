"use client";

import { useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DEFAULT_MODEL,
  DEFAULT_PROVIDER,
  looksLikeAPIKey,
  maskStoredKey,
  type AssistantProviderId,
} from "@/domain/assistant/types";
import { writeAiSkipped } from "@/domain/cafe/setup";
import { cn } from "@/lib/utils";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";
import { GlassField, GlassGroup, GlassInput, PillButton, StepHero } from "./glass";
import { StepFooter } from "./step-footer";

type Props = {
  workspaceId: string;
  onBack: (() => void) | null;
  onDone: (opts: { configured: boolean; skipped: boolean }) => void;
};

const PROVIDERS: { id: AssistantProviderId; hint: string }[] = [
  { id: "gemini", hint: "AIza…" },
  { id: "openai", hint: "sk-…" },
];

export function AIStep({ workspaceId, onBack, onDone }: Props) {
  const { t } = useLocale();
  const settings = useQuery({
    queryKey: qk.assistantSettings(workspaceId),
    queryFn: () => kernel.getAssistantSettings(workspaceId),
    staleTime: 30_000,
    retry: 1,
  });
  const ready = Boolean(settings.data?.configured && settings.data?.enabled);
  const [editing, setEditing] = useState(false);
  const [provider, setProvider] = useState<AssistantProviderId>(DEFAULT_PROVIDER);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [keyError, setKeyError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const showForm = !ready || editing;
  const hint = PROVIDERS.find((p) => p.id === provider)?.hint ?? "";

  function skip() {
    writeAiSkipped(workspaceId, true);
    onDone({ configured: false, skipped: true });
  }

  async function primary() {
    if (!showForm) {
      writeAiSkipped(workspaceId, false);
      onDone({ configured: true, skipped: false });
      return;
    }
    if (!looksLikeAPIKey(apiKey)) {
      setKeyError(t.setupAIKeyError);
      return;
    }
    setBusy(true);
    try {
      const next = await kernel.saveAssistantSettings(workspaceId, {
        provider,
        model: model.trim() || (provider === "gemini" ? DEFAULT_MODEL : "gpt-4o-mini"),
        apiKey: apiKey.trim(),
        dailyLimit: settings.data?.dailyLimit || 50,
        enabled: true,
      });
      setApiKey("");
      setEditing(false);
      writeAiSkipped(workspaceId, false);
      toast.success(t.aiSaved);
      settings.refetch();
      onDone({ configured: next.configured, skipped: false });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.aiSettingsLoadError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <StepHero icon={Sparkles} tint="ai" title={t.setupAITitle} subtitle={t.setupAISubtitle} />

      {ready && !editing ? (
        <GlassGroup>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-white">{t.setupAIConnected}</p>
              <p className="truncate text-[12px] text-white/55">
                {[settings.data?.provider, settings.data?.model, maskStoredKey(settings.data?.keyHint ?? "")]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <PillButton variant="plain" onClick={() => setEditing(true)}>
              {t.setupAIChange}
            </PillButton>
          </div>
        </GlassGroup>
      ) : (
        <>
          <GlassGroup title={t.aiProvider}>
            <div role="radiogroup" aria-label={t.aiProvider} className="grid grid-cols-2 gap-3 p-3">
              {PROVIDERS.map((p) => {
                const active = p.id === provider;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setProvider(p.id)}
                    data-testid={`setup-ai-${p.id}`}
                    className={cn(
                      "flex min-h-[92px] flex-col items-center justify-center gap-1.5 rounded-[16px] px-2 py-3 text-center transition-all duration-200 active:scale-[0.98]",
                      active
                        ? "bg-white/[0.2] text-white shadow-[0_0_0_2px_rgba(14,165,233,0.55),0_8px_18px_-12px_rgba(15,23,42,0.4)]"
                        : "bg-white/[0.06] text-white/65 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.1)] hover:bg-white/[0.14]",
                    )}
                  >
                    <span className="text-[13px] font-semibold leading-tight">
                      {p.id === "gemini" ? t.aiProviderGemini : t.aiProviderOpenAI}
                    </span>
                    <span className="font-mono text-[10px] text-white/40">{p.hint}</span>
                  </button>
                );
              })}
            </div>
          </GlassGroup>

          <GlassGroup footer={t.setupAIKeyHint}>
            <GlassField id="setup-ai-key" label={t.aiApiKey} error={keyError}>
              <GlassInput
                id="setup-ai-key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                dir="ltr"
                value={apiKey}
                invalid={Boolean(keyError)}
                placeholder={hint}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setKeyError(undefined);
                }}
                data-testid="setup-ai-key"
              />
            </GlassField>
            <GlassField id="setup-ai-model" label={t.aiModel}>
              <GlassInput
                id="setup-ai-model"
                autoComplete="off"
                spellCheck={false}
                dir="ltr"
                value={model}
                placeholder={t.aiModelCustomPlaceholder}
                onChange={(e) => setModel(e.target.value)}
              />
            </GlassField>
          </GlassGroup>
        </>
      )}

      <StepFooter
        onBack={editing ? () => setEditing(false) : onBack}
        primaryLabel={showForm ? t.setupAIConnect : t.setupContinue}
        onPrimary={() => void primary()}
        busy={busy || settings.isLoading}
        secondary={
          ready && !editing
            ? undefined
            : { label: t.setupAISkip, onClick: skip, alwaysEnabled: true }
        }
      />
    </div>
  );
}
