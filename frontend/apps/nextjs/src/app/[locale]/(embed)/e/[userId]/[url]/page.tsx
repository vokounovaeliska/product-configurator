import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"

import { env } from "@/config/env"

import { EmbedConfiguratorWrapper } from "@/features/embed/components/EmbedConfiguratorWrapper"

type Props = {
  params: Promise<{ locale: Locale; userId: string; url: string }>
}

export async function generateMetadata(props: Omit<Props, "children">) {
  const { locale, userId, url } = await props.params
  const t = await getTranslations({ locale, namespace: "Embed" })
  const title = t("title")
  const path = `/e/${userId}/${url}`

  return {
    title,
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}${path}`,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en${path}`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs${path}`,
      },
    },
    robots: "index, follow",
  } satisfies Metadata
}

const EmbedPage = async (props: Props) => {
  const { userId, url } = await props.params

  if (!userId?.trim() || !url?.trim()) {
    notFound()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <EmbedConfiguratorWrapper
        userId={userId}
        url={url}
      />
    </div>
  )
}

export default EmbedPage
