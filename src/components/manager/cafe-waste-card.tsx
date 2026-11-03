"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChefHat, Plus, Scale, Trash2, Wine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isLiveWaste, type RecipeDraft, type WasteReason, type WasteStation } from "@/domain/cafe/waste";
import { parseIQD } from "@/domain/finance/types";
import { ApiError } from "@/infrastructure/http/errors";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

function iqd(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
}

export function CafeWasteCard({ workspaceId }: { workspaceId: string }) {
  const { t, locale } = useLocale();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: qk.cafeWaste(workspaceId),
    queryFn: () => kernel.getCafeWaste(workspaceId),
    staleTime: 15_000,
  });
  const [open, setOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [form, setForm] = useState({
    item: "",
    station: "kitchen",
    grams: "",
    cost: "",
    reason: "other",
    recipeId: "",
    note: "",
  });
  const [drafts, setDrafts] = useState<RecipeDraft[] | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: qk.cafeWaste(workspaceId) });
    qc.invalidateQueries({ queryKey: qk.dashboard(workspaceId) });
    qc.invalidateQueries({ queryKey: qk.brief(workspaceId) });
  }

  const record = useMutation({
    mutationFn: (input: { item: string; station: WasteStation; grams: number; cost: number; reason: WasteReason; recipeId?: string; note?: string }) =>
      kernel.recordCafeWaste(workspaceId, input),
    onSuccess: () => {
      toast.success(t.wasteRecord);
      setForm({ item: "", station: "kitchen", grams: "", cost: "", reason: "other", recipeId: "", note: "" });
      setOpen(false);
      invalidate();
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  const saveBook = useMutation({
    mutationFn: (recipes: RecipeDraft[]) => kernel.saveCafeRecipes(workspaceId, recipes),
    onSuccess: () => {
      toast.success(t.wasteRecipesSaved);
      setDrafts(null);
      setBookOpen(false);
      invalidate();
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  if (query.isPending) {
    return (
      <WidgetCard title={t.wasteTitle} icon={Trash2} tone="zinc" testId="cafe-waste">
        <p className="text-[13px] text-zinc-500">{t.wasteLoading}</p>
      </WidgetCard>
    );
  }
  if (query.isError) {
    return (
      <WidgetCard title={t.wasteTitle} icon={Trash2} tone="rose" testId="cafe-waste">
        <button type="button" className="text-sm font-semibold text-[#007AFF]" onClick={() => void query.refetch()}>
          {t.wasteLoadError}
        </button>
      </WidgetCard>
    );
  }

  const day = query.data;
  const live = isLiveWaste(day);
  const busy = record.isPending || saveBook.isPending;
  const recipes = drafts ?? day.recipes.map((rec) => ({ id: rec.id, name: rec.name, station: rec.station, lines: rec.lines }));

  return (
    <WidgetCard title={t.wasteTitle} icon={Trash2} tone={live ? "amber" : "zinc"} testId="cafe-waste">
      <p className="mb-3 text-[13px] text-zinc-500">{t.wasteDoesNotInvent}</p>
      <div className="rounded-[22px] bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 p-4 ring-1 ring-inset ring-amber-900/[0.04]">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700/80">{live ? t.wasteLive : t.wasteNotWiredLive}</p>
        <p className="mt-1 text-[34px] font-semibold tracking-tight tabular-nums text-zinc-950">
          {live ? iqd(day.cost, locale) : "—"}
          {live ? <span className="ms-1.5 text-[13px] font-medium text-zinc-400">IQD</span> : null}
        </p>
        {!live ? <p className="mt-1 text-[13px] text-zinc-500">{t.wasteEmpty}</p> : null}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MetricTile icon={Scale} tone={live ? "amber" : "zinc"} value={live ? iqd(day.grams, locale) : "—"} label={t.wasteGrams} compact />
        <MetricTile icon={ChefHat} tone={live && day.kitchenGrams > 0 ? "teal" : "zinc"} value={live ? iqd(day.kitchenGrams, locale) : "—"} label={t.wasteKitchenGrams} compact />
        <MetricTile icon={Wine} tone={live && day.barGrams > 0 ? "violet" : "zinc"} value={live ? iqd(day.barGrams, locale) : "—"} label={t.wasteBarGrams} compact />
      </div>

      {live ? (
        <ul className="mt-4 space-y-1.5">
          {day.tickets.map((ticket) => (
            <li key={ticket.id} className="rounded-[20px] bg-zinc-50/80 px-3 py-2.5">
              <span className="block truncate text-[14px] font-semibold tracking-tight text-zinc-900">{ticket.item}</span>
              <span className="block truncate text-[12px] font-medium text-zinc-500">
                {ticket.station === "bar" ? t.prepBar : t.prepKitchen} · {iqd(ticket.grams, locale)} g · {iqd(ticket.cost, locale)} IQD
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {day.canRecord ? (
        <div className="mt-4">
          {open ? (
            <form
              className="grid gap-2 rounded-[20px] bg-zinc-50/70 p-3.5"
              onSubmit={(e) => {
                e.preventDefault();
                const grams = parseIQD(form.grams);
                const cost = parseIQD(form.cost);
                if (!form.item.trim() || grams == null || grams < 1 || cost == null || cost < 1 || record.isPending) return;
                record.mutate({
                  item: form.item.trim(),
                  station: form.station === "bar" ? "bar" : "kitchen",
                  grams,
                  cost,
                  reason: (["prep", "spoilage", "overcook", "other"].includes(form.reason) ? form.reason : "other") as WasteReason,
                  recipeId: form.recipeId || undefined,
                  note: form.note.trim() || undefined,
                });
              }}
            >
              <Input placeholder={t.wasteItem} value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} required />
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm"
                  value={form.station}
                  onChange={(e) => setForm({ ...form, station: e.target.value as WasteStation })}
                  aria-label={t.prepStation}
                >
                  <option value="kitchen">{t.prepKitchen}</option>
                  <option value="bar">{t.prepBar}</option>
                </select>
                <select
                  className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  aria-label={t.wasteReason}
                >
                  <option value="prep">{t.wastePrep}</option>
                  <option value="spoilage">{t.wasteSpoilage}</option>
                  <option value="overcook">{t.wasteOvercook}</option>
                  <option value="other">{t.wasteOther}</option>
                </select>
              </div>
              {day.recipes.length > 0 ? (
                <select
                  className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm"
                  value={form.recipeId}
                  onChange={(e) => setForm({ ...form, recipeId: e.target.value })}
                  aria-label={t.wasteRecipes}
                >
                  <option value="">{t.wasteRecipes}</option>
                  {day.recipes.map((rec) => (
                    <option key={rec.id} value={rec.id}>
                      {rec.name}
                    </option>
                  ))}
                </select>
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                <Input inputMode="numeric" placeholder={t.wasteGrams} value={form.grams} onChange={(e) => setForm({ ...form, grams: e.target.value })} required />
                <Input inputMode="numeric" placeholder={t.wasteCost} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required />
              </div>
              <Input placeholder={t.wasteNote} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              <Button type="submit" disabled={busy}>
                {t.wasteRecord}
              </Button>
            </form>
          ) : (
            <Button variant="outline" disabled={busy} onClick={() => setOpen(true)}>
              {t.wasteRecord}
            </Button>
          )}
        </div>
      ) : null}

      {day.canEditRecipes ? (
        <div className="mt-4">
          {bookOpen ? (
            <div className="space-y-2 rounded-[20px] bg-zinc-50/70 p-3.5">
              <p className="text-[13px] text-zinc-500">{recipes.length === 0 ? t.wasteRecipesEmpty : t.wasteRecipes}</p>
              {recipes.map((rec, index) => (
                <div key={rec.id ?? `new-${index}`} className="grid gap-2 rounded-2xl bg-white p-3">
                  <Input
                    placeholder={t.wasteRecipeName}
                    value={rec.name}
                    onChange={(e) => {
                      const next = recipes.map((row, i) => (i === index ? { ...row, name: e.target.value } : row));
                      setDrafts(next);
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm"
                      value={rec.station}
                      onChange={(e) => {
                        const next = recipes.map((row, i) => (i === index ? { ...row, station: e.target.value as WasteStation } : row));
                        setDrafts(next);
                      }}
                    >
                      <option value="kitchen">{t.prepKitchen}</option>
                      <option value="bar">{t.prepBar}</option>
                    </select>
                    <Input
                      placeholder={t.wasteIngredient}
                      value={rec.lines[0]?.title ?? ""}
                      onChange={(e) => {
                        const line = { title: e.target.value, grams: rec.lines[0]?.grams ?? 1 };
                        const next = recipes.map((row, i) => (i === index ? { ...row, lines: [line, ...row.lines.slice(1)] } : row));
                        setDrafts(next);
                      }}
                    />
                  </div>
                  <Input
                    inputMode="numeric"
                    placeholder={t.wasteGrams}
                    value={rec.lines[0]?.grams ? String(rec.lines[0].grams) : ""}
                    onChange={(e) => {
                      const grams = parseIQD(e.target.value) ?? 0;
                      const line = { title: rec.lines[0]?.title ?? "", grams };
                      const next = recipes.map((row, i) => (i === index ? { ...row, lines: [line, ...row.lines.slice(1)] } : row));
                      setDrafts(next);
                    }}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => setDrafts([...recipes, { name: "", station: "kitchen", lines: [{ title: "", grams: 1 }] }])}
              >
                <Plus className="me-1 h-4 w-4" />
                {t.wasteAddRecipe}
              </Button>
              <Button type="button" disabled={busy} onClick={() => saveBook.mutate(recipes)}>
                {t.wasteSaveRecipes}
              </Button>
            </div>
          ) : (
            <Button variant="outline" disabled={busy} onClick={() => setBookOpen(true)}>
              {t.wasteRecipes}
            </Button>
          )}
        </div>
      ) : null}
    </WidgetCard>
  );
}
