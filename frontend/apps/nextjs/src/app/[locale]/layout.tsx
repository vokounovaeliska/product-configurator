import { hasLocale, NextIntlClientProvider, type Locale } from "next-intl"
import { cn } from "@workspace/ui/lib/utils"

import { FooterOrNull } from "@/components/Footer/FooterOrNull"
import { HeaderOrNull } from "@/components/Header/HeaderOrNull"
import { MainContent } from "@/components/layout/MainContent"
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner"
import { Providers } from "@/components/Providers"
import { SidebarProvider } from "@/components/SetupNavigation/useSidebar"
import { fontDisplay, fontSans } from "@/styles/fonts"

import "@/styles/global.css"

import type { Metadata } from "next"
import { getLocale, getMessages, getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"

import { env } from "@/config/env"
import { routing } from "@/lib/i18n/routing"

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata(props: Omit<Props, "children">) {
  const { locale } = await props.params
  const t = await getTranslations({ locale: locale as Locale, namespace: "Common.BaseLayout.seo" })
  const siteName = t("siteName")

  // TODO: Extend as needed
  return {
    title: { default: siteName, template: `%s | ${siteName}` },
    description: t("description"),
    icons: { icon: "/icon.png" },
    alternates: {
      canonical: env.NEXT_PUBLIC_SITE_URL,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs`,
      },
    },
  } satisfies Metadata
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Enable static rendering
  setRequestLocale(locale)

  const messages = await getMessages()
  const resolvedLocale = await getLocale()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
    >
      <body
        className={cn(
          fontSans.variable,
          fontDisplay.variable,
          "flex min-h-screen flex-col font-sans antialiased",
        )}
      >
        <NextIntlClientProvider
          locale={resolvedLocale}
          messages={messages}
        >
          <Providers>
            <SidebarProvider>
              <HeaderOrNull />
              <MainContent>{children}</MainContent>
              <FooterOrNull />
              <CookieConsentBanner />
            </SidebarProvider>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
