"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

const STORAGE_KEY = "howItWorksExpanded"

type HowItWorksSectionProps = {
  title: string
  description: string
  showStepsLabel?: string
  hideStepsLabel?: string
  children: React.ReactNode
  className?: string
  isCentered?: boolean
  /** When false, section is always expanded with no toggle. Default true. */
  isCollapsible?: boolean
}

export const HowItWorksSection = ({
  title,
  description,
  showStepsLabel = "Show steps",
  hideStepsLabel = "Hide steps",
  children,
  className,
  isCentered = false,
  isCollapsible = true,
}: HowItWorksSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    if (!isCollapsible) return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        setIsExpanded(stored === "true")
      }
    } catch {
      // localStorage may be unavailable
    }
  }, [isCollapsible])

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => {
      const willExpand = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(willExpand))
      } catch {
        // ignore
      }
      return willExpand
    })
  }, [])

  const headerContent = (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-0.5 text-left",
        isCentered && "sm:items-center sm:text-center",
      )}
    >
      <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
      <p className="text-xs text-muted-foreground sm:text-sm">{description}</p>
    </div>
  )

  const isContentVisible = isCollapsible ? isExpanded : true

  return (
    <section
      className={cn(
        "w-full rounded-xl border border-border bg-card/50 p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4",
        className,
      )}
    >
      {isCollapsible ? (
        <button
          type="button"
          onClick={handleToggle}
          className="flex w-full flex-row items-center justify-between gap-3 rounded-lg py-2 transition-colors hover:bg-muted/50"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? hideStepsLabel : showStepsLabel}
        >
          {headerContent}
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform"
            aria-hidden
          >
            {isExpanded ? (
              <ChevronUpIcon className="size-5" />
            ) : (
              <ChevronDownIcon className="size-5" />
            )}
          </span>
        </button>
      ) : (
        <div className="py-2">{headerContent}</div>
      )}

      {isContentVisible && (
        <div
          className={cn(
            "mt-4 sm:mt-6",
            isCollapsible && "animate-in duration-300 fade-in slide-in-from-top-2",
          )}
        >
          {children}
        </div>
      )}
    </section>
  )
}
