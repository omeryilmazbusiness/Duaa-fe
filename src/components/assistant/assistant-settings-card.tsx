"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  clampDailyLimit,
  CUSTOM_MODEL,
  defaultSelection,
  isListedModel,
  looksLikeAPIKey,
  maskStoredKey,
  parseSelection,
  pickerGroups,
  selectionValue,
  MAX_DAILY_LIMIT,
  MIN_DAILY_LIMIT,
  type AssistantProviderId,
  type AssistantSettings,
} from "@/domain/assistant/types";
import type { SessionPayload } from "@/domain/session/types";
import { IosField, IosGroup, IosLinkButton, IosRow, IosSeparator, IosSwitch } from "@/components/ios/ios-settings";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

/** GM-only setup: provider, model, API key (write-only), daily limit. */
export function AssistantSettingsCard({ session }: { session: SessionPayload }) {
  const { t } = useLocale();
  const wid = session.workspace.id;
  const settings = useQuery({
    queryKey: qk.assistantSettings(wid),
    queryFn: () => kernel.getAssistantSettings(wid),
    enabled: session.scope === "general_manager",
    retry: 1,
    staleTime: 30_000,
  });
  if (session.scope !== "general_manager") return null;
  if (settings.isPending) {
    return (
      <IosGroup>
        <div className="flex items-center gap-2 px-4 py-3 text-[15px] text-ios-secondary" data-testid="ai-settings-loading">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t.aiLoadingSettings}
        </div>
      </IosGroup>
    );
  }
  if (settings.isError || !settings.data) {
    return (
      <IosGroup footer={t.aiSettingsLoadError}>
        <IosLinkButton onClick={() => void settings.refetch()}>{t.aiRetry}</IosLinkButton>
      </IosGroup>
    );
  }
  return <SettingsForm key={`${settings.data.configured}:${settings.data.keyHint}`} wid={wid} initial={settings.data} />;
}

