"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Briefcase, Loader2, Plus, UserMinus, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { catalogFor } from "@/domain/catalog";
import { isEmployeePortalDepartment } from "@/domain/staff-scope";
import { personInitials } from "@/domain/session/types";
import type { SessionPayload } from "@/domain/session/types";
import { memberDisplayName, type MemberView } from "@/domain/work/types";
import { EXPAND_SPRING, FADE_UP, IOS_EASE, PRESS_SOFT, STAGGER_PARENT, TAP_SPRING } from "@/lib/motion";
import { departmentLabel } from "@/lib/format";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { ApiError } from "@/infrastructure/http/errors";
import { TONE_GRADIENT, TONE_SOFT, TONE_TINT, TONE_WELL, type Tone } from "@/theme/tones";

type HireMode = "staff" | "manager";

const AVATAR_TONES: Tone[] = ["sky", "violet", "teal", "amber", "indigo", "rose", "emerald"];

function toneForId(id: string): Tone {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length;
  return AVATAR_TONES[n] ?? "sky";
}

export function TeamTab({ session }: { session: SessionPayload }) {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const qc = useQueryClient();
  const wid = session.workspace.id;
  const catalog = catalogFor(session.workspace.kind);
  const staff = useQuery({ queryKey: qk.staff(wid), queryFn: () => kernel.listPersonnel(wid) });
  const managers = useQuery({
    queryKey: qk.managers(wid),
    queryFn: () => kernel.listDepartmentManagers(wid),
    enabled: session.scope === "general_manager",
  });

  const [open, setOpen] = useState<HireMode | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    staffDepartment: catalog.departments()[0] ?? "KITCHEN",
    employeeNumber: "",
    email: "",
    password: "",
  });

  const pinDept = isEmployeePortalDepartment(form.staffDepartment, catalog);

  const hireStaff = useMutation({
    mutationFn: () =>
      kernel.createPersonnel(wid, {
        firstName: form.firstName,
        lastName: form.lastName,
        staffDepartment: form.staffDepartment,
        employeeNumber: pinDept ? form.employeeNumber : undefined,
        email: pinDept ? undefined : form.email,
        password: pinDept ? undefined : form.password,
      }),
    onSuccess: () => {
      toast.success("Staff hired");
      qc.invalidateQueries({ queryKey: qk.staff(wid) });
      setOpen(null);
      setForm({
        firstName: "",
        lastName: "",
        staffDepartment: catalog.departments()[0] ?? "KITCHEN",
        employeeNumber: "",
        email: "",
        password: "",
      });
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  const hireMgr = useMutation({
    mutationFn: () =>
      kernel.createDepartmentManager(wid, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        staffDepartment: form.staffDepartment,
      }),
    onSuccess: () => {
      toast.success("Manager hired");
      qc.invalidateQueries({ queryKey: qk.managers(wid) });
      setOpen(null);
      setForm({
        firstName: "",
        lastName: "",
        staffDepartment: catalog.departments()[0] ?? "KITCHEN",
        employeeNumber: "",
        email: "",
        password: "",
      });
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => kernel.deactivate(wid, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.staff(wid) });
      qc.invalidateQueries({ queryKey: qk.managers(wid) });
    },
  });

  const people = staff.data ?? [];
  const mgrs = managers.data ?? [];
  const loading = staff.isPending || (session.scope === "general_manager" && managers.isPending);
  const hiring = hireStaff.isPending || hireMgr.isPending;

  return (
    <motion.div
      className="space-y-4"
      data-testid="team-board"
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={STAGGER_PARENT}
    >
      {/* Hire actions */}
      <motion.div
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
        variants={FADE_UP}
        transition={{ duration: 0.4, ease: IOS_EASE }}
      >
        <HireAction
          tone="sky"
          icon={UserPlus}
          label={t.hireStaff}
          active={open === "staff"}
          onClick={() => setOpen(open === "staff" ? null : "staff")}
        />
        {session.scope === "general_manager" ? (
          <HireAction
            tone="violet"
            icon={Briefcase}
            label={t.hireManager}
            active={open === "manager"}
            onClick={() => setOpen(open === "manager" ? null : "manager")}
          />
        ) : null}
      </motion.div>

      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.form
            key={open}
            className={cn(
              "overflow-hidden rounded-[24px] border border-white/80 bg-gradient-to-br p-4 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)] sm:p-5",
              TONE_TINT[open === "manager" ? "violet" : "sky"],
            )}
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, y: -6 }}
            transition={EXPAND_SPRING}
            onSubmit={(e) => {
              e.preventDefault();
              if (open === "manager") hireMgr.mutate();
              else hireStaff.mutate();
            }}
          >
            <header className="mb-4 flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-[14px] text-white",
                  TONE_WELL[open === "manager" ? "violet" : "sky"],
                )}
              >
                {open === "manager" ? <Briefcase className="h-4 w-4" strokeWidth={2.2} /> : <Plus className="h-4 w-4" strokeWidth={2.4} />}
              </span>
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold tracking-tight text-zinc-950">
                  {open === "manager" ? t.hireManager : t.hireStaff}
                </h2>
                <p className="text-[12px] text-zinc-500">{departmentLabel(form.staffDepartment)}</p>
              </div>
            </header>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <SoftField
                label={t.firstName}
                value={form.firstName}
                onChange={(v) => setForm({ ...form, firstName: v })}
                required
              />
              <SoftField
                label={t.lastName}
                value={form.lastName}
                onChange={(v) => setForm({ ...form, lastName: v })}
                required
              />
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[12px] font-medium text-zinc-500">{t.department}</span>
                <select
                  className="h-11 w-full rounded-[14px] border-0 bg-white/90 px-3.5 text-[15px] text-zinc-950 outline-none ring-1 ring-zinc-900/5 focus:ring-2 focus:ring-zinc-900/15"
                  value={form.staffDepartment}
                  onChange={(e) => setForm({ ...form, staffDepartment: e.target.value })}
                >
                  {catalog.departments().map((d) => (
                    <option key={d} value={d}>
                      {departmentLabel(d)}
                    </option>
                  ))}
                </select>
              </label>

              {open === "staff" && pinDept ? (
                <SoftField
                  className="sm:col-span-2"
                  label={t.employeeNumber}
                  value={form.employeeNumber}
                  onChange={(v) => setForm({ ...form, employeeNumber: v.replace(/\D/g, "").slice(0, 4) })}
                  placeholder="0000"
                  maxLength={4}
                  mono
                  required
                />
              ) : (
                <>
                  <SoftField
                    className="sm:col-span-2"
                    label={t.email}
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm({ ...form, email: v })}
                    required
                  />
                  <SoftField
                    className="sm:col-span-2"
                    label={t.password}
                    type="password"
                    value={form.password}
                    onChange={(v) => setForm({ ...form, password: v })}
                    minLength={8}
                    required
                  />
                </>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <motion.button
                type="submit"
                disabled={hiring}
                className={cn(
                  "inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold text-white disabled:opacity-40",
                  TONE_GRADIENT[open === "manager" ? "violet" : "sky"],
                )}
                whileTap={reduce || hiring ? undefined : { scale: 0.97 }}
                transition={TAP_SPRING}
              >
                {hiring ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {t.save}
              </motion.button>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-full bg-white/80 px-4 text-[14px] font-semibold text-zinc-600 ring-1 ring-zinc-900/5"
                onClick={() => setOpen(null)}
              >
                {t.cancel}
              </button>
            </div>
          </motion.form>
        ) : null}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-[14px] text-zinc-500" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          …
        </div>
      ) : (
        <>
          {session.scope === "general_manager" ? (
            <PeopleSection
              title={t.hireManager}
              tone="violet"
              icon={Briefcase}
              count={mgrs.length}
              empty={null}
              people={mgrs}
              busy={deactivate.isPending}
              onDeactivate={(id) => deactivate.mutate(id)}
              deactivateLabel={t.deactivate}
            />
          ) : null}

          <PeopleSection
            title={t.employees}
            tone="sky"
            icon={Users}
            count={people.length}
            empty={people.length === 0 ? t.noStaff : null}
            people={people}
            busy={deactivate.isPending}
            onDeactivate={(id) => deactivate.mutate(id)}
            deactivateLabel={t.deactivate}
            showPin
          />
        </>
      )}
    </motion.div>
  );
}

