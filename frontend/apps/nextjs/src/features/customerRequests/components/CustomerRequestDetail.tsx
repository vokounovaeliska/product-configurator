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
import { useRequestConfigurationData } from "../hooks/useRequestConfigurationData"
import { RequestConfigurationDisplay } from "./RequestConfigurationDisplay"

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

type Props = {
  id: string
}

export const CustomerRequestDetail = ({ id }: Props) => {
  const t = useTranslations("Setup.customerRequests")
  const { data: request, isLoading, error } = useCustomerRequest(id)
  const updateStatus = useUpdateCustomerRequestStatus()
  const config = request?.configurationJson ?? null
  const configurationData = useRequestConfigurationData(
    config ?? null,
    request?.productModelId ?? null,
  )

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

  const configStr = config != null ? JSON.stringify(config, null, 2) : "—"

  return (
    <div className="min-w-0 flex-1 overflow-x-hidden rounded-2xl bg-muted/50 p-4 sm:p-6 md:p-10">
      <div className="mb-4 md:mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 min-h-10 touch-manipulation md:mb-4"
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

      <Card className="p-4 sm:p-6">
        <div className="space-y-5 sm:space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
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
                {formatPrice(request.totalPrice, request.currency)}
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
            <RequestConfigurationDisplay
              config={config}
              configStr={configStr}
              configurationData={configurationData}
              variant="full"
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
