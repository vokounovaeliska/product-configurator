import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { Typography } from "@workspace/ui/components/typography"

import type { ProductModelDto } from "@/api/productModelTypes"
import { Breadcrumbs } from "@/components/SetupNavigation/Breadcrumbs"
import { env } from "@/config/env"
import { api } from "@/lib/api/restClient"

import { ComponentsList } from "@/features/components/components/ComponentsList"

type Props = {
  params: Promise<{ locale: Locale; productModelId: string }>
}

export async function generateMetadata(props: Omit<Props, "children">) {
  const { locale, productModelId } = await props.params
  const t = await getTranslations({
    locale,
    namespace: "Components",
  })
  const title = t("title")

  return {
    title,
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}/setup/product-models/${productModelId}/components`,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en/setup/product-models/${productModelId}/components`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs/setup/product-models/${productModelId}/components`,
      },
    },
  } satisfies Metadata
}

const ComponentsPage = async (props: Props) => {
  const { productModelId } = await props.params
  const { locale } = await props.params
  const t = await getTranslations({
    locale,
    namespace: "Components",
  })

  // Fetch product model name for breadcrumbs
  let productModelName: string | undefined
  try {
    const productModel = await api
      .get(`products/api/v1/product-models/${productModelId}`)
      .json<ProductModelDto>()
    productModelName = productModel.name
  } catch {
    // If fetch fails, breadcrumbs will handle it
  }

  return (
    <div className="flex-1 rounded-2xl bg-muted/50 p-10">
      <Breadcrumbs
        productModelId={productModelId}
        productModelName={productModelName}
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
      <ComponentsList productModelId={productModelId} />
    </div>
  )
}

export default ComponentsPage
