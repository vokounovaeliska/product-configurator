import { defineRouting } from "next-intl/routing"

import { DEFAULT_LOCALE, locales } from "./config"

export const routing = defineRouting({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: DEFAULT_LOCALE,

  // Don't prefix default locale
  localePrefix: "as-needed",
})
