import { getLocale, getTranslations } from "next-intl/server"

import { locales } from "@/lib/i18n/config"

import { LanguageSwitcherMenu } from "./LanguageSwitcherMenu"

const createLanguageSwitcherOptions = async () => {
  const t = await getTranslations("Common.BaseLayout.Header.LanguageSwitcher.values")
  return locales.map((lang) => ({ label: t(lang), value: lang }))
}

export const LanguageSwitcher = async () => {
  const locale = await getLocale()
  const options = await createLanguageSwitcherOptions()

  return (
    <LanguageSwitcherMenu
      currentLocale={locale}
      options={options}
    />
  )
}
