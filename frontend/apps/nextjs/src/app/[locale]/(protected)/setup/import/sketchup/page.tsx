import { DownloadIcon } from "lucide-react"
import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { Button } from "@workspace/ui/components/button"
import { Typography } from "@workspace/ui/components/typography"

import { Breadcrumbs } from "@/components/SetupNavigation/Breadcrumbs"
import { env } from "@/config/env"

import { SketchUpImportForm } from "@/features/skpImport/components/SketchUpImportForm"

const PLUGIN_DOWNLOAD_URL = "/downloads/konfiguruj_export.rbz"

type Props = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata(props: Omit<Props, "children">) {
  const { locale } = await props.params
  const t = await getTranslations({
    locale,
    namespace: "SketchUpImport",
  })
  const title = t("title")

  return {
    title,
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}/setup/import/sketchup`,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en/setup/import/sketchup`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs/setup/import/sketchup`,
      },
    },
  } satisfies Metadata
}

const SketchUpImportPage = async (props: Props) => {
  const { locale } = await props.params
  const t = await getTranslations({
    locale,
    namespace: "SketchUpImport",
  })

  return (
    <div className="flex-1 rounded-2xl bg-muted/50 p-10">
      <Breadcrumbs />
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
          className="mb-4 text-muted-foreground"
        >
          {t("description")}
        </Typography>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <a
              href={PLUGIN_DOWNLOAD_URL}
              download="konfiguruj_export.rbz"
            >
              <DownloadIcon className="mr-2 size-4" />
              {t("downloadPlugin")}
            </a>
          </Button>
          <Typography
            as="span"
            variant="body-sm"
            className="text-muted-foreground"
          >
            {t("downloadPluginHint")}
          </Typography>
        </div>
      </div>
      <SketchUpImportForm />
    </div>
  )
}

export default SketchUpImportPage
