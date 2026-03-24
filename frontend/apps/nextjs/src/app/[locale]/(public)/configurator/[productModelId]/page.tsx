import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"

import { ProductConfiguratorWrapper } from "@/app/_wrappers/ProductConfiguratorWrapper"
import { env } from "@/config/env"

type Props = {
  params: Promise<{ locale: Locale; productModelId: string }>
}

export async function generateMetadata(props: Omit<Props, "children">) {
  const { locale, productModelId } = await props.params
  const t = await getTranslations({
    locale,
    namespace: "Configurator",
  })
  const title = t("title")

  return {
    title,
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}/configurator/${productModelId}`,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en/configurator/${productModelId}`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs/configurator/${productModelId}`,
      },
    },
  } satisfies Metadata
}

const ConfiguratorPage = async (props: Props) => {
  const { productModelId } = await props.params

  return (
    <div className="flex min-h-screen flex-col">
      <ProductConfiguratorWrapper productModelId={productModelId} />
    </div>
  )
}

export default ConfiguratorPage
