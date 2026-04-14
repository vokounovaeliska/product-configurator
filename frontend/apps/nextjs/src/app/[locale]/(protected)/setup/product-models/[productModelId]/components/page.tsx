import { Suspense } from "react"
import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type { ProductModelDto } from "@/api/productModelTypes"
import { Breadcrumbs } from "@/components/SetupNavigation/Breadcrumbs"
import { env } from "@/config/env"
import { api } from "@/lib/api/restClient"

import { ProductModelSetupPageHeading } from "@/features/setup/components/ProductModelSetupPageHeading"
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
      <ProductModelSetupPageHeading
        productModelId={productModelId}
        initialName={productModelName}
      />
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
