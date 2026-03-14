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

import { PublishPageContent } from "./PublishPageContent"

type Props = {
  params: Promise<{ locale: Locale; productModelId: string }>
}

export async function generateMetadata(props: Omit<Props, "children">) {
  const { locale, productModelId } = await props.params
  const t = await getTranslations({ locale, namespace: "ProductModels.Publish" })
  const title = t("title")

  return {
    title,
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}/setup/product-models/${productModelId}/publish`,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en/setup/product-models/${productModelId}/publish`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs/setup/product-models/${productModelId}/publish`,
      },
    },
  } satisfies Metadata
}

const PublishPage = async (props: Props) => {
  const { productModelId, locale } = await props.params
  const t = await getTranslations({ locale, namespace: "ProductModels.Publish" })

  let productModelName: string | undefined
  try {
    const productModel = await api
      .get(`products/api/v1/product-models/${productModelId}`)
      .json<ProductModelDto>()
    productModelName = productModel.name
  } catch {
    /* breadcrumbs will handle fallback */
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
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        }
      >
        <PublishPageContent productModelId={productModelId} />
      </Suspense>
    </div>
  )
}

export default PublishPage
