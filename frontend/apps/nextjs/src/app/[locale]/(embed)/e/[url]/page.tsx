import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"

import { env } from "@/config/env"

import { EmbedConfiguratorWrapper } from "@/features/embed/components/EmbedConfiguratorWrapper"

type Props = {
  params: Promise<{ locale: Locale; url: string }>
}

export async function generateMetadata(props: Omit<Props, "children">) {
  const { locale, url } = await props.params
  const t = await getTranslations({ locale, namespace: "Embed" })
  const title = t("title")

  return {
    title,
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}/e/${url}`,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en/e/${url}`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs/e/${url}`,
      },
    },
    robots: "index, follow",
  } satisfies Metadata
}

const EmbedPage = async (props: Props) => {
  const { url } = await props.params

  if (!url?.trim()) {
    notFound()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <EmbedConfiguratorWrapper url={url} />
    </div>
  )
}

export default EmbedPage
