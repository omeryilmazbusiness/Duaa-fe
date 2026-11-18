"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildDailyFigures,
  minorToMajor,
  type DailyFiguresDraft,
  type DailyFiguresIssue,
  type HotelPMSView,
} from "@/domain/hotel/pms";
import { ApiError } from "@/infrastructure/http/errors";
import type { Messages } from "@/lib/i18n";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

const ISSUE_KEY: Record<DailyFiguresIssue, keyof Messages> = {
  invalid_number: "hotelDailyInvalidNumber",
  rooms_required: "hotelDailyRoomsRequired",
  ooo_exceeds_total: "hotelDailyOooTooHigh",
  occupied_exceeds_available: "hotelDailyOccupiedTooHigh",
};

const FIELD_LABEL = "mb-1 block text-[11.5px] font-semibold text-zinc-600";

function draftFrom(view: HotelPMSView): DailyFiguresDraft {
  const today = view.today;
  const currency = today?.currency ?? view.profile.currency;
  const rooms = today?.totalRooms || view.profile.totalRooms;
  const amount = (minor: number | undefined) => (minor ? String(minorToMajor(minor, currency)) : "");
  const count = (n: number | undefined) => (n ? String(n) : "");
  return {
    totalRooms: rooms ? String(rooms) : "",
    occupiedRooms: count(today?.occupiedRooms),
    outOfOrderRooms: count(today?.outOfOrderRooms),
    roomRevenue: amount(today?.roomRevenueMinor),
    fbRevenue: amount(today?.fbRevenueMinor),
    otherRevenue: amount(today?.otherRevenueMinor),
    arrivals: count(today?.arrivalsCount),
    departures: count(today?.departuresCount),
    inHouseGuests: count(today?.inHouseGuests),
  };
}

/** Manual daily totals for hotels without a live OHIP feed. Mount with key={workspaceId + businessDate}. */
export function HotelDailyForm({ view }: { view: HotelPMSView }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const workspaceId = view.workspaceId;
  const currency = view.today?.currency ?? view.profile.currency ?? "USD";
  const [draft, setDraft] = useState<DailyFiguresDraft>(() => draftFrom(view));
  const [issue, setIssue] = useState<DailyFiguresIssue | null>(null);

  const save = useMutation({
    mutationFn: (input: Parameters<typeof kernel.importHotelPMS>[1]) => kernel.importHotelPMS(workspaceId, input),
    onSuccess: (next) => {
      toast.success(t.hotelDailySaved);
      qc.setQueryData(qk.hotelPMS(workspaceId), next);
      void qc.invalidateQueries({ queryKey: qk.portfolio() });
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : t.aiErrGeneric),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const built = buildDailyFigures(draft, currency);
    if (!built.ok) {
      setIssue(built.issue);
      return;
    }
    setIssue(null);
    save.mutate({ businessDate: view.businessDate, source: "manual", currency, ...built.value });
  }

  const field = (key: keyof DailyFiguresDraft, label: string, decimal = false) => (
    <label>
      <span className={FIELD_LABEL}>{label}</span>
      <Input
        inputMode={decimal ? "decimal" : "numeric"}
        value={draft[key]}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        className="tabular-nums"
      />
    </label>
  );

  return (
    <form onSubmit={submit} className="space-y-3" data-testid="hotel-daily-form">
      <p className="text-[12px] text-zinc-500">
        {t.hotelDailyHint.replace("{date}", view.businessDate).replace("{currency}", currency)}
      </p>
      <fieldset disabled={save.isPending} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {field("totalRooms", t.hotelInfoRooms)}
        {field("occupiedRooms", t.hotelDailyOccupied)}
        {field("outOfOrderRooms", t.hotelOoo)}
        {field("roomRevenue", `${t.hotelDailyRoomRevenue} (${currency})`, true)}
        {field("fbRevenue", `${t.hotelDailyFbRevenue} (${currency})`, true)}
        {field("otherRevenue", `${t.hotelDailyOtherRevenue} (${currency})`, true)}
        {field("arrivals", t.hotelArrivals)}
        {field("departures", t.hotelDepartures)}
        {field("inHouseGuests", t.hotelDailyInHouse)}
      </fieldset>
      {issue ? (
        <p className="text-[12px] font-medium text-rose-700" role="alert">
          {t[ISSUE_KEY[issue]]}
        </p>
      ) : null}
      <Button type="submit" disabled={save.isPending} className="w-full sm:w-auto">
        {save.isPending ? t.aiSaving : t.hotelDailySave}
      </Button>
    </form>
  );
}