function HireAction({
  tone,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  tone: Tone;
  icon: typeof UserPlus;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-[72px] items-center gap-3.5 rounded-[22px] border border-white/80 bg-gradient-to-br px-4 py-3.5 text-start shadow-[0_10px_28px_-22px_rgba(15,23,42,0.4)]",
        TONE_TINT[tone],
        active && "ring-2 ring-zinc-900/70",
      )}
      whileHover={reduce ? undefined : PRESS_SOFT.whileHover}
      whileTap={reduce ? undefined : PRESS_SOFT.whileTap}
      transition={TAP_SPRING}
    >
      <span className={cn("inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-white", TONE_GRADIENT[tone])}>
        <Icon className="h-5 w-5" strokeWidth={2.1} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-[15px] font-semibold tracking-tight text-zinc-950">{label}</span>
      <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full", TONE_SOFT[tone])}>
        <Plus className={cn("h-4 w-4 transition-transform", active && "rotate-45")} strokeWidth={2.4} aria-hidden />
      </span>
    </motion.button>
  );
}

function SoftField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  maxLength,
  minLength,
  mono,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  mono?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[12px] font-medium text-zinc-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        minLength={minLength}
        className={cn(
          "h-11 w-full rounded-[14px] border-0 bg-white/90 px-3.5 text-[15px] text-zinc-950 outline-none ring-1 ring-zinc-900/5 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900/15",
          mono && "font-mono tracking-[0.28em]",
        )}
      />
    </label>
  );
}

