"use client"

import { useTransition } from "react"
import { GlobeIcon } from "lucide-react"
import { useTranslations, type Locale } from "next-intl"
import { useParams } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { DropdownMenu } from "@workspace/ui/components/dropdown-menu"
import { Icon } from "@workspace/ui/components/icon"

import { usePathname, useRouter } from "@/lib/i18n/navigation"
import { getIsValidLocale } from "@/lib/i18n/utils"
import { raiseError } from "@/lib/utils"

type Props = {
  currentLocale: Locale
  options: { label: string; value: Locale }[]
}

export const LanguageSwitcherMenu = ({ currentLocale, options }: Props) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()
  const params = useParams()

  const t = useTranslations("Common.BaseLayout.Header.LanguageSwitcher")

  const handleLanguageChange = (lang: string) => {
    const validLang = getIsValidLocale(lang) ? lang : raiseError(`${lang} is not a valid locale`)
    startTransition(() => {
      // @ts-expect-error -- TypeScript will validate that only known `params`
      router.replace({ pathname, params }, { locale: validLang })
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 min-h-9 min-w-9 shrink-0 lg:min-h-0 lg:min-w-0"
        >
          <Icon as={GlobeIcon} />
          <span className="sr-only">{t("label")}</span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Content.Label>{t("label")}</DropdownMenu.Content.Label>
        <DropdownMenu.Content.RadioGroup
          value={currentLocale}
          onValueChange={handleLanguageChange}
        >
          {options.map((option) => (
            <DropdownMenu.Content.RadioGroup.Item
              key={option.value}
              value={option.value}
              disabled={isPending}
            >
              {option.label}
            </DropdownMenu.Content.RadioGroup.Item>
          ))}
        </DropdownMenu.Content.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}
