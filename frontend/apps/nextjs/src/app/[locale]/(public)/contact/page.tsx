import { MailIcon } from "lucide-react"
import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Typography } from "@workspace/ui/components/typography"

import { env } from "@/config/env"

type Props = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata(props: Omit<Props, "children">): Promise<Metadata> {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: "Contact" })
  const title = t("title")

  return {
    title,
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}/contact`,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en/contact`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs/contact`,
      },
    },
  }
}

const ContactPage = async (props: Props) => {
  const { locale } = await props.params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "Contact" })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-6 px-4 py-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <MailIcon className="size-6 text-primary" />
        </div>
        <Typography
          as="h1"
          variant="display-2xl"
          weight="bold"
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
        <Typography
          as="p"
          variant="body-sm"
          className="text-muted-foreground"
        >
          {t("author")}
        </Typography>
        <a
          href={`mailto:${t("emailAddress")}`}
          className="mt-1 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <MailIcon className="size-4" />
          {t("emailAddress")}
        </a>
      </div>
    </div>
  )
}

export default ContactPage