function SettingsForm({ wid, initial }: { wid: string; initial: AssistantSettings }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const first = defaultSelection(initial.providers);
  const [provider, setProvider] = useState<AssistantProviderId>(initial.configured ? initial.provider : first.provider);
  const [model, setModel] = useState(initial.configured ? initial.model : first.model);
  const [custom, setCustom] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [replacing, setReplacing] = useState(!initial.configured);
  const [limit, setLimit] = useState(String(initial.dailyLimit));
  const [enabled, setEnabled] = useState(initial.enabled);

  const liveModels = useQuery({
    queryKey: qk.assistantModels(wid),
    queryFn: () => kernel.listAssistantModels(wid),
    enabled: initial.configured,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const groups = pickerGroups(initial.providers, liveModels.data, initial.provider);
  const current = groups.find((p) => p.id === provider);
  const listed = isListedModel(current?.models ?? [], model);
  const pickerValue = custom || !listed ? selectionValue(provider, CUSTOM_MODEL) : selectionValue(provider, model);
  const pickRow = (raw: string) => {
    const parsed = parseSelection(raw);
    if (!parsed) return;
    if (parsed.model === CUSTOM_MODEL) {
      setProvider(parsed.provider);
      setCustom(true);
      setModel("");
      return;
    }
    setProvider(parsed.provider);
    setModel(parsed.model);
    setCustom(false);
  };
  const providerChanged = initial.configured && provider !== initial.provider;
  const needsKey = !initial.configured || providerChanged || replacing;
  const canSave = !needsKey || looksLikeAPIKey(apiKey);
  const showStored = initial.configured && !providerChanged && !replacing;

  const refresh = (next: AssistantSettings) => {
    qc.setQueryData(qk.assistantSettings(wid), next);
    void qc.invalidateQueries({ queryKey: qk.assistantStatus(wid) });
    void qc.invalidateQueries({ queryKey: qk.assistantModels(wid) });
  };

  const save = useMutation({
    mutationFn: (input: { apiKey: string; enabled?: boolean }) =>
      kernel.saveAssistantSettings(wid, {
        provider,
        model: model.trim(),
        apiKey: input.apiKey.trim(),
        dailyLimit: clampDailyLimit(Number(limit)),
        enabled: input.enabled ?? enabled,
      }),
    onSuccess: (next) => {
      setApiKey("");
      setReplacing(false);
      setLimit(String(next.dailyLimit));
      setProvider(next.provider);
      setModel(next.model);
      setEnabled(next.enabled);
      toast.success(t.aiSaved);
      refresh(next);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: () => kernel.removeAssistant(wid),
    onSuccess: async () => {
      toast.success(t.aiRemoved);
      setApiKey("");
      setReplacing(true);
      const fresh = await kernel.getAssistantSettings(wid);
      const next = fresh.configured ? { provider: fresh.provider, model: fresh.model } : defaultSelection(fresh.providers);
      setProvider(next.provider);
      setModel(next.model);
      setCustom(false);
      setLimit(String(fresh.dailyLimit));
      setEnabled(fresh.enabled);
      refresh(fresh);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const busy = save.isPending || remove.isPending;

  return (
    <form
      className="space-y-8"
      autoComplete="off"
      data-testid="ai-settings"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave && !busy) save.mutate({ apiKey });
      }}
    >
      <IosGroup footer={t.aiSettingsHint}>
        <IosRow
          title={t.aiEnabled}
          trailing={
            <IosSwitch
              checked={enabled}
              disabled={busy || !initial.configured}
              label={t.aiEnabled}
              onCheckedChange={(next) => {
                setEnabled(next);
                if (initial.configured) save.mutate({ apiKey: "", enabled: next });
              }}
            />
          }
        />
      </IosGroup>

      <IosGroup header={t.aiModel}>
        <label className="block px-4">
          <select
            id="duaa-ai-model"
            className="h-11 w-full bg-transparent text-[17px] text-ios-label outline-none"
            value={pickerValue}
            data-testid="ai-model"
            onChange={(e) => pickRow(e.target.value)}
          >
            {groups.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.models.map((m) => (
                  <option key={`${group.id}:${m.id}`} value={selectionValue(group.id, m.id)}>
                    {[m.id, m.free ? t.aiModelFree : "", m.id === group.defaultModel ? t.aiModelDefault : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </option>
                ))}
                <option value={selectionValue(group.id, CUSTOM_MODEL)}>
                  {group.label} — {t.aiModelCustom}
                </option>
              </optgroup>
            ))}
          </select>
        </label>
        {custom ? (
          <>
            <IosSeparator inset={false} />
            <div className="px-4">
              <IosField
                value={model}
                maxLength={64}
                placeholder={t.aiModelCustomPlaceholder}
                onChange={(e) => setModel(e.target.value)}
                spellCheck={false}
                data-testid="ai-model-custom"
              />
            </div>
          </>
        ) : null}
      </IosGroup>

      <IosGroup header={t.aiApiKey} footer={showStored ? t.aiApiKeyKeep.replace("{hint}", initial.keyHint) : t.aiPrivacyNote}>
        {showStored ? (
          <>
            <IosRow title={maskStoredKey(initial.keyHint)} testId="ai-key-stored" />
            <IosSeparator inset={false} />
            <IosLinkButton
              onClick={() => {
                setReplacing(true);
                setApiKey("");
              }}
              testId="ai-key-replace"
            >
              {t.aiReplaceKey}
            </IosLinkButton>
          </>
        ) : (
          <>
            <div className="px-4">
              <IosField
                type="password"
                value={apiKey}
                maxLength={256}
                autoComplete="new-password"
                spellCheck={false}
                placeholder={t.aiApiKeyPlaceholder}
                onChange={(e) => setApiKey(e.target.value)}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  if (!looksLikeAPIKey(text) || busy) return;
                  e.preventDefault();
                  const next = text.trim();
                  setApiKey(next);
                  save.mutate({ apiKey: next });
                }}
                data-testid="ai-key-input"
              />
            </div>
            {initial.configured && replacing ? (
              <>
                <IosSeparator inset={false} />
                <IosLinkButton
                  onClick={() => {
                    setReplacing(false);
                    setApiKey("");
                  }}
                >
                  {t.aiKeepStoredKey}
                </IosLinkButton>
              </>
            ) : null}
          </>
        )}
      </IosGroup>

      <IosGroup header={t.aiDailyLimit}>
        <div className="px-4">
          <IosField
            type="number"
            inputMode="numeric"
            min={MIN_DAILY_LIMIT}
            max={MAX_DAILY_LIMIT}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="tabular-nums"
          />
        </div>
      </IosGroup>

      <IosGroup>
        <IosLinkButton
          onClick={() => {
            if (canSave && !busy) save.mutate({ apiKey });
          }}
          disabled={!canSave || busy}
          testId="ai-save"
        >
          {save.isPending ? t.aiSaving : t.aiSave}
        </IosLinkButton>
        {initial.configured ? (
          <>
            <IosSeparator inset={false} />
            <IosLinkButton destructive disabled={busy} onClick={() => remove.mutate()}>
              {t.aiRemoveKey}
            </IosLinkButton>
          </>
        ) : null}
      </IosGroup>
    </form>
  );
}
