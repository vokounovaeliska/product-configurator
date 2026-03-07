"use client"

import { ArrowLeftIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Select } from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

import { useCustomerRequest, useUpdateCustomerRequestStatus } from "../api/customerRequestQueries"

const REQUEST_STATUSES = ["NEW", "IN_PROGRESS", "OFFER_SENT", "CLOSED"] as const
const STATUS_KEYS: Record<
  (typeof REQUEST_STATUSES)[number],
  "status.NEW" | "status.IN_PROGRESS" | "status.OFFER_SENT" | "status.CLOSED"
> = {
  NEW: "status.NEW",
  IN_PROGRESS: "status.IN_PROGRESS",
  OFFER_SENT: "status.OFFER_SENT",
  CLOSED: "status.CLOSED",
}

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

function isConfigEmpty(config: Record<string, unknown> | null): boolean {
  if (!config) return true
  const opts = config.selectedOptionsByComponent as Record<string, unknown> | undefined
  const other = config.selectedOtherValuesByComponent as Record<string, unknown> | undefined
  return (!opts || Object.keys(opts).length === 0) && (!other || Object.keys(other).length === 0)
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
          if (opt && typeof opt === "object" && opt.label) items.push(opt.label)
        }
      }
    }
  }
  if (other) {
    for (const compOther of Object.values(other)) {
      if (compOther && typeof compOther === "object") {
        for (const val of Object.values(compOther)) items.push(String(val))
      }
    }
  }
  return items
}

type Props = {
  id: string
}

export const CustomerRequestDetail = ({ id }: Props) => {
  const t = useTranslations("Setup.customerRequests")
  const { data: request, isLoading, error } = useCustomerRequest(id)
  const updateStatus = useUpdateCustomerRequestStatus()

  const handleStatusChange = (newStatus: string) => {
    if (!request || newStatus === request.status) return
    updateStatus.reset()
    updateStatus.mutate({ id: request.id, status: newStatus })
  }

  if (isLoading) {
    return (
      <div className="flex-1 rounded-2xl bg-muted/50 p-6 md:p-10">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="flex-1 rounded-2xl bg-muted/50 p-6 md:p-10">
        <Typography
          as="p"
          variant="body-md"
          className="text-destructive"
        >
          {error instanceof Error ? error.message : t("errorLoading")}
        </Typography>
      </div>
    )
  }

  const config = request.configurationJson as Record<string, unknown> | null
  const configStr = config != null ? JSON.stringify(config, null, 2) : "—"
  const isConfigEmptyFlag = isConfigEmpty(config)
  const configSummary = config && !isConfigEmptyFlag ? formatConfigSummary(config) : []

  return (
    <div className="flex-1 rounded-2xl bg-muted/50 p-6 md:p-10">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          asChild
        >
          <Link href={ROUTES.setupCustomerRequests}>
            <ArrowLeftIcon className="mr-1.5 size-4" />
            {t("detail.backToList")}
          </Link>
        </Button>
        <Typography
          as="h1"
          variant="display-lg"
          weight="bold"
          className="mb-1"
        >
          {t("detail.title")}
        </Typography>
        <Typography
          as="p"
          variant="body-md"
          className="text-muted-foreground"
        >
          {request.productModelName}
        </Typography>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Typography
                as="p"
                variant="body-sm"
                weight="semibold"
                className="mb-1 text-muted-foreground"
              >
                {t("table.status")}
              </Typography>
              <Select
                value={request.status}
                onValueChange={handleStatusChange}
                disabled={updateStatus.isPending}
              >
                <Select.Trigger className="w-full sm:w-[180px]">
                  <Select.Trigger.Value />
                </Select.Trigger>
                <Select.Content>
                  {REQUEST_STATUSES.map((s) => (
                    <Select.Content.Item
                      key={s}
                      value={s}
                    >
                      {t(STATUS_KEYS[s])}
                    </Select.Content.Item>
                  ))}
                </Select.Content>
              </Select>
              {updateStatus.isError && (
                <Typography
                  as="p"
                  variant="body-sm"
                  className="mt-1 text-destructive"
                >
                  {t("statusUpdateError")}
                </Typography>
              )}
            </div>
            <div>
              <Typography
                as="p"
                variant="body-sm"
                weight="semibold"
                className="mb-1 text-muted-foreground"
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
                className="mb-1 text-muted-foreground"
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
                className="mb-1 text-muted-foreground"
              >
                {t("table.price")}
              </Typography>
              <Typography
                as="p"
                variant="body-md"
                weight="semibold"
              >
                {formatPrice(request.totalPriceCents, request.currency)}
              </Typography>
            </div>
            <div>
              <Typography
                as="p"
                variant="body-sm"
                weight="semibold"
                className="mb-1 text-muted-foreground"
              >
                {t("table.date")}
              </Typography>
              <Typography
                as="p"
                variant="body-md"
              >
                {formatDate(request.createdAt)}
              </Typography>
            </div>
          </div>

          {request.customerNote && (
            <div>
              <Typography
                as="p"
                variant="body-sm"
                weight="semibold"
                className="mb-1.5 text-muted-foreground"
              >
                {t("detail.message")}
              </Typography>
              <Typography
                as="p"
                variant="body-md"
                className="rounded-lg border bg-muted/30 p-4 whitespace-pre-wrap"
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
                className="max-h-96 w-full rounded-lg border bg-muted/30 object-contain sm:max-w-lg"
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
            {isConfigEmptyFlag ? (
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
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
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
      </Card>
    </div>
  )
}
