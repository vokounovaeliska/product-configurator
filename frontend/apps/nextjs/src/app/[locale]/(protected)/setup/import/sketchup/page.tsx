import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"
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
      </div>
      <SketchUpImportForm />
      <section
        aria-labelledby="sketchup-plugin-help-heading"
        className="mt-6 max-w-2xl rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4"
      >
        <Typography
          id="sketchup-plugin-help-heading"
          as="h2"
          variant="body-md"
          weight="semibold"
          className="text-foreground"
        >
          {t("pluginHelpSectionTitle")}
        </Typography>
        <Typography
          as="p"
          variant="body-sm"
          className="mt-2 text-muted-foreground"
        >
          {t("downloadPluginHint")}
        </Typography>
        <a
          href={PLUGIN_DOWNLOAD_URL}
          download="konfiguruj_export.rbz"
          className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4 hover:no-underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {t("downloadPluginLink")}
        </a>
      </section>
    </div>
  )
}

export default SketchUpImportPage
