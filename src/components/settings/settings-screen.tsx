"use client";

import { Briefcase, Check, ChevronRight, ClipboardCheck, Globe, QrCode, Settings, Sparkles, Store, Users } from "lucide-react";
import { displayName, personInitials, type SessionPayload } from "@/domain/session/types";
import type { SettingsPane } from "@/domain/settings/pane";
import {
  IosGlyph,
  IosGroup,
  IosLargeTitle,
  IosLinkButton,
  IosNavBar,
  IosRow,
  IosScreen,
} from "@/components/ios/ios-settings";
import { AssistantSettingsCard } from "@/components/assistant/assistant-settings-card";
import { CafeChecklistDesk } from "@/components/settings/cafe-checklist-desk";
import { CafeDefinitionCard } from "@/components/settings/cafe-definition-card";
import { CafeTableQR } from "@/components/settings/cafe-table-qr";
import { TeamTab } from "@/components/manager/tabs/team-tab";
import { useAssistantStatus } from "@/components/assistant/use-assistant";
import { LOCALES, type Messages, type StaffLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

const LOCALE_NAME: Record<StaffLocale, keyof Messages> = {
  en: "localeEnglish",
  tr: "localeTurkish",
  ar: "localeArabic",
};

export function SettingsScreen({
  session,
  pane,
  onPane,
  onLogout,
}: {
  session: SessionPayload;
  pane: SettingsPane;
  onPane: (pane: SettingsPane) => void;
  onLogout: () => void;
}) {
  const detail = pane !== "root";
  return (
    <IosScreen>
      <div
        className="lg:grid lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)] lg:items-start lg:gap-8"
        data-testid="settings-hub"
      >
        <aside
          className={cn(
            detail ? "hidden lg:block" : "block",
            "lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pb-6 lg:pe-1",
          )}
        >
          <SettingsList session={session} pane={pane} onPane={onPane} onLogout={onLogout} />
        </aside>
        <div className={cn(detail ? "block" : "hidden lg:block", "min-w-0 lg:min-h-[calc(100dvh-6rem)]")}>
          <SettingsDetail session={session} pane={pane} onPane={onPane} />
        </div>
      </div>
    </IosScreen>
  );
}

function SettingsList({
  session,
  pane,
  onPane,
  onLogout,
}: {
  session: SessionPayload;
  pane: SettingsPane;
  onPane: (pane: SettingsPane) => void;
  onLogout: () => void;
}) {
  const { t, locale } = useLocale();
  const status = useAssistantStatus(session);
  const name = displayName(session.user);
  const letters = personInitials(session.user.firstName, session.user.lastName);
  const aiHint = !status.isFetched
    ? undefined
    : status.data?.configured && status.data.enabled
      ? t.aiConnected
      : t.aiNotConnected;

  return (
    <nav aria-label={t.settings} className="space-y-5" data-testid="settings-nav">
      <IosLargeTitle>{t.settings}</IosLargeTitle>

      <button
        type="button"
        className="flex w-full items-center gap-3.5 rounded-[20px] bg-white p-3.5 text-start shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-zinc-200/60"
        data-testid="settings-profile"
      >
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-zinc-300 to-zinc-500 text-[18px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
          {letters}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-semibold tracking-tight text-zinc-950">{name}</span>
          <span className="block truncate text-[12.5px] text-zinc-500">
            {session.scopeLabel}
            {session.workspace.name ? ` · ${session.workspace.name}` : ""}
          </span>
          <span className="mt-0.5 block truncate text-[12px] font-medium text-[#007AFF]">{session.user.email}</span>
        </span>
        <ChevronRight className="h-[18px] w-[18px] shrink-0 text-zinc-300 rtl:-scale-x-100" strokeWidth={2.4} aria-hidden />
      </button>

      <IosGroup header={t.settingsGroupWorkspace}>
        {session.workspace.kind === "cafe" ? (
          <IosRow
            icon={<IosGlyph icon={Store} tone="amber" className={pane === "cafe" ? "ring-1 ring-white/40" : undefined} />}
            title={t.cafeTitle}
            subtitle={t.settingsHintCafe}
            chevron
            active={pane === "cafe"}
            onClick={() => onPane("cafe")}
            testId="settings-row-cafe"
          />
        ) : null}
        {session.workspace.kind === "cafe" ? (
          <IosRow
            icon={<IosGlyph icon={QrCode} tone="teal" className={pane === "qr" ? "ring-1 ring-white/40" : undefined} />}
            title={t.qrTitle}
            subtitle={t.settingsHintQR}
            chevron
            active={pane === "qr"}
            onClick={() => onPane("qr")}
            testId="settings-row-qr"
          />
        ) : null}
        <IosRow
          icon={<IosGlyph icon={Sparkles} tone="violet" className={pane === "ai" ? "ring-1 ring-white/40" : undefined} />}
          title={t.aiSettingsTitle}
          subtitle={t.settingsHintAi}
          value={aiHint}
          chevron
          active={pane === "ai"}
          onClick={() => onPane("ai")}
          testId="settings-row-ai"
        />
        <IosRow
          icon={<IosGlyph icon={Users} tone="sky" className={pane === "team" ? "ring-1 ring-white/40" : undefined} />}
          title={t.tabTeam}
          subtitle={t.settingsHintTeam}
          chevron
          active={pane === "team"}
          onClick={() => onPane("team")}
          testId="settings-row-team"
        />
      </IosGroup>

      <IosGroup header={t.settingsGroupPrefs}>
        <IosRow
          icon={<IosGlyph icon={Globe} tone="teal" className={pane === "language" ? "ring-1 ring-white/40" : undefined} />}
          title={t.language}
          subtitle={t[LOCALE_NAME[locale]]}
          chevron
          active={pane === "language"}
          onClick={() => onPane("language")}
          testId="settings-row-language"
        />
        <IosRow icon={<IosGlyph icon={Briefcase} tone="amber" />} title={t.product} subtitle={session.workspace.kind} />
      </IosGroup>

      <IosGroup>
        <IosLinkButton destructive onClick={onLogout} testId="settings-sign-out">
          {t.logout}
        </IosLinkButton>
      </IosGroup>
    </nav>
  );
}

function SettingsDetail({
  session,
  pane,
  onPane,
}: {
  session: SessionPayload;
  pane: SettingsPane;
  onPane: (pane: SettingsPane) => void;
}) {
  const { t } = useLocale();
  if (pane === "root") return <SettingsWelcome />;
  if (pane === "cafe" && session.workspace.kind === "cafe") {
    return (
      <article className="space-y-6" data-testid="settings-detail-cafe">
        <IosNavBar backLabel={t.settings} onBack={() => onPane("root")} />
        <DetailHeader icon={Store} tone="amber" title={t.cafeTitle} description={t.cafeHint} />
        <CafeDefinitionCard session={session} />
        <section className="space-y-3" data-testid="settings-checklist">
          <header className="flex items-center gap-3">
            <IosGlyph icon={ClipboardCheck} tone="indigo" />
            <div>
              <h2 className="text-[17px] font-semibold text-zinc-950">{t.checkTitle}</h2>
              <p className="text-[13px] text-zinc-500">{t.checkHint}</p>
            </div>
          </header>
          <CafeChecklistDesk workspaceId={session.workspace.id} />
        </section>
      </article>
    );
  }
  if (pane === "qr" && session.workspace.kind === "cafe") {
    return (
      <article className="space-y-6" data-testid="settings-detail-qr">
        <IosNavBar backLabel={t.settings} onBack={() => onPane("root")} />
        <DetailHeader icon={QrCode} tone="teal" title={t.qrTitle} description={t.qrPaneHint} />
        <CafeTableQR
          workspaceId={session.workspace.id}
          canIssue={session.scope === "general_manager"}
          canRotate={session.scope === "general_manager" || session.scope === "floor_ops"}
        />
      </article>
    );
  }
  if (pane === "ai") {
    return (
      <article className="space-y-6" data-testid="settings-detail-ai">
        <IosNavBar backLabel={t.settings} onBack={() => onPane("root")} />
        <DetailHeader icon={Sparkles} tone="violet" title={t.aiSettingsTitle} description={t.aiSettingsHint} />
        <AssistantSettingsCard session={session} />
      </article>
    );
  }
  if (pane === "team") {
    return (
      <article className="space-y-6" data-testid="settings-detail-team">
        <IosNavBar backLabel={t.settings} onBack={() => onPane("root")} />
        <DetailHeader icon={Users} tone="sky" title={t.tabTeam} description={t.settingsHintTeam} />
        <TeamTab session={session} />
      </article>
    );
  }
  return <LanguagePane onBack={() => onPane("root")} />;
}

function DetailHeader({
  icon,
  tone,
  title,
  description,
}: {
  icon: typeof Sparkles;
  tone: "violet" | "sky" | "teal" | "amber";
  title: string;
  description: string;
}) {
  return (
    <header className="flex items-center gap-4">
      <IosGlyph icon={icon} tone={tone} size="lg" />
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-zinc-950 sm:text-[30px]">{title}</h1>
        <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-zinc-500">{description}</p>
      </div>
    </header>
  );
}

function SettingsWelcome() {
  const { t } = useLocale();
  return (
    <div
      className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] bg-white/70 px-8 text-center ring-1 ring-zinc-200/60"
      data-testid="settings-welcome"
    >
      <IosGlyph icon={Settings} tone="zinc" size="lg" />
      <p className="mt-5 text-[22px] font-semibold tracking-tight text-zinc-950">{t.settingsWelcomeTitle}</p>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-zinc-500">{t.settingsWelcomeBody}</p>
    </div>
  );
}

function LanguagePane({ onBack }: { onBack: () => void }) {
  const { t, locale, setLocale } = useLocale();
  return (
    <article className="space-y-6" data-testid="settings-detail-language">
      <IosNavBar backLabel={t.settings} onBack={onBack} />
      <DetailHeader icon={Globe} tone="teal" title={t.language} description={t.settingsHintLanguage} />
      <IosGroup>
        {LOCALES.map((code) => (
          <IosRow
            key={code}
            title={t[LOCALE_NAME[code]]}
            onClick={() => setLocale(code)}
            trailing={locale === code ? <Check className="h-5 w-5 text-[#007AFF]" strokeWidth={2.6} aria-hidden /> : null}
            testId={`settings-locale-${code}`}
          />
        ))}
      </IosGroup>
    </article>
  );
}
