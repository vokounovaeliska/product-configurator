import { headers } from "next/headers"

import { Footer } from "./Footer"

const EMBED_PATH_PREFIX = "/e/"

export const FooterOrNull = async () => {
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") ?? ""
  const isEmbed = pathname.includes(EMBED_PATH_PREFIX)

  if (isEmbed) return null
  return <Footer />
}
