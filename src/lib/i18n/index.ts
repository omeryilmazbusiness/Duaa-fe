import { ar } from "./locales/ar";
import { en, type Messages } from "./locales/en";
import { tr } from "./locales/tr";

export type StaffLocale = "en" | "tr" | "ar";

export const LOCALES: readonly StaffLocale[] = ["en", "tr", "ar"];

const DICTS: Record<StaffLocale, Messages> = { en, tr, ar };

export function isStaffLocale(value: string): value is StaffLocale {
  return LOCALES.includes(value as StaffLocale);
}

export function messages(locale: StaffLocale): Messages {
  return DICTS[locale];
}

export function localeDir(locale: StaffLocale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function localeNameKey(locale: StaffLocale): "localeEnglish" | "localeTurkish" | "localeArabic" {
  if (locale === "tr") return "localeTurkish";
  if (locale === "ar") return "localeArabic";
  return "localeEnglish";
}

export type { Messages };
