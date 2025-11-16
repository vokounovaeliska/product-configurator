/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable @typescript-eslint/consistent-type-imports */
import { locales } from "@/lib/i18n/config"

import messages from "./locales/en.json"

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof locales)[number]
    Messages: typeof messages
  }
}
