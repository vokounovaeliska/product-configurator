"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Card } from "@workspace/ui/components/card"
import { Dialog } from "@workspace/ui/components/dialog"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

import { useCustomerRequestsList } from "../api/customerRequestQueries"
import type { CustomerRequestDto } from "../api/customerRequestQueries"

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export const CustomerRequestsList = () => {
  const t = useTranslations("Setup.customerRequests")
  const { data: requests, isLoading, error } = useCustomerRequestsList({ limit: 50 })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = requests?.find((r) => r.id === selectedId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <Typography
          as="p"
          variant="body-md"
          className="text-destructive"
        >
          {error instanceof Error ? error.message : t("errorLoading")}
        </Typography>
      </Card>
    )
  }

  if (!requests || requests.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Typography
          as="p"
          variant="body-md"
          className="text-muted-foreground"
        >
          {t("emptyState")}
        </Typography>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {requests.map((req) => (
          <Card
            key={req.id}
            className="cursor-pointer p-4 transition-colors hover:bg-muted/50"
            onClick={() => setSelectedId(req.id)}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Typography
                  as="p"
                  variant="body-lg"
                  weight="semibold"
                  className="truncate"
                >
                  {req.productModelName}
                </Typography>
                <Typography
                  as="p"
                  variant="body-sm"
                  className="text-muted-foreground"
                >
                  {req.customerName ?? req.customerEmail} · {req.customerEmail}
                </Typography>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <Typography
                  as="span"
                  variant="body-md"
                  weight="semibold"
                  className="tabular-nums"
                >
                  {formatPrice(req.totalPriceCents, req.currency)}
                </Typography>
                <Typography
                  as="span"
                  variant="body-sm"
                  className="text-muted-foreground"
                >
                  {formatDate(req.createdAt)}
                </Typography>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <CustomerRequestDetailDialog
        request={selected}
        isOpen={selectedId != null}
        onOpenChange={(isOpen) => !isOpen && setSelectedId(null)}
      />
    </>
  )
}

type CustomerRequestDetailDialogProps = {
  request: CustomerRequestDto | undefined
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

function isConfigEmpty(config: Record<string, unknown> | null): boolean {
  if (!config) return true
  const opts = config.selectedOptionsByComponent as Record<string, unknown> | undefined
  const other = config.selectedOtherValuesByComponent as Record<string, unknown> | undefined
  const isOptsEmpty = !opts || Object.keys(opts).length === 0
  const isOtherEmpty = !other || Object.keys(other).length === 0
  return isOptsEmpty && isOtherEmpty
}

function formatConfigSummary(config: Record<string, unknown>): string[] {
  const items: string[] = []
  const opts = config.selectedOptionsByComponent as
    | Record<string, Record<string, { label?: string; value?: string } | null>>
    | undefined
  const other = config.selectedOtherValuesByComponent as
    | Record<string, Record<string, number | boolean>>
    | undefined

  if (opts) {
    for (const compOpts of Object.values(opts)) {
      if (compOpts && typeof compOpts === "object") {
        for (const opt of Object.values(compOpts)) {
          if (opt && typeof opt === "object" && opt.label) {
            items.push(opt.label)
          }
        }
      }
    }
  }
  if (other) {
    for (const compOther of Object.values(other)) {
      if (compOther && typeof compOther === "object") {
        for (const val of Object.values(compOther)) {
          items.push(String(val))
        }
      }
    }
  }
  return items
}

const CustomerRequestDetailDialog = ({
  request,
  isOpen,
  onOpenChange,
}: CustomerRequestDetailDialogProps) => {
  const t = useTranslations("Setup.customerRequests")

  if (!request) return null

  const config = request.configurationJson as Record<string, unknown> | null
  const configStr = config != null ? JSON.stringify(config, null, 2) : "—"
  const isConfigEmptyFlag = isConfigEmpty(config)
  const configSummary = config && !isConfigEmptyFlag ? formatConfigSummary(config) : []

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <Dialog.Content className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <Dialog.Content.Header>
          <Dialog.Content.Header.Title>{t("detail.title")}</Dialog.Content.Header.Title>
        </Dialog.Content.Header>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Typography
                as="p"
                variant="body-sm"
                weight="semibold"
                className="text-muted-foreground"
              >
                {t("table.product")}
              </Typography>
              <Typography
                as="p"
                variant="body-md"
              >
                {request.productModelName?.trim() ||
                  (request.productModelId ? `#${request.productModelId.slice(0, 8)}` : "—")}
              </Typography>
            </div>
            <div>
              <Typography
                as="p"
                variant="body-sm"
                weight="semibold"
                className="text-muted-foreground"
              >
                {t("table.customer")}
              </Typography>
              <Typography
                as="p"
                variant="body-md"
              >
                {request.customerName ?? "—"}
              </Typography>
            </div>
            <div>
              <Typography
                as="p"
                variant="body-sm"
                weight="semibold"
                className="text-muted-foreground"
              >
                {t("table.email")}
              </Typography>
              <Typography
                as="p"
                variant="body-md"
              >
                <a
                  href={`mailto:${request.customerEmail}`}
                  className="text-primary hover:underline"
                >
                  {request.customerEmail}
                </a>
              </Typography>
            </div>
            <div>
              <Typography
                as="p"
                variant="body-sm"
                weight="semibold"
                className="text-muted-foreground"
              >
                {t("table.price")}
              </Typography>
              <Typography
                as="p"
                variant="body-md"
              >
                {formatPrice(request.totalPriceCents, request.currency)}
              </Typography>
            </div>
          </div>

          {request.customerNote && (
            <div>
              <Typography
                as="p"
                variant="body-sm"
                weight="semibold"
                className="mb-1 text-muted-foreground"
              >
                {t("detail.message")}
              </Typography>
              <Typography
                as="p"
                variant="body-md"
                className="rounded-lg border bg-muted/30 p-3 whitespace-pre-wrap"
              >
                {request.customerNote}
              </Typography>
            </div>
          )}

          {request.snapshotImageBase64 && (
            <div>
              <Typography
                as="p"
                variant="body-sm"
                weight="semibold"
                className="mb-2 text-muted-foreground"
              >
                {t("detail.snapshot")}
              </Typography>
              <Image
                src={request.snapshotImageBase64}
                alt="Configuration snapshot"
                width={800}
                height={384}
                className="max-h-96 w-full rounded-lg border bg-muted/30 object-contain"
                unoptimized
              />
            </div>
          )}

          <div>
            <Typography
              as="p"
              variant="body-sm"
              weight="semibold"
              className="mb-2 text-muted-foreground"
            >
              {t("detail.configuration")}
            </Typography>
            {configEmpty ? (
              <Typography
                as="p"
                variant="body-md"
                className="rounded-lg border border-dashed bg-muted/20 p-4 text-muted-foreground"
              >
                {t("detail.configurationEmpty")}
              </Typography>
            ) : configSummary.length > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {configSummary.map((item, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-primary/10 px-2 py-1 text-sm text-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <details className="group">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    {t("detail.rawJson")}
                  </summary>
                  <pre className="mt-2 max-h-32 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
                    {configStr}
                  </pre>
                </details>
              </div>
            ) : (
              <pre className="max-h-48 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
                {configStr}
              </pre>
            )}
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
