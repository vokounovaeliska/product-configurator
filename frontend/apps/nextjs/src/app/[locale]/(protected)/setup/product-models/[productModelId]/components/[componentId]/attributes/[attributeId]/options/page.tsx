import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { Typography } from "@workspace/ui/components/typography"

import type { AttributeDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"
import type { ProductModelDto } from "@/api/productModelTypes"
import { Breadcrumbs } from "@/components/SetupNavigation/Breadcrumbs"
import { env } from "@/config/env"
import { api } from "@/lib/api/restClient"

import { AttributeOptionsList } from "@/features/attributes/components/AttributeOptionsList"

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
  const t = await getTranslations({
    locale,
    namespace: "AttributeOptions",
  })
  const title = t("title")

  return {
    title,
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}/setup/product-models/${productModelId}/components/${componentId}/attributes/${attributeId}/options`,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en/setup/product-models/${productModelId}/components/${componentId}/attributes/${attributeId}/options`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs/setup/product-models/${productModelId}/components/${componentId}/attributes/${attributeId}/options`,
      },
    },
  } satisfies Metadata
}

const OptionsPage = async (props: Props) => {
  const { productModelId, componentId, attributeId } = await props.params
  const { locale } = await props.params
  const t = await getTranslations({
    locale,
    namespace: "AttributeOptions",
  })

  let productModelName: string | undefined
  let componentName: string | undefined
  let attributeName: string | undefined
  try {
    const [productModel, component, attribute] = await Promise.all([
      api.get(`products/api/v1/product-models/${productModelId}`).json<ProductModelDto>(),
      api
        .get(`products/api/v1/product-models/${productModelId}/components/${componentId}`)
        .json<ComponentDto>(),
      api
        .get(
          `products/api/v1/product-models/${productModelId}/components/${componentId}/attributes/${attributeId}`,
        )
        .json<AttributeDto>(),
    ])
    productModelName = productModel.name
    componentName = component.label
    attributeName = attribute.label
  } catch {
    // If fetch fails, breadcrumbs will handle it
  }

  return (
    <div className="min-w-0 flex-1 overflow-x-hidden rounded-2xl bg-muted/50 p-4 sm:p-6 md:p-10">
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
          {t("title")}
        </Typography>
        <Typography
          as="p"
          variant="body-lg"
          className="text-muted-foreground"
        >
          {t("description")}
        </Typography>
      </div>
      <AttributeOptionsList
        productModelId={productModelId}
        componentId={componentId}
        attributeId={attributeId}
      />
    </div>
  )
}

export default OptionsPage
