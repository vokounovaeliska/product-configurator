import { headers } from "next/headers"

import { Header } from "./Header"

const EMBED_PATH_PREFIX = "/e/"

export const HeaderOrNull = async () => {
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") ?? ""
  const isEmbed = pathname.includes(EMBED_PATH_PREFIX)

  if (isEmbed) return null
  return <Header pathname={pathname} />
}
