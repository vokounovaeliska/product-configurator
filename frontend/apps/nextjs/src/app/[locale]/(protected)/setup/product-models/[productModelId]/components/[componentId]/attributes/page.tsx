import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { Typography } from "@workspace/ui/components/typography"

import type { ComponentDto } from "@/api/componentTypes"
import type { ProductModelDto } from "@/api/productModelTypes"
import { Breadcrumbs } from "@/components/SetupNavigation/Breadcrumbs"
import { env } from "@/config/env"
import { api } from "@/lib/api/restClient"

import { AttributesList } from "@/features/attributes/components/AttributesList"

type Props = {
  params: Promise<{ locale: Locale; productModelId: string; componentId: string }>
}

export async function generateMetadata(props: Omit<Props, "children">) {
  const { locale, productModelId, componentId } = await props.params
  const t = await getTranslations({
    locale,
    namespace: "Attributes",
  })
  const title = t("title")

  return {
    title,
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}/setup/product-models/${productModelId}/components/${componentId}/attributes`,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en/setup/product-models/${productModelId}/components/${componentId}/attributes`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs/setup/product-models/${productModelId}/components/${componentId}/attributes`,
      },
    },
  } satisfies Metadata
}

const AttributesPage = async (props: Props) => {
  const { productModelId, componentId } = await props.params
  const { locale } = await props.params
  const t = await getTranslations({
    locale,
    namespace: "Attributes",
  })

  let productModelName: string | undefined
  let componentName: string | undefined
  try {
    const [productModel, component] = await Promise.all([
      api.get(`products/api/v1/product-models/${productModelId}`).json<ProductModelDto>(),
      api
        .get(`products/api/v1/product-models/${productModelId}/components/${componentId}`)
        .json<ComponentDto>(),
    ])
    productModelName = productModel.name
    componentName = component.label
  } catch {
    void 0
  }

  return (
    <div className="min-w-0 flex-1 overflow-x-hidden rounded-2xl bg-muted/50 p-4 sm:p-6 md:p-10">
      <Breadcrumbs
        productModelId={productModelId}
        productModelName={productModelName}
        componentId={componentId}
        componentName={componentName}
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
      <AttributesList
        productModelId={productModelId}
        componentId={componentId}
      />
    </div>
  )
}

export default AttributesPage
