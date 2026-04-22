"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronDownIcon, ExternalLinkIcon, SearchIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Select } from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

import {
  useCustomerRequestProductModels,
  useCustomerRequestsInfiniteList,
  useUpdateCustomerRequestStatus,
} from "../api/customerRequestQueries"
import type { CustomerRequestDto } from "../api/customerRequestQueries"
import { useRequestConfigurationData } from "../hooks/useRequestConfigurationData"
import { customerRequestStatusBadgeClasses } from "../utils/customerRequestStatusStyles"
import { CustomerRequestDeleteControl } from "./CustomerRequestDeleteControl"
import {
  CustomerRequestSummaryText,
  CustomerRequestThumbnail,
} from "./CustomerRequestInquiryPreview"
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

function matchesSearch(req: CustomerRequestDto, query: string): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase().trim()
  const name = (req.customerName ?? "").toLowerCase()
  const email = req.customerEmail.toLowerCase()
  const product = req.productModelName.toLowerCase()
  const note = (req.customerNote ?? "").toLowerCase()
  return name.includes(q) || email.includes(q) || product.includes(q) || note.includes(q)
}

const MESSAGE_PREVIEW_LENGTH = 60

function truncateMessage(text: string | null): string {
  if (!text?.trim()) return ""
  const trimmed = text.trim()
  if (trimmed.length <= MESSAGE_PREVIEW_LENGTH) return trimmed
  return `${trimmed.slice(0, MESSAGE_PREVIEW_LENGTH)}…`
}

type RequestsListPaginationBarProps = {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  loadedCount: number
  t: ReturnType<typeof useTranslations<"Setup.customerRequests">>
}

function RequestsListPaginationBar({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  loadedCount,
  t,
}: RequestsListPaginationBarProps) {
  return (
    <div className="flex flex-col items-center gap-2 pt-4">
      {hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          className="min-w-[200px]"
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          {isFetchingNextPage ? t("loadingMore") : t("loadMore")}
        </Button>
      ) : (
        loadedCount > 0 && (
          <Typography
            as="p"
            variant="body-sm"
            className="text-muted-foreground"
          >
            {t("allLoaded")}
          </Typography>
        )
      )}
    </div>
  )
}

