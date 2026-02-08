import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { Card } from "@workspace/ui/components/card"
import { Typography } from "@workspace/ui/components/typography"

import type { AttributeDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"
import type { ProductModelDto } from "@/api/productModelTypes"
import { Breadcrumbs } from "@/components/SetupNavigation/Breadcrumbs"
import { env } from "@/config/env"
import { getServerApi } from "@/lib/api/restClient"

import { PricingRulesList } from "@/features/pricing/components/PricingRulesList"

type Props = {
  params: Promise<{
    locale: Locale
    productModelId: string
    componentId: string
    attributeId: string
  }>
}

export async function generateMetadata(props: Omit<Props, "children">) {
  const { locale, productModelId, componentId, attributeId } = await props.params
  const t = await getTranslations({ locale, namespace: "Setup" })
  const title = t("navigation.pricing")

  return {
    title,
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}/setup/product-models/${productModelId}/components/${componentId}/attributes/${attributeId}/pricing`,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en/setup/product-models/${productModelId}/components/${componentId}/attributes/${attributeId}/pricing`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs/setup/product-models/${productModelId}/components/${componentId}/attributes/${attributeId}/pricing`,
      },
    },
  } satisfies Metadata
}

const AttributePricingPage = async (props: Props) => {
  const { productModelId, componentId, attributeId } = await props.params
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: "Pricing" })
  const tSetup = await getTranslations({ locale, namespace: "Setup" })

  let productModelName: string | undefined
  let componentName: string | undefined
  let attributeName: string | undefined
  let attributeCode: string | undefined
  let presetAttributeContext:
    | {
        unit: string | null
        attributeType: AttributeDto["type"]
        numericRange?: { min: number; max: number }
      }
    | undefined
  let hasLoadError = false
  try {
    const serverApi = await getServerApi()
    const [productModel, component, attribute] = await Promise.all([
      serverApi.get(`products/api/v1/product-models/${productModelId}`).json<ProductModelDto>(),
      serverApi
        .get(`products/api/v1/product-models/${productModelId}/components/${componentId}`)
        .json<ComponentDto>(),
      serverApi
        .get(
          `products/api/v1/product-models/${productModelId}/components/${componentId}/attributes/${attributeId}`,
        )
        .json<AttributeDto>(),
    ])
    productModelName = productModel.name
    componentName = component.label
    attributeName = attribute.label
    attributeCode = attribute.code
    presetAttributeContext = {
      unit: attribute.unit ?? null,
      attributeType: attribute.type,
      numericRange:
        attribute.type === "INTEGER"
          ? {
              min: attribute.minInt ?? 0,
              max: attribute.maxInt ?? 100,
            }
          : attribute.type === "DECIMAL"
            ? {
                min: attribute.minDecimal ?? 0,
                max: attribute.maxDecimal ?? 100,
              }
            : undefined,
    }
  } catch {
    hasLoadError = true
  }

  return (
    <div className="flex-1 rounded-2xl bg-muted/50 p-10">
      <Breadcrumbs
        productModelId={productModelId}
        productModelName={productModelName}
        componentId={componentId}
        componentName={componentName}
        attributeId={attributeId}
        attributeName={attributeName}
      />
      <div className="mb-8">
        <Typography
          as="h1"
          variant="display-3xl"
          weight="bold"
          className="mb-2"
        >
          {tSetup("navigation.pricing")}
        </Typography>
        <Typography
          as="p"
          variant="body-lg"
          className="text-muted-foreground"
        >
          {t("list.title")} — {attributeName ?? attributeCode ?? attributeId}
        </Typography>
      </div>
      {hasLoadError || attributeCode == null ? (
        <Card className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <Typography
            as="p"
            variant="body-md"
            className="text-destructive"
          >
            {t("list.attributePageLoadError")}
          </Typography>
        </Card>
      ) : (
        <PricingRulesList
          productModelId={productModelId}
          presetComponentId={componentId}
          presetAttributeCode={attributeCode}
          presetAttributeContext={presetAttributeContext}
        />
      )}
    </div>
  )
}

export default AttributePricingPage
