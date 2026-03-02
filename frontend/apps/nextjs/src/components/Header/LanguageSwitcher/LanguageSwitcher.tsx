"use client"

import { useLocale, useTranslations } from "next-intl"

import { locales, type Locale } from "@/lib/i18n/config"

import { LanguageSwitcherMenu } from "./LanguageSwitcherMenu"

export const LanguageSwitcher = () => {
  const locale = useLocale()
  const t = useTranslations("Common.BaseLayout.Header.LanguageSwitcher.values")
  const options: { label: string; value: Locale }[] = locales.map((lang) => ({
    label: t(lang),
    value: lang,
  }))

  return (
    <LanguageSwitcherMenu
      currentLocale={locale}
      options={options}
    />
  )
}
