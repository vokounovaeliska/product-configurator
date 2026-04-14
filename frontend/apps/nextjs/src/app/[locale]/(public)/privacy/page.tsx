import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Typography } from "@workspace/ui/components/typography"

import { env } from "@/config/env"

type Props = {
  params: Promise<{ locale: Locale }>
}

const sectionKeys = [
  "controller",
  "categories",
  "purposes",
  "retention",
  "recipients",
  "rights",
  "contact",
] as const

export async function generateMetadata(props: Omit<Props, "children">): Promise<Metadata> {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: "Legal.Privacy" })

  return {
    title: t("title"),
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}/privacy`,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en/privacy`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs/privacy`,
      },
    },
  }
}

const PrivacyPage = async (props: Props) => {
  const { locale } = await props.params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "Legal.Privacy" })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-6">
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
        className="whitespace-pre-line text-muted-foreground"
      >
        {t("intro")}
      </Typography>
      {sectionKeys.map((key) => (
        <section
          key={key}
          className="space-y-2"
        >
          <Typography
            as="h2"
            variant="display-sm"
            weight="semibold"
          >
            {t(`sections.${key}.title`)}
          </Typography>
          <Typography
            as="p"
            variant="body-md"
            className="whitespace-pre-line text-muted-foreground"
          >
            {t(`sections.${key}.body`)}
          </Typography>
        </section>
      ))}
      <Typography
        as="p"
        variant="body-sm"
        className="text-muted-foreground"
      >
        {t("disclaimer")}
      </Typography>
    </div>
  )
}

export default PrivacyPage
