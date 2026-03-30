import { BookOpenIcon, DownloadIcon } from "lucide-react"
import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import Image from "next/image"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Typography } from "@workspace/ui/components/typography"

import { env } from "@/config/env"
import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

const PLUGIN_DOWNLOAD_URL = "/downloads/konfiguruj_export.rbz"

type Props = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata(props: Omit<Props, "children">): Promise<Metadata> {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: "SketchUpTutorial" })
  const title = t("title")

  return {
    title,
    description: t("metaDescription"),
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}/tutorial`,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en/tutorial`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs/tutorial`,
      },
    },
  }
}

const TutorialPage = async (props: Props) => {
  const { locale } = await props.params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "SketchUpTutorial" })

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <BookOpenIcon className="size-6 text-primary" />
          </div>
          <div>
            <Typography
              as="h1"
              variant="display-2xl"
              weight="bold"
            >
              {t("title")}
            </Typography>
            <Typography
              as="p"
              variant="body-md"
              className="text-muted-foreground"
            >
              {t("subtitle")}
            </Typography>
          </div>
        </div>
        <Typography
          as="p"
          variant="body-lg"
          className="mb-6 text-muted-foreground"
        >
          {t("intro")}
        </Typography>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant="default"
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
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link href={ROUTES.setupImportSketchup}>{t("goToImport")}</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        <Card className="p-6">
          <Typography
            as="h2"
            variant="display-sm"
            weight="semibold"
            className="mb-3"
          >
            {t("installation.title")}
          </Typography>
          <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
            <li>{t("installation.step1")}</li>
            <li>{t("installation.step2")}</li>
            <li>{t("installation.step3")}</li>
          </ol>
          <Typography
            as="p"
            variant="body-sm"
            className="mt-4 text-muted-foreground"
          >
            {t("installation.extensionManagerCaption")}
          </Typography>
          <Image
            src="/tutorial/sketchup-extension-manager.png"
            alt={t("installation.extensionManagerAlt")}
            width={1024}
            height={617}
            className="mt-2 w-full rounded-md border border-border"
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </Card>

        <Card className="p-6">
          <Typography
            as="h2"
            variant="display-sm"
            weight="semibold"
            className="mb-3"
          >
            {t("supportedEntities.title")}
          </Typography>
          <Typography
            as="p"
            variant="body-sm"
            className="mb-3 text-muted-foreground"
          >
            {t("supportedEntities.intro")}
          </Typography>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>{t("supportedEntities.groups")}</li>
            <li>{t("supportedEntities.components")}</li>
          </ul>
          <Typography
            as="p"
            variant="body-sm"
            className="mt-4 text-muted-foreground"
          >
            {t("supportedEntities.componentsFigureCaption")}
          </Typography>
          <Image
            src="/tutorial/sketchup-components-hierarchy.png"
            alt={t("supportedEntities.componentsFigureAlt")}
            width={1024}
            height={535}
            className="mt-2 w-full rounded-md border border-border"
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </Card>

        <Card className="p-6">
          <Typography
            as="h2"
            variant="display-sm"
            weight="semibold"
            className="mb-3"
          >
            {t("parameters.title")}
          </Typography>
          <Typography
            as="p"
            variant="body-sm"
            className="mb-3 text-muted-foreground"
          >
            {t("parameters.intro")}
          </Typography>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>{t("parameters.dimensions")}</li>
            <li>{t("parameters.materials")}</li>
            <li>{t("parameters.options")}</li>
          </ul>
          <Typography
            as="h3"
            variant="body-md"
            weight="semibold"
            className="mt-4 mb-2"
          >
            {t("parameters.formulasTitle")}
          </Typography>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>{t("parameters.formulaParent")}</li>
            <li>{t("parameters.formulaComponent")}</li>
          </ul>
          <Typography
            as="p"
            variant="body-sm"
            className="mt-4 text-muted-foreground"
          >
            {t("parameters.definitionFigureCaption")}
          </Typography>
          <Image
            src="/tutorial/sketchup-parameters-definition.png"
            alt={t("parameters.definitionFigureAlt")}
            width={610}
            height={1024}
            className="mx-auto mt-2 w-full max-w-[610px] rounded-md border border-border"
            sizes="(max-width: 768px) 100vw, 610px"
          />
        </Card>

        <Card className="p-6">
          <Typography
            as="h2"
            variant="display-sm"
            weight="semibold"
            className="mb-3"
          >
            {t("effects.title")}
          </Typography>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>{t("effects.scale")}</li>
            <li>{t("effects.position")}</li>
            <li>{t("effects.material")}</li>
          </ul>
        </Card>

        <Card className="p-6">
          <Typography
            as="h2"
            variant="display-sm"
            weight="semibold"
            className="mb-3"
          >
            {t("workflow.title")}
          </Typography>
          <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
            <li>{t("workflow.step1")}</li>
            <li>{t("workflow.step2")}</li>
            <li>{t("workflow.step3")}</li>
            <li>{t("workflow.step4")}</li>
            <li>{t("workflow.step5")}</li>
          </ol>
          <Typography
            as="p"
            variant="body-sm"
            className="mt-4 text-muted-foreground"
          >
            {t("workflow.exportMenuCaption")}
          </Typography>
          <Image
            src="/tutorial/sketchup-export-menu.png"
            alt={t("workflow.exportMenuAlt")}
            width={744}
            height={428}
            className="mt-2 w-full rounded-md border border-border"
            sizes="(max-width: 768px) 100vw, 672px"
          />
          <Typography
            as="p"
            variant="body-sm"
            className="mt-4 text-muted-foreground"
          >
            {t("workflow.outputFigureCaption")}
          </Typography>
          <Image
            src="/tutorial/sketchup-export-output-folder.png"
            alt={t("workflow.outputFigureAlt")}
            width={1024}
            height={342}
            className="mt-2 w-full rounded-md border border-border"
            sizes="(max-width: 768px) 100vw, 672px"
          />
          <Typography
            as="h3"
            variant="body-md"
            weight="semibold"
            className="mt-6 mb-2"
          >
            {t("materials.title")}
          </Typography>
          <Typography
            as="p"
            variant="body-sm"
            className="text-muted-foreground"
          >
            {t("materials.description")}
          </Typography>
        </Card>

        <Card className="p-6">
          <Typography
            as="h2"
            variant="display-sm"
            weight="semibold"
            className="mb-3"
          >
            {t("troubleshooting.title")}
          </Typography>
          <Typography
            as="p"
            variant="body-sm"
            className="mb-3 text-muted-foreground"
          >
            {t("troubleshooting.intro")}
          </Typography>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>{t("troubleshooting.debug")}</li>
            <li>{t("troubleshooting.selectRoot")}</li>
          </ul>
          <Typography
            as="p"
            variant="body-sm"
            className="mt-4 text-muted-foreground"
          >
            {t("troubleshooting.debugFigureCaption")}
          </Typography>
          <Image
            src="/tutorial/sketchup-debug-console.png"
            alt={t("troubleshooting.debugFigureAlt")}
            width={1024}
            height={777}
            className="mt-2 w-full rounded-md border border-border"
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </Card>
      </div>
    </div>
  )
}

export default TutorialPage
