import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { Typography } from "@workspace/ui/components/typography"

import { Breadcrumbs } from "@/components/SetupNavigation/Breadcrumbs"
import { env } from "@/config/env"

import { ProductModelsList } from "@/features/productModels/components/ProductModelsList"

type Props = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata(props: Omit<Props, "children">) {
  const { locale } = await props.params
  const t = await getTranslations({
    locale,
    namespace: "ProductModels",
  })
  const title = t("title")

  return {
    title,
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}/setup/product-models`,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en/setup/product-models`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs/setup/product-models`,
      },
    },
  } satisfies Metadata
}

const ProductModelsPage = async (props: Props) => {
  const { locale } = await props.params
  const t = await getTranslations({
    locale,
    namespace: "ProductModels",
  })

  return (
    <div className="min-w-0 flex-1 overflow-x-hidden rounded-2xl bg-muted/50 p-4 sm:p-6 md:p-10">
      <Breadcrumbs />
      <div className="mb-6 md:mb-8">
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
      <ProductModelsList />
    </div>
  )
}

export default ProductModelsPage
