"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CAFE_CURRENCIES, CAFE_TIMEZONES } from "@/domain/cafe/definition";
import type { HotelProfile, HotelProfileSave } from "@/domain/hotel/pms";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

const SELECT_CLS = "h-10 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900";
const FIELD_LABEL = "mb-1 block text-[11.5px] font-semibold text-zinc-600";

function toDraft(p: HotelProfile) {
  return {
    displayName: p.displayName,
    totalRooms: p.totalRooms > 0 ? String(p.totalRooms) : "",
    currency: p.currency || "USD",
    timezone: p.timezone || "Asia/Baghdad",
    starRating: String(p.starRating || 0),
    city: p.city,
    address: p.address,
    phone: p.phone,
    gmName: p.gmName,
    notes: p.notes,
  };
}

/** Mount with key={workspaceId + profile.updatedAt} so a saved profile resets the draft but background refetches do not. */
export function HotelProfileForm({ workspaceId, profile }: { workspaceId: string; profile: HotelProfile }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [draft, setDraft] = useState(() => toDraft(profile));
  const [issue, setIssue] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (input: HotelProfileSave) => kernel.saveHotelProfile(workspaceId, input),
    onSuccess: () => {
      toast.success(t.hotelInfoSaved);
      void qc.invalidateQueries({ queryKey: qk.hotelPMS(workspaceId) });
      void qc.invalidateQueries({ queryKey: qk.portfolio() });
      void qc.invalidateQueries({ queryKey: qk.workspaces });
      void qc.invalidateQueries({ queryKey: qk.me });
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : t.aiErrGeneric),
  });

  const readOnly = !profile.canWrite;
  const currencies: readonly string[] = CAFE_CURRENCIES.includes(draft.currency as (typeof CAFE_CURRENCIES)[number])
    ? CAFE_CURRENCIES
    : [draft.currency, ...CAFE_CURRENCIES];
  const zones: readonly string[] = CAFE_TIMEZONES.includes(draft.timezone as (typeof CAFE_TIMEZONES)[number])
    ? CAFE_TIMEZONES
    : [draft.timezone, ...CAFE_TIMEZONES];

  function submit(e: FormEvent) {
    e.preventDefault();
    const name = draft.displayName.trim();
    if (!name) {
      setIssue(t.hotelInfoNameRequired);
      return;
    }
    const rooms = draft.totalRooms.trim() ? Number(draft.totalRooms) : 0;
    if (!Number.isInteger(rooms) || rooms < 0 || rooms > 10_000) {
      setIssue(t.hotelInfoRoomsInvalid);
      return;
    }
    setIssue(null);
    save.mutate({
      displayName: name,
      totalRooms: rooms,
      currency: draft.currency,
      timezone: draft.timezone,
      starRating: Number(draft.starRating) || 0,
      city: draft.city.trim(),
      address: draft.address.trim(),
      phone: draft.phone.trim(),
      gmName: draft.gmName.trim(),
      notes: draft.notes.trim(),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3" data-testid="hotel-profile-form">
      {readOnly ? <p className="text-[12px] text-zinc-500">{t.hotelInfoReadOnly}</p> : null}
      <fieldset disabled={readOnly || save.isPending} className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className={FIELD_LABEL}>{t.hotelInfoName}</span>
          <Input value={draft.displayName} maxLength={120} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} />
        </label>
        <label>
          <span className={FIELD_LABEL}>{t.hotelInfoRooms}</span>
          <Input inputMode="numeric" value={draft.totalRooms} onChange={(e) => setDraft({ ...draft, totalRooms: e.target.value.replace(/\D/g, "") })} />
        </label>
        <label>
          <span className={FIELD_LABEL}>{t.hotelInfoStars}</span>
          <select className={SELECT_CLS} value={draft.starRating} onChange={(e) => setDraft({ ...draft, starRating: e.target.value })}>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "—" : "★".repeat(n)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={FIELD_LABEL}>{t.hotelInfoCurrency}</span>
          <select className={SELECT_CLS} value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })}>
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={FIELD_LABEL}>{t.hotelInfoTimezone}</span>
          <select className={SELECT_CLS} value={draft.timezone} onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={FIELD_LABEL}>{t.hotelInfoCity}</span>
          <Input value={draft.city} maxLength={80} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
        </label>
        <label>
          <span className={FIELD_LABEL}>{t.hotelInfoPhone}</span>
          <Input type="tel" value={draft.phone} maxLength={40} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
        </label>
        <label className="sm:col-span-2">
          <span className={FIELD_LABEL}>{t.hotelInfoAddress}</span>
          <Input value={draft.address} maxLength={240} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
        </label>
        <label className="sm:col-span-2">
          <span className={FIELD_LABEL}>{t.hotelInfoGm}</span>
          <Input value={draft.gmName} maxLength={120} onChange={(e) => setDraft({ ...draft, gmName: e.target.value })} />
        </label>
        <label className="sm:col-span-2">
          <span className={FIELD_LABEL}>{t.hotelInfoNotes}</span>
          <textarea
            rows={3}
            maxLength={1000}
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>
      </fieldset>
      {issue ? (
        <p className="text-[12px] font-medium text-rose-700" role="alert">
          {issue}
        </p>
      ) : null}
      {!readOnly ? (
        <Button type="submit" disabled={save.isPending} className="w-full sm:w-auto">
          {save.isPending ? t.aiSaving : t.save}
        </Button>
      ) : null}
    </form>
  );
}
