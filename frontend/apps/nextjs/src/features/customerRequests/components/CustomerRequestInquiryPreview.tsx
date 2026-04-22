"use client"

import { useMemo } from "react"
import { ImageIcon } from "lucide-react"
import Image from "next/image"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import { formatConfigSummary } from "../utils/requestConfigDisplay"

const SUMMARY_JOIN = " · "
const SUMMARY_MAX_CHARS = 160
const SUMMARY_MAX_ITEMS = 5

function buildSummaryText(config: Record<string, unknown> | null): string {
  const parts = formatConfigSummary(config)
  if (parts.length === 0) return ""
  let joined = parts.slice(0, SUMMARY_MAX_ITEMS).join(SUMMARY_JOIN)
  if (joined.length > SUMMARY_MAX_CHARS) {
    joined = `${joined.slice(0, SUMMARY_MAX_CHARS)}…`
  }
  return joined
}

type SummaryProps = {
  config: Record<string, unknown> | null
  className?: string

  lineClamp?: 1 | 2 | 3
}

export function CustomerRequestSummaryText({ config, className, lineClamp = 2 }: SummaryProps) {
  const text = useMemo(() => buildSummaryText(config), [config])
  if (!text.trim()) return null
  return (
    <Typography
      as="p"
      variant="body-sm"
      title={text}
      className={cn(
        "text-muted-foreground",
        lineClamp === 1 && "line-clamp-1",
        lineClamp === 2 && "line-clamp-2",
        lineClamp === 3 && "line-clamp-3",
        className,
      )}
    >
      {text}
    </Typography>
  )
}

type ThumbnailProps = {
  snapshotImageBase64: string | null
  alt: string
  noPreviewLabel: string
  size?: "sm" | "md"
  className?: string
}

export function CustomerRequestThumbnail({
  snapshotImageBase64,
  alt,
  noPreviewLabel,
  size = "sm",
  className,
}: ThumbnailProps) {
  const dim = size === "sm" ? "size-14" : "size-24"
  if (snapshotImageBase64) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-lg border bg-background",
          dim,
          className,
        )}
      >
        <Image
          src={snapshotImageBase64}
          alt={alt}
          fill
          className="object-cover"
          sizes={size === "sm" ? "56px" : "96px"}
          unoptimized
        />
      </div>
    )
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-muted-foreground",
        dim,
        className,
      )}
      role="img"
      aria-label={noPreviewLabel}
    >
      <ImageIcon
        className={size === "sm" ? "size-5" : "size-8"}
        aria-hidden
      />
    </div>
  )
}

type ChipsProps = {
  config: Record<string, unknown> | null
  className?: string
}

export function CustomerRequestSummaryChips({ config, className }: ChipsProps) {
  const parts = useMemo(() => formatConfigSummary(config), [config])
  if (parts.length === 0) return null
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {parts.slice(0, 12).map((text, i) => (
        <span
          key={`${i}-${text.slice(0, 24)}`}
          className="inline-flex max-w-full items-center rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-foreground"
        >
          <span className="truncate">{text}</span>
        </span>
      ))}
    </div>
  )
}
