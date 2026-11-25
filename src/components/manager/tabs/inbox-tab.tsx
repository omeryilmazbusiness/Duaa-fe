"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Inbox,
  Loader2,
  MailPlus,
  Paperclip,
  RefreshCw,
  Sparkles,
  Unplug,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { InboxCategory, InboxMessage, InboxStatus } from "@/domain/inbox/types";
import type { SessionPayload } from "@/domain/session/types";
import type { Messages } from "@/lib/i18n";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

function categoryLabel(cat: string, t: Messages): string {
  switch (cat as InboxCategory) {
    case "guest":
      return t.catGuest;
    case "reservation":
      return t.catReservation;
    case "supplier":
      return t.catSupplier;
    case "staff":
      return t.catStaff;
    case "finance":
      return t.catFinance;
    case "complaint":
      return t.catComplaint;
    case "marketing":
      return t.catMarketing;
    case "internal":
      return t.catInternal;
    case "other":
      return t.catOther;
    default:
      return "";
  }
}

function formatWhen(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat(locale, sameDay ? { timeStyle: "short" } : { month: "short", day: "numeric" }).format(d);
}

function looksArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export function InboxTab({ session }: { session: SessionPayload }) {
  const { t, locale } = useLocale();
  const qc = useQueryClient();
  const wid = session.workspace.id;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [englishPreview, setEnglishPreview] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [tenant, setTenant] = useState("common");

  const inbox = useQuery({
    queryKey: qk.inbox(wid),
    queryFn: () => kernel.listInbox(wid),
    staleTime: 20_000,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("outlook");
    if (!flag) return;
    if (flag === "connected") toast.success(t.inboxConnectedToast);
    if (flag === "error") toast.error(t.inboxConnectError);
    params.delete("outlook");
    const next = `${window.location.pathname}?${params.toString()}`.replace(/\?$/, "");
    window.history.replaceState({}, "", next);
    void qc.invalidateQueries({ queryKey: qk.inbox(wid) });
  }, [qc, t.inboxConnectError, t.inboxConnectedToast, wid]);

  const messages = inbox.data?.messages ?? [];
  const status = inbox.data?.status;
  const selected = useMemo(
    () => messages.find((m: InboxMessage) => m.id === selectedId) ?? messages[0] ?? null,
    [messages, selectedId],
  );

  useEffect(() => {
    if (!selectedId && messages[0]) setSelectedId(messages[0].id);
  }, [messages, selectedId]);

  const saveApp = useMutation({
    mutationFn: () => kernel.saveOutlookApp(wid, { clientId, clientSecret, tenant }),
    onSuccess: async () => {
      toast.success(t.inboxAppSaved);
      setClientSecret("");
      await qc.invalidateQueries({ queryKey: qk.inbox(wid) });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t.errorTitle),
  });

  const connectOutlook = useMutation({
    mutationFn: async () => {
      if (status?.authUrl) return { authUrl: status.authUrl };
      return kernel.startOutlookConnect(wid);
    },
    onSuccess: (res) => {
      if (res.authUrl) window.location.href = res.authUrl;
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t.errorTitle),
  });

  const connectDemo = useMutation({
    mutationFn: () => kernel.connectInboxDemo(wid),
    onSuccess: async () => {
      toast.success(t.inboxConnectDemo);
      await qc.invalidateQueries({ queryKey: qk.inbox(wid) });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t.errorTitle),
  });

  const sync = useMutation({
    mutationFn: () => kernel.syncInbox(wid),
    onSuccess: (data) => {
      qc.setQueryData(qk.inbox(wid), data);
      toast.success(t.inboxSync);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t.errorTitle),
  });

  const disconnect = useMutation({
    mutationFn: () => kernel.disconnectInbox(wid),
    onSuccess: async () => {
      setSelectedId(null);
      await qc.invalidateQueries({ queryKey: qk.inbox(wid) });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t.errorTitle),
  });

  const enrich = useMutation({
    mutationFn: (id: string) => kernel.enrichInboxMessage(wid, id),
    onSuccess: async (msg) => {
      await qc.invalidateQueries({ queryKey: qk.inbox(wid) });
      setSelectedId(msg.id);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t.errorTitle),
  });

  const prepareSend = useMutation({
    mutationFn: async () => {
      if (!looksArabic(body)) return body;
      const res = await kernel.translateInboxCompose(wid, body, "en");
      return res.translated;
    },
    onSuccess: (english) => setEnglishPreview(english),
    onError: (err) => toast.error(err instanceof Error ? err.message : t.errorTitle),
  });

  const send = useMutation({
    mutationFn: (finalBody: string) =>
      kernel.sendInboxMail(wid, {
        to: to.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean),
        subject,
        body: finalBody,
      }),
    onSuccess: async () => {
      toast.success(t.inboxSendOk);
      setComposeOpen(false);
      setEnglishPreview(null);
      setTo("");
      setSubject("");
      setBody("");
      await qc.invalidateQueries({ queryKey: qk.inbox(wid) });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t.errorTitle),
  });

  if (inbox.isLoading) {
    return (
      <div className="ios-settings flex min-h-[50vh] items-center justify-center rounded-[28px]">
        <Loader2 className="h-7 w-7 animate-spin text-ios-secondary" />
      </div>
    );
  }

  if (!status?.connected) {
    return <ConnectPane status={status} t={t} clientId={clientId} clientSecret={clientSecret} tenant={tenant}
      onClientId={setClientId} onClientSecret={setClientSecret} onTenant={setTenant}
      saving={saveApp.isPending} connecting={connectOutlook.isPending} demoPending={connectDemo.isPending}
      onSave={() => saveApp.mutate()} onConnect={() => connectOutlook.mutate()} onDemo={() => connectDemo.mutate()} />;
  }

  return (
    <div className="ios-settings -mx-1 overflow-hidden rounded-[28px]" data-testid="inbox-board">
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-4 sm:px-5">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ios-secondary">{t.tabInbox}</p>
          <h1 className="truncate text-[28px] font-bold tracking-tight text-ios-label">{t.inboxTitle}</h1>
          <p className="mt-0.5 truncate text-[13px] text-ios-secondary">
            {t.inboxConnectedAs.replace("{email}", status.email || "—")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <IconBtn aria={t.inboxSync} onClick={() => sync.mutate()} disabled={sync.isPending}>
            <RefreshCw className={cn("h-[18px] w-[18px]", sync.isPending && "animate-spin")} />
          </IconBtn>
          <IconBtn aria={t.inboxCompose} onClick={() => { setComposeOpen(true); setEnglishPreview(null); }} tone="blue">
            <MailPlus className="h-[18px] w-[18px]" />
          </IconBtn>
        </div>
      </div>

      <div className="grid gap-3 px-3 pb-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:px-4">
        <section className="overflow-hidden rounded-[22px] bg-ios-row shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          {messages.length === 0 ? (
            <p className="px-4 py-10 text-center text-[15px] text-ios-secondary">{t.inboxEmpty}</p>
          ) : (
            <ul className="max-h-[70vh] divide-y divide-[#c6c6c8]/40 overflow-y-auto" data-testid="inbox-list">
              {messages.map((m: InboxMessage) => {
                const active = selected?.id === m.id;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(m.id)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3.5 text-start transition-colors",
                        active ? "bg-[#007aff]/10" : "active:bg-ios-press/60",
                      )}
                    >
                      <span className={cn("mt-2 h-2.5 w-2.5 shrink-0 rounded-full", m.isRead ? "bg-transparent" : "bg-ios-blue")} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn("truncate text-[15px]", m.isRead ? "font-medium text-ios-label" : "font-semibold text-ios-label")}>
                            {m.fromName || m.fromEmail}
                          </span>
                          <span className="shrink-0 text-[12px] text-ios-secondary">{formatWhen(m.receivedAt, locale)}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-[14px] text-ios-label">{m.subject || "—"}</span>
                        {m.summaryAr ? (
                          <span className="mt-1 block line-clamp-2 text-[13px] leading-snug text-ios-secondary" dir="rtl" lang="ar">
                            {m.summaryAr}
                          </span>
                        ) : (
                          <span className="mt-1 block truncate text-[13px] text-ios-secondary">{m.preview}</span>
                        )}
                        {m.category ? (
                          <span className="mt-1.5 inline-flex rounded-full bg-[#f2f2f7] px-2 py-0.5 text-[11px] font-medium text-ios-tertiary">
                            {categoryLabel(m.category, t)}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="min-h-[420px] rounded-[22px] bg-ios-row p-4 shadow-[0_1px_0_rgba(0,0,0,0.04)] sm:p-5" data-testid="inbox-detail">
          {!selected ? (
            <EmptyDetail t={t} />
          ) : (
            <Detail message={selected} t={t} locale={locale} enriching={enrich.isPending} onEnrich={() => enrich.mutate(selected.id)} />
          )}
        </section>
      </div>

      <div className="flex items-center justify-between border-t border-[#c6c6c8]/50 px-4 py-3">
        <button type="button" onClick={() => disconnect.mutate()} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ios-red">
          <Unplug className="h-3.5 w-3.5" />
          {t.inboxDisconnect}
        </button>
        {status.unreadCount > 0 ? (
          <span className="text-[12px] text-ios-secondary">{t.inboxUnread.replace("{count}", String(status.unreadCount))}</span>
        ) : null}
      </div>

      {composeOpen ? (
        <ComposeSheet
          t={t}
          to={to}
          subject={subject}
          body={body}
          englishPreview={englishPreview}
          preparing={prepareSend.isPending}
          sending={send.isPending}
          onTo={setTo}
          onSubject={setSubject}
          onBody={setBody}
          onClose={() => { setComposeOpen(false); setEnglishPreview(null); }}
          onPrepare={() => prepareSend.mutate()}
          onEditEnglish={() => setEnglishPreview(null)}
          onConfirmSend={() => send.mutate(englishPreview || body)}
        />
      ) : null}
    </div>
  );
}

function ConnectPane({
  status, t, clientId, clientSecret, tenant, onClientId, onClientSecret, onTenant,
  saving, connecting, demoPending, onSave, onConnect, onDemo,
}: {
  status?: InboxStatus;
  t: Messages;
  clientId: string;
  clientSecret: string;
  tenant: string;
  onClientId: (v: string) => void;
  onClientSecret: (v: string) => void;
  onTenant: (v: string) => void;
  saving: boolean;
  connecting: boolean;
  demoPending: boolean;
  onSave: () => void;
  onConnect: () => void;
  onDemo: () => void;
}) {
  const ready = Boolean(status?.outlookReady || status?.hasAppCredentials);
  return (
    <div className="ios-settings mx-auto max-w-lg space-y-4 rounded-[28px] p-4 sm:p-5" data-testid="inbox-connect">
      <header className="px-1 pt-2">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ios-secondary">{t.tabInbox}</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight text-ios-label">{t.inboxConnectTitle}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ios-secondary">{t.inboxConnectBody}</p>
      </header>

      <div className="overflow-hidden rounded-[22px] bg-ios-row">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-ios-blue text-white">
            <Inbox className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-ios-label">{t.inboxOutlookAppTitle}</p>
            <p className="text-[13px] text-ios-secondary">{t.inboxOutlookAppHint}</p>
          </div>
        </div>
        <div className="ios-hairline mx-4" />
        <label className="block px-4 py-3">
          <span className="text-[12px] font-medium text-ios-secondary">Client ID</span>
          <input className="mt-1 w-full rounded-xl bg-[#f2f2f7] px-3 py-2.5 text-[15px] text-ios-label outline-none" value={clientId} onChange={(e) => onClientId(e.target.value)} autoComplete="off" />
        </label>
        <div className="ios-hairline mx-4" />
        <label className="block px-4 py-3">
          <span className="text-[12px] font-medium text-ios-secondary">Client secret</span>
          <input type="password" className="mt-1 w-full rounded-xl bg-[#f2f2f7] px-3 py-2.5 text-[15px] text-ios-label outline-none" value={clientSecret} onChange={(e) => onClientSecret(e.target.value)} autoComplete="off" />
        </label>
        <div className="ios-hairline mx-4" />
        <label className="block px-4 py-3">
          <span className="text-[12px] font-medium text-ios-secondary">Tenant</span>
          <input className="mt-1 w-full rounded-xl bg-[#f2f2f7] px-3 py-2.5 text-[15px] text-ios-label outline-none" value={tenant} onChange={(e) => onTenant(e.target.value)} placeholder="common" />
        </label>
        {status?.redirectUrl ? (
          <>
            <div className="ios-hairline mx-4" />
            <div className="px-4 py-3">
              <p className="text-[12px] font-medium text-ios-secondary">{t.inboxRedirectLabel}</p>
              <p className="mt-1 break-all rounded-xl bg-[#f2f2f7] px-3 py-2 font-mono text-[12px] text-ios-label">{status.redirectUrl}</p>
            </div>
          </>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 px-1">
        <button type="button" onClick={onSave} disabled={saving || !clientId.trim() || !clientSecret.trim()}
          className="rounded-2xl bg-ios-blue px-4 py-3.5 text-[16px] font-semibold text-white disabled:opacity-40">
          {saving ? t.inboxEnriching : t.inboxSaveApp}
        </button>
        <button type="button" onClick={onConnect} disabled={connecting || !ready}
          className="rounded-2xl bg-ios-row px-4 py-3.5 text-[16px] font-semibold text-ios-blue shadow-[0_1px_0_rgba(0,0,0,0.04)] disabled:opacity-40">
          {connecting ? t.inboxEnriching : t.inboxConnectOutlook}
        </button>
        <button type="button" onClick={onDemo} disabled={demoPending}
          className="rounded-2xl px-4 py-3 text-[15px] font-medium text-ios-secondary disabled:opacity-40">
          {t.inboxConnectDemo}
        </button>
      </div>
    </div>
  );
}

function Detail({ message, t, locale, enriching, onEnrich }: { message: InboxMessage; t: Messages; locale: string; enriching: boolean; onEnrich: () => void }) {
  return (
    <article className="space-y-4">
      <header className="space-y-1 border-b border-[#c6c6c8]/40 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {message.category ? (
            <span className="rounded-full bg-[#f2f2f7] px-2.5 py-0.5 text-[11px] font-semibold text-ios-tertiary">
              {categoryLabel(message.category, t)}
            </span>
          ) : null}
          {message.hasAttachments ? <Paperclip className="h-3.5 w-3.5 text-ios-secondary" /> : null}
        </div>
        <h2 className="text-[22px] font-bold tracking-tight text-ios-label">{message.subject || "—"}</h2>
        <p className="text-[14px] text-ios-secondary">
          {t.inboxFrom}{" "}
          <span className="font-medium text-ios-label">{message.fromName || message.fromEmail}</span>
          {message.fromEmail ? ` · ${message.fromEmail}` : ""}
        </p>
        <p className="text-[12px] text-ios-tertiary">{formatWhen(message.receivedAt, locale)}</p>
      </header>

      <button
        type="button"
        onClick={onEnrich}
        disabled={enriching}
        className="inline-flex items-center gap-2 rounded-full bg-[#f2f2f7] px-3.5 py-2 text-[13px] font-semibold text-ios-blue disabled:opacity-50"
      >
        {enriching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {enriching ? t.inboxEnriching : t.inboxEnrich}
      </button>

      {message.summaryAr ? (
        <section className="rounded-2xl bg-[#f2f2f7] px-4 py-3" dir="rtl" lang="ar">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ios-secondary">{t.inboxArabicSummary}</p>
          <p className="mt-1 text-[16px] leading-relaxed text-ios-label">{message.summaryAr}</p>
        </section>
      ) : null}

      {message.summary ? (
        <section className="rounded-2xl bg-[#fff8e8] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a67c00]">{t.inboxSummary}</p>
          <p className="mt-1 text-[14px] leading-relaxed text-ios-label">{message.summary}</p>
        </section>
      ) : null}

      {message.bodyAr ? (
        <section className="rounded-2xl bg-[#eefbf3] px-4 py-3" dir="rtl" lang="ar">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1f7a45]">{t.inboxArabic}</p>
          <p className="mt-1 whitespace-pre-wrap text-[16px] leading-relaxed text-ios-label">{message.bodyAr}</p>
        </section>
      ) : null}

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ios-secondary">{t.inboxOriginal}</p>
        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ios-label">{message.bodyText}</p>
      </section>
    </article>
  );
}

function ComposeSheet({
  t, to, subject, body, englishPreview, preparing, sending,
  onTo, onSubject, onBody, onClose, onPrepare, onEditEnglish, onConfirmSend,
}: {
  t: Messages;
  to: string;
  subject: string;
  body: string;
  englishPreview: string | null;
  preparing: boolean;
  sending: boolean;
  onTo: (v: string) => void;
  onSubject: (v: string) => void;
  onBody: (v: string) => void;
  onClose: () => void;
  onPrepare: () => void;
  onEditEnglish: () => void;
  onConfirmSend: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-3 backdrop-blur-[2px] sm:items-center" role="dialog" aria-modal>
      <div className="ios-settings w-full max-w-lg overflow-hidden rounded-[28px] bg-ios-grouped shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          <button type="button" onClick={onClose} className="text-[16px] font-medium text-ios-blue">{t.cancel}</button>
          <p className="text-[16px] font-semibold text-ios-label">{t.inboxCompose}</p>
          {!englishPreview ? (
            <button type="button" onClick={onPrepare} disabled={preparing || !body.trim() || !to.trim() || !subject.trim()}
              className="text-[16px] font-semibold text-ios-blue disabled:opacity-35">
              {preparing ? "…" : t.inboxSend}
            </button>
          ) : (
            <button type="button" onClick={onConfirmSend} disabled={sending}
              className="text-[16px] font-semibold text-ios-blue disabled:opacity-35">
              {sending ? "…" : t.inboxConfirmSend}
            </button>
          )}
        </div>

        {!englishPreview ? (
          <div className="mx-3 mb-4 overflow-hidden rounded-[18px] bg-ios-row">
            <Field label={t.inboxTo} value={to} onChange={onTo} placeholder="guest@example.com" />
            <div className="ios-hairline mx-4" />
            <Field label={t.inboxSubject} value={subject} onChange={onSubject} />
            <div className="ios-hairline mx-4" />
            <label className="block px-4 py-3">
              <span className="text-[12px] font-medium text-ios-secondary">{t.inboxBody} · AR</span>
              <textarea
                className="mt-1 min-h-40 w-full resize-none bg-transparent text-[16px] leading-relaxed text-ios-label outline-none"
                dir="auto"
                value={body}
                onChange={(e) => onBody(e.target.value)}
                placeholder={t.inboxComposePlaceholder}
              />
            </label>
            <p className="px-4 pb-3 text-[12px] text-ios-secondary">{t.inboxSendHint}</p>
          </div>
        ) : (
          <div className="mx-3 mb-4 space-y-3">
            <div className="rounded-[18px] bg-ios-row px-4 py-3">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-ios-secondary">{t.inboxEnglishPreview}</p>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ios-label">{englishPreview}</p>
            </div>
            <button type="button" onClick={onEditEnglish} className="inline-flex items-center gap-1 px-1 text-[14px] font-medium text-ios-blue">
              <ChevronLeft className="h-4 w-4" />
              {t.inboxEditArabic}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="flex items-center gap-3 px-4 py-3">
      <span className="w-16 shrink-0 text-[15px] text-ios-secondary">{label}</span>
      <input
        className="min-w-0 flex-1 bg-transparent text-[16px] text-ios-label outline-none placeholder:text-ios-tertiary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function IconBtn({ children, onClick, disabled, aria, tone }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; aria: string; tone?: "blue" }) {
  return (
    <button
      type="button"
      aria-label={aria}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-ios-row text-ios-blue shadow-[0_1px_0_rgba(0,0,0,0.04)] disabled:opacity-40",
        tone === "blue" && "bg-ios-blue text-white",
      )}
    >
      {children}
    </button>
  );
}

function EmptyDetail({ t }: { t: Messages }) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
      <Inbox className="h-10 w-10 text-ios-tertiary" strokeWidth={1.4} />
      <p className="mt-3 text-[15px] text-ios-secondary">{t.inboxEmpty}</p>
    </div>
  );
}
