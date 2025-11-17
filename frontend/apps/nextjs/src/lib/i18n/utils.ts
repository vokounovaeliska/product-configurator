import type { Locale } from "next-intl"

import { locales } from "./config"

export const getIsValidLocale = (lang?: string): lang is Locale => {
  return locales.some((l) => l === lang)
}
