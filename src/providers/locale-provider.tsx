"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isStaffLocale, localeDir, messages, type Messages, type StaffLocale } from "@/lib/i18n";

const KEY = "duaos_locale";

interface LocaleContextValue {
  locale: StaffLocale;
  dir: "ltr" | "rtl";
  t: Messages;
  setLocale: (locale: StaffLocale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<StaffLocale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    if (stored && isStaffLocale(stored)) setLocaleState(stored);
  }, []);

  const setLocale = useCallback((next: StaffLocale) => {
    setLocaleState(next);
    window.localStorage.setItem(KEY, next);
    document.documentElement.lang = next;
    document.documentElement.dir = localeDir(next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, dir: localeDir(locale), t: messages(locale), setLocale }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