function PeopleSection({
  title,
  tone,
  icon: Icon,
  count,
  empty,
  people,
  busy,
  onDeactivate,
  deactivateLabel,
  showPin,
}: {
  title: string;
  tone: Tone;
  icon: typeof Users;
  count: number;
  empty: string | null;
  people: MemberView[];
  busy: boolean;
  onDeactivate: (id: string) => void;
  deactivateLabel: string;
  showPin?: boolean;
}) {
  const reduce = useReducedMotion();
  if (people.length === 0 && !empty) return null;

  return (
    <motion.section
      className={cn(
        "overflow-hidden rounded-[24px] border border-white/80 bg-gradient-to-br shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)]",
        TONE_TINT[tone],
      )}
      variants={FADE_UP}
      transition={{ duration: 0.45, ease: IOS_EASE }}
    >
      <header className="flex items-center gap-3 border-b border-white/70 px-4 py-3.5 sm:px-5">
        <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-white", TONE_WELL[tone])}>
          <Icon className="h-4 w-4" strokeWidth={2.1} aria-hidden />
        </span>
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-zinc-950">{title}</h2>
        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums", TONE_SOFT[tone])}>{count}</span>
      </header>

      {empty ? (
        <p className="px-5 py-10 text-center text-[14px] text-zinc-500">{empty}</p>
      ) : (
        <motion.ul className="divide-y divide-white/70 px-2 py-2 sm:px-3" initial={reduce ? false : "hidden"} animate="show" variants={STAGGER_PARENT}>
          {people.map((m) => (
            <PersonRow
              key={m.id}
              member={m}
              showPin={showPin}
              busy={busy}
              onDeactivate={() => onDeactivate(m.id)}
              deactivateLabel={deactivateLabel}
            />
          ))}
        </motion.ul>
      )}
    </motion.section>
  );
}

function PersonRow({
  member,
  showPin,
  busy,
  onDeactivate,
  deactivateLabel,
}: {
  member: MemberView;
  showPin?: boolean;
  busy: boolean;
  onDeactivate: () => void;
  deactivateLabel: string;
}) {
  const reduce = useReducedMotion();
  const tone = toneForId(member.id);
  const meta = [
    departmentLabel(member.staffDepartment),
    showPin && member.employeeNumber ? `#${member.employeeNumber}` : null,
    !member.isActive ? "Inactive" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.li
      className="flex items-center gap-3 rounded-[18px] px-2.5 py-3 transition-colors hover:bg-white/60"
      variants={FADE_UP}
      layout
    >
      <span
        className={cn(
          "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-[13px] font-semibold text-white",
          TONE_GRADIENT[tone],
          !member.isActive && "opacity-45 grayscale",
        )}
        aria-hidden
      >
        {personInitials(member.firstName, member.lastName)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold tracking-tight text-zinc-950">{memberDisplayName(member)}</p>
        <p className="mt-0.5 truncate text-[12px] font-medium text-zinc-500">{meta}</p>
      </div>
      <motion.button
        type="button"
        disabled={busy || !member.isActive}
        onClick={onDeactivate}
        className={cn(
          "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold disabled:opacity-35",
          TONE_SOFT.rose,
        )}
        aria-label={deactivateLabel}
        whileTap={reduce || busy ? undefined : { scale: 0.96 }}
        transition={TAP_SPRING}
      >
        <UserMinus className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
        <span className="hidden sm:inline">{deactivateLabel}</span>
      </motion.button>
    </motion.li>
  );
}
