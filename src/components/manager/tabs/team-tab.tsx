"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { catalogFor } from "@/domain/catalog";
import { isEmployeePortalDepartment } from "@/domain/staff-scope";
import { personInitials } from "@/domain/session/types";
import type { SessionPayload } from "@/domain/session/types";
import { memberDisplayName } from "@/domain/work/types";
import { IosField, IosGroup, IosLinkButton, IosRow, IosSeparator } from "@/components/ios/ios-settings";
import { departmentLabel } from "@/lib/format";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";
import { ApiError } from "@/infrastructure/http/errors";

export function TeamTab({ session }: { session: SessionPayload }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const wid = session.workspace.id;
  const catalog = catalogFor(session.workspace.kind);
  const staff = useQuery({ queryKey: qk.staff(wid), queryFn: () => kernel.listPersonnel(wid) });
  const managers = useQuery({
    queryKey: qk.managers(wid),
    queryFn: () => kernel.listDepartmentManagers(wid),
    enabled: session.scope === "general_manager",
  });

  const [open, setOpen] = useState<"staff" | "manager" | null>(null);
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

  return (
    <div className="space-y-8">
      <IosGroup>
        <IosLinkButton onClick={() => setOpen("staff")}>{t.hireStaff}</IosLinkButton>
        {session.scope === "general_manager" ? (
          <>
            <IosSeparator inset={false} />
            <IosLinkButton onClick={() => setOpen("manager")}>{t.hireManager}</IosLinkButton>
          </>
        ) : null}
      </IosGroup>

      {open ? (
        <form
          className="space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (open === "manager") hireMgr.mutate();
            else hireStaff.mutate();
          }}
        >
          <IosGroup header={open === "manager" ? t.hireManager : t.hireStaff}>
            <div className="px-4">
              <IosField placeholder={t.firstName} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <IosSeparator inset={false} />
            <div className="px-4">
              <IosField placeholder={t.lastName} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
            <IosSeparator inset={false} />
            <label className="block px-4">
              <select
                className="h-11 w-full bg-transparent text-[17px] text-ios-label outline-none"
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
              <>
                <IosSeparator inset={false} />
                <div className="px-4">
                  <IosField
                    placeholder="0000"
                    maxLength={4}
                    value={form.employeeNumber}
                    onChange={(e) => setForm({ ...form, employeeNumber: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    className="font-mono tracking-[0.3em]"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <IosSeparator inset={false} />
                <div className="px-4">
                  <IosField type="email" placeholder={t.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <IosSeparator inset={false} />
                <div className="px-4">
                  <IosField type="password" placeholder={t.password} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
                </div>
              </>
            )}
          </IosGroup>
          <IosGroup>
            <IosLinkButton type="submit" disabled={hireStaff.isPending || hireMgr.isPending}>
              {t.save}
            </IosLinkButton>
            <IosSeparator inset={false} />
            <IosLinkButton destructive onClick={() => setOpen(null)}>
              {t.cancel}
            </IosLinkButton>
          </IosGroup>
        </form>
      ) : null}

      {session.scope === "general_manager" && mgrs.length > 0 ? (
        <IosGroup header={t.hireManager}>
          {mgrs.map((m, i) => (
            <div key={m.id}>
              {i > 0 ? <IosSeparator /> : null}
              <IosRow
                icon={<Avatar letters={personInitials(m.firstName, m.lastName)} />}
                title={memberDisplayName(m)}
                subtitle={departmentLabel(m.staffDepartment)}
                trailing={
                  <button type="button" className="text-[15px] text-ios-red" onClick={() => deactivate.mutate(m.id)}>
                    {t.deactivate}
                  </button>
                }
              />
            </div>
          ))}
        </IosGroup>
      ) : null}

      <IosGroup header={t.employees} footer={people.length === 0 ? t.noStaff : undefined}>
        {people.map((m, i) => (
          <div key={m.id}>
            {i > 0 ? <IosSeparator /> : null}
            <IosRow
              icon={<Avatar letters={personInitials(m.firstName, m.lastName)} />}
              title={memberDisplayName(m)}
              subtitle={`${departmentLabel(m.staffDepartment)}${m.employeeNumber ? ` · #${m.employeeNumber}` : ""}`}
              trailing={
                <button type="button" className="text-[15px] text-ios-red" onClick={() => deactivate.mutate(m.id)}>
                  {t.deactivate}
                </button>
              }
            />
          </div>
        ))}
      </IosGroup>
    </div>
  );
}

function Avatar({ letters }: { letters: string }) {
  return (
    <span className="inline-flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-full bg-[#c7c7cc] text-[11px] font-semibold text-white">
      {letters}
    </span>
  );
}
