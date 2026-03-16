import { SunIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Icon } from "@workspace/ui/components/icon"
import { cn } from "@workspace/ui/lib/utils"

type Props = React.ComponentProps<"button">

export const ThemeSwitcherTriggerButton = ({ className, ...props }: Props) => {
  const t = useTranslations("Common.BaseLayout.Header.ThemeSwitcher")

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-9 min-h-9 min-w-9 shrink-0 lg:min-h-0 lg:min-w-0", className)}
      {...props}
    >
      <Icon as={SunIcon} />
      <span className="sr-only">{t("label")}</span>
    </Button>
  )
}
