import type { Locale } from "next-intl"

import { redirect } from "@/lib/i18n/navigation"

type Props = {
  params: Promise<{ locale: Locale; productModelId: string }>
}

const PublishPage = async (props: Props) => {
  const { locale, productModelId } = await props.params
  redirect({
    href: `/setup/product-models/${productModelId}/components?tab=publish`,
    locale,
  })
}

export default PublishPage
