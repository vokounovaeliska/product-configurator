export const locales = ["en", "cs"] as const
export type Locale = (typeof locales)[number]
export const DEFAULT_LOCALE = "en" satisfies Locale
