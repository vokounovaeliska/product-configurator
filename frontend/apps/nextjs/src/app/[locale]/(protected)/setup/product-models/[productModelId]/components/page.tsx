import { Suspense } from "react"
import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

import type { ProductModelDto } from "@/api/productModelTypes"
import { Breadcrumbs } from "@/components/SetupNavigation/Breadcrumbs"
import { env } from "@/config/env"
import { api } from "@/lib/api/restClient"

import { ProductModelSetupTabs } from "@/features/setup/components/ProductModelSetupTabs"

type Props = {
  params: Promise<{ locale: Locale; productModelId: string }>
}

export async function generateMetadata(props: Omit<Props, "children">) {
  const { locale, productModelId } = await props.params
  const t = await getTranslations({
    locale,
    namespace: "Components",
  })
  let productModelName: string | undefined
  try {
    const productModel = await api
      .get(`products/api/v1/product-models/${productModelId}`)
      .json<ProductModelDto>()
    productModelName = productModel.name
  } catch {
    /* use fallback title */
  }
  const title = productModelName ? t("titleWithProduct", { name: productModelName }) : t("title")

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
    <div className="min-w-0 flex-1 overflow-x-hidden rounded-2xl bg-muted/50 p-4 sm:p-6 md:p-10">
      <Breadcrumbs
        productModelId={productModelId}
        productModelName={productModelName}
      />
      <div className="mb-6">
        <Typography
          as="h1"
          variant="display-3xl"
          weight="bold"
          className="mb-2"
        >
          {productModelName ? t("titleWithProduct", { name: productModelName }) : t("title")}
        </Typography>
        <Typography
          as="p"
          variant="body-lg"
          className="text-muted-foreground"
        >
          {t("description")}
        </Typography>
      </div>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        }
      >
        <ProductModelSetupTabs productModelId={productModelId} />
      </Suspense>
    </div>
  )
}

export default ComponentsPage
