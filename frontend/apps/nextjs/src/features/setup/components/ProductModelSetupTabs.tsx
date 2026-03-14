"use client"

import { BanknoteIcon, BoxIcon, ExternalLinkIcon, SettingsIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

/* eslint-disable import/no-restricted-paths -- setup tabs composes app wrappers, pricing, productModels */
import { ProductConfiguratorWrapper } from "@/app/_wrappers/ProductConfiguratorWrapper"
import { usePathname, useRouter } from "@/lib/i18n/navigation"

import { PricingRulesList } from "@/features/pricing/components/PricingRulesList"
import { useProductModel } from "@/features/productModels/api/productModelQueries"
import { PublishProductModelCard } from "@/features/productModels/components/PublishProductModelCard"

/* eslint-enable import/no-restricted-paths */

import { ModelSetupUnified } from "./ModelSetupUnified"

const TAB_VALUES = ["general", "pricing", "publish", "configure"] as const
type TabValue = (typeof TAB_VALUES)[number]

const isValidTab = (v: string | null): v is TabValue =>
  v != null && TAB_VALUES.includes(v as TabValue)

type Props = {
  productModelId: string
}

export const ProductModelSetupTabs = ({ productModelId }: Props) => {
  const t = useTranslations("Setup.tabs")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const activeTab = isValidTab(tabParam) ? tabParam : "general"

  const { data: productModel, isLoading: isLoadingProductModel } = useProductModel(productModelId)

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="flex flex-col gap-6"
    >
      <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
        <TabsTrigger
          value="general"
          className="gap-2"
        >
          <SettingsIcon className="size-4" />
          {t("general")}
        </TabsTrigger>
        <TabsTrigger
          value="pricing"
          className="gap-2"
        >
          <BanknoteIcon className="size-4" />
          {t("pricing")}
        </TabsTrigger>
        <TabsTrigger
          value="publish"
          className="gap-2"
        >
          <ExternalLinkIcon className="size-4" />
          {t("publish")}
        </TabsTrigger>
        <TabsTrigger
          value="configure"
          className="gap-2"
        >
          <BoxIcon className="size-4" />
          {t("configure")}
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="general"
        className="mt-0 flex flex-col gap-6"
      >
        <ModelSetupUnified
          productModelId={productModelId}
          isQuickActionsHidden
        />
      </TabsContent>

      <TabsContent
        value="pricing"
        className="mt-0 flex flex-col gap-6"
      >
        <PricingRulesList productModelId={productModelId} />
      </TabsContent>

      <TabsContent
        value="publish"
        className="mt-0 flex flex-col gap-6"
      >
        {isLoadingProductModel || !productModel ? (
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        ) : (
          <PublishProductModelCard productModel={productModel} />
        )}
      </TabsContent>

      <TabsContent
        value="configure"
        className="mt-0"
      >
        <div className="min-h-[60vh] rounded-lg border bg-card">
          <ProductConfiguratorWrapper productModelId={productModelId} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
