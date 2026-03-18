"use client"

import { useState } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

type Props = Omit<React.ComponentProps<typeof Input>, "type">

export const PasswordInput = ({ className, ...props }: Props) => {
  const [isVisible, setIsVisible] = useState(false)
  const t = useTranslations("Common.PasswordInput")

  return (
    <div className="relative">
      <Input
        type={isVisible ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setIsVisible((prev) => !prev)}
        className={cn(
          "absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5",
          "text-muted-foreground hover:bg-muted hover:text-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
        )}
        tabIndex={-1}
        aria-label={isVisible ? t("hidePassword") : t("showPassword")}
      >
        {isVisible ? (
          <EyeOffIcon
            className="size-4"
            aria-hidden
          />
        ) : (
          <EyeIcon
            className="size-4"
            aria-hidden
          />
        )}
      </button>
    </div>
  )
}
