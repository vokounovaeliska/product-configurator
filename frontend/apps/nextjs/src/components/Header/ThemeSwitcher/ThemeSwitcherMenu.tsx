"use client"

import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { DropdownMenu } from "@workspace/ui/components/dropdown-menu"

import { ThemeSwitcherTriggerButton } from "./ThemeSwitcherTriggerButton"

export const ThemeSwitcherMenu = () => {
  const t = useTranslations("Common.BaseLayout.Header.ThemeSwitcher")
  const { theme, setTheme } = useTheme()
  const options = ["light", "dark", "system"] as const

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <ThemeSwitcherTriggerButton />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Content.Label>{t("label")}</DropdownMenu.Content.Label>
        <DropdownMenu.Content.RadioGroup
          value={theme}
          onValueChange={setTheme}
        >
          {options.map((option) => (
            <DropdownMenu.Content.RadioGroup.Item
              key={option}
              value={option}
            >
              {t(`values.${option}`)}
            </DropdownMenu.Content.RadioGroup.Item>
          ))}
        </DropdownMenu.Content.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}
