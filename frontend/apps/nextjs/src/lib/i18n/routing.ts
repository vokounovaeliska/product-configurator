import { defineRouting } from "next-intl/routing"

import { DEFAULT_LOCALE, locales } from "./config"

export const routing = defineRouting({
  locales,

  defaultLocale: DEFAULT_LOCALE,

  localePrefix: "always",
})