export const CustomerRequestsList = () => {
  const t = useTranslations("Setup.customerRequests")
  const [productFilter, setProductFilter] = useState<string>("all")
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")
  const { data: productModels } = useCustomerRequestProductModels(100)
  const {
    data: requestsInfinite,
    isPending,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
  } = useCustomerRequestsInfiniteList({
    pageSize: 40,
    productModelId: productFilter === "all" ? null : productFilter,
    fromDate: fromDate || null,
    toDate: toDate || null,
  })
  const requests = useMemo(
    () => requestsInfinite?.pages.flatMap((p) => p) ?? [],
    [requestsInfinite?.pages],
  )
  const isFilterRefetching = isFetching && !isFetchingNextPage
  const updateStatus = useUpdateCustomerRequestStatus()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    productFilter !== "all" ||
    fromDate !== "" ||
    toDate !== ""

  useEffect(() => {
    if (productFilter === "all") return
    const items = productModels?.items
    if (items === undefined) return
    if (!items.some((pm) => pm.id === productFilter)) {
      setProductFilter("all")
    }
  }, [productModels?.items, productFilter])

  const handleClearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setProductFilter("all")
    setFromDate("")
    setToDate("")
  }

  const handleToggleExpand = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  const handleRequestDeleted = useCallback((deletedId: string) => {
    setSelectedId((prev) => (prev === deletedId ? null : prev))
  }, [])

  const handleStatusChange = (id: string, newStatus: string) => {
    const req = requests.find((r) => r.id === id)
    if (!req || req.status === newStatus) return
    updateStatus.reset()
    updateStatus.mutate({ id, status: newStatus })
  }

  const filteredRequests = useMemo(() => {
    if (!requests) return []
    return requests.filter((req) => {
      if (!matchesSearch(req, searchQuery)) return false
      if (statusFilter !== "all" && req.status !== statusFilter) return false
      return true
    })
  }, [requests, searchQuery, statusFilter])

  const isServerListEmpty = requests.length === 0

  if (isPending && requestsInfinite === undefined) {
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

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="relative min-w-[200px] flex-1">
            <SearchIcon
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label={t("searchPlaceholder")}
            />
          </div>
          <div className="flex flex-col gap-2 sm:w-[180px]">
            <label
              htmlFor="filter-product"
              className="text-sm font-medium text-muted-foreground"
            >
              {t("listHeaders.product")}
            </label>
            <Select
              value={productFilter}
              onValueChange={setProductFilter}
            >
              <Select.Trigger
                id="filter-product"
                className="w-full"
              >
                <Select.Trigger.Value placeholder={t("filterProductAll")} />
              </Select.Trigger>
              <Select.Content>
                <Select.Content.Item value="all">{t("filterProductAll")}</Select.Content.Item>
                {(productModels?.items ?? []).map((pm) => (
                  <Select.Content.Item
                    key={pm.id}
                    value={pm.id}
                    className="max-w-[300px] truncate"
                  >
                    {pm.name}
                  </Select.Content.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <div className="flex flex-col gap-2 sm:w-[140px]">
            <label
              htmlFor="filter-from-date"
              className="text-sm font-medium text-muted-foreground"
            >
              {t("filterFromDate")}
            </label>
            <Input
              id="filter-from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label={t("filterFromDate")}
            />
          </div>
          <div className="flex flex-col gap-2 sm:w-[140px]">
            <label
              htmlFor="filter-to-date"
              className="text-sm font-medium text-muted-foreground"
            >
              {t("filterToDate")}
            </label>
            <Input
              id="filter-to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              aria-label={t("filterToDate")}
            />
          </div>
          <div className="flex flex-col gap-2 sm:w-[180px]">
            <label
              htmlFor="filter-status"
              className="text-sm font-medium text-muted-foreground"
            >
              {t("listHeaders.status")}
            </label>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <Select.Trigger id="filter-status">
                <Select.Trigger.Value placeholder={t("filterStatusAll")} />
              </Select.Trigger>
              <Select.Content>
                <Select.Content.Item value="all">{t("filterStatusAll")}</Select.Content.Item>
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
          </div>
          <div className="sm:ml-auto">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              {t("clearFilters")}
            </Button>
          </div>
        </div>
      </div>

      {isServerListEmpty ? (
        <Card className="p-10 text-center">
          <Typography
            as="p"
            variant="body-md"
            className="text-muted-foreground"
          >
            {hasActiveFilters ? t("noMatchingResults") : t("emptyState")}
          </Typography>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <>
          <Card className="p-10 text-center">
            <Typography
              as="p"
              variant="body-md"
              className="text-muted-foreground"
            >
              {t("noMatchingResults")}
            </Typography>
          </Card>
          <RequestsListPaginationBar
            hasNextPage={Boolean(hasNextPage)}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            loadedCount={requests.length}
            t={t}
          />
        </>
      ) : (
        <>
          {/* Mobile: card list */}
          <div
            className={cn(
              "space-y-3 transition-opacity md:hidden",
              isFilterRefetching && "opacity-60",
            )}
            aria-busy={isFilterRefetching}
          >
            {filteredRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                isExpanded={selectedId === req.id}
                onToggle={() => handleToggleExpand(req.id)}
                onStatusChange={(newStatus) => handleStatusChange(req.id, newStatus)}
                onRequestDeleted={handleRequestDeleted}
                isStatusUpdating={updateStatus.isPending}
                t={t}
              />
            ))}
          </div>

          {/* Desktop: table */}
          <Card
            className={cn("hidden transition-opacity md:block", isFilterRefetching && "opacity-60")}
            aria-busy={isFilterRefetching}
          >
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th
                      className="h-12 w-[72px] px-3 py-3 text-left align-middle font-semibold text-muted-foreground"
                      scope="col"
                    >
                      {t("listHeaders.preview")}
                    </th>
                    <th
                      className="h-12 px-4 py-3 text-left align-middle font-semibold text-muted-foreground"
                      scope="col"
                    >
                      {t("listHeaders.product")}
                    </th>
                    <th
                      className="h-12 px-4 py-3 text-left align-middle font-semibold text-muted-foreground"
                      scope="col"
                    >
                      {t("listHeaders.customer")}
                    </th>
                    <th
                      className="hidden h-12 px-4 py-3 text-left align-middle font-semibold text-muted-foreground md:table-cell"
                      scope="col"
                    >
                      {t("listHeaders.email")}
                    </th>
                    <th
                      className="hidden h-12 max-w-[220px] min-w-[140px] px-4 py-3 text-left align-middle font-semibold text-muted-foreground lg:table-cell"
                      scope="col"
                    >
                      {t("listHeaders.message")}
                    </th>
                    <th
                      className="hidden h-12 px-4 py-3 text-left align-middle font-semibold text-muted-foreground xl:table-cell"
                      scope="col"
                    >
                      {t("listHeaders.date")}
                    </th>
                    <th
                      className="h-12 px-4 py-3 text-right align-middle font-semibold text-muted-foreground"
                      scope="col"
                    >
                      {t("listHeaders.price")}
                    </th>
                    <th
                      className="h-12 w-[140px] px-4 py-3 text-left align-middle font-semibold text-muted-foreground"
                      scope="col"
                    >
                      {t("listHeaders.status")}
                    </th>
                    <th
                      className="h-12 w-12 px-2 py-3 text-center align-middle font-semibold text-muted-foreground"
                      scope="col"
                    >
                      <span className="sr-only">{t("listHeaders.actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => {
                    const isExpanded = selectedId === req.id
                    return (
                      <RequestRow
                        key={req.id}
                        request={req}
                        isExpanded={isExpanded}
                        onToggle={() => handleToggleExpand(req.id)}
                        onStatusChange={(newStatus) => handleStatusChange(req.id, newStatus)}
                        onRequestDeleted={handleRequestDeleted}
                        isStatusUpdating={updateStatus.isPending}
                        t={t}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <RequestsListPaginationBar
            hasNextPage={Boolean(hasNextPage)}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            loadedCount={requests.length}
            t={t}
          />
          {updateStatus.isError && (
            <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2">
              <Typography
                as="p"
                variant="body-sm"
                className="text-destructive"
              >
                {t("statusUpdateError")}
              </Typography>
            </div>
          )}
        </>
      )}
    </>
  )
}

type RequestCardProps = {
  request: CustomerRequestDto
  isExpanded: boolean
  onToggle: () => void
  onStatusChange: (newStatus: string) => void
  onRequestDeleted: (id: string) => void
  isStatusUpdating: boolean
  t: ReturnType<typeof useTranslations<"Setup.customerRequests">>
}

const RequestCard = ({
  request: req,
  isExpanded,
  onToggle,
  onStatusChange,
  onRequestDeleted,
  isStatusUpdating,
  t,
}: RequestCardProps) => {
  const config = req.configurationJson as Record<string, unknown> | null
  const configStr = config != null ? JSON.stringify(config, null, 2) : "—"
  const configurationData = useRequestConfigurationData(config, req.productModelId, {
    enabled: isExpanded,
  })

  return (
    <Card
      className={cn("overflow-hidden transition-colors", isExpanded && "ring-2 ring-primary/30")}
    >
      <div className="flex gap-3 p-4">
        <Link
          href={ROUTES.setupCustomerRequestDetail(req.id)}
          className="shrink-0 self-start pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <CustomerRequestThumbnail
            snapshotImageBase64={req.snapshotImageBase64}
            alt={t("previewAlt", { product: req.productModelName })}
            noPreviewLabel={t("noPreview")}
            size="md"
          />
        </Link>
        <div className="flex min-w-0 flex-1 items-start gap-1">
          <div
            role="button"
            tabIndex={0}
            className="flex min-w-0 flex-1 cursor-pointer flex-col gap-2 text-left"
            onClick={onToggle}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onToggle()
              }
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <Typography
                as="span"
                variant="body-md"
                weight="medium"
                className="line-clamp-2 min-w-0 flex-1"
              >
                {req.productModelName}
              </Typography>
              <Typography
                as="span"
                variant="body-md"
                weight="semibold"
                className="shrink-0 tabular-nums"
              >
                {formatPrice(req.totalPrice, req.currency)}
              </Typography>
            </div>
            <CustomerRequestSummaryText config={config} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Typography
                as="span"
                variant="body-sm"
                className="text-muted-foreground"
              >
                {req.customerName ?? req.customerEmail}
              </Typography>
              <Select
                value={req.status}
                onValueChange={onStatusChange}
                disabled={isStatusUpdating}
              >
                <Select.Trigger
                  className={cn(
                    "h-8 min-w-[90px] border-0 bg-transparent shadow-none hover:bg-muted/50",
                    customerRequestStatusBadgeClasses(req.status),
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Select.Trigger.Value />
                </Select.Trigger>
                <Select.Content align="start">
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
            </div>
            <ChevronDownIcon
              className={cn(
                "size-4 shrink-0 self-center text-muted-foreground transition-transform",
                isExpanded && "rotate-180",
              )}
            />
          </div>
          <CustomerRequestDeleteControl
            variant="icon"
            requestId={req.id}
            onDeleted={() => onRequestDeleted(req.id)}
            className="self-start"
          />
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-border bg-muted/20 px-4 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Typography
                as="h3"
                variant="body-lg"
                weight="semibold"
              >
                {t("detail.title")}
              </Typography>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link href={ROUTES.setupCustomerRequestDetail(req.id)}>
                  <ExternalLinkIcon className="mr-1.5 size-3.5" />
                  {t("detail.openFullPage")}
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
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
                  {req.customerName ?? "—"}
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
                    href={`mailto:${req.customerEmail}`}
                    className="text-primary hover:underline"
                  >
                    {req.customerEmail}
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
                  {formatPrice(req.totalPrice, req.currency)}
                </Typography>
              </div>
              <div>
                <Typography
                  as="p"
                  variant="body-sm"
                  weight="semibold"
                  className="text-muted-foreground"
                >
                  {t("table.date")}
                </Typography>
                <Typography
                  as="p"
                  variant="body-md"
                >
                  {formatDate(req.createdAt)}
                </Typography>
              </div>
            </div>

            {req.customerNote && (
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
                  className="rounded-lg border bg-background p-3 whitespace-pre-wrap"
                >
                  {req.customerNote}
                </Typography>
              </div>
            )}

            {req.snapshotImageBase64 && (
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
                  src={req.snapshotImageBase64}
                  alt="Configuration snapshot"
                  width={800}
                  height={384}
                  className="max-h-72 w-full rounded-lg border bg-background object-contain"
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
                variant="compact"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

type RequestRowProps = {
  request: CustomerRequestDto
  isExpanded: boolean
  onToggle: () => void
  onStatusChange: (newStatus: string) => void
  onRequestDeleted: (id: string) => void
  isStatusUpdating: boolean
  t: ReturnType<typeof useTranslations<"Setup.customerRequests">>
}

const RequestRow = ({
  request: req,
  isExpanded,
  onToggle,
  onStatusChange,
  onRequestDeleted,
  isStatusUpdating,
  t,
}: RequestRowProps) => {
  const config = req.configurationJson as Record<string, unknown> | null
  const configStr = config != null ? JSON.stringify(config, null, 2) : "—"
  const configurationData = useRequestConfigurationData(config, req.productModelId, {
    enabled: isExpanded,
  })
  const colCount = 9

  return (
    <>
      <tr
        className={cn(
          "cursor-pointer border-b border-border transition-colors hover:bg-muted/40",
          isExpanded && "bg-muted/30",
          !isExpanded && "last:border-0",
        )}
        onClick={onToggle}
      >
        <td
          className="px-3 py-3 align-middle"
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            href={ROUTES.setupCustomerRequestDetail(req.id)}
            className="inline-block"
          >
            <CustomerRequestThumbnail
              snapshotImageBase64={req.snapshotImageBase64}
              alt={t("previewAlt", { product: req.productModelName })}
              noPreviewLabel={t("noPreview")}
            />
          </Link>
        </td>
        <td className="max-w-[min(100vw,280px)] px-4 py-3 align-middle">
          <div className="space-y-1">
            <Link
              href={ROUTES.setupCustomerRequestDetail(req.id)}
              className="text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Typography
                as="span"
                variant="body-md"
                weight="medium"
                className="line-clamp-2"
              >
                {req.productModelName}
              </Typography>
            </Link>
            <CustomerRequestSummaryText
              config={config}
              lineClamp={2}
            />
          </div>
        </td>
        <td className="px-4 py-3 align-middle">
          <Typography
            as="span"
            variant="body-md"
            className="text-foreground"
          >
            {req.customerName ?? req.customerEmail}
          </Typography>
        </td>
        <td className="hidden px-4 py-3 align-middle md:table-cell">
          <a
            href={`mailto:${req.customerEmail}`}
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {req.customerEmail}
          </a>
        </td>
        <td className="hidden px-4 py-3 align-middle lg:table-cell">
          <Typography
            as="span"
            variant="body-sm"
            className="line-clamp-2 text-muted-foreground"
            title={req.customerNote ?? undefined}
          >
            {truncateMessage(req.customerNote) || t("noMessage")}
          </Typography>
        </td>
        <td className="hidden px-4 py-3 align-middle text-sm text-muted-foreground tabular-nums xl:table-cell">
          {formatDate(req.createdAt)}
        </td>
        <td className="px-4 py-3 text-right align-middle">
          <Typography
            as="span"
            variant="body-md"
            weight="semibold"
            className="tabular-nums"
          >
            {formatPrice(req.totalPrice, req.currency)}
          </Typography>
        </td>
        <td
          className="px-4 py-3 align-middle"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <Select
              value={req.status}
              onValueChange={onStatusChange}
              disabled={isStatusUpdating}
            >
              <Select.Trigger
                className={cn(
                  "h-8 min-w-[100px] border-0 bg-transparent shadow-none hover:bg-muted/50",
                  customerRequestStatusBadgeClasses(req.status),
                )}
              >
                <Select.Trigger.Value />
              </Select.Trigger>
              <Select.Content align="start">
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
            <ChevronDownIcon
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                isExpanded && "rotate-180",
              )}
            />
          </div>
        </td>
        <td
          className="px-2 py-3 align-middle"
          onClick={(e) => e.stopPropagation()}
        >
          <CustomerRequestDeleteControl
            variant="icon"
            requestId={req.id}
            onDeleted={() => onRequestDeleted(req.id)}
          />
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-border last:border-0">
          <td
            colSpan={colCount}
            className="bg-muted/20 px-6 py-5"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <Typography
                  as="h3"
                  variant="body-lg"
                  weight="semibold"
                >
                  {t("detail.title")}
                </Typography>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={ROUTES.setupCustomerRequestDetail(req.id)}>
                    <ExternalLinkIcon className="mr-1.5 size-3.5" />
                    {t("detail.openFullPage")}
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    {req.customerName ?? "—"}
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
                      href={`mailto:${req.customerEmail}`}
                      className="text-primary hover:underline"
                    >
                      {req.customerEmail}
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
                    {formatPrice(req.totalPrice, req.currency)}
                  </Typography>
                </div>
                <div>
                  <Typography
                    as="p"
                    variant="body-sm"
                    weight="semibold"
                    className="text-muted-foreground"
                  >
                    {t("table.date")}
                  </Typography>
                  <Typography
                    as="p"
                    variant="body-md"
                  >
                    {formatDate(req.createdAt)}
                  </Typography>
                </div>
              </div>

              {req.customerNote && (
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
                    className="rounded-lg border bg-background p-3 whitespace-pre-wrap"
                  >
                    {req.customerNote}
                  </Typography>
                </div>
              )}

              {req.snapshotImageBase64 && (
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
                    src={req.snapshotImageBase64}
                    alt="Configuration snapshot"
                    width={800}
                    height={384}
                    className="max-h-72 w-full rounded-lg border bg-background object-contain sm:max-w-md"
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
                  variant="compact"
                />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
