"use client"

import { useMemo, useState } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BanknoteIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LayersIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import type { AttributeDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"
import { env } from "@/config/env"
import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

/* eslint-disable import/no-restricted-paths -- setup page composes attributes, components, pricing, productModels */
import { useAttributesList, useUpdateAttribute } from "@/features/attributes/api/attributeQueries"
import { AttributeOptionsList } from "@/features/attributes/components/AttributeOptionsList"
import { CreateAttributeDialog } from "@/features/attributes/components/CreateAttributeDialog"
import { DeleteAttributeDialog } from "@/features/attributes/components/DeleteAttributeDialog"
import { EditAttributeDialog } from "@/features/attributes/components/EditAttributeDialog"
import { useComponentsList, useUpdateComponent } from "@/features/components/api/componentQueries"
import { CreateComponentDialog } from "@/features/components/components/CreateComponentDialog"
import { DeleteComponentDialog } from "@/features/components/components/DeleteComponentDialog"
import { EditComponentDialog } from "@/features/components/components/EditComponentDialog"
import { useProductModel } from "@/features/productModels/api/productModelQueries"
import { EditProductModelDialog } from "@/features/productModels/components/EditProductModelDialog"
import { PublishProductModelCard } from "@/features/productModels/components/PublishProductModelCard"

/* eslint-enable import/no-restricted-paths */

type Props = {
  productModelId: string
}

const CollapsibleSection = ({
  isOpen,
  onToggle,
  title,
  badge,
  actions,
  children,
  className,
}: {
  isOpen: boolean
  onToggle: () => void
  title: string
  badge?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) => (
  <div className={cn("rounded-lg border border-border bg-card", className)}>
    <div className="flex w-full min-w-0 items-center gap-3 px-4 py-3">
      <button
        type="button"
        onClick={onToggle}
        className="-mt-1 -mr-2 -mb-1 -ml-2 flex min-w-0 flex-1 items-center gap-3 rounded px-2 py-1 text-left transition-colors hover:bg-muted/50"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronDownIcon className="size-5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
        )}
        <span
          className="min-w-0 flex-1 truncate font-semibold"
          title={title}
        >
          {title}
        </span>
        {badge != null && <span className="shrink-0">{badge}</span>}
      </button>
      {actions != null && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
    {isOpen && (
      <div className="max-h-[70vh] overflow-y-auto border-t border-border px-4 py-4">
        {children}
      </div>
    )}
  </div>
)

export const ModelSetupUnified = ({ productModelId }: Props) => {
  const t = useTranslations("Setup")
  const tComponents = useTranslations("Components")
  const tProductModels = useTranslations("ProductModels")
  const searchParams = useSearchParams()
  const expandComponentId = searchParams.get("expand")

  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(() =>
    expandComponentId ? new Set([expandComponentId]) : new Set(),
  )
  const [expandedAttributes, setExpandedAttributes] = useState<Set<string>>(new Set())
  const [isCreateComponentOpen, setIsCreateComponentOpen] = useState(false)
  const [isCreateAttributeOpen, setIsCreateAttributeOpen] = useState<string | null>(null)
  const [editingComponent, setEditingComponent] = useState<ComponentDto | null>(null)
  const [deletingComponent, setDeletingComponent] = useState<ComponentDto | null>(null)
  const [editingAttribute, setEditingAttribute] = useState<AttributeDto | null>(null)
  const [deletingAttribute, setDeletingAttribute] = useState<AttributeDto | null>(null)
  const [isEditModelDialogOpen, setIsEditModelDialogOpen] = useState(false)

  const toggleComponent = (id: string) => {
    setExpandedComponents((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAttribute = (id: string) => {
    setExpandedAttributes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const { data: productModel } = useProductModel(productModelId)
  const { data: componentsData, isLoading: isLoadingComponents } = useComponentsList(
    productModelId,
    { limit: 100 },
  )
  const updateComponent = useUpdateComponent(productModelId)
  const components = useMemo(() => componentsData?.items ?? [], [componentsData?.items])
  const sortedComponents = useMemo(
    () => [...components].sort((a, b) => a.sortOrder - b.sortOrder),
    [components],
  )

  const handleMoveComponentUp = (component: ComponentDto) => {
    const idx = sortedComponents.findIndex((c) => c.id === component.id)
    if (idx <= 0) return
    const prev = sortedComponents[idx - 1]
    if (!prev || updateComponent.isPending) return
    updateComponent.mutate({
      componentId: component.id,
      patches: [{ path: "SlashSortOrder", value: prev.sortOrder, op: "Replace" }],
    })
    updateComponent.mutate({
      componentId: prev.id,
      patches: [{ path: "SlashSortOrder", value: component.sortOrder, op: "Replace" }],
    })
  }

  const handleMoveComponentDown = (component: ComponentDto) => {
    const idx = sortedComponents.findIndex((c) => c.id === component.id)
    if (idx < 0 || idx >= sortedComponents.length - 1) return
    const next = sortedComponents[idx + 1]
    if (!next || updateComponent.isPending) return
    updateComponent.mutate({
      componentId: component.id,
      patches: [{ path: "SlashSortOrder", value: next.sortOrder, op: "Replace" }],
    })
    updateComponent.mutate({
      componentId: next.id,
      patches: [{ path: "SlashSortOrder", value: component.sortOrder, op: "Replace" }],
    })
  }

  if (isLoadingComponents) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header: model name + quick links */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Typography
              as="h2"
              variant="display-lg"
              weight="bold"
              className="mb-1"
            >
              {productModel?.name ?? "—"}
            </Typography>
            <Typography
              as="p"
              variant="body-sm"
              className="text-muted-foreground"
            >
              {t("unified.setupDescription")}
            </Typography>
          </div>
          <div className="flex flex-wrap gap-2">
            {productModel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModelDialogOpen(true)}
              >
                <PencilIcon className="mr-2 size-4" />
                {tProductModels("card.editButton")}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={ROUTES.setupPricingRules(productModelId)}>
                <BanknoteIcon className="mr-2 size-4" />
                {t("navigation.pricingRules")}
              </Link>
            </Button>
            {productModel?.isActive && (
              <Button
                variant="default"
                size="sm"
                asChild
              >
                <Link href={ROUTES.configurator(productModelId)}>
                  {tProductModels("card.configureButton")}
                </Link>
              </Button>
            )}
            {productModel?.isPublished && productModel?.url && (
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={`${env.NEXT_PUBLIC_SITE_URL}${ROUTES.embed(productModel.url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tProductModels("Publish.previewEmbed")}
                </a>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Publish & Embed */}
      {productModel && <PublishProductModelCard productModel={productModel} />}

      {/* Components */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Typography
            as="h3"
            variant="display-md"
            weight="semibold"
          >
            {tComponents("list.title")}
          </Typography>
          <Button onClick={() => setIsCreateComponentOpen(true)}>
            <PlusIcon className="mr-2 size-4" />
            {tComponents("list.createButton")}
          </Button>
        </div>

        {sortedComponents.length === 0 ? (
          <Card className="rounded-lg border-dashed p-12 text-center">
            <Typography
              as="p"
              variant="body-lg"
              className="mb-4 text-muted-foreground"
            >
              {tComponents("list.emptyState.message")}
            </Typography>
            <Button
              variant="outline"
              onClick={() => setIsCreateComponentOpen(true)}
            >
              {tComponents("list.emptyState.createButton")}
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedComponents.map((component, index) => (
              <ComponentSection
                key={component.id}
                productModelId={productModelId}
                component={component}
                canMoveUp={index > 0}
                canMoveDown={index < sortedComponents.length - 1}
                isExpanded={expandedComponents.has(component.id)}
                onToggle={() => toggleComponent(component.id)}
                expandedAttributes={expandedAttributes}
                onToggleAttribute={toggleAttribute}
                onAddAttribute={() => setIsCreateAttributeOpen(component.id)}
                onEditComponent={() => setEditingComponent(component)}
                onDeleteComponent={() => setDeletingComponent(component)}
                onMoveComponentUp={() => handleMoveComponentUp(component)}
                onMoveComponentDown={() => handleMoveComponentDown(component)}
                onEditAttribute={setEditingAttribute}
                onDeleteAttribute={setDeletingAttribute}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateComponentDialog
        productModelId={productModelId}
        isOpen={isCreateComponentOpen}
        onOpenChange={setIsCreateComponentOpen}
      />

      {isCreateAttributeOpen && (
        <CreateAttributeDialog
          productModelId={productModelId}
          componentId={isCreateAttributeOpen}
          isOpen={true}
          onOpenChange={(isOpen) => !isOpen && setIsCreateAttributeOpen(null)}
        />
      )}

      {editingComponent && (
        <EditComponentDialog
          component={editingComponent}
          productModelId={productModelId}
          isOpen={true}
          onOpenChange={(isOpen) => !isOpen && setEditingComponent(null)}
        />
      )}

      {deletingComponent && (
        <DeleteComponentDialog
          component={deletingComponent}
          productModelId={productModelId}
          isOpen={true}
          onOpenChange={(isOpen) => !isOpen && setDeletingComponent(null)}
        />
      )}

      {editingAttribute && (
        <EditAttributeDialog
          attribute={editingAttribute}
          productModelId={productModelId}
          componentId={editingAttribute.componentId}
          isOpen={true}
          onOpenChange={(isOpen) => !isOpen && setEditingAttribute(null)}
        />
      )}

      {deletingAttribute && (
        <DeleteAttributeDialog
          attribute={deletingAttribute}
          productModelId={productModelId}
          componentId={deletingAttribute.componentId}
          isOpen={true}
          onOpenChange={(isOpen) => !isOpen && setDeletingAttribute(null)}
        />
      )}

      {productModel && (
        <EditProductModelDialog
          productModel={productModel}
          isOpen={isEditModelDialogOpen}
          onOpenChange={setIsEditModelDialogOpen}
        />
      )}
    </div>
  )
}

type ComponentSectionProps = {
  productModelId: string
  component: ComponentDto
  canMoveUp: boolean
  canMoveDown: boolean
  isExpanded: boolean
  onToggle: () => void
  expandedAttributes: Set<string>
  onToggleAttribute: (id: string) => void
  onAddAttribute: () => void
  onEditComponent: () => void
  onDeleteComponent: () => void
  onMoveComponentUp: () => void
  onMoveComponentDown: () => void
  onEditAttribute: (attr: AttributeDto) => void
  onDeleteAttribute: (attr: AttributeDto) => void
}

const ComponentSection = ({
  productModelId,
  component,
  canMoveUp,
  canMoveDown,
  isExpanded,
  onToggle,
  expandedAttributes,
  onToggleAttribute,
  onAddAttribute,
  onEditComponent,
  onDeleteComponent,
  onMoveComponentUp,
  onMoveComponentDown,
  onEditAttribute,
  onDeleteAttribute,
}: ComponentSectionProps) => {
  const t = useTranslations("Components")
  const tAttributes = useTranslations("Attributes")

  const { data: attributesData, isLoading } = useAttributesList(productModelId, component.id, {
    limit: 100,
  })
  const updateAttribute = useUpdateAttribute(productModelId, component.id)
  const sortedAttributes = useMemo(
    () => [...(attributesData?.items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [attributesData?.items],
  )

  const handleMoveAttributeUp = (attribute: AttributeDto) => {
    const idx = sortedAttributes.findIndex((a) => a.id === attribute.id)
    if (idx <= 0) return
    const prev = sortedAttributes[idx - 1]
    if (!prev || updateAttribute.isPending) return
    updateAttribute.mutate({
      attributeId: attribute.id,
      patches: [{ path: "/sortOrder", value: prev.sortOrder, op: "Replace" }],
    })
    updateAttribute.mutate({
      attributeId: prev.id,
      patches: [{ path: "/sortOrder", value: attribute.sortOrder, op: "Replace" }],
    })
  }

  const handleMoveAttributeDown = (attribute: AttributeDto) => {
    const idx = sortedAttributes.findIndex((a) => a.id === attribute.id)
    if (idx < 0 || idx >= sortedAttributes.length - 1) return
    const next = sortedAttributes[idx + 1]
    if (!next || updateAttribute.isPending) return
    updateAttribute.mutate({
      attributeId: attribute.id,
      patches: [{ path: "/sortOrder", value: next.sortOrder, op: "Replace" }],
    })
    updateAttribute.mutate({
      attributeId: next.id,
      patches: [{ path: "/sortOrder", value: attribute.sortOrder, op: "Replace" }],
    })
  }

  return (
    <CollapsibleSection
      isOpen={isExpanded}
      onToggle={onToggle}
      title={component.label}
      badge={
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {component.code}
        </span>
      }
      actions={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onMoveComponentUp()
            }}
            title={t("card.moveUp")}
            disabled={!canMoveUp}
          >
            <ArrowUpIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onMoveComponentDown()
            }}
            title={t("card.moveDown")}
            disabled={!canMoveDown}
          >
            <ArrowDownIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onAddAttribute()
            }}
            title={tAttributes("list.createButton")}
          >
            <PlusIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEditComponent()
            }}
          >
            {t("card.editButton")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteComponent()
            }}
          >
            {t("card.deleteButton")}
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : sortedAttributes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Typography
            as="p"
            variant="body-sm"
            className="mb-3 text-muted-foreground"
          >
            {tAttributes("list.emptyState.message")}
          </Typography>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddAttribute}
          >
            {tAttributes("list.emptyState.createButton")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAttributes.map((attribute, attrIndex) => (
            <AttributeSection
              key={attribute.id}
              productModelId={productModelId}
              componentId={component.id}
              attribute={attribute}
              canMoveUp={attrIndex > 0}
              canMoveDown={attrIndex < sortedAttributes.length - 1}
              isExpanded={expandedAttributes.has(attribute.id)}
              onToggle={() => onToggleAttribute(attribute.id)}
              onEdit={() => onEditAttribute(attribute)}
              onDelete={() => onDeleteAttribute(attribute)}
              onMoveUp={() => handleMoveAttributeUp(attribute)}
              onMoveDown={() => handleMoveAttributeDown(attribute)}
            />
          ))}
        </div>
      )}
    </CollapsibleSection>
  )
}

type AttributeSectionProps = {
  productModelId: string
  componentId: string
  attribute: AttributeDto
  canMoveUp: boolean
  canMoveDown: boolean
  isExpanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

const AttributeSection = ({
  productModelId,
  componentId,
  attribute,
  canMoveUp,
  canMoveDown,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: AttributeSectionProps) => {
  const t = useTranslations("Attributes")

  const getRangeDisplay = () => {
    const unitSuffix =
      (attribute.type === "INTEGER" || attribute.type === "DECIMAL") && attribute.unit?.trim()
        ? ` ${attribute.unit.trim()}`
        : ""
    if (attribute.type === "INTEGER") {
      if (attribute.minInt != null && attribute.maxInt != null) {
        return `${attribute.minInt}–${attribute.maxInt}${unitSuffix}`
      }
    }
    if (attribute.type === "DECIMAL") {
      if (attribute.minDecimal != null && attribute.maxDecimal != null) {
        return `${attribute.minDecimal}–${attribute.maxDecimal}${unitSuffix}`
      }
    }
    return null
  }

  const rangeDisplay = getRangeDisplay()

  return (
    <CollapsibleSection
      isOpen={isExpanded}
      onToggle={onToggle}
      title={attribute.label}
      badge={
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {attribute.type}
        </span>
      }
      actions={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onMoveUp()
            }}
            title={t("card.moveUp")}
            disabled={!canMoveUp}
          >
            <ArrowUpIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onMoveDown()
            }}
            title={t("card.moveDown")}
            disabled={!canMoveDown}
          >
            <ArrowDownIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
          >
            {t("card.editButton")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            {t("card.deleteButton")}
          </Button>
        </>
      }
      className="ml-4 border-l-2 border-l-primary/20"
    >
      <div className="space-y-6">
        {rangeDisplay && (
          <Typography
            as="p"
            variant="body-sm"
            className="text-muted-foreground"
          >
            {t("card.range")}: {rangeDisplay}
          </Typography>
        )}

        {attribute.type === "ENUM" && (
          <div className="flex min-h-0 flex-col space-y-3">
            <div className="flex shrink-0 items-center gap-2">
              <LayersIcon className="size-4 text-muted-foreground" />
              <Typography
                as="h4"
                variant="display-sm"
                weight="semibold"
              >
                {t("card.manageOptionsButton")}
              </Typography>
            </div>
            <div className="max-h-[400px] min-h-0 overflow-y-auto">
              <AttributeOptionsList
                productModelId={productModelId}
                componentId={componentId}
                attributeId={attribute.id}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <BanknoteIcon className="size-4 text-muted-foreground" />
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href={ROUTES.setupAttributePricing(productModelId, componentId, attribute.id)}>
              {t("card.pricingButton")}
            </Link>
          </Button>
        </div>
      </div>
    </CollapsibleSection>
  )
}
