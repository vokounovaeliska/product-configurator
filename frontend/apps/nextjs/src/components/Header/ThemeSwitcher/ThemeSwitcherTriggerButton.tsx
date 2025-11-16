import { SunIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Icon } from "@workspace/ui/components/icon"

type Props = React.ComponentProps<"button">

export const ThemeSwitcherTriggerButton = (props: Props) => {
  const t = useTranslations("Common.BaseLayout.Header.ThemeSwitcher")

  return (
    <Button
      variant="ghost"
      size="icon"
      {...props}
    >
      <Icon as={SunIcon} />
      <span className="sr-only">{t("label")}</span>
    </Button>
  )
}
